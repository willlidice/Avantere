import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil)

  if (!isAdmin) {
    const vinculo = await prisma.obraUser.findUnique({
      where: { userId_obraId: { userId: parseInt(session.user.id), obraId } },
    })
    if (!vinculo) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })
  }

  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: { aditivos: { orderBy: { criadoEm: "asc" } }, documentos: { orderBy: { criadoEm: "desc" } } },
  })
  if (!obra) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

  // ADMIN verifica se obra pertence à mesma organização
  const orgId = session.user.organizacaoId
  if (session.user.perfil === "ADMIN" && orgId && obra.organizacaoId !== orgId) {
    return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })
  }

  return NextResponse.json(obra)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const obraId = parseInt(params.id)
  const orgId = session.user.organizacaoId

  // ADMIN verifica se obra pertence à mesma org
  if (session.user.perfil === "ADMIN" && orgId) {
    const obra = await prisma.obra.findUnique({ where: { id: obraId }, select: { organizacaoId: true } })
    if (!obra || obra.organizacaoId !== orgId)
      return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.nome !== undefined) data.nome = String(body.nome).trim()
  if (body.ativa !== undefined) data.ativa = Boolean(body.ativa)
  if (body.cliente !== undefined) data.cliente = body.cliente || null
  if (body.cnpjCliente !== undefined) data.cnpjCliente = body.cnpjCliente || null
  if (body.cnpjObra !== undefined) data.cnpjObra = body.cnpjObra || null
  if (body.cnoObra !== undefined) data.cnoObra = body.cnoObra || null
  if (body.dataInicio !== undefined) data.dataInicio = body.dataInicio ? new Date(body.dataInicio) : null
  if (body.dataFim !== undefined) data.dataFim = body.dataFim ? new Date(body.dataFim) : null
  if (body.escopo !== undefined) data.escopo = body.escopo || null
  if (body.valorContrato !== undefined) data.valorContrato = body.valorContrato != null ? Number(body.valorContrato) : null

  const obra = await prisma.obra.update({ where: { id: obraId }, data })
  return NextResponse.json(obra)
}
