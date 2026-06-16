import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { temAcessoObra } from "@/lib/acesso-obra"

export async function POST(
  _: NextRequest,
  { params }: { params: { id: string; jobId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  if (!["ADMIN", "SUPER_ADMIN", "GESTAO"].includes(session.user.perfil)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })
  }

  const obraId = parseInt(params.id)
  const jobId = parseInt(params.jobId)
  if (isNaN(obraId) || isNaN(jobId)) return NextResponse.json({ erro: "ID inválido" }, { status: 400 })

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const job = await prisma.levantamentoJob.findFirst({ where: { id: jobId, obraId } })
  if (!job) return NextResponse.json({ erro: "Levantamento não encontrado" }, { status: 404 })
  if (job.status === "APROVADO") return NextResponse.json({ erro: "Levantamento já aprovado" }, { status: 409 })
  if (job.status !== "CONCLUIDO") return NextResponse.json({ erro: "Somente levantamentos concluídos podem ser aprovados" }, { status: 409 })

  const atualizado = await prisma.levantamentoJob.update({
    where: { id: jobId },
    data: {
      status: "APROVADO",
      aprovadoPorId: parseInt(session.user.id),
      aprovadoEm: new Date(),
    },
  })

  return NextResponse.json(atualizado)
}
