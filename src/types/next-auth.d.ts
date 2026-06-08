import { Perfil, Plano } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      perfil: Perfil;
      organizacaoId: number | null;
      plano: Plano | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    perfil: Perfil;
    organizacaoId: number | null;
    plano: Plano | null;
    trialFim: string | null;
  }
}
