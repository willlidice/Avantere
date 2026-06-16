import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { temAcessoObra } from "@/lib/acesso-obra"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; versao: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const relacoes = await prisma.tarefaRelacao.findMany({
    where: { antecessora: { cronograma: { obraId, versao } } },
    select: { id: true, antecessoraId: true, sucessoraId: true },
  })

  return NextResponse.json(relacoes)
}
