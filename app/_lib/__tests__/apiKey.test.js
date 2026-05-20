/** @jest-environment node */

describe("apiKey", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  function makeRequest(apiKey) {
    const headers = new Map();
    if (apiKey) headers.set("x-api-key", apiKey);
    return { headers: { get: (name) => headers.get(name) || null } };
  }

  test("validateApiKey returns valid for correct key", async () => {
    process.env.MYCONDPETS_API_KEYS = "test-key-123:condmanager,key2:clinic";
    const { validateApiKey } = await import("../apiKey");

    const result = validateApiKey(makeRequest("test-key-123"));
    expect(result.valid).toBe(true);
    expect(result.consumer).toBe("condmanager");
  });

  test("validateApiKey returns invalid for wrong key", async () => {
    process.env.MYCONDPETS_API_KEYS = "correct-key:label";
    const { validateApiKey } = await import("../apiKey");

    const result = validateApiKey(makeRequest("wrong-key"));
    expect(result.valid).toBe(false);
    expect(result.consumer).toBeNull();
  });

  test("validateApiKey returns invalid when no key sent", async () => {
    process.env.MYCONDPETS_API_KEYS = "some-key:label";
    const { validateApiKey } = await import("../apiKey");

    const result = validateApiKey(makeRequest(null));
    expect(result.valid).toBe(false);
  });

  test("validateApiKey returns invalid when no keys configured", async () => {
    process.env.MYCONDPETS_API_KEYS = "";
    const { validateApiKey } = await import("../apiKey");

    const result = validateApiKey(makeRequest("any-key"));
    expect(result.valid).toBe(false);
  });

  test("requireApiKey returns 401 response for invalid key", async () => {
    process.env.MYCONDPETS_API_KEYS = "valid:label";
    const { requireApiKey } = await import("../apiKey");

    const response = requireApiKey(makeRequest("invalid"));
    expect(response).not.toBeNull();
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("requireApiKey returns null for valid key", async () => {
    process.env.MYCONDPETS_API_KEYS = "valid-key:myapp";
    const { requireApiKey } = await import("../apiKey");

    const req = makeRequest("valid-key");
    const response = requireApiKey(req);
    expect(response).toBeNull();
    expect(req._apiConsumer).toBe("myapp");
  });

  test("supports multiple API keys", async () => {
    process.env.MYCONDPETS_API_KEYS = "key1:app1,key2:app2,key3:app3";
    const { validateApiKey } = await import("../apiKey");

    expect(validateApiKey(makeRequest("key1")).consumer).toBe("app1");
    expect(validateApiKey(makeRequest("key2")).consumer).toBe("app2");
    expect(validateApiKey(makeRequest("key3")).consumer).toBe("app3");
    expect(validateApiKey(makeRequest("key4")).valid).toBe(false);
  });
});
