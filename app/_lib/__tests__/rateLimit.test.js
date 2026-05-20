/** @jest-environment node */

describe("rateLimit", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function makeRequest(ip = "127.0.0.1") {
    return {
      headers: {
        get: (name) => {
          if (name === "x-forwarded-for") return ip;
          return null;
        },
      },
    };
  }

  test("allows requests under the limit", async () => {
    const { rateLimit } = await import("../rateLimit");
    const req = makeRequest("10.0.0.1");

    const result = rateLimit(req, { max: 5, windowMs: 60000 });
    expect(result).toBe(false);
  });

  test("blocks requests over the limit", async () => {
    const { rateLimit } = await import("../rateLimit");
    const req = makeRequest("10.0.0.2");

    for (let i = 0; i < 3; i++) {
      rateLimit(req, { max: 3, windowMs: 60000 });
    }

    const blocked = rateLimit(req, { max: 3, windowMs: 60000 });
    expect(blocked).toBe(true);
  });

  test("tracks different IPs separately", async () => {
    const { rateLimit } = await import("../rateLimit");

    const req1 = makeRequest("10.0.0.3");
    const req2 = makeRequest("10.0.0.4");

    for (let i = 0; i < 3; i++) {
      rateLimit(req1, { max: 3, windowMs: 60000 });
    }

    // req1 should be blocked, req2 should not
    expect(rateLimit(req1, { max: 3, windowMs: 60000 })).toBe(true);
    expect(rateLimit(req2, { max: 3, windowMs: 60000 })).toBe(false);
  });
});
