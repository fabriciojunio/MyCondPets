/** @jest-environment node */
import { verificaPerfilCompleto } from "./verificaPerfilCompleto";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

describe("verificaPerfilCompleto", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna false quando email não é fornecido", async () => {
    expect(await verificaPerfilCompleto(null)).toBe(false);
    expect(await verificaPerfilCompleto("")).toBe(false);
  });

  test("retorna false quando dono não existe", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    expect(await verificaPerfilCompleto("nao@existe.com")).toBe(false);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna false quando dono não tem contato", async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [{ don_id: 1, don_contato: null }],
    });

    expect(await verificaPerfilCompleto("a@b.com")).toBe(false);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna false quando dono não tem residência", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ don_id: 1, don_contato: "11999" }] })
      .mockResolvedValueOnce({ rows: [] });

    expect(await verificaPerfilCompleto("a@b.com")).toBe(false);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna false quando residência está incompleta", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ don_id: 1, don_contato: "11999" }] })
      .mockResolvedValueOnce({
        rows: [{ res_complemento: "Apto 1", res_numero: null, res_cep: null }],
      });

    expect(await verificaPerfilCompleto("a@b.com")).toBe(false);
  });

  test("retorna true quando perfil está completo", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ don_id: 1, don_contato: "11999" }] })
      .mockResolvedValueOnce({
        rows: [{ res_complemento: "Apto 1", res_numero: "101", res_cep: "01001-000" }],
      });

    expect(await verificaPerfilCompleto("a@b.com")).toBe(true);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna false em caso de erro no banco", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    expect(await verificaPerfilCompleto("a@b.com")).toBe(false);
    expect(mockClient.release).toHaveBeenCalled();
  });
});
