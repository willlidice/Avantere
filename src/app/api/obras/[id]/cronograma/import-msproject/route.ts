import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseStringPromise } from "xml2js"
import { temAcessoObra } from "@/lib/acesso-obra"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function str(val: any): string {
  if (!val) return ""
  return Array.isArray(val) ? String(val[0] ?? "") : String(val)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function num(val: any): number {
  return parseInt(str(val)) || 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseData(val: any): Date | null {
  const s = str(val)
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO")
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const obraId = parseInt(params.id)
  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const formData = await req.formData()
  const arquivo = formData.get("arquivo") as File | null

  if (!arquivo) return NextResponse.json({ erro: "Arquivo não enviado" }, { status: 400 })
  if (!arquivo.name.toLowerCase().endsWith(".xml"))
    return NextResponse.json({ erro: "Apenas arquivos .xml são aceitos" }, { status: 400 })
  if (arquivo.size > 10 * 1024 * 1024)
    return NextResponse.json({ erro: "Arquivo excede o limite de 10 MB" }, { status: 413 })

  const xmlText = await arquivo.text()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any
  try {
    parsed = await parseStringPromise(xmlText, { explicitArray: true, ignoreAttrs: true })
  } catch {
    return NextResponse.json({ erro: "Arquivo XML inválido ou corrompido" }, { status: 400 })
  }

  // Suporte a namespace padrão (Project) e prefixado (msp:Project)
  const project = parsed?.Project ?? parsed?.["msp:Project"] ?? parsed
  const tasksNode = project?.Tasks?.[0] ?? project?.["msp:Tasks"]?.[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTasks: any[] = tasksNode?.Task ?? tasksNode?.["msp:Task"] ?? []

  if (!Array.isArray(rawTasks) || rawTasks.length === 0)
    return NextResponse.json({ erro: "Nenhuma tarefa encontrada no arquivo XML" }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tarefasValidas = rawTasks.filter((t: any) => {
    if (str(t.Milestone) === "1") return false // pular marcos
    const nome = str(t.Name)
    const inicio = parseData(t.Start)
    const fim = parseData(t.Finish)
    return nome && inicio && fim
  })

  if (tarefasValidas.length === 0)
    return NextResponse.json({
      erro: "Nenhuma tarefa válida. Cada tarefa precisa de nome, data de início e data de fim.",
    }, { status: 400 })

  const ultima = await prisma.cronograma.findFirst({
    where: { obraId },
    orderBy: { versao: "desc" },
  })
  const novaVersao = (ultima?.versao ?? 0) + 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tarefasData = tarefasValidas.map((t: any, index: number) => {
    const uid = str(t.UID)
    const id = str(t.ID)
    const wbs = str(t.WBS)
    const idExterno = id ? `T${id}` : wbs ? `WBS${wbs}` : `T${index + 1}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const predecessors: string[] = (t.PredecessorLink ?? []).map((l: any) => str(l.PredecessorUID)).filter(Boolean)

    return {
      _uid: uid,
      _predecessors: predecessors,
      idExterno,
      nome: str(t.Name),
      local: "",
      quantidade: 1,
      unidade: "un",
      inicio: parseData(t.Start)!,
      fim: parseData(t.Finish)!,
      ordem: index + 1,
      responsavel: str(t.ResourceNames) || null,
      percentualConcluido: num(t.PercentComplete),
    }
  })

  const cronograma = await prisma.$transaction(async (tx) => {
    const cron = await tx.cronograma.create({
      data: {
        obraId,
        versao: novaVersao,
        tarefas: {
          create: tarefasData.map(({ _uid: _, _predecessors: __, ...rest }) => rest),
        },
      },
      include: {
        tarefas: { orderBy: { ordem: "asc" } },
        _count: { select: { tarefas: true } },
      },
    })

    // Mapa UID → id da tarefa criada
    const uidParaId = new Map<string, number>()
    tarefasData.forEach((td, i) => {
      const tarefa = cron.tarefas[i]
      if (tarefa && td._uid) uidParaId.set(td._uid, tarefa.id)
    })

    // Criar relações de precedência
    const relacoes: { antecessoraId: number; sucessoraId: number }[] = []
    tarefasData.forEach((td, i) => {
      const sucessoraId = cron.tarefas[i]?.id
      if (!sucessoraId) return
      for (const predUid of td._predecessors) {
        const antecessoraId = uidParaId.get(predUid)
        if (antecessoraId && antecessoraId !== sucessoraId) {
          relacoes.push({ antecessoraId, sucessoraId })
        }
      }
    })

    if (relacoes.length > 0) {
      await tx.tarefaRelacao.createMany({ data: relacoes, skipDuplicates: true })
    }

    return cron
  })

  return NextResponse.json(cronograma, { status: 201 })
}
