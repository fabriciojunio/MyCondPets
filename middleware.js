import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Rotas que o usuário pode acessar mesmo com perfil incompleto
    const rotasPermitidas = [
      "/perfilDono",
      "/api",
      "/api/v1",
      "/login",
      "/_next",
      "/images",
      "/favicon.ico"
    ];

    // Verifica se a rota atual é permitida
    const rotaPermitida = rotasPermitidas.some(rota => 
      pathname.startsWith(rota)
    );

    // Se o usuário está logado e o perfil está incompleto
    if (token && !token.perfilCompleto && !rotaPermitida) {
      const url = req.nextUrl.clone();
      url.pathname = "/perfilDono";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Rotas públicas que não precisam de autenticação
        const rotasPublicas = [
          "/login",
          "/api",
          "/_next",
          "/images",
          "/favicon.ico"
        ];

        // Verifica se é a rota raiz exatamente
        if (pathname === "/") {
          return true;
        }

        // Verifica se começa com alguma rota pública
        const rotaPublica = rotasPublicas.some(rota => 
          pathname.startsWith(rota)
        );

        // Permite acesso a rotas públicas
        if (rotaPublica) {
          return true;
        }

        // Para outras rotas, precisa estar logado
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};