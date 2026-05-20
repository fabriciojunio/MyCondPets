/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DetalhesPets from "../../app/detalhesPets/page";
import "@testing-library/jest-dom";

const mockPets = [
  {
    nome: "Totó",
    raca: "cachorro",
    idade: "3 anos",
    cor: "caramelo",
    dono: "Fulano",
    endereco: "Rua A",
    telefone: "1111",
    imagem: "img1.jpg",
  },
  {
    nome: "Mel",
    raca: "gato",
    idade: "2 anos",
    cor: "preto",
    dono: "Maria",
    endereco: "Rua B",
    telefone: "2222",
    imagem: "img2.jpg",
  },
];

// Mock global fetch
global.fetch = jest.fn();

describe("Página DetalhesPets", () => {

  beforeEach(() => {
    fetch.mockClear();
  });

  test("exibe mensagem de carregamento antes de buscar pets", async () => {
    fetch.mockResolvedValue({
      json: async () => mockPets,
    });

    render(<DetalhesPets />);

    // O componente usa "Carregando pets..." (minúsculo) com ícone
    expect(screen.getByText(/Carregando pets/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getAllByText("Totó").length).toBeGreaterThan(0));
  });

  test("carrega e exibe o primeiro pet da lista", async () => {
    fetch.mockResolvedValue({
      json: async () => mockPets,
    });

    render(<DetalhesPets />);

    await waitFor(() => expect(screen.getAllByText("Totó").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Totó")[0]).toBeInTheDocument();

    // Dados aparecem em badge + info-value, então usamos getAllByText
    expect(screen.getAllByText(/cachorro/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3 anos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/caramelo/i).length).toBeGreaterThan(0);
  });

  test("exibe lista filtrada ao digitar na barra de pesquisa", async () => {
    fetch.mockResolvedValue({
      json: async () => mockPets,
    });

    render(<DetalhesPets />);

    await waitFor(() => expect(screen.getAllByText("Totó").length).toBeGreaterThan(0));

    // O placeholder real do componente é "Nome do pet..."
    const input = screen.getByPlaceholderText("Nome do pet...");

    fireEvent.change(input, { target: { value: "mel" } });

    // O sidebar mostra nome e endereço em divs separadas, não "Mel, Rua B"
    expect(screen.getByText("Mel")).toBeInTheDocument();
    expect(screen.getByText("Rua B")).toBeInTheDocument();
    // Totó não deve aparecer na sidebar filtrada
    expect(screen.queryByText("Rua A")).not.toBeInTheDocument();
  });

  test("ao clicar em um pet, troca o pet selecionado", async () => {
    fetch.mockResolvedValue({
      json: async () => mockPets,
    });

    render(<DetalhesPets />);

    await waitFor(() => expect(screen.getAllByText("Totó").length).toBeGreaterThan(0));

    // Clica no item da sidebar pelo endereço (Rua B pertence à Mel)
    const melItem = screen.getByText("Rua B").closest(".sidebar-result-item");
    fireEvent.click(melItem);

    // Verifica que Mel agora é exibida no painel de detalhes (badge + info-value)
    await waitFor(() => {
      expect(screen.getAllByText(/gato/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/2 anos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/preto/i).length).toBeGreaterThan(0);
    });
  });

  test("limpa pesquisa ao selecionar um pet", async () => {
    fetch.mockResolvedValue({
      json: async () => mockPets,
    });

    render(<DetalhesPets />);

    await waitFor(() => expect(screen.getAllByText("Totó").length).toBeGreaterThan(0));

    const input = screen.getByPlaceholderText("Nome do pet...");
    fireEvent.change(input, { target: { value: "mel" } });

    const melItem = screen.getByText("Rua B").closest(".sidebar-result-item");
    fireEvent.click(melItem);

    expect(input.value).toBe(""); // Pesquisa limpa após selecionar
  });

  test("exibe erro no console caso a requisição falhe", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    fetch.mockRejectedValue(new Error("Erro no servidor"));

    render(<DetalhesPets />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

});
