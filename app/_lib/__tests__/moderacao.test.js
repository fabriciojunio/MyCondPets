/** @jest-environment node */
import { moderar } from "../moderacao";

describe("moderar", () => {
  test("aceita texto normal", () => {
    const result = moderar("Meu cachorro está perdido");
    expect(result.ok).toBe(true);
  });

  test("rejeita texto vazio", () => {
    const result = moderar("");
    expect(result.ok).toBe(false);
    expect(result.motivo).toContain("vazio");
  });

  test("rejeita texto nulo", () => {
    const result = moderar(null);
    expect(result.ok).toBe(false);
  });

  test("rejeita texto longo (mais de 1000 caracteres)", () => {
    const result = moderar("a".repeat(1001));
    expect(result.ok).toBe(false);
    expect(result.motivo).toContain("longo");
  });

  test("bloqueia frases violentas", () => {
    const result = moderar("vou te matar");
    expect(result.ok).toBe(false);
    expect(result.motivo).toContain("bloqueada");
  });

  test("bloqueia frases de extorsão", () => {
    const result = moderar("manda pix agora");
    expect(result.ok).toBe(false);
    expect(result.motivo).toContain("bloqueada");
  });

  test("bloqueia palavras graves", () => {
    const result = moderar("isso é pedofilia");
    expect(result.ok).toBe(false);
    expect(result.motivo).toContain("inapropriado");
  });

  test("aceita texto com até 1000 caracteres", () => {
    const result = moderar("a".repeat(1000));
    expect(result.ok).toBe(true);
  });
});
