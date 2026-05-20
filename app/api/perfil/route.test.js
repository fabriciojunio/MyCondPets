/** @jest-environment node */
import { PUT } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

const validBody = {
  userEmail: "a@b.com",
  nome: "João",
  contato: "11999",
  complemento: "Apto 1",
  numero: "10",
  cep: "01001-000",
};

const makeRequest = (body) => ({ json: jest.fn().mockResolvedValue(body) });

describe("PUT /api/perfil", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna 400 quando email não é fornecido", async () => {
    const res = await PUT(makeRequest({ ...validBody, userEmail: undefined }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.message).toMatch(/Email/i);
  });

  test("retorna 400 quando campos obrigatórios faltam", async () => {
    const res = await PUT(makeRequest({ userEmail: "a@b.com", nome: "João" }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.message).toMatch(/obrigatórios/i);
  });

  test("retorna 404 quando usuário não é encontrado", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // SELECT dono

    const res = await PUT(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.message).toBe("Usuário não encontrado");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("atualiza perfil e cria nova residência com sucesso", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ don_id: 1 }] }) // SELECT dono
      .mockResolvedValueOnce({}) // UPDATE dono
      .mockResolvedValueOnce({ rows: [] }) // SELECT residencia (não existe)
      .mockResolvedValueOnce({}) // INSERT residencia
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PUT(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Perfil atualizado com sucesso");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("atualiza perfil e atualiza residência existente", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ don_id: 1 }] }) // SELECT dono
      .mockResolvedValueOnce({}) // UPDATE dono
      .mockResolvedValueOnce({ rows: [{ res_id: 5 }] }) // SELECT residencia (existe)
      .mockResolvedValueOnce({}) // UPDATE residencia
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PUT(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
  });

  test("atualiza residência por ID quando residenciaId é fornecido", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ don_id: 1 }] }) // SELECT dono
      .mockResolvedValueOnce({}) // UPDATE dono
      .mockResolvedValueOnce({}) // UPDATE residencia by ID
      .mockResolvedValueOnce({}); // COMMIT

    const res = await PUT(makeRequest({ ...validBody, residenciaId: 5 }));
    const data = await res.json();

    expect(res.status).toBe(200);
  });

  test("faz rollback e retorna 500 em caso de erro", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(new Error("DB error")); // SELECT dono falha

    const res = await PUT(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.message).toBe("Erro interno do servidor");
    expect(data.error).toBeUndefined();
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
