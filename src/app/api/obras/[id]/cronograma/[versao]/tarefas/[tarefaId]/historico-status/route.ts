import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: { id: string; versao: string; tarefaId: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const tarefaId = parseInt(params.tarefaId)
  if (isNaN(tarefaId)) return NextResponse.json({ erro: "Inválido" }, { status: 400 })

  const logs = await prisma.logEdicao.findMany({
    where: {
      tarefaId,
      acao: { in: ["ATUALIZAR_STATUS", "EDITAR_TAREFA"] },
    },
    orderBy: { criadoEm: "desc" },
    take: 20,
    include: { user: { select: { nome: true, perfil: true } } },
  })

  const STATUS_LABEL: Record<string, string> = {
    ANDAMENTO: "Em andamento",
    COM_INTERFERENCIA: "Com interferência",
    ATRASADO: "Atrasado",
    CONCLUIDO: "Concluído",
  }

  const historico = logs
    .filter((log) => {
      const depois = log.dadosDepois as Record<string, unknown> | null
      return depois && depois.statusManual !== undefined
    })
    .map((log) => {
      const depois = log.dadosDepois as Record<string, unknown>
      const antes = log.dadosAntes as Record<string, unknown> | null
      const novoStatus = String(depois.statusManual ?? "")
      const statusAntes = antes?.statusManual ? String(antes.statusManual) : null
      return {
        id: log.id,
        criadoEm: log.criadoEm,
        userNome: log.user.nome,
        userPerfil: log.user.perfil,
        statusAntes: statusAntes ? (STATUS_LABEL[statusAntes] ?? statusAntes) : "Auto",
        statusDepois: STATUS_LABEL[novoStatus] ?? (novoStatus || "Auto"),
      }
    })

  return NextResponse.json(historico)
}
