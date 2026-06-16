import { NextRequest, NextResponse } from "next/server"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { temAcessoObra } from "@/lib/acesso-obra"

async function verificarAcesso(obraId: number, session: Session | null) {
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "GESTAO"].includes(session.user.perfil)) return false
  return temAcessoObra(session, obraId)
}

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string; jobId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const jobId = parseInt(params.jobId)
  if (isNaN(obraId) || isNaN(jobId)) return NextResponse.json({ erro: "ID inválido" }, { status: 400 })

  const ok = await verificarAcesso(obraId, session)
  if (!ok) return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const job = await prisma.levantamentoJob.findFirst({
    where: { id: jobId, obraId },
    include: {
      arquivos: true,
      itens: { orderBy: [{ categoria: "asc" }, { descricao: "asc" }] },
    },
  })
  if (!job) return NextResponse.json({ erro: "Levantamento não encontrado" }, { status: 404 })

  // Busca nome do aprovador se houver
  let aprovadorNome: string | null = null
  if (job.aprovadoPorId) {
    const u = await prisma.user.findUnique({ where: { id: job.aprovadoPorId }, select: { nome: true } })
    aprovadorNome = u?.nome ?? null
  }

  return NextResponse.json({ ...job, aprovadorNome })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; jobId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const jobId = parseInt(params.jobId)
  if (isNaN(obraId) || isNaN(jobId)) return NextResponse.json({ erro: "ID inválido" }, { status: 400 })

  const ok = await verificarAcesso(obraId, session)
  if (!ok) return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const job = await prisma.levantamentoJob.findFirst({ where: { id: jobId, obraId } })
  if (!job) return NextResponse.json({ erro: "Levantamento não encontrado" }, { status: 404 })
  if (job.status === "APROVADO") return NextResponse.json({ erro: "Levantamento aprovado não pode ser editado" }, { status: 409 })

  const body = await req.json()
  const itens: { id: number; descricao?: string; quantidade?: number | null; unidade?: string | null; categoria?: string; revisado?: boolean; memoriaCalculo?: string | null }[] = body.itens ?? []

  await Promise.all(
    itens.map((item) =>
      prisma.itemLevantamento.update({
        where: { id: item.id, jobId },
        data: {
          ...(item.descricao !== undefined && { descricao: item.descricao }),
          ...(item.quantidade !== undefined && { quantidade: item.quantidade }),
          ...(item.unidade !== undefined && { unidade: item.unidade }),
          ...(item.categoria !== undefined && { categoria: item.categoria }),
          ...(item.revisado !== undefined && { revisado: item.revisado }),
          ...(item.memoriaCalculo !== undefined && { memoriaCalculo: item.memoriaCalculo }),
          editado: true,
        },
      }),
    ),
  )

  return NextResponse.json({ ok: true })
}
