/** @jest-environment node */
import { GET } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../../_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

jest.mock("../../../_lib/apiKey", () => ({
  requireApiKey: jest.fn(() => null), // auth passes by default
}));

function makeRequest(params = "") {
  return {
    url: `http://localhost/api/v1/pets${params}`,
    headers: { get: () => null },
    _apiConsumer: "test",
  };
}

describe("GET /api/v1/pets", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna lista de pets com status 200", async () => {
    mockClient.query.mockResolvedValue({
      rows: [
        { pet_id: 1, pet_nome: "Rex", don_nome: "João" },
        { pet_id: 2, pet_nome: "Mimi", don_nome: "Maria" },
      ],
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.timestamp).toBeDefined();
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("filtra por pet_id", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ pet_id: 1, pet_nome: "Rex" }],
    });

    const res = await GET(makeRequest("?pet_id=1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });

  test("rejeita pet_id inválido", async () => {
    const res = await GET(makeRequest("?pet_id=abc"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("inválido");
  });

  test("filtra por dono_id", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ pet_id: 1, pet_nome: "Rex", don_id: 5 }],
    });

    const res = await GET(makeRequest("?dono_id=5"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });

  test("retorna 500 em caso de erro no banco", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain("Erro");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna 401 quando API key inválida", async () => {
    const { requireApiKey } = require("../../../_lib/apiKey");
    requireApiKey.mockReturnValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });
});
