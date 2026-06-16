import * as XLSX from "xlsx"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export interface ItemExtraido {
  categoria: string
  descricao: string
  quantidade: number | null
  unidade: string | null
  scoreConfianca: number
  arquivoOrigem: string
  memoriaCalculo: string | null
}

export interface PerguntaLevantamento {
  id: number
  pergunta: string
  resposta: string | null
}

const CATEGORIAS_VALIDAS = [
  "estrutura",
  "vedação",
  "cobertura",
  "revestimento",
  "esquadrias",
  "hidráulico",
  "elétrico",
  "outros",
]

export function contarPaginasPDF(buffer: Buffer): number {
  const content = buffer.toString("latin1")
  const re = /\/Count\s+(\d+)/g
  const counts: number[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) counts.push(parseInt(m[1], 10))
  if (counts.length > 0) return Math.max(...counts)
  const pages = (content.match(/\/Type\s*\/Page[^s]/g) || []).length
  return Math.max(1, pages)
}

function extrairArrayJSON(texto: string): unknown[] {
  const tentativas = [
    texto.trim(),
    texto.replace(/```(?:json)?/g, "").trim(),
    texto.slice(texto.indexOf("["), texto.lastIndexOf("]") + 1),
  ]
  for (const t of tentativas) {
    if (!t.includes("[")) continue
    try {
      const parsed = JSON.parse(t)
      if (Array.isArray(parsed)) return parsed
    } catch {
      const match = t.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          const parsed = JSON.parse(match[0])
          if (Array.isArray(parsed)) return parsed
        } catch { /* continua */ }
      }
    }
  }
  console.error("[levantamento] falha JSON. Primeiros 500:", texto.slice(0, 500))
  return []
}

// Chamada 1: lê o PDF e gera 3-5 perguntas específicas ao projeto
export async function gerarPerguntasPDF(buffer: Buffer): Promise<string[]> {
  const pdfBase64 = buffer.toString("base64")

  const resposta = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
          } as any,
          {
            type: "text",
            text: `Você é um engenheiro civil sênior analisando um projeto para levantamento de materiais.

Leia este documento e formule de 3 a 5 perguntas ESPECÍFICAS e OBJETIVAS — baseadas no que você realmente viu no projeto — cujas respostas tornariam o levantamento de materiais mais preciso.

Exemplos de BOA pergunta (específica ao que você viu):
- "As tubulações PVC ø25mm indicadas no trecho entre o medidor e os pontos de utilização serão embutidas em alvenaria ou aparentes? Isso define o tipo de abraçadeira e protegem necessários."
- "O projeto não indica se os registros de pressão são de bronze ou PVC. Qual o padrão de qualidade adotado para esta obra?"

Exemplos de PERGUNTA RUIM (genérica demais, evite):
- "Qual o tipo de material?"
- "Quais são as dimensões?"

Foque em: diâmetros ambíguos, tipo de conexão não especificado, trechos verticais não cotados, instalação embutida vs. aparente, padrão de qualidade (linha econômica vs. técnica), norma técnica adotada.

Retorne SOMENTE JSON: {"perguntas": ["pergunta 1", "pergunta 2", "pergunta 3"]}`,
          },
        ],
      },
    ],
  })

  const texto = resposta.content[0].type === "text" ? resposta.content[0].text : ""

  try {
    const cleaned = texto.replace(/```(?:json)?/g, "").trim()
    const obj = JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1))
    if (Array.isArray(obj?.perguntas)) {
      return obj.perguntas.filter((p: unknown) => typeof p === "string" && p.trim().length > 10)
    }
  } catch {
    console.error("[levantamento] falha ao parsear perguntas:", texto.slice(0, 300))
  }

  return []
}

// Chamada 2: gera levantamento completo com contexto das respostas (qas pode ser vazio)
export async function processarPDFComRespostas(
  buffer: Buffer,
  nomeArquivo: string,
  qas: { pergunta: string; resposta: string }[],
): Promise<ItemExtraido[]> {
  const pdfBase64 = buffer.toString("base64")

  const contextoQA =
    qas.length > 0
      ? `\n\nInformações complementares fornecidas pelo responsável técnico:\n${qas
          .map((qa, i) => `${i + 1}. ${qa.pergunta}\n   Resposta: ${qa.resposta}`)
          .join("\n")}\n\nUtilize estas informações para refinar o levantamento.`
      : ""

  const resposta = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
          } as any,
          {
            type: "text",
            text: `Você é um engenheiro civil sênior com especialização em instalações prediais, realizando levantamento de materiais para orçamentação de obra.${contextoQA}

Analise este projeto com rigor técnico e elabore o levantamento COMPLETO de materiais, incluindo:

1. Materiais explícitos: tubulações, conexões, registros, equipamentos e componentes visíveis no projeto
2. Materiais implícitos: conexões necessárias para executar a instalação (joelhos, curvas, tês, luvas, reduções, uniões) — deduza a partir dos trajetos e pontos de utilização
3. Acessórios: fita veda-rosca, solução limpa-PVC, abraçadeiras — estime pelo comprimento de tubulação e número de conexões

Para cada item retorne um objeto JSON com estes campos exatos:
- "categoria": estrutura | vedação | cobertura | revestimento | esquadrias | hidráulico | elétrico | outros
- "descricao": descrição técnica completa (ex: "Joelho 90 graus PVC soldável 25mm", "Registro de gaveta bronze 3/4 pol")
- "quantidade": número estimado — nunca null quando puder calcular
- "unidade": m, m2, m3, un, pç, kg, l, rolo
- "scoreConfianca": 0.95 se explícito no projeto; 0.80 se calculado; 0.65 se estimado por boa prática
- "memoriaCalculo": texto de uma linha explicando o cálculo

IMPORTANTE: retorne SOMENTE o array JSON, começando com [ e terminando com ]. Sem markdown, sem texto antes ou depois.`,
          },
        ],
      },
    ],
  })

  const conteudo = resposta.content[0].type === "text" ? resposta.content[0].text : ""
  console.log("[levantamento PDF] stop_reason:", resposta.stop_reason, "tokens:", resposta.usage?.output_tokens)

  const itens = extrairArrayJSON(conteudo) as ItemExtraido[]

  return itens
    .filter((item) => item.descricao && String(item.descricao).trim().length > 0)
    .map((item) => ({
      categoria: CATEGORIAS_VALIDAS.includes(item.categoria) ? item.categoria : "outros",
      descricao: String(item.descricao).trim(),
      quantidade: item.quantidade != null ? Number(item.quantidade) : null,
      unidade: item.unidade ? String(item.unidade).trim() : null,
      scoreConfianca: Math.min(1, Math.max(0, Number(item.scoreConfianca) || 0.5)),
      arquivoOrigem: nomeArquivo,
      memoriaCalculo: item.memoriaCalculo ? String(item.memoriaCalculo).trim() : null,
    }))
}

// Alias para compatibilidade (sem contexto de Q&A)
export async function processarPDF(buffer: Buffer, nomeArquivo: string): Promise<ItemExtraido[]> {
  return processarPDFComRespostas(buffer, nomeArquivo, [])
}

export async function processarXLSX(buffer: Buffer, nomeArquivo: string): Promise<ItemExtraido[]> {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const itens: ItemExtraido[] = []

  for (const nomePlanilha of workbook.SheetNames) {
    const planilha = workbook.Sheets[nomePlanilha]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linhas: Record<string, any>[] = XLSX.utils.sheet_to_json(planilha, { defval: "" })
    if (linhas.length === 0) continue

    const colunas = Object.keys(linhas[0]).map((k) => k.toString())
    const encontrar = (termos: string[]) =>
      colunas.find((c) => termos.some((t) => c.toLowerCase().includes(t.toLowerCase()))) ?? null

    const colDescricao = encontrar(["descrição", "descricao", "material", "item", "tarefa", "nome"])
    const colQuantidade = encontrar(["quantidade", "qtd", "qtde", "quant"])
    const colUnidade = encontrar(["unidade", "und", "un"])
    const colCategoria = encontrar(["categoria", "disciplina", "tipo"])

    if (!colDescricao) continue

    for (const linha of linhas) {
      const descricao = String(linha[colDescricao] ?? "").trim()
      if (!descricao || descricao.length < 2) continue

      const qtdRaw = colQuantidade ? linha[colQuantidade] : null
      const quantidade = qtdRaw !== "" && qtdRaw != null ? Number(qtdRaw) : null
      const unidade = colUnidade ? String(linha[colUnidade] ?? "").trim() || null : null

      let categoria = "outros"
      if (colCategoria) {
        const cat = String(linha[colCategoria] ?? "").toLowerCase().trim()
        if (CATEGORIAS_VALIDAS.some((c) => cat.includes(c))) {
          categoria = CATEGORIAS_VALIDAS.find((c) => cat.includes(c))!
        }
      }

      itens.push({
        categoria,
        descricao,
        quantidade: !isNaN(quantidade as number) ? quantidade : null,
        unidade,
        scoreConfianca: 0.95,
        arquivoOrigem: `${nomeArquivo} (${nomePlanilha})`,
        memoriaCalculo: null,
      })
    }
  }

  return itens
}
