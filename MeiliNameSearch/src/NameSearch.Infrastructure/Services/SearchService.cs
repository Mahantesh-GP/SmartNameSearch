using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using NameSearch.Domain.Entities;
using NameSearch.Infrastructure.Models;

namespace NameSearch.Infrastructure.Services
{
    public interface ISearchService
    {
        Task<IReadOnlyList<SearchResult>> SearchAsync(string query, int limit);
    }

    public sealed class SearchService : ISearchService
    {
        private const string IndexName = "persons";
        private readonly HttpClient _client;
        private readonly INicknameProvider _nicknameProvider;
        private readonly IPhoneticEncoder _phonetic;

        public SearchService(
            HttpClient client,
            INicknameProvider nicknameProvider,
            IPhoneticEncoder phonetic)
        {
            _client = client;
            _nicknameProvider = nicknameProvider;
            _phonetic = phonetic;
        }

        public async Task<IReadOnlyList<SearchResult>> SearchAsync(string query, int limit)
        {
            if (string.IsNullOrWhiteSpace(query))
                return Array.Empty<SearchResult>();

            // 1) Tokenize the user query (letters/numbers only) and normalize
            var tokens = Tokenize(query);
            if (tokens.Count == 0)
                return Array.Empty<SearchResult>();

            // 2) Expand: originals + nicknames + double-metaphone (primary/alternate)
            var expanded = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var t in tokens)
            {
                // keep original token
                expanded.Add(t);

                // nicknames (transitive)
                foreach (var n in _nicknameProvider.Expand(t))
                    expanded.Add(n);

                // double metaphone for the raw token
                var (p, a) = _phonetic.Encode(t);
                if (!string.IsNullOrWhiteSpace(p)) expanded.Add(p!);
                if (!string.IsNullOrWhiteSpace(a)) expanded.Add(a!);
            }

            // 3) Build a single query string. Meili matches terms (logical OR).
            var q = string.Join(' ', expanded);

            // clamp limit to something sane
            var clampedLimit = Math.Clamp(limit <= 0 ? 10 : limit, 1, 200);

            // 4) Call Meilisearch
            var requestBody = new
            {
                q,
                limit = clampedLimit,
                // optional: ask Meili to return ranking score (some versions already include it)
                showRankingScore = true
            };

            using var resp = await _client.PostAsJsonAsync($"indexes/{IndexName}/search", requestBody);
            // If index is missing, treat as empty results rather than surfacing an error
            if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return Array.Empty<SearchResult>();
            }
            resp.EnsureSuccessStatusCode();

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var results = new List<SearchResult>();
            if (!root.TryGetProperty("hits", out var hits) || hits.ValueKind != JsonValueKind.Array)
                return results;

            foreach (var hit in hits.EnumerateArray())
            {
                // id
                var id = hit.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";

                // person fields
                var person = new PersonRecord(
                    Id: id,
                    FirstName: hit.TryGetProperty("first", out var f) ? f.GetString() ?? string.Empty : string.Empty,
                    LastName:  hit.TryGetProperty("last", out var l) ? l.GetString() ?? string.Empty : string.Empty,
                    MiddleName: hit.TryGetProperty("middlename", out var m) ? m.GetString() : null,
                    City:      hit.TryGetProperty("city", out var c) ? c.GetString() : null,
                    State:     hit.TryGetProperty("state", out var s) ? s.GetString() : null,
                    Dob:       ParseDate(hit.TryGetProperty("dob", out var dob) ? dob.GetString() : null)
                );

                // ranking score (if present)
                double score = 0;
                if (hit.TryGetProperty("_rankingScore", out var scoreProp) &&
                    scoreProp.ValueKind == JsonValueKind.Number &&
                    scoreProp.TryGetDouble(out var sc))
                {
                    score = sc;
                }

                results.Add(new SearchResult(id, score, person));
            }

            return results;
        }

        // --- helpers ---

        private static readonly Regex _tokenRx = new(@"[A-Za-z0-9]+", RegexOptions.Compiled);

        private static List<string> Tokenize(string input)
        {
            var list = new List<string>();
            foreach (Match m in _tokenRx.Matches(input))
            {
                if (m.Success && m.Length > 0)
                    list.Add(m.Value.Trim());
            }
            return list;
        }
             private static DateTime? ParseDate(string? value)
        {
            if (!string.IsNullOrWhiteSpace(value) && DateTime.TryParse(value, out var dt))
            {
                return dt;
            }
            return null;
        }
        
    }
}
