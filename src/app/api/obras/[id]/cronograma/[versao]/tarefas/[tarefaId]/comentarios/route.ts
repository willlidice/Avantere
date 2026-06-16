import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { temAcessoObra } from "@/lib/acesso-obra"

type Params = { params: { id: string; versao: string; tarefaId: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  const tarefaId = parseInt(params.tarefaId)

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const tarefa = await prisma.tarefa.findFirst({
    where: { id: tarefaId, cronograma: { obraId, versao } },
  })
  if (!tarefa) return NextResponse.json({ erro: "Tarefa não encontrada" }, { status: 404 })

  const comentarios = await prisma.comentario.findMany({
    where: { tarefaId },
    orderBy: { criadoEm: "asc" },
  })

  return NextResponse.json(comentarios)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  const tarefaId = parseInt(params.tarefaId)

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const tarefa = await prisma.tarefa.findFirst({
    where: { id: tarefaId, cronograma: { obraId, versao } },
  })
  if (!tarefa) return NextResponse.json({ erro: "Tarefa não encontrada" }, { status: 404 })

  const { texto } = await req.json()
  if (!texto || !String(texto).trim()) {
    return NextResponse.json({ erro: "Comentário vazio" }, { status: 400 })
  }

  const comentario = await prisma.comentario.create({
    data: {
      tarefaId,
      userId: parseInt(session.user.id),
      userNome: session.user.name ?? "Usuário",
      texto: String(texto).trim(),
    },
  })

  return NextResponse.json(comentario, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const { comentarioId } = await req.json()
  if (!comentarioId) return NextResponse.json({ erro: "ID inválido" }, { status: 400 })

  const comentario = await prisma.comentario.findUnique({
    where: { id: comentarioId },
    include: { tarefa: { select: { cronograma: { select: { obraId: true } } } } },
  })
  if (!comentario) return NextResponse.json({ erro: "Comentário não encontrado" }, { status: 404 })

  const ehDono = comentario.userId === parseInt(session.user.id)
  const ehAdmin =
    ["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil) &&
    (await temAcessoObra(session, comentario.tarefa.cronograma.obraId))
  if (!ehDono && !ehAdmin) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  await prisma.comentario.delete({ where: { id: comentarioId } })
  return NextResponse.json({ ok: true })
}
