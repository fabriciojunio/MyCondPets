/** @jest-environment node */
import { GET } from "./route";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

const makeRequest = () => ({ url: "http://localhost/api/dashboard" });

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("retorna dados do dashboard com status 200", async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [{
        total_pets: "10",
        total_perdidos: "2",
        total_donos: "8",
        total_aptos_com_pets: "5",
      }],
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.petsCadastrados).toBe(10);
    expect(data.petsPerdidos).toBe(2);
    expect(data.donosCadastrados).toBe(8);
    expect(data.aptosComPets).toBe(5);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna zeros quando queries retornam nulos", async () => {
    mockClient.query.mockResolvedValueOnce({
      rows: [{
        total_pets: null,
        total_perdidos: null,
        total_donos: null,
        total_aptos_com_pets: null,
      }],
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(data.petsCadastrados).toBe(0);
    expect(data.petsPerdidos).toBe(0);
    expect(data.donosCadastrados).toBe(0);
    expect(data.aptosComPets).toBe(0);
  });

  test("retorna 500 em caso de erro no banco", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao buscar dados do dashboard");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
