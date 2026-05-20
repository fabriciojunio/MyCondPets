/** @jest-environment node */
import { GET, POST } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../../_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

jest.mock("../../../_lib/apiKey", () => ({
  requireApiKey: jest.fn(() => null),
}));

describe("POST /api/v1/webhooks", () => {
  beforeEach(() => jest.clearAllMocks());

  function makePostRequest(body) {
    return {
      url: "http://localhost/api/v1/webhooks",
      headers: { get: () => null },
      _apiConsumer: "test",
      json: () => Promise.resolve(body),
    };
  }

  test("registra webhook com sucesso", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // ensureTable
      .mockResolvedValueOnce({
        rows: [{ wh_id: 1, wh_url: "https://example.com/hook", wh_events: ["pet.created"] }],
      });

    const res = await POST(
      makePostRequest({
        url: "https://example.com/hook",
        events: ["pet.created"],
        secret: "mysecret",
      })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message).toContain("sucesso");
  });

  test("rejeita sem URL", async () => {
    const res = await POST(makePostRequest({ events: ["pet.created"] }));
    expect(res.status).toBe(400);
  });

  test("rejeita sem events", async () => {
    const res = await POST(makePostRequest({ url: "https://example.com" }));
    expect(res.status).toBe(400);
  });

  test("rejeita URL inválida", async () => {
    const res = await POST(
      makePostRequest({ url: "not-a-url", events: ["pet.created"] })
    );
    expect(res.status).toBe(400);
  });

  test("rejeita eventos inválidos", async () => {
    const res = await POST(
      makePostRequest({
        url: "https://example.com",
        events: ["invalid.event"],
      })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("inválidos");
  });
});

describe("GET /api/v1/webhooks", () => {
  beforeEach(() => jest.clearAllMocks());

  function makeRequest() {
    return {
      url: "http://localhost/api/v1/webhooks",
      headers: { get: () => null },
      _apiConsumer: "test",
    };
  }

  test("lista webhooks registrados", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // ensureTable
      .mockResolvedValueOnce({
        rows: [{ wh_id: 1, wh_url: "https://example.com/hook" }],
      });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.eventos_validos).toBeDefined();
  });
});
