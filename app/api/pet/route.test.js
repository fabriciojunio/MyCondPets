/** @jest-environment node */
import { DELETE } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

const makeRequest = (body) => ({
  json: jest.fn().mockResolvedValue(body),
});

describe("DELETE /api/pet", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna 400 quando faltam dados", async () => {
    const res = await DELETE(makeRequest({ pet_nome: "", userEmail: "" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(400);
    expect(data.error).toBe("Dados inválidos");
  });

  test("retorna 400 quando pet_nome está ausente", async () => {
    const res = await DELETE(makeRequest({ userEmail: "a@b.com" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(400);
  });

  test("retorna 404 quando dono não é encontrado", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const res = await DELETE(makeRequest({ pet_nome: "Rex", userEmail: "a@b.com" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(404);
    expect(data.error).toBe("Dono não encontrado");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna 404 quando pet não é encontrado para o dono", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ don_id: 1 }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    const res = await DELETE(makeRequest({ pet_nome: "Rex", userEmail: "a@b.com" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(404);
    expect(data.error).toBe("Pet não encontrado");
  });

  test("exclui pet com sucesso e retorna 200", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ don_id: 1 }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const res = await DELETE(makeRequest({ pet_nome: "Rex", userEmail: "a@b.com" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(200);
    expect(data.message).toBe("Pet excluído com sucesso");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna 500 em caso de erro no banco", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await DELETE(makeRequest({ pet_nome: "Rex", userEmail: "a@b.com" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao excluir pet");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
