/** @jest-environment node */
import { excluiPET } from "./excluiPet";

const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("@/app/_lib/db", () => ({
  __esModule: true,
  default: { connect: jest.fn(() => Promise.resolve(mockClient)) },
}));

const makeRequest = (body) => ({
  json: jest.fn().mockResolvedValue(body),
});

describe("excluiPET", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna 400 quando dados são inválidos", async () => {
    const res = await excluiPET(makeRequest({ pet_nome: "", don_cpf: "" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(400);
    expect(data.error).toBe("Dados inválidos");
  });

  test("retorna 400 quando pet_nome está ausente", async () => {
    const res = await excluiPET(makeRequest({ don_cpf: "123" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(400);
  });

  test("retorna 400 quando don_cpf está ausente", async () => {
    const res = await excluiPET(makeRequest({ pet_nome: "Rex" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(400);
  });

  test("exclui pet com sucesso e retorna 200", async () => {
    mockClient.query.mockResolvedValue({});

    const res = await excluiPET(makeRequest({ pet_nome: "Rex", don_cpf: "12345678900" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(200);
    expect(data.message).toBe("Pet excluído com sucesso");
    expect(mockClient.query).toHaveBeenCalledWith(
      "DELETE FROM pet WHERE pet_nome = $1 AND don_cpf = $2;",
      ["Rex", "12345678900"]
    );
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("retorna 500 em caso de erro no banco", async () => {
    mockClient.query.mockRejectedValue(new Error("DB error"));

    const res = await excluiPET(makeRequest({ pet_nome: "Rex", don_cpf: "12345678900" }));
    const data = JSON.parse(await res.text());

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erro ao excluir pet");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
