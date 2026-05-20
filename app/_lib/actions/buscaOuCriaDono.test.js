import { buscaOuCriaDono } from "./buscaOuCriaDono";

// Mock do pool de conexão
jest.mock("../db", () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

import pool from "../db";

describe("buscaOuCriaDono", () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Cria o mock do client retornado por pool.connect()
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValue(mockClient);
  });

  test("deve ser uma função", () => {
    expect(typeof buscaOuCriaDono).toBe("function");
  });

  test("deve retornar dono existente", async () => {
    // 1ª query → busca por email
    mockClient.query.mockResolvedValueOnce({
      rows: [
        { 
          don_id: 1, 
          don_email: "teste@email.com", 
          don_nome: "Teste",
          don_contato: "9999-9999"
        }
      ],
    });

    // 2ª query → busca por residência
    mockClient.query.mockResolvedValueOnce({
      rows: [
        { 
          res_complemento: "Apto 10", 
          res_numero: "200", 
          res_cep: "12345-000" 
        },
      ],
    });

    const result = await buscaOuCriaDono("teste@email.com", "Teste");

    expect(result).toHaveProperty("dono");
    expect(result.isNew).toBe(false);

    // Verifica se as queries foram chamadas corretamente
    expect(mockClient.query).toHaveBeenCalledWith(
      "SELECT * FROM dono WHERE don_email = $1",
      ["teste@email.com"]
    );
  });

  test("deve lançar erro se email não for fornecido", async () => {
    await expect(buscaOuCriaDono(null, "Nome"))
      .rejects.toThrow("Email é obrigatório.");
  });
});
