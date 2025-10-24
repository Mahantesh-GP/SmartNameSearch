using System;
using System.Threading;
using System.Threading.Tasks;

namespace NameSearch.Api.Background
{
    /// <summary>
    /// Represents a queue for background work items that can be processed asynchronously.
    /// </summary>
    public interface IBackgroundTaskQueue
    {
        /// <summary>
        /// Queues a background work item for asynchronous execution.
        /// </summary>
        /// <param name="workItem">The work item to queue.</param>
        ValueTask QueueBackgroundWorkItemAsync(Func<CancellationToken, Task> workItem);
        
        /// <summary>
        /// Dequeues a background work item for execution.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token to stop waiting for work items.</param>
        /// <returns>The next work item to execute.</returns>
        ValueTask<Func<CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken);
    }
}
