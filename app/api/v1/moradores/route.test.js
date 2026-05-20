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
    url: `http://localhost/api/v1/moradores${params}`,
    headers: { get: () => null },
    _apiConsumer: "test",
  };
}

describe("GET /api/v1/moradores", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna lista de moradores", async () => {
    mockClient.query.mockResolvedValue({
      rows: [
        { don_id: 1, don_nome: "João", don_email: "joao@test.com" },
        { don_id: 2, don_nome: "Maria", don_email: "maria@test.com" },
      ],
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  test("retorna resumo com contagem de pets", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ don_id: 1, don_nome: "João", total_pets: 3 }],
    });

    const res = await GET(makeRequest("?resumo=true"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data[0].total_pets).toBe(3);
  });

  test("retorna 500 em caso de erro", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
