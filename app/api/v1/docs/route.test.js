/** @jest-environment node */
import { GET } from "./route";

function makeRequest() {
  return {
    url: "http://localhost/api/v1/docs",
    headers: { get: () => null },
  };
}

describe("GET /api/v1/docs", () => {
  test("retorna documentação da API", async () => {
    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe("MyCondPets API");
    expect(data.version).toBe("1.0.0");
    expect(data.endpoints).toBeDefined();
    expect(data.endpoints.length).toBeGreaterThan(0);
    expect(data.authentication.type).toBe("API Key");
    expect(data.authentication.header).toBe("x-api-key");
    expect(data.impacto_saude_publica).toBeDefined();
    expect(data.impacto_saude_publica.casos_de_uso.length).toBeGreaterThan(0);
  });
});
