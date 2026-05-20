/** @jest-environment node */
import { GET } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../../_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

jest.mock("../../../_lib/apiKey", () => ({
  requireApiKey: jest.fn(() => null),
}));

function makeRequest(params = "") {
  return {
    url: `http://localhost/api/v1/saude${params}`,
    headers: { get: () => null },
    _apiConsumer: "test",
  };
}

describe("GET /api/v1/saude", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna saúde por pet_id", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ pet_id: 1, sau_doencas: "Nenhuma", pet_nome: "Rex" }],
    });

    const res = await GET(makeRequest("?pet_id=1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  test("rejeita pet_id inválido", async () => {
    const res = await GET(makeRequest("?pet_id=abc"));
    expect(res.status).toBe(400);
  });

  test("filtra pets com doenças contagiosas", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ pet_id: 1, sau_contagiosas: "Leptospirose", pet_nome: "Rex" }],
    });

    const res = await GET(makeRequest("?contagiosas=true"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.alerta_saude).toBeTruthy();
    expect(data.data).toHaveLength(1);
  });

  test("retorna todos os registros sem filtro", async () => {
    mockClient.query.mockResolvedValue({ rows: [] });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toEqual([]);
  });

  test("retorna 500 em caso de erro", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest("?pet_id=1"));
    expect(res.status).toBe(500);
  });
});
