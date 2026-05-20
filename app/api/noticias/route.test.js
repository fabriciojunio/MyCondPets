/** @jest-environment node */
import { GET, POST, PATCH, DELETE } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../../_lib/authOptions", () => ({ authOptions: {} }));
jest.mock("../../_lib/embeddings", () => ({
  gerarEmbedding: jest.fn().mockResolvedValue(null),
  formatarEmbedding: jest.fn(),
}));
jest.mock("../../_lib/rateLimit", () => ({ rateLimit: jest.fn().mockReturnValue(false) }));

const { getServerSession } = require("next-auth");
const { rateLimit } = require("../../_lib/rateLimit");

const makeRequest = ({ url = "http://localhost/api/noticias", body = null, headers = {} } = {}) => ({
  url,
  json: jest.fn().mockResolvedValue(body),
  headers: { get: jest.fn((h) => headers[h] || null) },
});

describe("GET /api/noticias", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna todas as notícias sem filtro", async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ not_id: 1, not_titulo: "Rex perdido", don_nome: "João" }],
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("aplica filtros de tipo e status", async () => {
    mockClient.query.mockResolvedValue({ rows: [] });

    await GET(makeRequest({ url: "http://localhost/api/noticias?tipo=cachorro&status=aberto" }));

    const queryCall = mockClient.query.mock.calls[0];
    expect(queryCall[0]).toContain("not_tipo_animal");
    expect(queryCall[0]).toContain("not_status");
    expect(queryCall[1]).toContain("cachorro");
    expect(queryCall[1]).toContain("aberto");
  });

  test("retorna 500 em caso de erro", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao buscar notícias");
  });
});

describe("POST /api/noticias", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna 429 quando rate limit é atingido", async () => {
    rateLimit.mockReturnValueOnce(true);

    const res = await POST(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toMatch(/Muitas requisições/i);
  });

  test("retorna 400 quando título está ausente", async () => {
    const res = await POST(makeRequest({ body: { descricao: "desc", donId: 1, foto: "img" } }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Título/i);
  });

  test("retorna 400 quando descrição está ausente", async () => {
    const res = await POST(makeRequest({ body: { titulo: "T", donId: 1, foto: "img" } }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Descrição/i);
  });

  test("retorna 400 quando donId está ausente", async () => {
    const res = await POST(makeRequest({ body: { titulo: "T", descricao: "D", foto: "img" } }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Dono/i);
  });

  test("retorna 400 quando foto está ausente", async () => {
    const res = await POST(makeRequest({ body: { titulo: "T", descricao: "D", donId: 1 } }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/Foto/i);
  });

  test("retorna 404 quando dono não existe", async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // donoCheck — retorna 404 imediatamente

    const res = await POST(makeRequest({ body: { titulo: "T", descricao: "D", donId: 1, foto: "img" } }));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Dono não encontrado");
  });

  test("cria notícia com sucesso", async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ don_id: 1 }] }) // donoCheck
      .mockResolvedValueOnce({}) // CREATE EXTENSION
      .mockResolvedValueOnce({}) // ALTER TABLE
      .mockResolvedValueOnce({}) // ALTER TABLE embedding
      .mockResolvedValueOnce({ rows: [{ not_id: 99, not_titulo: "T" }] }); // INSERT

    const res = await POST(makeRequest({ body: { titulo: "T", descricao: "D", donId: 1, foto: "img" } }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message).toMatch(/sucesso/i);
  });
});

describe("PATCH /api/noticias", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "admin@test.com";
  });

  test("retorna 401 sem sessão", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await PATCH(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
  });

  test("retorna 400 quando not_id ou not_status estão ausentes", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });

    const res = await PATCH(makeRequest({ body: {} }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/obrigatórios/i);
  });

  test("retorna 400 para status inválido", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });

    const res = await PATCH(makeRequest({ body: { not_id: 1, not_status: "invalido" } }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Status inválido");
  });

  test("admin pode atualizar qualquer notícia", async () => {
    getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockClient.query.mockResolvedValue({});

    const res = await PATCH(makeRequest({ body: { not_id: 1, not_status: "resolvido" } }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Status atualizado");
  });

  test("dono pode atualizar sua própria notícia", async () => {
    getServerSession.mockResolvedValue({ user: { email: "dono@test.com" } });
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ don_email: "dono@test.com" }] }) // verificação de dono
      .mockResolvedValueOnce({}); // UPDATE

    const res = await PATCH(makeRequest({ body: { not_id: 1, not_status: "encontrado" } }));
    const data = await res.json();

    expect(res.status).toBe(200);
  });

  test("retorna 403 quando usuário não é dono nem admin", async () => {
    getServerSession.mockResolvedValue({ user: { email: "outro@test.com" } });
    mockClient.query.mockResolvedValueOnce({ rows: [{ don_email: "dono@test.com" }] });

    const res = await PATCH(makeRequest({ body: { not_id: 1, not_status: "perdido" } }));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/permissão/i);
  });

  test("retorna 404 quando notícia não existe", async () => {
    getServerSession.mockResolvedValue({ user: { email: "outro@test.com" } });
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const res = await PATCH(makeRequest({ body: { not_id: 999, not_status: "aberto" } }));
    const data = await res.json();

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/noticias", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "admin@test.com";
  });

  test("retorna 401 sem sessão", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await DELETE(makeRequest({ url: "http://localhost/api/noticias?not_id=1" }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Não autorizado");
  });

  test("retorna 400 quando not_id está ausente", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });

    const res = await DELETE(makeRequest({ url: "http://localhost/api/noticias" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/not_id obrigatório/i);
  });

  test("admin pode apagar qualquer notícia", async () => {
    getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockClient.query
      .mockResolvedValueOnce({}) // DELETE comentarios
      .mockResolvedValueOnce({}) // DELETE curtidas
      .mockResolvedValueOnce({}); // DELETE noticias

    const res = await DELETE(makeRequest({ url: "http://localhost/api/noticias?not_id=1" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/removida com sucesso/i);
  });

  test("dono pode apagar sua própria notícia", async () => {
    getServerSession.mockResolvedValue({ user: { email: "dono@test.com" } });
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ don_email: "dono@test.com" }] }) // verificação de dono
      .mockResolvedValueOnce({}) // DELETE comentarios
      .mockResolvedValueOnce({}) // DELETE curtidas
      .mockResolvedValueOnce({}); // DELETE noticias

    const res = await DELETE(makeRequest({ url: "http://localhost/api/noticias?not_id=5" }));
    const data = await res.json();

    expect(res.status).toBe(200);
  });

  test("retorna 403 quando usuário não é dono nem admin", async () => {
    getServerSession.mockResolvedValue({ user: { email: "outro@test.com" } });
    mockClient.query.mockResolvedValueOnce({ rows: [{ don_email: "dono@test.com" }] });

    const res = await DELETE(makeRequest({ url: "http://localhost/api/noticias?not_id=1" }));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/permissão/i);
  });

  test("retorna 404 quando notícia não existe", async () => {
    getServerSession.mockResolvedValue({ user: { email: "outro@test.com" } });
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const res = await DELETE(makeRequest({ url: "http://localhost/api/noticias?not_id=999" }));
    const data = await res.json();

    expect(res.status).toBe(404);
  });

  test("retorna 500 em caso de erro do banco", async () => {
    getServerSession.mockResolvedValue({ user: { email: "admin@test.com" } });
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await DELETE(makeRequest({ url: "http://localhost/api/noticias?not_id=1" }));
    const data = await res.json();

    expect(res.status).toBe(500);
  });
});
