/** @jest-environment node */
import { GET } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

const makeRequest = (url = "http://localhost/api/detalhesPets") => ({ url });

describe("GET /api/detalhesPets", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna lista paginada de pets com dados do dono e residência", async () => {
    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            nome: "Rex",
            raca: "Labrador",
            idade: "3 anos",
            cor: "Amarelo",
            dono: "João",
            telefone: "11999",
            endereco: "Apto 101",
            foto: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ total: "1" }] });

    const res = await GET(makeRequest());
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(200);
    expect(data.pets).toHaveLength(1);
    expect(data.pets[0].nome).toBe("Rex");
    expect(data.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("processa foto como string quando não é Buffer", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ nome: "Mimi", foto: "base64string", dono: "Maria" }] })
      .mockResolvedValueOnce({ rows: [{ total: "1" }] });

    const res = await GET(makeRequest());
    const data = JSON.parse(await res.text());

    expect(data.pets[0].foto).toBe("base64string");
  });

  test("retorna foto como null quando foto é undefined", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ nome: "Bob", foto: undefined, dono: "Pedro" }] })
      .mockResolvedValueOnce({ rows: [{ total: "1" }] });

    const res = await GET(makeRequest());
    const data = JSON.parse(await res.text());

    expect(data.pets[0].foto).toBeNull();
  });

  test("respeita os parâmetros de paginação page e limit", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: "50" }] });

    const res = await GET(makeRequest("http://localhost/api/detalhesPets?page=2&limit=10"));
    const data = JSON.parse(await res.text());

    expect(data.pagination).toEqual({ page: 2, limit: 10, total: 50, totalPages: 5 });
    // Confere LIMIT/OFFSET aplicados na query de dados
    const dataQueryParams = mockClient.query.mock.calls[0][1];
    expect(dataQueryParams).toEqual([10, 10]);
  });

  test("retorna 500 em caso de erro no banco", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest());
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao buscar pets");
  });
});
