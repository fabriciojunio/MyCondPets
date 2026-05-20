/** @jest-environment node */
import { GET } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../../_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

jest.mock("../../../_lib/requestQueue", () => ({
  getQueueStats: jest.fn(() => ({ running: 0, highPending: 0, lowPending: 0 })),
}));

function makeRequest() {
  return {
    url: "http://localhost/api/v1/health",
    headers: { get: () => null },
  };
}

describe("GET /api/v1/health", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna healthy quando o banco está ok", async () => {
    mockClient.query.mockResolvedValue({ rows: [{ "?column?": 1 }] });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.database.status).toBe("ok");
    expect(data.version).toBe("1.0.0");
    expect(data.timestamp).toBeDefined();
    expect(data.response_time_ms).toBeDefined();
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna degraded quando o banco falha", async () => {
    const db = require("../../../_lib/db").default;
    db.connect.mockRejectedValueOnce(new Error("Connection failed"));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.checks.database.status).toBe("error");
  });
});
