/** @jest-environment node */
import { GET } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

describe("GET /api/pets", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna lista de pets com status 200", async () => {
    mockClient.query.mockResolvedValue({
      rows: [
        { pet_id: 1, pet_nome: "Rex", pet_especie: "Cachorro", dono_nome: "João" },
        { pet_id: 2, pet_nome: "Mimi", pet_especie: "Gato", dono_nome: "Maria" },
      ],
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].pet_nome).toBe("Rex");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna lista vazia quando não há pets", async () => {
    mockClient.query.mockResolvedValue({ rows: [] });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  test("retorna 500 em caso de erro no banco", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao buscar pets");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
