using System.Text.Json;
using System.Text.Json.Serialization;

namespace NameSearch.Infrastructure.Services
{
    public interface INicknameProvider
    {
        IReadOnlyCollection<string> Expand(string name);
    }

    public sealed class NicknameProvider : INicknameProvider
    {
        private readonly Dictionary<string, HashSet<string>> _graph;

        public NicknameProvider(string? jsonPath = null)
        {
            // Load JSON either from path or embedded defaults
            string json;
            if (!string.IsNullOrWhiteSpace(jsonPath) && File.Exists(jsonPath))
                json = File.ReadAllText(jsonPath);
            else
                json = DefaultJson;

            var opts = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                ReadCommentHandling = JsonCommentHandling.Skip,
                AllowTrailingCommas = true
            };

            var seed = JsonSerializer.Deserialize<Dictionary<string, string[]>>(json, opts)
                       ?? new Dictionary<string, string[]>();

            // Build undirected graph (bidirectional)
            _graph = new(StringComparer.OrdinalIgnoreCase);
            foreach (var (canon, nicks) in seed)
            {
                AddNode(canon);
                foreach (var n in nicks)
                {
                    AddNode(n);
                    Link(canon, n);
                }
            }
        }

        public IReadOnlyCollection<string> Expand(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return Array.Empty<string>();
            var start = name.Trim();

            // BFS over the nickname graph for transitive closure
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { start };
            var q = new Queue<string>();
            q.Enqueue(start);

            while (q.Count > 0)
            {
                var cur = q.Dequeue();
                if (!_graph.TryGetValue(cur, out var neighbors)) continue;
                foreach (var n in neighbors)
                {
                    if (seen.Add(n))
                        q.Enqueue(n);
                }
            }

            return seen;
        }

        private void AddNode(string s)
        {
            if (!_graph.ContainsKey(s)) _graph[s] = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        }

        private void Link(string a, string b)
        {
            _graph[a].Add(b);
            _graph[b].Add(a);
        }

        // Minimal defaults — replace with your full dictionary file
        private const string DefaultJson = /*lang=json*/ @"{
          ""elizabeth"": [""liz"",""beth"",""lizzy"",""eliza""],
          ""william"": [""bill"",""will"",""billy""],
          ""robert"": [""rob"",""bob"",""bobby""],
          ""margaret"": [""maggie"",""meg"",""peggy""],
          ""katherine"": [""kat"",""kate"",""kathy"",""cathy""],
          ""john"": [""jack""],
          ""henry"": [""harry""]
        }";
    }
}
