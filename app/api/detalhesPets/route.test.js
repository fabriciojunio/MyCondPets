/** @jest-environment node */
import { GET } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

describe("GET /api/detalhesPets", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna lista de pets com dados do dono e residência", async () => {
    mockClient.query.mockResolvedValue({
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
    });

    const res = await GET();
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].nome).toBe("Rex");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("processa foto como string quando não é Buffer", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ nome: "Mimi", foto: "base64string", dono: "Maria" }],
    });

    const res = await GET();
    const data = JSON.parse(await res.text());

    expect(data[0].foto).toBe("base64string");
  });

  test("retorna foto como null quando foto é undefined", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ nome: "Bob", foto: undefined, dono: "Pedro" }],
    });

    const res = await GET();
    const data = JSON.parse(await res.text());

    expect(data[0].foto).toBeNull();
  });

  test("retorna 500 em caso de erro no banco", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao buscar pets");
  });
});
