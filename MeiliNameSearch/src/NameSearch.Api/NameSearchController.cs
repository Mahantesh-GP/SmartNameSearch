using Microsoft.AspNetCore.Mvc;
using NameSearch.Domain.Entities;
using NameSearch.Infrastructure.Services;
using NameSearch.Infrastructure.Models;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace NameSearch.Api
{
    [ApiController]
    [Route("[controller]")]
    public class NameSearchController : ControllerBase
    {
        private readonly IndexService _indexService;
        private readonly SearchService _searchService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<NameSearchController> _logger;

        public NameSearchController(IndexService indexService, SearchService searchService, IHttpClientFactory httpClientFactory, ILogger<NameSearchController> logger)
        {
            _indexService = indexService;
            _searchService = searchService;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        /// <summary>
        /// Indexes a collection of person records. Each record is augmented with nickname and phonetic
        /// metadata and stored in Meilisearch. Returns the number of records indexed.
        /// </summary>
        /// <param name="records">A list of person records to index.</param>
        [HttpPost("index")]
        public async Task<IActionResult> IndexAsync([FromBody] IEnumerable<PersonRecord> records)
        {
            if (records == null)
            {
                return BadRequest("Records body cannot be null");
            }
            var count = await _indexService.IndexRecordsAsync(records);
            return Ok(new { Indexed = count });
        }

        /// <summary>
        /// Searches for people by name. The query is expanded using nickname lookup, and phonetic and fuzzy
        /// matching are applied when querying Meilisearch. Returns a list of matches with scores.
        /// </summary>
        /// <param name="query">The search query, typically a person name.</param>
        /// <param name="limit">Maximum number of results to return (default 10).</param>
        [HttpGet("search")]
        public async Task<IActionResult> SearchAsync([FromQuery] string query, [FromQuery] int limit = 10)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Query parameter is required.");
            }
            var results = await _searchService.SearchAsync(query, limit);
            return Ok(results);
        }

        /// <summary>
        /// Example endpoint returning a sample PersonRecord. Useful for debugging the basic model contract.
        /// </summary>
        [HttpGet("example")]
        public IActionResult Example()
        {
            var sample = new PersonRecord(
                Id: "1",
                FirstName: "Liz",
                LastName: "Morrison",
                MiddleName: null,
                City: "Seattle",
                State: "WA",
                Dob: null
            );
            return Ok(sample);
        }

        /// <summary>
        /// Fetches sample people from randomuser.me and indexes them in bulk.
        /// Useful for seeding the development index with realistic-looking data.
        /// </summary>
        /// <param name="count">Number of sample users to fetch (max 5000).</param>
        [HttpPost("bulk-index-from-randomuser")]
        public async Task<IActionResult> BulkIndexFromRandomUser([FromQuery] int count = 100)
        {
            if (count <= 0) return BadRequest("Count must be > 0");
            if (count > 5000) return BadRequest("Count must be <= 5000");

            var url = $"https://randomuser.me/api/?results={count}&nat=us";
                try
                {
                    var client = _httpClientFactory.CreateClient("randomuser");
                    var resp = await client.GetAsync(url);
                    if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode, "Failed to fetch sample data");
                    var json = await resp.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    var list = new List<PersonRecord>();
                    var results = doc.RootElement.GetProperty("results");
                    foreach (var item in results.EnumerateArray())
                    {
                        var id = item.GetProperty("login").GetProperty("uuid").GetString() ?? Guid.NewGuid().ToString();
                        var name = item.GetProperty("name");
                        var location = item.GetProperty("location");
                        var dob = item.GetProperty("dob").GetProperty("date").GetString();
                        var pr = new PersonRecord(
                            Id: id,
                            FirstName: name.GetProperty("first").GetString() ?? string.Empty,
                            LastName: name.GetProperty("last").GetString() ?? string.Empty,
                            MiddleName: null,
                            City: location.GetProperty("city").GetString() ?? string.Empty,
                            State: location.GetProperty("state").GetString() ?? string.Empty,
                            Dob: DateTime.TryParse(dob, out var d) ? d : null
                        );
                        list.Add(pr);
                    }

                    var indexed = await _indexService.IndexRecordsAsync(list);
                    return Ok(new { Indexed = indexed });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Bulk indexing from randomuser failed");
                    return StatusCode(500, "Bulk indexing failed");
                }
        }

            /// <summary>
            /// Enqueue a background bulk index job (returns job id immediately).
            /// </summary>
            [HttpPost("enqueue-bulk-index")]
            public async Task<IActionResult> EnqueueBulkIndex([FromQuery] int count = 100)
            {
                if (count <= 0 || count > 5000) return BadRequest("Count must be 1..5000");
                var jobId = Guid.NewGuid().ToString();
                var jobTracker = HttpContext.RequestServices.GetRequiredService<Background.JobTracker>();
                var queue = HttpContext.RequestServices.GetRequiredService<Background.IBackgroundTaskQueue>();
                jobTracker.SetStatus(jobId, "Queued");
                await queue.QueueBackgroundWorkItemAsync(async ct =>
                {
                    try
                    {
                        jobTracker.SetStatus(jobId, "Running");
                        // Reuse the existing controller method to perform the work by calling the service directly.
                        var url = $"https://randomuser.me/api/?results={count}&nat=us";
                        var client = _httpClientFactory.CreateClient("randomuser");
                        var resp = await client.GetAsync(url, ct);
                        resp.EnsureSuccessStatusCode();
                        var json = await resp.Content.ReadAsStringAsync(ct);
                        using var doc = JsonDocument.Parse(json);
                        var list = new List<PersonRecord>();
                        var results = doc.RootElement.GetProperty("results");
                        foreach (var item in results.EnumerateArray())
                        {
                            var id = item.GetProperty("login").GetProperty("uuid").GetString() ?? Guid.NewGuid().ToString();
                            var name = item.GetProperty("name");
                            var location = item.GetProperty("location");
                            var dob = item.GetProperty("dob").GetProperty("date").GetString();
                            var pr = new PersonRecord(
                                Id: id,
                                FirstName: name.GetProperty("first").GetString() ?? string.Empty,
                                LastName: name.GetProperty("last").GetString() ?? string.Empty,
                                MiddleName: null,
                                City: location.GetProperty("city").GetString() ?? string.Empty,
                                State: location.GetProperty("state").GetString() ?? string.Empty,
                                Dob: DateTime.TryParse(dob, out var d) ? d : null
                            );
                            list.Add(pr);
                        }
                        await _indexService.IndexRecordsAsync(list);
                        jobTracker.SetStatus(jobId, $"Completed: {list.Count}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Background bulk index failed");
                        jobTracker.SetStatus(jobId, "Failed");
                    }
                });
                return Accepted(new { JobId = jobId });
            }

            [HttpGet("job-status/{id}")]
            public IActionResult JobStatus(string id)
            {
                var jobTracker = HttpContext.RequestServices.GetRequiredService<Background.JobTracker>();
                var status = jobTracker.GetStatus(id);
                if (status == null) return NotFound();
                return Ok(new { Id = id, Status = status });
            }

            /// <summary>
            /// Returns simple stats for the 'persons' index in Meilisearch (e.g. document count).
            /// Useful for quick debugging from Swagger or the browser.
            /// </summary>
            [HttpGet("index-stats")]
            public async Task<IActionResult> IndexStats()
            {
                try
                {
                    var meili = HttpContext.RequestServices.GetRequiredService<MeiliSearchClient>();
                    var json = await meili.GetIndexStatsAsync("persons");
                    return Ok(JsonSerializer.Deserialize<object>(json.RootElement.GetRawText()));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to fetch index stats");
                    return StatusCode(500, "Failed to fetch index stats");
                }
            }
    }
}