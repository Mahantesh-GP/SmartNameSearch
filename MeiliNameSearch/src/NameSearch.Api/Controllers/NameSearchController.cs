using Microsoft.AspNetCore.Mvc;
using NameSearch.Domain.Entities;
using NameSearch.Infrastructure.Services;
using NameSearch.Infrastructure.Models;

namespace NameSearch.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class NameSearchController : ControllerBase
    {
        private readonly IndexService _indexService;
        private readonly SearchService _searchService;

        public NameSearchController(IndexService indexService, SearchService searchService)
        {
            _indexService = indexService;
            _searchService = searchService;
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
    }
}