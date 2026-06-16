import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { temAcessoObra } from "@/lib/acesso-obra"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const obraId = parseInt(params.id)
  if (isNaN(obraId)) return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const logs = await prisma.logEdicao.findMany({
    where: { obraId },
    orderBy: { criadoEm: "desc" },
    take: 200,
    include: {
      user: { select: { nome: true, email: true, perfil: true } },
    },
  })

  return NextResponse.json({ logs })
}
