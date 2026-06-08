import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const userId = parseInt(session.user.id)
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil)
  const orgId = session.user.organizacaoId

  // Obras acessíveis — ADMIN vê da própria org, SUPER_ADMIN vê todas
  const obrasAcessiveis =
    session.user.perfil === "SUPER_ADMIN"
      ? await prisma.obra.findMany({ orderBy: { nome: "asc" } })
      : isAdmin
      ? await prisma.obra.findMany({
          where: { organizacaoId: orgId ?? undefined },
          orderBy: { nome: "asc" },
        })
      : await prisma.obra.findMany({
          where: {
            organizacaoId: orgId ?? undefined,
            usuarios: { some: { userId } },
          },
          orderBy: { nome: "asc" },
        })

  const obraIds = obrasAcessiveis.map((o) => o.id)
  const totalObras = obrasAcessiveis.length
  const totalObrasAtivas = obrasAcessiveis.filter((o) => o.ativa).length

  // Buscar cronogramas mais recentes por obra
  const cronogramas = await prisma.cronograma.findMany({
    where: { obraId: { in: obraIds } },
    include: {
      tarefas: {
        select: { id: true, nomeTraduzido: true, inicio: true, fim: true, nome: true },
      },
    },
    orderBy: { versao: "desc" },
  })

  // Pegar apenas o cronograma mais recente por obra
  const cronogramasPorObra = new Map<number, typeof cronogramas[0]>()
  for (const c of cronogramas) {
    if (!cronogramasPorObra.has(c.obraId)) {
      cronogramasPorObra.set(c.obraId, c)
    }
  }

  const agora = new Date()
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const em7Dias = new Date(hoje.getTime() + 7 * 86400000)

  let totalTarefas = 0
  let totalTraduzidas = 0
  let emAndamento = 0
  let concluidas = 0
  let futuras = 0

  const obraStats: {
    obraId: number
    obraNome: string
    ativa: boolean
    totalTarefas: number
    traduzidas: number
    versoes: number
  }[] = []

  const vencendoEm7Dias: { tarefaNome: string; obraNome: string; fim: Date }[] = []

  for (const obra of obrasAcessiveis) {
    const cron = cronogramasPorObra.get(obra.id)
    const tarefas = cron?.tarefas ?? []
    const traduzidas = tarefas.filter((t) => t.nomeTraduzido).length

    totalTarefas += tarefas.length
    totalTraduzidas += traduzidas

    for (const t of tarefas) {
      const ini = new Date(t.inicio)
      const fim = new Date(t.fim)
      if (fim < hoje) concluidas++
      else if (ini > hoje) futuras++
      else emAndamento++

      if (fim >= hoje && fim <= em7Dias) {
        vencendoEm7Dias.push({ tarefaNome: t.nome, obraNome: obra.nome, fim })
      }
    }

    // Contar versões desta obra
    const totalVersoes = cronogramas.filter((c) => c.obraId === obra.id).length

    obraStats.push({
      obraId: obra.id,
      obraNome: obra.nome,
      ativa: obra.ativa,
      totalTarefas: tarefas.length,
      traduzidas,
      versoes: totalVersoes,
    })
  }

  obraStats.sort((a, b) => b.totalTarefas - a.totalTarefas)
  vencendoEm7Dias.sort((a, b) => a.fim.getTime() - b.fim.getTime())

  return NextResponse.json({
    totalObras,
    totalObrasAtivas,
    totalTarefas,
    totalTraduzidas,
    porStatus: { emAndamento, concluidas, futuras },
    obraStats,
    vencendoEm7Dias: vencendoEm7Dias.slice(0, 10).map((v) => ({
      tarefaNome: v.tarefaNome,
      obraNome: v.obraNome,
      fim: v.fim.toISOString(),
    })),
  })
}
