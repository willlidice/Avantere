import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" })
}

function mesReferencia(inicio: Date, fim: Date): string {
  const i = new Date(inicio)
  const f = new Date(fim)
  const mesI = i.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" })
  const mesF = f.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" })
  return mesI === mesF ? mesI : `${mesI} a ${mesF}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; versao: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "GESTAO"].includes(session.user.perfil)) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })
  }

  // 5 chamadas por minuto por usuário — protege contra loops e abuso de custo
  const { permitido, tentarNovamenteEm } = checkRateLimit(
    `traduzir:${session.user.id}`,
    5,
    60 * 1000
  )
  if (!permitido) {
    return NextResponse.json(
      {
        erro: `Muitas requisições de tradução. Aguarde ${tentarNovamenteEm} segundo(s) e tente novamente.`,
      },
      { status: 429 }
    )
  }

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)

  if (isNaN(obraId) || isNaN(versao)) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })
  }

  if (session.user.perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findUnique({
      where: { userId_obraId: { userId: parseInt(session.user.id), obraId } },
    })
    if (!vinculo) return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  const obra = await prisma.obra.findUnique({ where: { id: obraId }, select: { nome: true } })
  if (!obra) return NextResponse.json({ erro: "Obra não encontrada" }, { status: 404 })

  const cronograma = await prisma.cronograma.findUnique({
    where: { obraId_versao: { obraId, versao } },
    select: { id: true },
  })

  if (!cronograma) {
    return NextResponse.json({ erro: "Cronograma não encontrado" }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const idsFilter: number[] | undefined =
    Array.isArray(body?.ids) && body.ids.length > 0 ? body.ids.map(Number) : undefined
  const promptCustomizado: string | undefined =
    typeof body.promptCustomizado === "string" && body.promptCustomizado.trim()
      ? body.promptCustomizado.trim()
      : undefined

  const tarefas = await prisma.tarefa.findMany({
    where: {
      cronogramaId: cronograma.id,
      nomeTraduzido: null,
      ...(idsFilter ? { id: { in: idsFilter } } : {}),
    },
    select: { id: true, nome: true, local: true, quantidade: true, unidade: true, inicio: true, fim: true },
    orderBy: { ordem: "asc" },
  })

  if (tarefas.length === 0) {
    return NextResponse.json({ traduzidas: 0, mensagem: "Nenhuma tarefa pendente de tradução" })
  }

  const contextoObra = `Obra: ${obra.nome}`

  const tarefasJson = JSON.stringify(
    tarefas.map((t) => ({
      id: t.id,
      atividade: t.nome,
      descricao: t.nome,
      etapa: t.local,
      dataInicio: formatarData(t.inicio),
      dataFim: formatarData(t.fim),
      unidadeMedida: t.unidade,
      quantidadePrevista: t.quantidade,
    }))
  )

  const instrucoes = promptCustomizado ?? `Você é especialista em construção civil. Traduza as atividades abaixo para instruções de produção em português PT-BR.`

  const prompt = `${instrucoes}

### CONTEXTO DA OBRA
${contextoObra}

### ATIVIDADES (JSON)
${tarefasJson}

### FORMATO DE SAÍDA (JSON OBRIGATÓRIO)
Responda APENAS com um JSON válido neste schema exato:
{
  "traducoes": [
    {
      "id": <número igual ao id da atividade>,
      "resumoAtividade": "1 ou 2 frases simples explicando o que será feito",
      "instrucoes": "orientação geral em linguagem de canteiro (ou null)",
      "materiais": ["lista de materiais e ferramentas em termos simples"],
      "observacoes": "alertas de segurança/qualidade (ou null)",
      "mesReferencia": "mês/ano de referência (ex.: Junho/2026)",
      "subtarefas": [
        { "ordem": 1, "descricao": "passo a passo claro e direto" }
      ]
    }
  ]
}

REGRAS:
- "materiais" deve ser array (vazio [] se não houver).
- "subtarefas" deve ter ao menos 1 item em ordem crescente.
- Campos opcionais sem conteúdo devem ser null (não string vazia).
- Inclua um objeto por atividade, mantendo o id original.
- Não inclua campos fora do schema.`

  let traducoes: {
    id: number
    resumoAtividade: string
    instrucoes: string | null
    materiais: string[]
    observacoes: string | null
    mesReferencia: string
    subtarefas: { ordem: number; descricao: string }[]
  }[] = []

  try {
    // ~250 tokens por tarefa; mínimo 512, máximo 4096 — protege orçamento
    const maxTokens = Math.min(4096, Math.max(512, tarefas.length * 250))

    const resposta = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    })

    const texto = resposta.content[0].type === "text" ? resposta.content[0].text : ""
    const match = texto.match(/\{[\s\S]*\}/)
    if (!match) {
      return NextResponse.json({ erro: "Resposta da IA inválida" }, { status: 502 })
    }

    const parsed = JSON.parse(match[0])
    traducoes = parsed.traducoes ?? []
  } catch (err: unknown) {
    console.error("Erro na tradução IA:", err)

    if (err && typeof err === "object" && "status" in err) {
      const apiErr = err as { status: number; error?: { error?: { message?: string } } }
      if (apiErr.status === 400) {
        const msg = apiErr.error?.error?.message ?? ""
        if (msg.toLowerCase().includes("credit")) {
          return NextResponse.json(
            { erro: "Créditos da API Anthropic esgotados. Acesse console.anthropic.com para recarregar." },
            { status: 502 }
          )
        }
      }
      if (apiErr.status === 429) {
        return NextResponse.json(
          { erro: "Limite de requisições atingido. Aguarde alguns minutos e tente novamente." },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({ erro: "Falha na tradução. Tente novamente." }, { status: 502 })
  }

  await Promise.all([
    ...traducoes.map((t) =>
      prisma.tarefa.update({
        where: { id: t.id },
        data: {
          nomeTraduzido: t.resumoAtividade,
          traducaoJson: t as object,
        },
      })
    ),
    prisma.logEdicao.create({
      data: {
        userId: parseInt(session.user.id),
        obraId,
        cronogramaId: cronograma.id,
        acao: "TRADUZIR_LOTE",
        dadosDepois: { total: traducoes.length } as object,
      },
    }),
  ])

  const tarefasAtualizadas = await prisma.tarefa.findMany({
    where: { id: { in: traducoes.map((t) => t.id) } },
    select: {
      id: true,
      idExterno: true,
      nome: true,
      nomeTraduzido: true,
      traducaoJson: true,
      local: true,
      quantidade: true,
      unidade: true,
      inicio: true,
      fim: true,
      ordem: true,
      jpgEditadoUrl: true,
    },
    orderBy: { ordem: "asc" },
  })

  return NextResponse.json({ traduzidas: traducoes.length, tarefas: tarefasAtualizadas })
}
