/** @jest-environment node */
import { POST } from "./route";
import db from "@/app/_lib/db";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(), query: jest.fn() },
}));

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/app/_lib/authOptions", () => ({ authOptions: {} }));

const { getServerSession } = require("next-auth");

const makeRequest = (body) => ({ json: jest.fn().mockResolvedValue(body) });

const validBody = {
  itens: [{ prod_id: 1, quantidade: 2 }],
  nome: "João",
  email: "joao@a.com",
  telefone: "11999",
  endereco: "Rua A",
};

describe("POST /api/pedidos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.connect.mockResolvedValue(mockClient);
    getServerSession.mockResolvedValue(null);
  });

  test("retorna 400 quando carrinho está vazio", async () => {
    const res = await POST(makeRequest({ ...validBody, itens: [] }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Carrinho vazio");
  });

  test("retorna 400 quando produto não existe", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/não encontrado/i);
  });

  test("retorna 400 quando estoque é insuficiente", async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ prod_id: 1, prod_preco: "50.00", prod_estoque: 1 }],
    });

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Estoque insuficiente/i);
  });

  test("cria pedido com sucesso e retorna 201", async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ prod_id: 1, prod_preco: "50.00", prod_estoque: 10 }],
    });

    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ ped_id: 42 }] }) // INSERT pedido
      .mockResolvedValueOnce({}) // INSERT item_pedido
      .mockResolvedValueOnce({}) // UPDATE estoque
      .mockResolvedValueOnce({}); // COMMIT

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.pedido_id).toBe(42);
    expect(data.total).toBe("100.00");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("faz rollback em caso de erro na transação", async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ prod_id: 1, prod_preco: "50.00", prod_estoque: 10 }],
    });

    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(new Error("DB error")); // INSERT pedido falha

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("cria pedido com sessão vinculada ao dono", async () => {
    getServerSession.mockResolvedValue({ user: { email: "dono@a.com" } });
    db.query
      .mockResolvedValueOnce({ rows: [{ don_id: 5 }] }) // busca dono por email
      .mockResolvedValueOnce({ rows: [{ prod_id: 1, prod_preco: "30.00", prod_estoque: 5 }] }); // produtos

    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ ped_id: 7 }] }) // INSERT pedido
      .mockResolvedValueOnce({}) // INSERT item
      .mockResolvedValueOnce({}) // UPDATE estoque
      .mockResolvedValueOnce({}); // COMMIT

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.pedido_id).toBe(7);

    const insertPedidoCall = mockClient.query.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("INSERT INTO pedido")
    );
    expect(insertPedidoCall[1][0]).toBe(5); // don_id = 5
  });
});
