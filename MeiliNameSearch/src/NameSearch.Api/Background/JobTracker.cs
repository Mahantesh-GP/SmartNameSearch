using System.Collections.Concurrent;

namespace NameSearch.Api.Background
{
    /// <summary>
    /// Simple in-memory job status tracker using a concurrent dictionary.
    /// </summary>
    public class JobTracker
    {
        private readonly ConcurrentDictionary<string, string> _statuses = new();

        /// <summary>
        /// Sets the status for a job.
        /// </summary>
        /// <param name="id">The job identifier.</param>
        /// <param name="status">The status message (e.g., "Queued", "Running", "Completed", "Failed").</param>
        public void SetStatus(string id, string status) => _statuses[id] = status;
        
        /// <summary>
        /// Gets the current status for a job.
        /// </summary>
        /// <param name="id">The job identifier.</param>
        /// <returns>The status message, or null if the job is not found.</returns>
        public string? GetStatus(string id) => _statuses.TryGetValue(id, out var s) ? s : null;
    }
}
