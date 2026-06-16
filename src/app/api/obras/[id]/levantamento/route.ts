import { NextRequest, NextResponse } from "next/server"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadArquivoParaR2, deletarDoR2 } from "@/lib/r2"
import { contarPaginasPDF, gerarPerguntasPDF, processarXLSX } from "@/lib/levantamento"
import { temAcessoObra } from "@/lib/acesso-obra"

const TAMANHO_MAX = 20 * 1024 * 1024 // 20 MB
const TIPOS_PERMITIDOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]

async function verificarAcesso(obraId: number, session: Session | null) {
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "GESTAO"].includes(session.user.perfil)) return false
  return temAcessoObra(session, obraId)
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  if (isNaN(obraId)) return NextResponse.json({ erro: "ID inválido" }, { status: 400 })

  const ok = await verificarAcesso(obraId, session)
  if (!ok) return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const jobs = await prisma.levantamentoJob.findMany({
    where: { obraId },
    orderBy: { criadoEm: "desc" },
    include: {
      _count: { select: { itens: true, arquivos: true } },
      arquivos: { select: { id: true, nome: true, tipo: true } },
    },
  })

  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  if (isNaN(obraId)) return NextResponse.json({ erro: "ID inválido" }, { status: 400 })

  const ok = await verificarAcesso(obraId, session)
  if (!ok) return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const formData = await req.formData()
  const arquivosForm = formData.getAll("arquivos") as File[]

  if (!arquivosForm.length) return NextResponse.json({ erro: "Nenhum arquivo enviado" }, { status: 400 })
  if (arquivosForm.length > 10) return NextResponse.json({ erro: "Máximo 10 arquivos por levantamento" }, { status: 400 })

  // Validações pré-processamento
  const buffers: { file: File; buffer: Buffer }[] = []
  for (const file of arquivosForm) {
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json(
        { erro: `Arquivo "${file.name}": tipo não permitido. Aceito: PDF, XLSX.` },
        { status: 422 },
      )
    }
    if (file.size > TAMANHO_MAX) {
      return NextResponse.json(
        { erro: `Arquivo "${file.name}" excede 20 MB.` },
        { status: 422 },
      )
    }
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.type === "application/pdf") {
      const paginas = contarPaginasPDF(buffer)
      if (paginas > 1) {
        return NextResponse.json(
          {
            erro: `Arquivo "${file.name}" tem ${paginas} páginas. PDFs devem ter no máximo 1 página. Divida o documento antes de enviar.`,
          },
          { status: 422 },
        )
      }
    }

    buffers.push({ file, buffer })
  }

  // Cria job
  const job = await prisma.levantamentoJob.create({
    data: {
      obraId,
      status: "PROCESSANDO",
      criadoPorId: parseInt(session.user.id),
    },
  })

  // Fase 1: upload de todos os arquivos + processa XLSX imediatamente
  const itensXLSX: { categoria: string; descricao: string; quantidade: number | null; unidade: string | null; scoreConfianca: number; arquivoOrigem: string; memoriaCalculo: string | null }[] = []
  const buffersPDF: { file: File; buffer: Buffer }[] = []
  const errosArquivos: string[] = []

  for (const { file, buffer } of buffers) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
    const chave = `levantamento/obra-${obraId}/job-${job.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const url = await uploadArquivoParaR2(chave, buffer, file.type)

    await prisma.arquivoLevantamento.create({
      data: { jobId: job.id, nome: file.name, url, tipo: ext, tamanho: file.size },
    })

    if (file.type === "application/pdf") {
      buffersPDF.push({ file, buffer })
    } else {
      try {
        const itens = await processarXLSX(buffer, file.name)
        itensXLSX.push(...itens)
      } catch (err) {
        errosArquivos.push(`${file.name}: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      }
    }
  }

  // Salva itens de XLSX já disponíveis
  if (itensXLSX.length > 0) {
    await prisma.itemLevantamento.createMany({
      data: itensXLSX.map((item) => ({ ...item, jobId: job.id })),
    })
  }

  // Fase 2: gera perguntas para PDFs (se houver)
  if (buffersPDF.length > 0) {
    const todasPerguntas: string[] = []

    for (const { file, buffer } of buffersPDF) {
      try {
        const perguntas = await gerarPerguntasPDF(buffer)
        todasPerguntas.push(...perguntas)
      } catch (err) {
        errosArquivos.push(`${file.name}: ${err instanceof Error ? err.message : "Erro ao gerar perguntas"}`)
      }
    }

    if (todasPerguntas.length > 0) {
      // Suspende o job aguardando respostas
      const perguntasJson = todasPerguntas.slice(0, 5).map((p, i) => ({
        id: i + 1,
        pergunta: p,
        resposta: null,
      }))

      const jobAtualizado = await prisma.levantamentoJob.update({
        where: { id: job.id },
        data: {
          status: "AGUARDANDO_RESPOSTAS",
          perguntas: perguntasJson,
          observacoes: errosArquivos.length > 0 ? errosArquivos.join("\n") : null,
        },
        include: {
          arquivos: true,
          itens: { orderBy: [{ categoria: "asc" }, { descricao: "asc" }] },
        },
      })

      return NextResponse.json(jobAtualizado, { status: 201 })
    }

    // Nenhuma pergunta gerada (PDF sem texto útil) — processa direto sem Q&A
    for (const { file, buffer } of buffersPDF) {
      try {
        const { processarPDF } = await import("@/lib/levantamento")
        const itens = await processarPDF(buffer, file.name)
        if (itens.length > 0) {
          await prisma.itemLevantamento.createMany({
            data: itens.map((item) => ({ ...item, jobId: job.id })),
          })
        }
      } catch (err) {
        errosArquivos.push(`${file.name}: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      }
    }
  }

  // Finaliza job (apenas XLSX ou PDF sem perguntas)
  const todosItens = await prisma.itemLevantamento.findMany({ where: { jobId: job.id } })
  const scoreGeral =
    todosItens.length > 0
      ? todosItens.reduce((acc, i) => acc + i.scoreConfianca, 0) / todosItens.length
      : null

  const nenhumArquivoProcessado = errosArquivos.length === buffers.length
  const statusFinal = nenhumArquivoProcessado ? "ERRO" : "CONCLUIDO"

  const jobAtualizado = await prisma.levantamentoJob.update({
    where: { id: job.id },
    data: {
      status: statusFinal,
      scoreGeral,
      observacoes: errosArquivos.length > 0 ? errosArquivos.join("\n") : null,
    },
    include: {
      arquivos: true,
      itens: { orderBy: [{ categoria: "asc" }, { descricao: "asc" }] },
    },
  })

  if (statusFinal === "CONCLUIDO") {
    const r2PublicUrl = process.env.R2_PUBLIC_URL!
    for (const arquivo of jobAtualizado.arquivos.filter((a) => a.tipo === "pdf")) {
      try {
        await deletarDoR2(arquivo.url.replace(`${r2PublicUrl}/`, ""))
      } catch (err) {
        console.error("[levantamento] falha ao deletar PDF do R2:", arquivo.nome, err)
      }
    }
  }

  return NextResponse.json(jobAtualizado, { status: 201 })
  } catch (err) {
    console.error("[levantamento POST]", err)
    return NextResponse.json(
      { erro: err instanceof Error ? err.message : "Erro interno ao processar levantamento" },
      { status: 500 },
    )
  }
}
