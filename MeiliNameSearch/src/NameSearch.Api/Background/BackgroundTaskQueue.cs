using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace NameSearch.Api.Background
{
    /// <summary>
    /// Thread-safe in-memory queue for background work items using a semaphore for signaling.
    /// </summary>
    public class BackgroundTaskQueue : IBackgroundTaskQueue
    {
        private readonly ConcurrentQueue<Func<CancellationToken, Task>> _workItems = new();
        private readonly SemaphoreSlim _signal = new(0);

        /// <summary>
        /// Queues a background work item for asynchronous execution.
        /// </summary>
        /// <param name="workItem">The work item to queue.</param>
        public ValueTask QueueBackgroundWorkItemAsync(Func<CancellationToken, Task> workItem)
        {
            if (workItem == null) throw new ArgumentNullException(nameof(workItem));
            _workItems.Enqueue(workItem);
            _signal.Release();
            return ValueTask.CompletedTask;
        }

        /// <summary>
        /// Dequeues a background work item for execution.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token to stop waiting for work items.</param>
        /// <returns>The next work item to execute.</returns>
        public async ValueTask<Func<CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken)
        {
            await _signal.WaitAsync(cancellationToken);
            _workItems.TryDequeue(out var workItem);
            return workItem!;
        }
    }
}
