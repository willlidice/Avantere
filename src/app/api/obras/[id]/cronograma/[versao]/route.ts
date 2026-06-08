import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function verificarAcesso(userId: number, obraId: number, perfil: string) {
  if (perfil === "PRODUCAO") {
    const vinculo = await prisma.obraUser.findUnique({
      where: { userId_obraId: { userId, obraId } },
    })
    return !!vinculo
  }
  if (perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findUnique({
      where: { userId_obraId: { userId, obraId } },
    })
    return !!vinculo
  }
  return perfil === "ADMIN"
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

  const cronograma = await prisma.cronograma.findUnique({
    where: { obraId_versao: { obraId, versao } },
    include: {
      tarefas: {
        orderBy: { ordem: "asc" },
        include: { imagens: { orderBy: { ordem: "asc" } } },
      },
    },
  })

  if (!cronograma) return NextResponse.json({ erro: "Versão não encontrada" }, { status: 404 })

  return NextResponse.json(cronograma)
}
