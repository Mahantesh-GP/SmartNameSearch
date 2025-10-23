using System.Collections.Concurrent;

namespace NameSearch.Api.Background
{
    public class JobTracker
    {
        private readonly ConcurrentDictionary<string, string> _statuses = new();

        public void SetStatus(string id, string status) => _statuses[id] = status;
        public string? GetStatus(string id) => _statuses.TryGetValue(id, out var s) ? s : null;
    }
}
