using Microsoft.AspNetCore.Mvc;
using NameSearch.Domain.Entities;
using NameSearch.Infrastructure.Services;

namespace NameSearch.Api.Controllers
{
    /// <summary>
    /// Controller that provides synthetic sample data seeding when external sources are unavailable.
    /// </summary>
    [ApiController]
    [Route("NameSearch")]
    public class SampleDataController : ControllerBase
    {
        private readonly IndexService _indexService;
        private readonly ILogger<SampleDataController> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="SampleDataController"/> class.
        /// </summary>
        /// <param name="indexService">Indexing service.</param>
        /// <param name="logger">Logger.</param>
        public SampleDataController(IndexService indexService, ILogger<SampleDataController> logger)
        {
            _indexService = indexService;
            _logger = logger;
        }

        /// <summary>
        /// Generates synthetic sample person data (no external network) and indexes them in bulk.
        /// Useful as a fallback when RandomUser is unavailable or blocked.
        /// </summary>
        /// <param name="count">Number of sample users to generate (max 5000).</param>
        [HttpPost("bulk-index-sample")]
        public async Task<IActionResult> BulkIndexSample([FromQuery] int count = 100)
        {
            if (count <= 0) return BadRequest("Count must be > 0");
            if (count > 5000) return BadRequest("Count must be <= 5000");

            var firstNames = new[] { "John", "Jane", "Mike", "Emily", "Maha", "Mahantesh", "Liz", "Beth", "William", "Will", "Bill", "Robert", "Rob", "Bob", "Catherine", "Kate", "Katherine", "Kathy", "Kaitlyn" };
            var lastNames = new[] { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Morrison", "Anderson", "Thomas", "Jackson" };
            var cities = new[] { "Seattle", "Austin", "San Francisco", "New York", "Chicago", "Miami", "Denver", "Boston" };
            var states = new[] { "WA", "TX", "CA", "NY", "IL", "FL", "CO", "MA" };
            var rnd = new Random();

            var list = new List<PersonRecord>(count);
            for (int i = 0; i < count; i++)
            {
                var first = firstNames[rnd.Next(firstNames.Length)];
                var last = lastNames[rnd.Next(lastNames.Length)];
                var city = cities[rnd.Next(cities.Length)];
                var state = states[rnd.Next(states.Length)];
                DateTime? dob = null;
                if (rnd.NextDouble() > 0.3)
                {
                    var year = rnd.Next(1950, 2005);
                    var month = rnd.Next(1, 13);
                    var day = rnd.Next(1, DateTime.DaysInMonth(year, month) + 1);
                    dob = new DateTime(year, month, day);
                }

                var pr = new PersonRecord(
                    Id: Guid.NewGuid().ToString(),
                    FirstName: first,
                    LastName: last,
                    MiddleName: null,
                    City: city,
                    State: state,
                    Dob: dob
                );
                list.Add(pr);
            }

            try
            {
                var indexed = await _indexService.IndexRecordsAsync(list);
                return Ok(new { Indexed = indexed });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Synthetic bulk indexing failed");
                return StatusCode(500, "Bulk indexing failed");
            }
        }

        /// <summary>
        /// Enqueue a background bulk index job with synthetic data (returns job id immediately).
        /// Useful as a reliable alternative to RandomUser API.
        /// </summary>
        [HttpPost("enqueue-bulk-index-sample")]
        public async Task<IActionResult> EnqueueBulkIndexSample([FromQuery] int count = 100)
        {
            if (count <= 0 || count > 5000) return BadRequest("Count must be 1..5000");
            var jobId = Guid.NewGuid().ToString();
            var jobTracker = HttpContext.RequestServices.GetRequiredService<NameSearch.Api.Background.JobTracker>();
            var queue = HttpContext.RequestServices.GetRequiredService<NameSearch.Api.Background.IBackgroundTaskQueue>();
            jobTracker.SetStatus(jobId, "Queued");
            
            await queue.QueueBackgroundWorkItemAsync(async ct =>
            {
                try
                {
                    jobTracker.SetStatus(jobId, "Running");
                    
                    var firstNames = new[] { "John", "Jane", "Mike", "Emily", "Maha", "Mahantesh", "Liz", "Beth", "William", "Will", "Bill", "Robert", "Rob", "Bob", "Catherine", "Kate", "Katherine", "Kathy", "Kaitlyn" };
                    var lastNames = new[] { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Morrison", "Anderson", "Thomas", "Jackson" };
                    var cities = new[] { "Seattle", "Austin", "San Francisco", "New York", "Chicago", "Miami", "Denver", "Boston" };
                    var states = new[] { "WA", "TX", "CA", "NY", "IL", "FL", "CO", "MA" };
                    var rnd = new Random();

                    var list = new List<PersonRecord>(count);
                    for (int i = 0; i < count; i++)
                    {
                        var first = firstNames[rnd.Next(firstNames.Length)];
                        var last = lastNames[rnd.Next(lastNames.Length)];
                        var city = cities[rnd.Next(cities.Length)];
                        var state = states[rnd.Next(states.Length)];
                        DateTime? dob = null;
                        if (rnd.NextDouble() > 0.3)
                        {
                            var year = rnd.Next(1950, 2005);
                            var month = rnd.Next(1, 13);
                            var day = rnd.Next(1, DateTime.DaysInMonth(year, month) + 1);
                            dob = new DateTime(year, month, day);
                        }

                        var pr = new PersonRecord(
                            Id: Guid.NewGuid().ToString(),
                            FirstName: first,
                            LastName: last,
                            MiddleName: null,
                            City: city,
                            State: state,
                            Dob: dob
                        );
                        list.Add(pr);
                    }

                    await _indexService.IndexRecordsAsync(list);
                    jobTracker.SetStatus(jobId, $"Completed: {list.Count}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background synthetic bulk index failed");
                    jobTracker.SetStatus(jobId, "Failed");
                }
            });
            
            return Accepted(new { JobId = jobId });
        }
    }
}
