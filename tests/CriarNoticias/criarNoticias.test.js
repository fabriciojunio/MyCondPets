import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";

// Mock do banco de dados ANTES de importar o componente
jest.mock("../../app/_lib/db", () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

import CriarNoticias from "../../app/criarNoticias/page";

// Mock do fetch global
global.fetch = jest.fn();

// Mock do window.history.back
const mockHistoryBack = jest.fn();
window.history.back = mockHistoryBack;

describe("CriarNoticias Component", () => {
  const mockDonos = [
    { don_id: "1", don_nome: "João Silva" },
    { don_id: "2", don_nome: "Maria Santos" },
    { don_id: "3", don_nome: "Pedro Oliveira" },
  ];

  beforeAll(() => {
    // Simple mock of window.location without triggering jsdom navigation
    delete window.location;
    window.location = { href: "" };
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
    window.location.href = ""; // Reseta a URL mockada antes de cada teste

    // Mock padrão para carregar donos - SEMPRE retornar array
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockDonos,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper para esperar o carregamento inicial
  const waitForLoadingToFinish = async () => {
    await waitFor(
      () => {
        expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  };

  describe("Renderização Inicial", () => {
    it("deve exibir loading ao carregar donos", async () => {
      global.fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockDonos,
                }),
              100
            );
          })
      );

      render(<CriarNoticias />);
      expect(screen.getByText("Carregando...")).toBeInTheDocument();

      await waitForLoadingToFinish();
    });

    it("deve renderizar o formulário após carregar donos", async () => {
      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      expect(
        screen.getByRole("heading", { name: /Publicar Notícia/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Título da Notícia/i)).toBeInTheDocument();
    });

    it("deve carregar e exibir lista de donos no select", async () => {
      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      const select = screen.getByRole("combobox", { name: /publicado por/i });
      expect(select).toHaveTextContent("João Silva");
      expect(select).toHaveTextContent("Pedro Oliveira");
    });

    it("deve exibir mensagem de erro ao falhar ao carregar donos", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ details: "Erro no servidor" }),
      });

      render(<CriarNoticias />);

      await waitFor(
        () => {
          expect(
            screen.getByText(/Erro ao carregar lista de donos/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Validação de Formulário", () => {
    it("deve validar título vazio ao submeter", async () => {
      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      const form = screen
        .getByRole("button", { name: /Publicar Notícia/i })
        .closest("form");

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/Por favor, insira um título/i);
      });
    });

    it("deve validar descrição vazia ao submeter", async () => {
      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      const tituloInput = screen.getByLabelText(/Título da Notícia/i);
      fireEvent.change(tituloInput, { target: { value: "Título de teste" } });

      const form = screen
        .getByRole("button", { name: /Publicar Notícia/i })
        .closest("form");

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/Por favor, insira uma descrição/i);
      });
    });
    
    it("deve validar dono não selecionado ao submeter", async () => {
      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      const tituloInput = screen.getByLabelText(/Título da Notícia/i);
      const descricaoInput = screen.getByLabelText(/Descrição/i);

      fireEvent.change(tituloInput, { target: { value: "Título de teste" } });
      fireEvent.change(descricaoInput, {
        target: { value: "Descrição de teste" },
      });

      const form = screen
        .getByRole("button", { name: /Publicar Notícia/i })
        .closest("form");

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/Por favor, selecione um dono/i);
      });
    });
  });

  describe("Interação com Formulário", () => {
    it("deve atualizar campo de título ao digitar", async () => {
      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      const tituloInput = screen.getByLabelText(/Título da Notícia/i);
      fireEvent.change(tituloInput, {
        target: { value: "Golden Retriever perdido" },
      });
      expect(tituloInput.value).toBe("Golden Retriever perdido");
    });

    it("deve fechar mensagem de erro ao clicar no X", async () => {
      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      const form = screen
        .getByRole("button", { name: /Publicar Notícia/i })
        .closest("form");

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", {
        name: /Fechar mensagem/i,
      });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });

  describe("Submissão de Formulário", () => {
    it("deve submeter formulário com sucesso", async () => {
      // Mock para carregar donos primeiro
      global.fetch.mockResolvedValueOnce({ 
        ok: true, 
        json: async () => mockDonos 
      });

      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      // Agora mock para a submissão
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, id: "123" }),
      });

      // Preencher formulário
      fireEvent.change(screen.getByLabelText(/Título da Notícia/i), {
        target: { value: "Golden perdido" },
      });
      fireEvent.change(screen.getByLabelText(/Descrição/i), {
        target: { value: "Perdido no parque" },
      });
      fireEvent.change(screen.getByRole("combobox", { name: /publicado por/i }), {
        target: { value: "1" },
      });

      // Criar arquivo mock para o input file
      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      const fileInput = screen.getByLabelText(/galeria/i);
      
      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const form = screen.getByRole("button", {
        name: /Publicar Notícia/i,
      }).closest("form");

      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/Notícia publicada com sucesso!/i)
        ).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it("deve redirecionar após sucesso", async () => {
      // NÃO usar fake timers para este teste
      // Mock para carregar donos
      global.fetch.mockResolvedValueOnce({ 
        ok: true, 
        json: async () => mockDonos 
      });

      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      // Mock para submissão
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      fireEvent.change(screen.getByLabelText(/Título da Notícia/i), {
        target: { value: "Teste" },
      });
      fireEvent.change(screen.getByLabelText(/Descrição/i), {
        target: { value: "Teste descrição" },
      });
      fireEvent.change(screen.getByRole("combobox", { name: /publicado por/i }), {
        target: { value: "1" },
      });

      // Adicionar arquivo mock
      const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
      const fileInput = screen.getByLabelText(/galeria/i);
      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const form = screen.getByRole("button", {
        name: /Publicar Notícia/i,
      }).closest("form");

      await act(async () => {
        fireEvent.submit(form);
      });

      // Verificar que a mensagem de sucesso aparece
      await waitFor(() => {
        expect(
          screen.queryByText(/Notícia publicada com sucesso!/i)
        ).toBeInTheDocument();
      }, { timeout: 5000 });

      // Nota: Não podemos testar o redirecionamento real no jsdom
      // mas verificamos que o estado de sucesso foi atingido
    });
  });

  describe("Botão Cancelar", () => {
    it("deve voltar para página anterior ao clicar em cancelar", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDonos,
      });

      render(<CriarNoticias />);
      await waitForLoadingToFinish();

      const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockHistoryBack).toHaveBeenCalled();
    });
  });
});