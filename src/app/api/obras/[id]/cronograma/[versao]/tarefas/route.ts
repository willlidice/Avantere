import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deletarDoR2 } from "@/lib/r2"
import { temAcessoObra } from "@/lib/acesso-obra"

type Params = { params: { id: string; versao: string } }

// POST /api/obras/[id]/cronograma/[versao]/tarefas — cria tarefa manualmente
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  if (isNaN(obraId) || isNaN(versao)) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })
  }

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Sem acesso a esta obra" }, { status: 403 })

  const cronograma = await prisma.cronograma.findUnique({
    where: { obraId_versao: { obraId, versao } },
    select: { id: true },
  })
  if (!cronograma) return NextResponse.json({ erro: "Cronograma não encontrado" }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { idExterno, nome, local, quantidade, unidade, inicio, fim, responsavel } = body

  if (!idExterno?.trim() || !nome?.trim() || !local?.trim() || !unidade?.trim() || !inicio || !fim) {
    return NextResponse.json({ erro: "Campos obrigatórios: ID, Nome, Local, Unidade, Início, Fim" }, { status: 400 })
  }

  const qtd = parseFloat(quantidade)
  if (isNaN(qtd) || qtd < 0) return NextResponse.json({ erro: "Quantidade inválida" }, { status: 400 })

  const inicioDate = new Date(inicio)
  const fimDate = new Date(fim)
  if (isNaN(inicioDate.getTime()) || isNaN(fimDate.getTime())) {
    return NextResponse.json({ erro: "Datas inválidas" }, { status: 400 })
  }

  const maxOrdem = await prisma.tarefa.aggregate({
    where: { cronogramaId: cronograma.id },
    _max: { ordem: true },
  })
  const ordemNova = (maxOrdem._max.ordem ?? 0) + 1

  const tarefa = await prisma.$transaction(async (tx) => {
    const t = await tx.tarefa.create({
      data: {
        cronogramaId: cronograma.id,
        idExterno: idExterno.trim(),
        nome: nome.trim(),
        local: local.trim(),
        quantidade: qtd,
        unidade: unidade.trim(),
        inicio: inicioDate,
        fim: fimDate,
        ordem: ordemNova,
        responsavel: responsavel?.trim() || null,
      },
      include: { imagens: true },
    })
    await tx.logEdicao.create({
      data: {
        userId: parseInt(session.user.id),
        obraId,
        cronogramaId: cronograma.id,
        tarefaId: t.id,
        acao: "CRIAR_TAREFA_MANUAL",
        dadosDepois: { idExterno: t.idExterno, nome: t.nome } as object,
      },
    })
    return t
  })

  return NextResponse.json(tarefa, { status: 201 })
}

// DELETE /api/obras/[id]/cronograma/[versao]/tarefas — zera todas as tarefas da versão
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  if (isNaN(obraId) || isNaN(versao)) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })
  }

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Sem acesso a esta obra" }, { status: 403 })

  const cronograma = await prisma.cronograma.findUnique({
    where: { obraId_versao: { obraId, versao } },
    include: {
      tarefas: {
        include: { imagens: true },
      },
    },
  })
  if (!cronograma) return NextResponse.json({ erro: "Cronograma não encontrado" }, { status: 404 })

  // Excluir imagens do R2 (best effort)
  for (const tarefa of cronograma.tarefas) {
    for (const img of tarefa.imagens) {
      try {
        const chave = img.url.split("/").slice(3).join("/")
        await deletarDoR2(chave)
      } catch {
        // ignora falha no R2
      }
    }
  }

  await prisma.$transaction([
    prisma.tarefa.deleteMany({ where: { cronogramaId: cronograma.id } }),
    prisma.logEdicao.create({
      data: {
        userId: parseInt(session.user.id),
        obraId,
        cronogramaId: cronograma.id,
        acao: "ZERAR_TAREFAS",
        dadosAntes: { totalTarefas: cronograma.tarefas.length },
      },
    }),
  ])
  return NextResponse.json({ ok: true, deletadas: cronograma.tarefas.length })
}
