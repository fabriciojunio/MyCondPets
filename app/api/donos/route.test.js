/** @jest-environment node */
import { GET } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("../../_lib/authOptions", () => ({ authOptions: {} }));

const { getServerSession } = require("next-auth");

const makeRequest = () => ({ url: "http://localhost/api/donos" });

describe("GET /api/donos", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna 401 quando não há sessão", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Não autorizado");
  });

  test("retorna lista de donos com status 200", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    mockClient.query.mockResolvedValue({
      rows: [
        { don_id: 1, don_nome: "João", don_email: "joao@a.com" },
        { don_id: 2, don_nome: "Maria", don_email: "maria@a.com" },
      ],
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].don_nome).toBe("João");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna 500 em caso de erro no banco", async () => {
    getServerSession.mockResolvedValue({ user: { email: "a@b.com" } });
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao buscar donos");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
