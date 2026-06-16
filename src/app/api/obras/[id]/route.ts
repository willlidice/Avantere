import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { temAcessoObra } from "@/lib/acesso-obra"
import { deletarPrefixoDoR2 } from "@/lib/r2"

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: { aditivos: { orderBy: { criadoEm: "asc" } }, documentos: { orderBy: { criadoEm: "desc" } } },
  })
  if (!obra) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

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
  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

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

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "SUPER_ADMIN")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const obraId = parseInt(params.id)
  const obra = await prisma.obra.findUnique({ where: { id: obraId }, select: { nome: true } })
  if (!obra) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

  try {
    await Promise.all([
      deletarPrefixoDoR2(`obras/${obraId}/`),
      deletarPrefixoDoR2(`documentos/obra-${obraId}/`),
      deletarPrefixoDoR2(`levantamento/obra-${obraId}/`),
    ])
  } catch (err) {
    console.error("[obras DELETE] falha ao limpar arquivos do R2:", err)
  }

  await prisma.logEdicao.create({
    data: {
      userId: parseInt(session.user.id),
      obraId,
      acao: "EXCLUIR_OBRA",
      dadosAntes: { nome: obra.nome },
    },
  })

  await prisma.obra.delete({ where: { id: obraId } })

  return NextResponse.json({ ok: true })
}
