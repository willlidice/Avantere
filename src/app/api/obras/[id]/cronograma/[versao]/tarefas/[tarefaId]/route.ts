import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deletarDoR2 } from "@/lib/r2"

type Params = { params: { id: string; versao: string; tarefaId: string } }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  const tarefaId = parseInt(params.tarefaId)
  if (isNaN(obraId) || isNaN(versao) || isNaN(tarefaId)) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })
  }

  if (session.user.perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findFirst({
      where: { obraId, userId: parseInt(session.user.id) },
    })
    if (!vinculo) return NextResponse.json({ erro: "Sem acesso a esta obra" }, { status: 403 })
  }

  const tarefa = await prisma.tarefa.findFirst({
    where: { id: tarefaId, cronograma: { obraId, versao } },
    include: { imagens: true, cronograma: { select: { id: true } } },
  })
  if (!tarefa) return NextResponse.json({ erro: "Tarefa não encontrada" }, { status: 404 })

  for (const img of tarefa.imagens) {
    try {
      const chave = img.url.split("/").slice(3).join("/")
      await deletarDoR2(chave)
    } catch {
      // ignora falha no R2
    }
  }

  await prisma.$transaction([
    prisma.tarefa.delete({ where: { id: tarefaId } }),
    prisma.logEdicao.create({
      data: {
        userId: parseInt(session.user.id),
        obraId,
        cronogramaId: tarefa.cronograma.id,
        tarefaId,
        acao: "EXCLUIR_TAREFA",
        dadosAntes: {
          idExterno: tarefa.idExterno,
          nome: tarefa.nome,
          local: tarefa.local,
        },
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  const tarefaId = parseInt(params.tarefaId)
  if (isNaN(obraId) || isNaN(versao) || isNaN(tarefaId)) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })
  }

  const ehProducao = session.user.perfil === "PRODUCAO"

  if (!ehProducao && session.user.perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findFirst({
      where: { obraId, userId: parseInt(session.user.id) },
    })
    if (!vinculo) return NextResponse.json({ erro: "Sem acesso a esta obra" }, { status: 403 })
  }

  const tarefa = await prisma.tarefa.findFirst({
    where: { id: tarefaId, cronograma: { obraId, versao } },
    include: { cronograma: { select: { id: true } } },
  })
  if (!tarefa) return NextResponse.json({ erro: "Tarefa não encontrada" }, { status: 404 })

  const body = await req.json()

  const data: Record<string, unknown> = {}

  // PRODUCAO só pode alterar statusManual e dataConclusaoReal
  if (ehProducao) {
    const statusValidos = ["ANDAMENTO", "COM_INTERFERENCIA", "ATRASADO", "CONCLUIDO", "REPROGRAMAR", null]
    if (!statusValidos.includes(body.statusManual)) {
      return NextResponse.json({ erro: "Sem permissão para este campo" }, { status: 403 })
    }
    data.statusManual = body.statusManual ?? null
    if (body.dataConclusaoReal !== undefined) {
      if (body.dataConclusaoReal) {
        const d = new Date(body.dataConclusaoReal)
        if (!isNaN(d.getTime())) data.dataConclusaoReal = d
      } else {
        data.dataConclusaoReal = null
      }
    }
  } else {
    const { nome, nomeTraduzido, local, quantidade, unidade, inicio, fim, responsavel, statusManual } = body

    if (typeof nome === "string" && nome.trim()) data.nome = nome.trim()
    if (nomeTraduzido !== undefined) {
      data.nomeTraduzido = typeof nomeTraduzido === "string" && nomeTraduzido.trim()
        ? nomeTraduzido.trim()
        : null
      if (data.nomeTraduzido === null) data.traducaoJson = null
    }
    if (typeof local === "string") data.local = local.trim()
    if (quantidade !== undefined && !isNaN(Number(quantidade))) data.quantidade = Number(quantidade)
    if (typeof unidade === "string") data.unidade = unidade.trim()
    if (inicio) {
      const d = new Date(inicio)
      if (!isNaN(d.getTime())) data.inicio = d
    }
    if (fim) {
      const d = new Date(fim)
      if (!isNaN(d.getTime())) data.fim = d
    }
    if (responsavel !== undefined) data.responsavel = typeof responsavel === "string" ? responsavel.trim() || null : null
    if (statusManual !== undefined) data.statusManual = statusManual ?? null
    if (body.dataConclusaoReal !== undefined) {
      if (body.dataConclusaoReal) {
        const d = new Date(body.dataConclusaoReal)
        if (!isNaN(d.getTime())) data.dataConclusaoReal = d
      } else {
        data.dataConclusaoReal = null
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ erro: "Nenhum campo para atualizar" }, { status: 400 })
  }

  const [atualizada] = await prisma.$transaction([
    prisma.tarefa.update({ where: { id: tarefaId }, data }),
    prisma.logEdicao.create({
      data: {
        userId: parseInt(session.user.id),
        obraId,
        cronogramaId: tarefa.cronograma.id,
        tarefaId,
        acao: ehProducao ? "ATUALIZAR_STATUS" : "EDITAR_TAREFA",
        dadosAntes: {
          nome: tarefa.nome,
          nomeTraduzido: tarefa.nomeTraduzido,
          local: tarefa.local,
          quantidade: tarefa.quantidade,
          unidade: tarefa.unidade,
        },
        dadosDepois: data as object,
      },
    }),
  ])

  // Cascade: se datas mudaram e cascadeRelacoes=true, mover sucessoras recursivamente
  if (!ehProducao && body.cascadeRelacoes && (data.inicio || data.fim)) {
    const novoInicio = data.inicio ? new Date(data.inicio as string) : tarefa.inicio
    const deltaMs = novoInicio.getTime() - tarefa.inicio.getTime()

    const cascadeSucessoras = async (id: number, delta: number, visitados: Set<number>): Promise<void> => {
      if (visitados.has(id)) return
      visitados.add(id)
      const relacoes = await prisma.tarefaRelacao.findMany({ where: { antecessoraId: id }, select: { sucessoraId: true } })
      for (const r of relacoes) {
        const suc = await prisma.tarefa.findUnique({ where: { id: r.sucessoraId }, select: { inicio: true, fim: true } })
        if (!suc) continue
        await prisma.tarefa.update({
          where: { id: r.sucessoraId },
          data: {
            inicio: new Date(suc.inicio.getTime() + delta),
            fim: new Date(suc.fim.getTime() + delta),
          },
        })
        await cascadeSucessoras(r.sucessoraId, delta, visitados)
      }
    }
    if (deltaMs !== 0) await cascadeSucessoras(tarefaId, deltaMs, new Set([tarefaId]))
  }

  // Notificar PRODUCAO quando ADMIN/GESTAO muda status
  if (!ehProducao && data.statusManual !== undefined) {
    const statusLabel: Record<string, string> = {
      ANDAMENTO: "Em andamento",
      COM_INTERFERENCIA: "Com interferência",
      ATRASADO: "Atrasado",
      CONCLUIDO: "Concluído",
    }
    const novoStatus = String(data.statusManual ?? "")
    const obraUsuarios = await prisma.obraUser.findMany({
      where: { obraId },
      include: { user: { select: { id: true, perfil: true } } },
    })
    const producaoIds = obraUsuarios
      .filter((ou) => ou.user.perfil === "PRODUCAO")
      .map((ou) => ou.user.id)

    if (producaoIds.length > 0) {
      const { enviarPushPara } = await import("@/lib/push")
      await Promise.allSettled(
        producaoIds.map((uid) =>
          enviarPushPara(uid, {
            title: "Status atualizado",
            body: `${tarefa.nome} → ${statusLabel[novoStatus] ?? novoStatus}`,
            url: "/tarefas",
          })
        )
      )
    }
  }

  return NextResponse.json(atualizada)
}
