/** @jest-environment node */
import { GET, POST } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/app/_lib/authOptions", () => ({ authOptions: {} }));
jest.mock("@/app/_lib/moderacao", () => ({
  moderar: jest.fn().mockReturnValue({ ok: true }),
}));
jest.mock("@/app/_lib/rateLimit", () => ({
  rateLimit: jest.fn().mockReturnValue(false),
}));

const { getServerSession } = require("next-auth");
const { rateLimit } = require("@/app/_lib/rateLimit");
const { moderar } = require("@/app/_lib/moderacao");

const makeRequest = ({ url = "http://localhost/api/comentarios", body = null, headers = {} } = {}) => ({
  url,
  json: jest.fn().mockResolvedValue(body),
  headers: { get: jest.fn((h) => headers[h] || null) },
});

describe("GET /api/comentarios", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna 400 quando not_id não é fornecido", async () => {
    const res = await GET(makeRequest({ url: "http://localhost/api/comentarios" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("not_id obrigatório");
  });

  test("retorna comentários da notícia", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // ensureTable
      .mockResolvedValueOnce({
        rows: [
          { com_id: 1, com_autor: "João", com_texto: "Ótimo!", com_data: new Date() },
        ],
      });

    const res = await GET(makeRequest({ url: "http://localhost/api/comentarios?not_id=1" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.comentarios).toHaveLength(1);
    expect(data.comentarios[0].com_autor).toBe("João");
    expect(mockClient.release).toHaveBeenCalled();
  });
});

describe("POST /api/comentarios", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna 401 quando não há sessão", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await POST(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/logado/i);
  });

  test("retorna 429 quando rate limit é atingido", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com", name: "João" } });
    rateLimit.mockReturnValueOnce(true);

    const res = await POST(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(429);
  });

  test("retorna 400 quando campos obrigatórios faltam", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com", name: "João" } });

    const res = await POST(makeRequest({ body: { not_id: null, com_texto: "" } }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/obrigatórios/i);
  });

  test("retorna 400 quando comentário excede 500 caracteres", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com", name: "João" } });

    const res = await POST(makeRequest({ body: { not_id: 1, com_texto: "x".repeat(501) } }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/500/i);
  });

  test("retorna 422 quando moderação rejeita o comentário", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com", name: "João" } });
    moderar.mockReturnValueOnce({ ok: false, motivo: "Conteúdo ofensivo" });

    const res = await POST(makeRequest({ body: { not_id: 1, com_texto: "Texto ruim" } }));
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toBe("Conteúdo ofensivo");
  });

  test("cria comentário com sucesso — usa nome da sessão", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com", name: "João Silva" } });
    mockClient.query
      .mockResolvedValueOnce({}) // ensureTable
      .mockResolvedValueOnce({ rows: [{ com_id: 1, com_autor: "João Silva", com_texto: "Bom!" }] });

    const res = await POST(makeRequest({ body: { not_id: 1, com_texto: "Bom!" } }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.comentario.com_autor).toBe("João Silva");

    const insertCall = mockClient.query.mock.calls[1];
    expect(insertCall[1][1]).toBe("João Silva"); // autor da sessão, não do body
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("usa email como autor quando name não está disponível na sessão", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ com_id: 2, com_autor: "a@b.com", com_texto: "Ok" }] });

    const res = await POST(makeRequest({ body: { not_id: 1, com_texto: "Ok" } }));
    const data = await res.json();

    expect(res.status).toBe(201);
    const insertCall = mockClient.query.mock.calls[1];
    expect(insertCall[1][1]).toBe("a@b.com");
  });
});
