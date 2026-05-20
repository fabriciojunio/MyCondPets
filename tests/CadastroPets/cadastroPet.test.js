/**
 * app/cadastropet/cadastroPet.test.js
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import CadastroPage from "../../app/cadastropet/page";
import { redirect } from "next/navigation";
import pool from "@/app/_lib/db";
import { getServerSession } from "next-auth";

// ---------------------------
// MOCKS
// ---------------------------

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

jest.mock("../../app/cadastropet/FormCadastroPet", () => ({
  __esModule: true,
  default: ({ donoId }) =>
    <div data-testid="form-cadastro-pet">Form Mock - DonoId: {donoId}</div>,
}));

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

pool.connect.mockResolvedValue(mockClient);

// ---------------------------
// TESTES
// ---------------------------

describe("CadastroPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1 — Redireciona quando não há sessão
  test("redireciona para /login quando não houver sessão", async () => {
    getServerSession.mockResolvedValueOnce(null);

    await CadastroPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  // 2 — Renderiza quando sessão existe
  test("permite acesso quando houver sessão válida", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@email.com" },
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            don_id: 1,
            don_nome: "João Silva",
            don_email: "teste@email.com",
            don_contato: "11999999999",
            don_cpf: "12345678900",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const ui = await CadastroPage();

    expect(ui).toBeTruthy();
  });

  // 3 — Busca dados do dono
  test("busca dados do dono pelo email da sessão", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@email.com" },
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            don_id: 1,
            don_nome: "João Silva",
            don_email: "teste@email.com",
            don_contato: "11999999999",
            don_cpf: "12345678900",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await CadastroPage();

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT don_id"),
      ["teste@email.com"]
    );
  });

  // 4 — Dono não encontrado
  test("exibe mensagem de erro quando dono não for encontrado", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@email.com" },
    });

    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const ui = await CadastroPage();
    render(ui);

    expect(
      screen.getByText("Erro: Usuário não encontrado no sistema.")
    ).toBeInTheDocument();
  });

  // 5 — Exibe informações do dono
  test("exibe informações do dono quando encontrado", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "maria@email.com" },
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            don_id: 1,
            don_nome: "Maria Santos",
            don_email: "maria@email.com",
            don_contato: "11987654321",
            don_cpf: "98765432100",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const ui = await CadastroPage();
    render(ui);

    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    expect(screen.getByText("11987654321")).toBeInTheDocument();
  });

  // 6 — Complemento da residência
  test("exibe complemento da residência quando disponível", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@email.com" },
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [{ don_id: 1, don_nome: "João", don_email: "teste@email.com" }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ res_complemento: "Apto 202, Bloco B" }],
      });

    const ui = await CadastroPage();
    render(ui);

    expect(screen.getByText("Apto 202, Bloco B")).toBeInTheDocument();
  });

  // 7 — Sem complemento → "Não informado"
  test('exibe "Não informado" quando não houver residência', async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@email.com" },
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [{ don_id: 1, don_nome: "João", don_email: "teste@email.com" }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const ui = await CadastroPage();
    render(ui);

    expect(screen.getByText("Não informado")).toBeInTheDocument();
  });

  // 8 — Renderiza FormCadastroPet com ID
  test("renderiza FormCadastroPet com donoId correto", async () => {
    getServerSession.mockResolvedValue({
      user: { email: "teste@email.com" },
    });

    mockClient.query
      .mockResolvedValueOnce({
        rows: [
          {
            don_id: 42,
            don_nome: "João",
            don_email: "teste@email.com",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const ui = await CadastroPage();
    render(ui);

    const form = screen.getByTestId("form-cadastro-pet");

    expect(form).toBeInTheDocument();
    expect(form.textContent).toContain("DonoId: 42");
  });
});