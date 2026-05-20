/** @jest-environment node */
import { enqueue, getQueueStats } from "../requestQueue";

describe("requestQueue", () => {
  test("executes a function and returns its result", async () => {
    const result = await enqueue(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  test("propagates errors", async () => {
    await expect(
      enqueue(() => Promise.reject(new Error("test error")))
    ).rejects.toThrow("test error");
  });

  test("executes multiple tasks", async () => {
    const results = await Promise.all([
      enqueue(() => Promise.resolve(1)),
      enqueue(() => Promise.resolve(2)),
      enqueue(() => Promise.resolve(3)),
    ]);
    expect(results).toEqual([1, 2, 3]);
  });

  test("respects concurrency limit", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const tasks = Array.from({ length: 12 }, () =>
      enqueue(async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((r) => setTimeout(r, 10));
        concurrent--;
      })
    );

    await Promise.all(tasks);
    expect(maxConcurrent).toBeLessThanOrEqual(6); // MAX_CONCURRENT = 6
  });

  test("getQueueStats returns stats", () => {
    const stats = getQueueStats();
    expect(stats).toHaveProperty("running");
    expect(stats).toHaveProperty("highPending");
    expect(stats).toHaveProperty("lowPending");
  });
});
