import { Session } from "next-auth"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function temAcessoObra(session: Session | null, obraId: number): Promise<boolean> {
  if (!session?.user) return false
  if (session.user.perfil === "SUPER_ADMIN") return true
  const orgId = session.user.organizacaoId

  const vinculo = await prisma.obraUser.findUnique({
    where: { userId_obraId: { userId: parseInt(session.user.id), obraId } },
    include: { obra: { select: { organizacaoId: true } } },
  })
  if (!vinculo) return false
  return vinculo.obra.organizacaoId === orgId
}

export function filtroObrasVisiveis(
  session: Session,
  opts?: { apenasAtivas?: boolean },
): Prisma.ObraWhereInput {
  if (session.user.perfil === "SUPER_ADMIN") return {}
  return {
    organizacaoId: session.user.organizacaoId ?? undefined,
    usuarios: { some: { userId: parseInt(session.user.id) } },
    ...(opts?.apenasAtivas ? { ativa: true } : {}),
  }
}
