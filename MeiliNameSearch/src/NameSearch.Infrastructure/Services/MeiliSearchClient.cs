using System.Net.Http.Json;
using System.Text.Json;

namespace NameSearch.Infrastructure.Services
{
    /// <summary>
    /// Lightweight client for interacting with Meilisearch using its HTTP API. This client
    /// wraps common operations needed for the name search API: creating indexes,
    /// adding documents and performing searches. It depends on HttpClient which
    /// should be configured with BaseAddress and API key headers externally.
    /// </summary>
    public class MeiliSearchClient
    {
        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

        public MeiliSearchClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        /// <summary>
        /// Ensures that an index with the given UID exists. If the index already exists
        /// the call is a no-op. When creating the index you can optionally specify a
        /// primary key; if omitted, Meilisearch will infer it from the first document.
        /// </summary>
        /// <param name="uid">Unique identifier for the index.</param>
        /// <param name="primaryKey">Optional primary key field.</param>
        public async Task EnsureIndexExistsAsync(string uid, string? primaryKey = null)
        {
            // Check if the index exists by listing indexes.
            var response = await _httpClient.GetAsync($"/indexes/{uid}");
            if (response.IsSuccessStatusCode)
            {
                return;
            }
            // Create the index
            var payload = new { uid, primaryKey };
            await _httpClient.PostAsJsonAsync("/indexes", payload, _jsonOptions);
        }

        /// <summary>
        /// Adds or updates a collection of documents within the given index. Meilisearch
        /// will infer the schema from the first document if it has not been defined yet.
        /// </summary>
        /// <param name="indexUid">The UID of the index.</param>
        /// <param name="documents">Documents to be added or updated.</param>
        public async Task AddDocumentsAsync<T>(string indexUid, IEnumerable<T> documents)
        {
            var uri = $"/indexes/{indexUid}/documents";
            var response = await _httpClient.PostAsJsonAsync(uri, documents, _jsonOptions);
            response.EnsureSuccessStatusCode();
        }

        /// <summary>
        /// Performs a search against the specified index using the provided query. Returns
        /// the raw JSON response which can then be deserialized into domain models.
        /// </summary>
        /// <param name="indexUid">The UID of the index.</param>
        /// <param name="query">The search query text.</param>
        /// <param name="limit">Maximum number of results to return.</param>
        /// <returns>JSON document representing the search response.</returns>
        public async Task<JsonDocument> SearchAsync(string indexUid, string query, int limit)
        {
            var uri = $"/indexes/{indexUid}/search";
            var payload = new { q = query, limit };
            var response = await _httpClient.PostAsJsonAsync(uri, payload, _jsonOptions);
            response.EnsureSuccessStatusCode();
            var stream = await response.Content.ReadAsStreamAsync();
            return await JsonDocument.ParseAsync(stream);
        }
    }
}