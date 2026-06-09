import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Perfil, Plano } from "@prisma/client";
import { checkRateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.senha) return null;

        // Rate limit: 10 tentativas de login por IP em 15 minutos
        const ip =
          (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
          (req?.headers?.["x-real-ip"] as string) ??
          "unknown"
        const { permitido } = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
        if (!permitido) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organizacao: { select: { id: true, plano: true, trialFim: true } } },
        });

        if (!user || !user.ativo) return null;

        const senhaValida = await bcrypt.compare(credentials.senha, user.senha);
        if (!senhaValida) return null;

        return {
          id: String(user.id),
          name: user.nome,
          email: user.email,
          perfil: user.perfil,
          organizacaoId: user.organizacaoId,
          plano: user.organizacao?.plano ?? null,
          trialFim: user.organizacao?.trialFim?.toISOString() ?? null,
        } as {
          id: string;
          name: string;
          email: string;
          perfil: Perfil;
          organizacaoId: number | null;
          plano: Plano | null;
          trialFim: string | null;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.perfil = (user as unknown as { perfil: Perfil }).perfil;
        token.organizacaoId =
          (user as unknown as { organizacaoId: number | null }).organizacaoId ?? null;
        token.plano =
          (user as unknown as { plano: Plano | null }).plano ?? null;
        token.trialFim =
          (user as unknown as { trialFim: string | null }).trialFim ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.perfil = token.perfil as Perfil;
        session.user.organizacaoId = (token.organizacaoId as number | null) ?? null;
        session.user.plano = (token.plano as Plano | null) ?? null;
      }
      return session;
    },
  },
};
