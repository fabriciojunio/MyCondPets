/**
 * app/perfilDono/perfilDono.test.js
 */
import React from "react";
import { render, screen } from "@testing-library/react";

// ---------------------------
// MOCKS - DECLARAR ANTES DAS IMPORTAÇÕES
// ---------------------------

// 1. Mock do PerfilContent (NAMED EXPORT)
jest.mock("../../app/perfilDono/PerfilContent", () => ({
  PerfilContent: function MockPerfilContent({ dono, pets, residencia }) {
    return (
      <div data-testid="perfil-content-mock">
        <div data-testid="dono-nome">{dono?.don_nome || ""}</div>
        <div data-testid="dono-email">{dono?.don_email || ""}</div>
        <div data-testid="dono-contato">{dono?.don_contato || ""}</div>
        <div data-testid="residencia">{residencia?.res_complemento || ""}</div>
        <div data-testid="pets-count">{pets?.length || 0}</div>
      </div>
    );
  }
}));

// 2. Mock do next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// 3. Mock do authOptions
jest.mock("@/app/_lib/authOptions", () => ({
  authOptions: {},
}));

// 4. Mock do redirect
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// 5. Mock do banco de dados
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: {
    connect: jest.fn(() => Promise.resolve(mockClient)),
  },
}));

// ---------------------------
// IMPORTAÇÕES DEPOIS DOS MOCKS
// ---------------------------
import Home from "../../app/perfilDono/page";
const { getServerSession } = require("next-auth");
const { redirect } = require("next/navigation");

// ---------------------------
// TESTES
// ---------------------------
describe("Home Page (Server Component)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockClear();
    mockClient.release.mockClear();
  });

  test("redireciona para /login quando não houver sessão", async () => {
    getServerSession.mockResolvedValueOnce(null);

    await Home();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  test("renderiza dados do dono e pets corretamente", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@teste.com" },
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            don_id: 1,
            don_cpf: "123",
            don_nome: "João",
            don_email: "teste@teste.com",
            don_contato: "9999-9999",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { pet_id: 1, pet_nome: "Rex", pet_tipo: "Cachorro" },
          { pet_id: 2, pet_nome: "Mimi", pet_tipo: "Gato" },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ res_id: 1, res_complemento: "Apt 21B" }],
      });

    const ui = await Home();
    render(ui);

    expect(screen.getByTestId("perfil-content-mock")).toBeInTheDocument();
    expect(screen.getByTestId("dono-nome")).toHaveTextContent("João");
    expect(screen.getByTestId("dono-email")).toHaveTextContent("teste@teste.com");
    expect(screen.getByTestId("dono-contato")).toHaveTextContent("9999-9999");
    expect(screen.getByTestId("residencia")).toHaveTextContent("Apt 21B");
    expect(screen.getByTestId("pets-count")).toHaveTextContent("2");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("mostra mensagem de erro quando não encontra dono", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@teste.com" },
    });

    mockClient.query.mockResolvedValueOnce({
      rows: [],
    });

    const ui = await Home();
    render(ui);

    const headingError = screen.getByRole("heading", { name: /dono não encontrado/i });
    expect(headingError).toBeInTheDocument();
  });

  test("libera conexão do banco mesmo em caso de erro", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@teste.com" },
    });

    mockClient.query.mockRejectedValueOnce(new Error("Erro no banco"));

    try {
      await Home();
    } catch (error) {
      // Erro esperado
    }

    expect(mockClient.release).toHaveBeenCalled();
  });

  test("trata caso onde pets é array vazio", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@teste.com" },
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            don_id: 1,
            don_nome: "João",
            don_email: "teste@teste.com",
            don_contato: "9999-9999",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ res_complemento: "Apt 21B" }],
      });

    const ui = await Home();
    render(ui);

    expect(screen.getByTestId("pets-count")).toHaveTextContent("0");
  });

  test("trata caso onde residência não existe", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@teste.com" },
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            don_id: 1,
            don_nome: "João",
            don_email: "teste@teste.com",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ pet_id: 1, pet_nome: "Rex" }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const ui = await Home();
    render(ui);

    const residencia = screen.getByTestId("residencia");
    expect(residencia.textContent).toBe("");
  });
});