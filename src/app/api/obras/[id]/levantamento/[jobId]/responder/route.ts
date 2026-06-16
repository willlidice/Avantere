import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { baixarDoR2, deletarDoR2 } from "@/lib/r2"
import { processarPDFComRespostas, PerguntaLevantamento } from "@/lib/levantamento"

async function verificarAcesso(obraId: number, userId: number, perfil: string, orgId: number | null) {
  if (!["ADMIN", "SUPER_ADMIN", "GESTAO"].includes(perfil)) return false
  if (perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findUnique({
      where: { userId_obraId: { userId, obraId } },
    })
    if (!vinculo) return false
  }
  if (perfil === "ADMIN" && orgId) {
    const obra = await prisma.obra.findUnique({ where: { id: obraId }, select: { organizacaoId: true } })
    if (!obra || obra.organizacaoId !== orgId) return false
  }
  return true
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; jobId: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

    const obraId = parseInt(params.id)
    const jobId = parseInt(params.jobId)
    if (isNaN(obraId) || isNaN(jobId)) return NextResponse.json({ erro: "ID inválido" }, { status: 400 })

    const ok = await verificarAcesso(obraId, parseInt(session.user.id), session.user.perfil, session.user.organizacaoId ?? null)
    if (!ok) return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

    const job = await prisma.levantamentoJob.findFirst({
      where: { id: jobId, obraId },
      include: { arquivos: true },
    })
    if (!job) return NextResponse.json({ erro: "Levantamento não encontrado" }, { status: 404 })
    if (job.status !== "AGUARDANDO_RESPOSTAS") {
      return NextResponse.json({ erro: "Este levantamento não está aguardando respostas" }, { status: 409 })
    }

    const body = await req.json()
    const respostas: { id: number; resposta: string }[] = body.respostas ?? []
    const pular: boolean = body.pular ?? false

    // Mescla respostas no array de perguntas existente
    const perguntasAtuais = (job.perguntas as PerguntaLevantamento[]) ?? []
    const perguntasComRespostas = perguntasAtuais.map((p) => {
      const r = respostas.find((r) => r.id === p.id)
      return { ...p, resposta: pular ? null : (r?.resposta?.trim() || null) }
    })

    // Salva perguntas com respostas
    await prisma.levantamentoJob.update({
      where: { id: jobId },
      data: { perguntas: perguntasComRespostas, status: "PROCESSANDO" },
    })

    // Monta QAs para o prompt (ignora perguntas sem resposta)
    const qas = pular
      ? []
      : perguntasComRespostas
          .filter((p) => p.resposta && p.resposta.trim().length > 0)
          .map((p) => ({ pergunta: p.pergunta, resposta: p.resposta! }))

    // Processa cada PDF com contexto das respostas
    const novosItens: { categoria: string; descricao: string; quantidade: number | null; unidade: string | null; scoreConfianca: number; arquivoOrigem: string; memoriaCalculo: string | null }[] = []
    const erros: string[] = []

    for (const arquivo of job.arquivos) {
      if (arquivo.tipo !== "pdf") continue

      try {
        // Extrai chave R2 a partir da URL pública
        const r2PublicUrl = process.env.R2_PUBLIC_URL!
        const chave = arquivo.url.replace(`${r2PublicUrl}/`, "")
        const buffer = await baixarDoR2(chave)
        const itens = await processarPDFComRespostas(buffer, arquivo.nome, qas)
        novosItens.push(...itens)
      } catch (err) {
        erros.push(`${arquivo.nome}: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      }
    }

    // Salva novos itens (XLSX já estava salvo)
    if (novosItens.length > 0) {
      await prisma.itemLevantamento.createMany({
        data: novosItens.map((item) => ({ ...item, jobId })),
      })
    }

    // Calcula scoreGeral de todos os itens (XLSX + PDF)
    const todosItens = await prisma.itemLevantamento.findMany({ where: { jobId } })
    const scoreGeral =
      todosItens.length > 0
        ? todosItens.reduce((acc, i) => acc + i.scoreConfianca, 0) / todosItens.length
        : null

    const statusFinal = erros.length > 0 && novosItens.length === 0 && todosItens.filter(i => i.arquivoOrigem?.endsWith(".pdf")).length === 0
      ? "ERRO"
      : "CONCLUIDO"

    const jobFinal = await prisma.levantamentoJob.update({
      where: { id: jobId },
      data: {
        status: statusFinal,
        scoreGeral,
        observacoes: erros.length > 0 ? erros.join("\n") : null,
      },
      include: {
        arquivos: true,
        itens: { orderBy: [{ categoria: "asc" }, { descricao: "asc" }] },
      },
    })

    if (statusFinal === "CONCLUIDO") {
      const r2PublicUrl = process.env.R2_PUBLIC_URL!
      for (const arquivo of jobFinal.arquivos.filter((a) => a.tipo === "pdf")) {
        try {
          await deletarDoR2(arquivo.url.replace(`${r2PublicUrl}/`, ""))
        } catch (err) {
          console.error("[levantamento responder] falha ao deletar PDF do R2:", arquivo.nome, err)
        }
      }
    }

    return NextResponse.json(jobFinal)
  } catch (err) {
    console.error("[levantamento responder]", err)
    return NextResponse.json(
      { erro: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 },
    )
  }
}
