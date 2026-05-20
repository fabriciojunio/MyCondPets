/** @jest-environment node */
import { gerarEmbedding, formatarEmbedding } from "../embeddings";

const MOCK_EMBEDDING = Array.from({ length: 384 }, (_, i) => i * 0.001);

global.fetch = jest.fn();

describe("gerarEmbedding", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, HF_TOKEN: "test-token" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("retorna null quando texto está vazio", async () => {
    const result = await gerarEmbedding("");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("retorna null quando HF_TOKEN não está definido", async () => {
    delete process.env.HF_TOKEN;
    const result = await gerarEmbedding("cachorro perdido");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("retorna array de floats quando API retorna formato simples", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(MOCK_EMBEDDING),
    });

    const result = await gerarEmbedding("cachorro perdido bloco A");

    expect(result).toEqual(MOCK_EMBEDDING);
    expect(result).toHaveLength(384);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("paraphrase-multilingual"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      })
    );
  });

  test("retorna array de floats quando API retorna formato aninhado [[...floats]]", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue([MOCK_EMBEDDING]),
    });

    const result = await gerarEmbedding("gato encontrado");
    expect(result).toEqual(MOCK_EMBEDDING);
    expect(result).toHaveLength(384);
  });

  test("retorna null quando a API responde com erro (ok=false)", async () => {
    fetch.mockResolvedValueOnce({ ok: false, json: jest.fn() });

    const result = await gerarEmbedding("pet perdido");
    expect(result).toBeNull();
  });

  test("retorna null quando API retorna formato inesperado", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ error: "Model loading" }),
    });

    const result = await gerarEmbedding("cachorro");
    expect(result).toBeNull();
  });

  test("retorna null quando fetch lança exceção (rede indisponível)", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await gerarEmbedding("pet encontrado");
    expect(result).toBeNull();
  });

  test("trunca texto acima de 512 caracteres antes de enviar", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(MOCK_EMBEDDING),
    });

    const textoLongo = "a".repeat(1000);
    await gerarEmbedding(textoLongo);

    const bodyEnviado = JSON.parse(fetch.mock.calls[0][1].body);
    expect(bodyEnviado.inputs.length).toBeLessThanOrEqual(512);
  });

  test("usa modelo multilíngue (paraphrase-multilingual-MiniLM-L12-v2)", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(MOCK_EMBEDDING),
    });

    await gerarEmbedding("texto de teste");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("paraphrase-multilingual-MiniLM-L12-v2"),
      expect.any(Object)
    );
  });
});

describe("formatarEmbedding", () => {
  test("formata array de floats para string pgvector", () => {
    const embedding = [0.1, 0.2, 0.3];
    const resultado = formatarEmbedding(embedding);
    expect(resultado).toBe("[0.1,0.2,0.3]");
  });

  test("formata array grande corretamente", () => {
    const embedding = Array.from({ length: 384 }, (_, i) => i * 0.001);
    const resultado = formatarEmbedding(embedding);

    expect(resultado).toMatch(/^\[.*\]$/);
    expect(resultado.split(",")).toHaveLength(384);
  });

  test("formata array com um único elemento", () => {
    expect(formatarEmbedding([0.5])).toBe("[0.5]");
  });
});
