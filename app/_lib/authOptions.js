import GoogleProvider from "next-auth/providers/google";
import { buscaOuCriaDono } from "@/app/_lib/actions/buscaOuCriaDono";
import { verificaPerfilCompleto } from "@/app/_lib/actions/verificaPerfilCompleto";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        if (!user.email || !user.name) {
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account, trigger }) {
      // Login inicial
      if (user && account) {
        if (account.provider === "google") {
          try {
            const { dono, perfilCompleto } = await buscaOuCriaDono(user.email, user.name);

            if (!dono) {
              throw new Error("Não foi possível encontrar ou criar o dono.");
            }

            token.id = dono.don_id;
            token.email = dono.don_email;
            token.perfilCompleto = perfilCompleto;

          } catch (error) {
            console.error("Erro no callback JWT:", error);
            token.error = "LoginError";
          }
        }
      }

      // Atualiza o status do perfil quando a sessão é atualizada
      if (trigger === "update" && token.email) {
        try {
          token.perfilCompleto = await verificaPerfilCompleto(token.email);
        } catch (error) {
          console.error("Erro ao atualizar perfil:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.error) {
        return null;
      }
      session.user.id = token.id || null;
      session.user.perfilCompleto = token.perfilCompleto || false;
      return session;
    },
  },
};