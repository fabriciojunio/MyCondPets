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

function makeRequest() {
  return {
    url: "http://localhost/api/v1/dashboard-saude",
    headers: { get: () => null },
    _apiConsumer: "test",
  };
}

describe("GET /api/v1/dashboard-saude", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna métricas de saúde com alertas", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ total: 20 }] })   // total pets
      .mockResolvedValueOnce({ rows: [{ total: 5 }] })    // vacinas atrasadas
      .mockResolvedValueOnce({ rows: [{ total: 3 }] })    // vencendo
      .mockResolvedValueOnce({ rows: [{ total: 10 }] })   // em dia
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })    // doenças contagiosas
      .mockResolvedValueOnce({ rows: [{ total: 15 }] })   // total donos
      .mockResolvedValueOnce({ rows: [{ vacinados: 10 }] }); // cobertura

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.resumo.total_pets).toBe(20);
    expect(data.resumo.vacinacao.atrasada).toBe(5);
    expect(data.resumo.doencas_contagiosas).toBe(2);
    expect(data.resumo.cobertura_vacinal_pct).toBe(50);
    expect(data.alertas.length).toBeGreaterThan(0);
    expect(data.impacto_saude).toBeTruthy();
    expect(data.timestamp).toBeDefined();
  });

  test("retorna sem alertas quando tudo está em dia", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ total: 10 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })    // sem atrasadas
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 10 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })    // sem contagiosas
      .mockResolvedValueOnce({ rows: [{ total: 8 }] })
      .mockResolvedValueOnce({ rows: [{ vacinados: 10 }] }); // 100% cobertura

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(data.alertas).toHaveLength(0);
    expect(data.resumo.cobertura_vacinal_pct).toBe(100);
  });

  test("retorna 500 em caso de erro", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
