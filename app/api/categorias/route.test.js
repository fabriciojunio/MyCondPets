/** @jest-environment node */
import { GET } from "./route";
import db from "@/app/_lib/db";

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe("GET /api/categorias", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna lista de categorias com status 200", async () => {
    db.query.mockResolvedValue({
      rows: [
        { cat_id: 1, cat_nome: "Ração" },
        { cat_id: 2, cat_nome: "Brinquedos" },
      ],
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.categorias).toHaveLength(2);
    expect(data.categorias[0].cat_nome).toBe("Ração");
  });

  test("retorna lista vazia quando não há categorias", async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.categorias).toHaveLength(0);
  });

  test("retorna 500 em caso de erro no banco", async () => {
    db.query.mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro interno");
  });
});
