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

function makeRequest(params = "") {
  return {
    url: `http://localhost/api/v1/vacinacao${params}`,
    headers: { get: () => null },
    _apiConsumer: "test",
  };
}

describe("GET /api/v1/vacinacao", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna vacinas por pet_id", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ vac_id: 1, vac_tipo: "Antirrábica", vac_status: "em_dia" }],
    });

    const res = await GET(makeRequest("?pet_id=1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });

  test("filtra por status atrasada", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ vac_id: 1, vac_status: "atrasada", pet_nome: "Rex" }],
    });

    const res = await GET(makeRequest("?status=atrasada"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.filtro).toBe("atrasada");
    expect(data.impacto_saude).toBeTruthy();
  });

  test("rejeita pet_id inválido", async () => {
    const res = await GET(makeRequest("?pet_id=abc"));
    expect(res.status).toBe(400);
  });

  test("retorna todas as vacinas sem filtros", async () => {
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

describe("POST /api/v1/vacinacao", () => {
  beforeEach(() => jest.clearAllMocks());

  function makePostRequest(body) {
    return {
      url: "http://localhost/api/v1/vacinacao",
      headers: { get: () => null },
      _apiConsumer: "test",
      json: () => Promise.resolve(body),
    };
  }

  test("cria vacina com sucesso", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ pet_id: 1 }] }) // pet exists
      .mockResolvedValueOnce({ rows: [{ vac_id: 1, vac_tipo: "V10" }] }); // insert

    const res = await POST(
      makePostRequest({
        pet_id: 1,
        vac_tipo: "V10",
        vac_data_aplicacao: "2024-01-01",
        vac_data_vencimento: "2025-01-01",
      })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message).toContain("sucesso");
  });

  test("rejeita campos obrigatórios faltando", async () => {
    const res = await POST(makePostRequest({ pet_id: 1 }));
    expect(res.status).toBe(400);
  });

  test("rejeita pet inexistente", async () => {
    mockClient.query.mockResolvedValue({ rows: [] });

    const res = await POST(
      makePostRequest({
        pet_id: 999,
        vac_tipo: "V10",
        vac_data_aplicacao: "2024-01-01",
        vac_data_vencimento: "2025-01-01",
      })
    );
    expect(res.status).toBe(404);
  });
});
