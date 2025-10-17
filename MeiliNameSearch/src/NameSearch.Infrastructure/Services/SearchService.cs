using NameSearch.Domain.Entities;
using NameSearch.Infrastructure.Models;
using System.Text.Json;

namespace NameSearch.Infrastructure.Services
{
    /// <summary>
    /// Performs search queries against the Meilisearch index. Expands search terms using the
    /// nickname provider and applies phonetic matching through the indexed documents. It then
    /// parses the raw Meilisearch response into strongly-typed search results.
    /// </summary>
    public class SearchService
    {
        private const string IndexName = "persons";
        private readonly MeiliSearchClient _client;
        private readonly NicknameProvider _nicknameProvider;

        public SearchService(MeiliSearchClient client, NicknameProvider nicknameProvider)
        {
            _client = client;
            _nicknameProvider = nicknameProvider;
        }

        /// <summary>
        /// Searches the persons index using the provided query. The query is expanded to include
        /// nicknames for each token, improving recall for common diminutives. Returns up to
        /// <paramref name="limit"/> results with scores.
        /// </summary>
        /// <param name="query">The free-text query from the caller.</param>
        /// <param name="limit">The maximum number of results to return.</param>
        public async Task<IReadOnlyList<SearchResult>> SearchAsync(string query, int limit)
        {
            // Ensure the index exists before searching. This will create the index if missing.
            await _client.EnsureIndexExistsAsync(IndexName, "id");

            var tokens = query.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var expanded = new List<string>();
            foreach (var token in tokens)
            {
                var nicks = _nicknameProvider.GetNicknames(token);
                expanded.AddRange(nicks);
            }
            // Include the original query words as well. Duplicate tokens are removed later.
            expanded.AddRange(tokens);
            // Build the search string by joining unique tokens. Duplicates are removed to avoid
            // inflating the importance of repeated words.
            var searchTerms = string.Join(' ', expanded.Distinct(StringComparer.OrdinalIgnoreCase));
            var json = await _client.SearchAsync(IndexName, searchTerms, limit);
            var root = json.RootElement;
            var results = new List<SearchResult>();
            if (root.TryGetProperty("hits", out var hits))
            {
                foreach (var hit in hits.EnumerateArray())
                {
                    var id = hit.GetProperty("id").GetString() ?? string.Empty;
                    var person = new PersonRecord(
                        id,
                        hit.GetProperty("firstName").GetString() ?? string.Empty,
                        hit.GetProperty("lastName").GetString() ?? string.Empty,
                        hit.TryGetProperty("middleName", out var middle) ? middle.GetString() : null,
                        hit.TryGetProperty("city", out var city) ? city.GetString() : null,
                        hit.TryGetProperty("state", out var state) ? state.GetString() : null,
                        ParseDate(hit.TryGetProperty("dob", out var dob) ? dob.GetString() : null)
                    );
                    // Some versions of Meilisearch return "_rankingScore" with each hit. If present we use it.
                    double score = 0.0;
                    if (hit.TryGetProperty("_rankingScore", out var scoreProp) && scoreProp.ValueKind == JsonValueKind.Number)
                    {
                        score = scoreProp.GetDouble();
                    }
                    results.Add(new SearchResult(id, score, person));
                }
            }
            return results;
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