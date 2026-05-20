/** @jest-environment node */
import { GET, POST } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/app/_lib/authOptions", () => ({ authOptions: {} }));

const { getServerSession } = require("next-auth");

const makeRequest = (url = "http://localhost/api/curtidas") => ({ url });

describe("GET /api/curtidas", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna 400 quando not_id está ausente", async () => {
    const res = await GET(makeRequest("http://localhost/api/curtidas"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/not_id obrigatório/i);
  });

  test("retorna total e curtiu=false para usuário anônimo", async () => {
    getServerSession.mockResolvedValue(null);
    mockClient.query
      .mockResolvedValueOnce({}) // CREATE TABLE IF NOT EXISTS (ensureTable)
      .mockResolvedValueOnce({ rows: [{ total: "7" }] }); // COUNT

    const res = await GET(makeRequest("http://localhost/api/curtidas?not_id=1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.total).toBe(7);
    expect(data.curtiu).toBe(false);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna curtiu=true quando usuário já curtiu", async () => {
    getServerSession.mockResolvedValue({ user: { email: "user@test.com" } });
    mockClient.query
      .mockResolvedValueOnce({}) // ensureTable
      .mockResolvedValueOnce({ rows: [{ total: "3" }] }) // COUNT
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] }); // SELECT 1 (curtiu)

    const res = await GET(makeRequest("http://localhost/api/curtidas?not_id=1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.curtiu).toBe(true);
    expect(data.total).toBe(3);
  });

  test("retorna curtiu=false quando usuário não curtiu", async () => {
    getServerSession.mockResolvedValue({ user: { email: "user@test.com" } });
    mockClient.query
      .mockResolvedValueOnce({}) // ensureTable
      .mockResolvedValueOnce({ rows: [{ total: "5" }] }) // COUNT
      .mockResolvedValueOnce({ rows: [] }); // SELECT 1 (não curtiu)

    const res = await GET(makeRequest("http://localhost/api/curtidas?not_id=2"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.curtiu).toBe(false);
    expect(data.total).toBe(5);
  });
});

describe("POST /api/curtidas", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna 401 sem sessão", async () => {
    getServerSession.mockResolvedValue(null);

    const req = { ...makeRequest(), json: jest.fn().mockResolvedValue({ not_id: 1 }) };
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/logado/i);
  });

  test("retorna 400 quando not_id está ausente", async () => {
    getServerSession.mockResolvedValue({ user: { email: "user@test.com" } });

    const req = { ...makeRequest(), json: jest.fn().mockResolvedValue({}) };
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/not_id obrigatório/i);
  });

  test("adiciona curtida quando ainda não curtiu", async () => {
    getServerSession.mockResolvedValue({ user: { email: "user@test.com" } });

    mockClient.query
      .mockResolvedValueOnce({}) // ensureTable
      .mockResolvedValueOnce({ rows: [] }) // SELECT existeRes (não curtiu)
      .mockResolvedValueOnce({}) // INSERT
      .mockResolvedValueOnce({ rows: [{ total: "4" }] }); // COUNT total

    const req = { ...makeRequest(), json: jest.fn().mockResolvedValue({ not_id: 1 }) };
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.curtiu).toBe(true);
    expect(data.total).toBe(4);
  });

  test("remove curtida quando já curtiu (toggle)", async () => {
    getServerSession.mockResolvedValue({ user: { email: "user@test.com" } });

    mockClient.query
      .mockResolvedValueOnce({}) // ensureTable
      .mockResolvedValueOnce({ rows: [{ cur_id: 10 }] }) // SELECT existeRes (já curtiu)
      .mockResolvedValueOnce({}) // DELETE
      .mockResolvedValueOnce({ rows: [{ total: "2" }] }); // COUNT total

    const req = { ...makeRequest(), json: jest.fn().mockResolvedValue({ not_id: 1 }) };
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.curtiu).toBe(false);
    expect(data.total).toBe(2);
  });
});
