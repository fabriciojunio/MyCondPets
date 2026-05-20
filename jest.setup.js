import "@testing-library/jest-dom";

// Suprimir avisos específicos do console durante os testes
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const firstArg = args[0];

  // Suprimir erros conhecidos que não afetam os testes
  if (typeof firstArg === "string") {
    if (
      firstArg.includes("Not implemented: navigation") ||
      firstArg.includes("not wrapped in act") ||
      firstArg.includes("Erro ao carregar dados") ||
      firstArg.includes("Erro ao carregar donos") ||
      firstArg.includes("Erro da API")
    ) {
      return;
    }
  }

  // Suprimir objetos de erro do jsdom sobre navigation
  if (typeof firstArg === "object" && firstArg !== null) {
    if (
      firstArg.type === "not implemented" ||
      firstArg.message?.includes("Not implemented: navigation")
    ) {
      return;
    }
  }

  originalError.call(console, ...args);
};
console.warn = (...args) => {
  // Suprimir avisos do React sobre act()
  if (typeof args[0] === "string" && args[0].includes("not wrapped in act")) {
    return;
  }

  originalWarn.call(console, ...args);
};
