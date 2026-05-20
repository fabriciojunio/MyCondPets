// Mock do Next.js Server ANTES de qualquer import
jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: "next" })),
    redirect: jest.fn((url) => ({ type: "redirect", url })),
  },
}));

// Mock do next-auth/middleware
jest.mock("next-auth/middleware", () => ({
  withAuth: jest.fn((middlewareFn, config) => {
    // Retorna um objeto que contém tanto a função middleware quanto a config
    const result = {
      middlewareFn,
      ...config,
    };
    // Adiciona o matcher que será exportado no middleware.js
    result.matcher = undefined; // Será preenchido na importação
    return result;
  }),
}));

// Mock do NextRequest
class MockNextRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.nextUrl = {
      pathname: options.pathname || "/",
      clone: () => ({
        pathname: options.pathname || "/",
      }),
    };
    this.nextauth = {
      token: options.token || null,
    };
  }
}

describe("Middleware de Autenticação", () => {
  let middlewareConfig;
  let middlewareFn;

  beforeAll(() => {
    // Importa o middleware DEPOIS dos mocks
    const middlewareModule = require("../../middleware");
    middlewareConfig = middlewareModule.default;
    middlewareFn = middlewareConfig.middlewareFn;
    
    // Importa o config exportado separadamente
    if (middlewareModule.config) {
      middlewareConfig.matcher = middlewareModule.config.matcher;
    }
  });

  describe("Callback authorized", () => {
    test("deve autorizar acesso a rotas públicas sem token", () => {
      const authorized = middlewareConfig.callbacks.authorized;

      const rotasPublicas = [
        "/",
        "/login",
        "/api/auth/signin",
        "/_next/static/test.js",
        "/images/logo.png",
        "/favicon.ico",
      ];

      rotasPublicas.forEach((pathname) => {
        const req = new MockNextRequest("http://localhost:3000" + pathname, {
          pathname,
        });

        const result = authorized({ token: null, req });
        expect(result).toBe(true);
      });
    });

    test("deve negar acesso a rotas protegidas sem token", () => {
      const authorized = middlewareConfig.callbacks.authorized;

      // Rotas que realmente são protegidas (não estão na lista de públicas)
      const rotasProtegidas = ["/cadastropet", "/dashboard", "/usuarios", "/perfilDono"];

      rotasProtegidas.forEach((pathname) => {
        const req = new MockNextRequest("http://localhost:3000" + pathname, {
          pathname,
        });

        const result = authorized({ token: null, req });
        expect(result).toBe(false);
      });
    });

    test("deve autorizar acesso a rotas protegidas com token", () => {
      const authorized = middlewareConfig.callbacks.authorized;

      const token = {
        name: "Usuario Teste",
        email: "teste@teste.com",
        perfilCompleto: true,
      };

      const req = new MockNextRequest("http://localhost:3000/cadastropet", {
        pathname: "/cadastropet",
      });

      const result = authorized({ token, req });
      expect(result).toBe(true);
    });
  });

  describe("Função middleware - Redirecionamento de perfil incompleto", () => {
    const { NextResponse } = require("next/server");

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("deve redirecionar para /perfilDono se perfil incompleto", () => {
      const req = new MockNextRequest("http://localhost:3000/cadastropet", {
        pathname: "/cadastropet",
        token: {
          name: "Usuario",
          email: "teste@teste.com",
          perfilCompleto: false,
        },
      });

      middlewareFn(req);

      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    test("não deve redirecionar se perfil completo", () => {
      const req = new MockNextRequest("http://localhost:3000/cadastropet", {
        pathname: "/cadastropet",
        token: {
          name: "Usuario",
          email: "teste@teste.com",
          perfilCompleto: true,
        },
      });

      middlewareFn(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    test("não deve redirecionar se estiver em rota permitida com perfil incompleto", () => {
      const rotasPermitidas = [
        "/perfilDono",
        "/api/test",
        "/login",
        "/_next/static",
        "/images/test.png",
      ];

      rotasPermitidas.forEach((pathname) => {
        jest.clearAllMocks();

        const req = new MockNextRequest("http://localhost:3000" + pathname, {
          pathname,
          token: {
            name: "Usuario",
            email: "teste@teste.com",
            perfilCompleto: false,
          },
        });

        middlewareFn(req);

        expect(NextResponse.redirect).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
      });
    });

    test("deve permitir acesso se não houver token", () => {
      const req = new MockNextRequest("http://localhost:3000/cadastropet", {
        pathname: "/cadastropet",
        token: null,
      });

      middlewareFn(req);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("Configuração do matcher", () => {
    test("deve ter configuração de matcher correta", () => {
      expect(middlewareConfig.matcher).toBeDefined();
      expect(Array.isArray(middlewareConfig.matcher)).toBe(true);
      expect(middlewareConfig.matcher.length).toBeGreaterThan(0);
    });
  });
});