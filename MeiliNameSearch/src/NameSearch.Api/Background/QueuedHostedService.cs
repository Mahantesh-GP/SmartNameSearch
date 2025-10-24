using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace NameSearch.Api.Background
{
    /// <summary>
    /// Background hosted service that continuously processes work items from the background task queue.
    /// </summary>
    public class QueuedHostedService : BackgroundService
    {
        private readonly IBackgroundTaskQueue _taskQueue;
        private readonly ILogger<QueuedHostedService> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="QueuedHostedService"/> class.
        /// </summary>
        /// <param name="taskQueue">The background task queue to process.</param>
        /// <param name="logger">Logger for diagnostic messages.</param>
        public QueuedHostedService(IBackgroundTaskQueue taskQueue, ILogger<QueuedHostedService> logger)
        {
            _taskQueue = taskQueue;
            _logger = logger;
        }

        /// <summary>
        /// Executes the background service, continuously dequeuing and processing work items.
        /// </summary>
        /// <param name="stoppingToken">Cancellation token to signal when to stop processing.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Background worker running.");
            while (!stoppingToken.IsCancellationRequested)
            {
                var workItem = await _taskQueue.DequeueAsync(stoppingToken);
                try
                {
                    await workItem(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing background work item.");
                }
            }
            _logger.LogInformation("Background worker stopping.");
        }
    }
}
