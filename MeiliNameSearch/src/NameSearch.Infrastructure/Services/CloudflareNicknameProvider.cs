using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace NameSearch.Infrastructure.Services
{
    // INicknameProvider implementation that uses Cloudflare Workers AI to expand nicknames.
    // Falls back to the local graph-based NicknameProvider when unavailable or misconfigured.
    public sealed class CloudflareNicknameProvider : INicknameProvider
    {
        private readonly Func<HttpClient> _clientFactory;
        private readonly string? _accountId;
        private readonly string? _apiToken;
        private readonly string _model;
        private readonly INicknameProvider _fallback;

        // Simple in-memory cache to reduce LLM calls
        private readonly Dictionary<string, IReadOnlyCollection<string>> _cache = new(StringComparer.OrdinalIgnoreCase);
        private readonly object _lock = new();

        public CloudflareNicknameProvider(Func<HttpClient> clientFactory, string? accountId, string? apiToken, string? model, INicknameProvider fallback)
        {
            _clientFactory = clientFactory;
            // Use configured values passed in (from env vars). Previously this code used hard-coded
            // credentials which prevented deployments from using runtime values. Keep the model
            // default inline for backwards compatibility when not provided.
            _accountId = accountId;
            _apiToken = apiToken;
            _model = string.IsNullOrWhiteSpace(model) ? "@cf/meta/llama-3-8b-instruct" : model!;
            _fallback = fallback;
        }

        public IReadOnlyCollection<string> Expand(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return Array.Empty<string>();

            // Cache lookup
            lock (_lock)
            {
                if (_cache.TryGetValue(name, out var cached)) return cached;
            }

            // If Cloudflare credentials are missing, fallback immediately
            if (string.IsNullOrWhiteSpace(_accountId) || string.IsNullOrWhiteSpace(_apiToken))
            {
                var fb = _fallback.Expand(name);
                Cache(name, fb);
                return fb;
            }

            try
            {
                var client = _clientFactory();
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiToken);

                // Prefer chat-style payload; if it fails, we’ll try a plain prompt format.
                var system = "You expand personal names into common English nicknames and diminutives. Only output minified JSON: {\"canonical\": string, \"nicknames\": string[]}. No extra text.";
                var user = $"Name: {name}. Return JSON only.";

                var chatPayload = new
                {
                    messages = new object[]
                    {
                        new { role = "system", content = system },
                        new { role = "user", content = user }
                    },
                    temperature = 0.1,
                    max_tokens = 128
                };

                var path = $"/client/v4/accounts/{_accountId}/ai/run/{Uri.EscapeDataString(_model)}";
                using var resp = client.PostAsJsonAsync(path, chatPayload).GetAwaiter().GetResult();
                string content = resp.Content.ReadAsStringAsync().GetAwaiter().GetResult();

                if (!resp.IsSuccessStatusCode)
                {
                    // Log diagnostic info (avoid printing the API token)
                    try
                    {
                        Console.WriteLine($"Cloudflare call failed: {resp.RequestMessage?.Method} {resp.RequestMessage?.RequestUri} -> {(int)resp.StatusCode} {resp.ReasonPhrase}");
                        Console.WriteLine($"Cloudflare response body: {content}");
                    }
                    catch { }

                    // Try alternate "input" payload once
                    var prompt = $"Expand common English nicknames for the personal name '{name}'. Only output minified JSON: {{\"canonical\": string, \"nicknames\": string[]}}.";
                    var inputPayload = new { input = prompt, temperature = 0.1, max_tokens = 128 };
                    using var resp2 = client.PostAsJsonAsync(path, inputPayload).GetAwaiter().GetResult();
                    content = resp2.Content.ReadAsStringAsync().GetAwaiter().GetResult();

                    if (!resp2.IsSuccessStatusCode)
                    {
                        try
                        {
                            Console.WriteLine($"Cloudflare fallback call failed: {resp2.RequestMessage?.Method} {resp2.RequestMessage?.RequestUri} -> {(int)resp2.StatusCode} {resp2.ReasonPhrase}");
                            Console.WriteLine($"Cloudflare response body: {content}");
                        }
                        catch { }
                        return Fallback(name);
                    }
                }

                // Cloudflare Workers AI commonly returns { success, result: { response: "..." } }
                // Parse JSON to extract the text field; then extract a JSON object from the text.
                using var doc = JsonDocument.Parse(content);
                string? text = null;
                if (doc.RootElement.TryGetProperty("result", out var result))
                {
                    if (result.TryGetProperty("response", out var responseProp) && responseProp.ValueKind == JsonValueKind.String)
                        text = responseProp.GetString();
                    else if (result.TryGetProperty("output_text", out var outputText) && outputText.ValueKind == JsonValueKind.String)
                        text = outputText.GetString();
                }
                text ??= content; // fallback to raw content if structure differs

                // Find JSON object or array in text
                var json = ExtractJson(text);
                if (string.IsNullOrWhiteSpace(json))
                    return Fallback(name);

                // Accept either { canonical, nicknames: [] } or just [ ... ]
                var nicknames = ParseNicknames(json, name);
                if (nicknames.Count == 0)
                    return Fallback(name);

                Cache(name, nicknames);
                return nicknames;
            }
            catch
            {
                return Fallback(name);
            }
        }

        private IReadOnlyCollection<string> Fallback(string name)
        {
            var fb = _fallback.Expand(name);
            Cache(name, fb);
            return fb;
        }

        private void Cache(string key, IReadOnlyCollection<string> value)
        {
            lock (_lock)
            {
                _cache[key] = value;
            }
        }

        private static string? ExtractJson(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return null;
            // Try to find the first JSON object or array
            var objMatch = Regex.Match(text, @"\{[\s\S]*\}");
            if (objMatch.Success) return objMatch.Value;
            var arrMatch = Regex.Match(text, @"\[[\s\S]*\]");
            if (arrMatch.Success) return arrMatch.Value;
            return null;
        }

        private static IReadOnlyCollection<string> ParseNicknames(string json, string canonicalFallback)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    var list = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { canonicalFallback };
                    foreach (var e in doc.RootElement.EnumerateArray())
                    {
                        if (e.ValueKind == JsonValueKind.String)
                            list.Add(e.GetString() ?? "");
                    }
                    return list;
                }
                if (doc.RootElement.ValueKind == JsonValueKind.Object)
                {
                    var list = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    if (doc.RootElement.TryGetProperty("canonical", out var canon) && canon.ValueKind == JsonValueKind.String)
                        list.Add(canon.GetString() ?? canonicalFallback);
                    else
                        list.Add(canonicalFallback);
                    if (doc.RootElement.TryGetProperty("nicknames", out var nicks) && nicks.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var e in nicks.EnumerateArray())
                        {
                            if (e.ValueKind == JsonValueKind.String)
                                list.Add(e.GetString() ?? "");
                        }
                    }
                    return list;
                }
            }
            catch { }
            return Array.Empty<string>();
        }
    }
}
