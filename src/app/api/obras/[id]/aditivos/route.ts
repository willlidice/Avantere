import { NextRequest, NextResponse } from "next/server"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { temAcessoObra } from "@/lib/acesso-obra"

async function verificarAcesso(obraId: number, session: Session | null) {
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "GESTAO"].includes(session.user.perfil))
    return false
  return temAcessoObra(session, obraId)
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await verificarAcesso(obraId, session)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const aditivos = await prisma.aditivo.findMany({ where: { obraId }, orderBy: { criadoEm: "asc" } })
  return NextResponse.json(aditivos)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await verificarAcesso(obraId, session)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const body = await req.json()
  const { tipo, descricao, valor, dataFim } = body

  if (!tipo || !["PRAZO", "VALOR"].includes(tipo))
    return NextResponse.json({ erro: "Tipo inválido" }, { status: 400 })
  if (tipo === "PRAZO" && !dataFim)
    return NextResponse.json({ erro: "Data fim obrigatória para aditivo de prazo" }, { status: 400 })
  if (tipo === "VALOR" && (valor == null || isNaN(Number(valor))))
    return NextResponse.json({ erro: "Valor obrigatório para aditivo de valor" }, { status: 400 })

  const aditivo = await prisma.aditivo.create({
    data: {
      obraId,
      tipo,
      descricao: descricao || null,
      valor: tipo === "VALOR" ? Number(valor) : null,
      dataFim: tipo === "PRAZO" ? new Date(dataFim) : null,
    },
  })
  return NextResponse.json(aditivo, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await verificarAcesso(obraId, session)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { aditivoId } = await req.json()
  await prisma.aditivo.deleteMany({ where: { id: Number(aditivoId), obraId } })
  return NextResponse.json({ ok: true })
}
