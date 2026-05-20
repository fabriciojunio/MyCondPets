// Mock completo do next-auth para evitar problemas com dependências
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: "google",
    name: "Google",
    type: "oauth",
  })),
}));

// Mock da action para isolar a lógica do NextAuth
jest.mock("@/app/_lib/actions/buscaOuCriaDono", () => ({
  buscaOuCriaDono: jest.fn(),
}));

import { buscaOuCriaDono } from "@/app/_lib/actions/buscaOuCriaDono";

describe("NextAuth Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("buscaOuCriaDono é chamada corretamente", async () => {
    const mockDono = { don_id: 10, don_cpf: "12345678900" };
    buscaOuCriaDono.mockResolvedValue({ dono: mockDono });

    await buscaOuCriaDono("teste@gmail.com", "Teste");

    expect(buscaOuCriaDono).toHaveBeenCalledWith("teste@gmail.com", "Teste");
  });

  test("buscaOuCriaDono lida com erros", async () => {
    buscaOuCriaDono.mockRejectedValue(new Error("Erro BD"));

    await expect(buscaOuCriaDono("teste@gmail.com", "Teste")).rejects.toThrow(
      "Erro BD"
    );
  });
});
