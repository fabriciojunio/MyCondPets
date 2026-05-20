/** @jest-environment node */
import { GET, PUT } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

const makeRequest = (body) => ({
  json: jest.fn().mockResolvedValue(body),
});

describe("GET /api/administradores", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna lista de usuários com admin status", async () => {
    mockClient.query.mockResolvedValue({
      rows: [
        { id: 1, name: "João", email: "joao@a.com", userType: "USER", isAdmin: false, isMaster: false },
        { id: 2, name: "Admin", email: "admin@a.com", userType: "ADMIN", isAdmin: true, isMaster: false },
      ],
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[1].isAdmin).toBe(true);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna 500 em caso de erro no banco", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao buscar administradores");
    expect(data.details).toBeUndefined();
    expect(mockClient.release).toHaveBeenCalled();
  });
});

describe("PUT /api/administradores", () => {
  beforeEach(() => jest.clearAllMocks());

  test("promove usuário a admin com sucesso", async () => {
    mockClient.query.mockResolvedValue({});

    const res = await PUT(makeRequest({ userId: 1, isAdmin: true }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO"),
      [1, "ADMIN"]
    );
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("remove admin com sucesso", async () => {
    mockClient.query.mockResolvedValue({});

    const res = await PUT(makeRequest({ userId: 1, isAdmin: false }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM"),
      [1]
    );
  });

  test("retorna 500 em caso de erro", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await PUT(makeRequest({ userId: 1, isAdmin: true }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao atualizar permissões");
    expect(data.details).toBeUndefined();
    expect(mockClient.release).toHaveBeenCalled();
  });
});
