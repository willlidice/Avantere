import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { id: string; versao: string; tarefaId: string }

async function verificarAcesso(obraId: number, session: Session | null) {
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "GESTAO"].includes(session.user.perfil)) return false
  const orgId = session.user.organizacaoId
  if (session.user.perfil === "ADMIN" && orgId) {
    const obra = await prisma.obra.findUnique({ where: { id: obraId }, select: { organizacaoId: true } })
    if (!obra || obra.organizacaoId !== orgId) return false
  }
  return true
}

export async function GET(_: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await verificarAcesso(obraId, session)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const tarefaId = parseInt(params.tarefaId)
  const antecessoras = await prisma.tarefaRelacao.findMany({
    where: { sucessoraId: tarefaId },
    include: { antecessora: { select: { id: true, idExterno: true, nome: true, inicio: true, fim: true } } },
  })
  const sucessoras = await prisma.tarefaRelacao.findMany({
    where: { antecessoraId: tarefaId },
    include: { sucessora: { select: { id: true, idExterno: true, nome: true, inicio: true, fim: true } } },
  })

  return NextResponse.json({
    antecessoras: antecessoras.map((r) => ({ relacaoId: r.id, ...r.antecessora })),
    sucessoras: sucessoras.map((r) => ({ relacaoId: r.id, ...r.sucessora })),
  })
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await verificarAcesso(obraId, session)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const tarefaId = parseInt(params.tarefaId)
  const { antecessoraId } = await req.json()
  if (!antecessoraId || antecessoraId === tarefaId)
    return NextResponse.json({ erro: "Relação inválida" }, { status: 400 })

  // Evitar ciclos: antecessoraId não pode ter tarefaId como antecessora (direta ou transitiva)
  async function temCiclo(origem: number, destino: number): Promise<boolean> {
    if (origem === destino) return true
    const proximas = await prisma.tarefaRelacao.findMany({ where: { antecessoraId: origem }, select: { sucessoraId: true } })
    for (const p of proximas) {
      if (await temCiclo(p.sucessoraId, destino)) return true
    }
    return false
  }
  if (await temCiclo(tarefaId, antecessoraId))
    return NextResponse.json({ erro: "Esta relação criaria um ciclo" }, { status: 400 })

  const relacao = await prisma.tarefaRelacao.create({
    data: { antecessoraId, sucessoraId: tarefaId },
  }).catch(() => null)

  if (!relacao)
    return NextResponse.json({ erro: "Relação já existe" }, { status: 409 })

  return NextResponse.json(relacao, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await verificarAcesso(obraId, session)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { relacaoId } = await req.json()
  await prisma.tarefaRelacao.deleteMany({ where: { id: Number(relacaoId) } })
  return NextResponse.json({ ok: true })
}
