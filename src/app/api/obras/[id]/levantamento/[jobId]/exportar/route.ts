import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET(
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

  const job = await prisma.levantamentoJob.findFirst({
    where: { id: jobId, obraId },
    include: {
      obra: { select: { nome: true } },
      itens: { orderBy: [{ categoria: "asc" }, { descricao: "asc" }] },
    },
  })
  if (!job) return NextResponse.json({ erro: "Levantamento não encontrado" }, { status: 404 })
  if (!["CONCLUIDO", "APROVADO"].includes(job.status)) {
    return NextResponse.json({ erro: "Levantamento ainda não concluído" }, { status: 409 })
  }

  const wb = XLSX.utils.book_new()

  // Aba Resumo
  let aprovadorNome = "-"
  if (job.aprovadoPorId) {
    const u = await prisma.user.findUnique({ where: { id: job.aprovadoPorId }, select: { nome: true } })
    aprovadorNome = u?.nome ?? "-"
  }

  const resumoData = [
    ["Obra", job.obra.nome],
    ["Status", job.status],
    ["Score geral de confiança", job.scoreGeral != null ? `${Math.round(job.scoreGeral * 100)}%` : "-"],
    ["Data de criação", job.criadoEm.toLocaleDateString("pt-BR")],
    ["Aprovado por", aprovadorNome],
    ["Aprovado em", job.aprovadoEm ? job.aprovadoEm.toLocaleDateString("pt-BR") : "-"],
    ["Total de itens", job.itens.length],
  ]
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData)
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo")

  // Aba por categoria
  const categorias = Array.from(new Set(job.itens.map((i) => i.categoria))).sort()
  for (const cat of categorias) {
    const itensCat = job.itens.filter((i) => i.categoria === cat)
    const dados = [
      ["Descrição", "Quantidade", "Unidade", "Confiança (%)", "Revisado", "Memória de cálculo", "Arquivo origem"],
      ...itensCat.map((i) => [
        i.descricao,
        i.quantidade ?? "",
        i.unidade ?? "",
        Math.round(i.scoreConfianca * 100),
        i.revisado ? "Sim" : "Não",
        i.memoriaCalculo ?? "",
        i.arquivoOrigem ?? "",
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(dados)
    // Nome da aba: máx 31 chars (limite Excel)
    const nomeAba = cat.charAt(0).toUpperCase() + cat.slice(1)
    XLSX.utils.book_append_sheet(wb, ws, nomeAba.slice(0, 31))
  }

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="levantamento-job-${jobId}.xlsx"`,
    },
  })
}
