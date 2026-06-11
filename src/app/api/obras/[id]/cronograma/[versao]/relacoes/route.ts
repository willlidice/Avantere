import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function verificarAcesso(userId: number, obraId: number, perfil: string) {
  if (perfil === "ADMIN" || perfil === "SUPER_ADMIN") return true
  const vinculo = await prisma.obraUser.findUnique({
    where: { userId_obraId: { userId, obraId } },
  })
  return !!vinculo
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; versao: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)

  const temAcesso = await verificarAcesso(parseInt(session.user.id), obraId, session.user.perfil)
  if (!temAcesso) return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const relacoes = await prisma.tarefaRelacao.findMany({
    where: { antecessora: { cronograma: { obraId, versao } } },
    select: { id: true, antecessoraId: true, sucessoraId: true },
  })

  return NextResponse.json(relacoes)
}
