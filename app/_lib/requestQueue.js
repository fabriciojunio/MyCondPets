/**
 * Request queue with concurrency control and priority.
 * Prevents overwhelming the database or external APIs
 * with too many simultaneous requests.
 */

const MAX_CONCURRENT = 6;
let running = 0;
const highQueue = [];
const lowQueue = [];

/**
 * Enqueue a function for controlled execution.
 * @param {() => Promise<T>} fn - async function to execute
 * @param {'high' | 'low'} priority
 * @returns {Promise<T>}
 * @template T
 */
export function enqueue(fn, priority = "low") {
  return new Promise((resolve, reject) => {
    const task = { fn, resolve, reject };

    if (priority === "high") {
      highQueue.push(task);
    } else {
      lowQueue.push(task);
    }

    processQueue();
  });
}

function processQueue() {
  while (running < MAX_CONCURRENT) {
    const task = highQueue.shift() || lowQueue.shift();
    if (!task) break;

    running++;
    task
      .fn()
      .then(task.resolve)
      .catch(task.reject)
      .finally(() => {
        running--;
        processQueue();
      });
  }
}

/**
 * Get current queue stats.
 * @returns {{ running: number, highPending: number, lowPending: number }}
 */
export function getQueueStats() {
  return {
    running,
    highPending: highQueue.length,
    lowPending: lowQueue.length,
  };
}
