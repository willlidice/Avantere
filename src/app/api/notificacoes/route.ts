import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enviarEmail } from "@/lib/email"
import { filtroObrasVisiveis } from "@/lib/acesso-obra"

// GET — lista tarefas vencendo nos próximos N dias do usuário
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const userId = parseInt(session.user.id)
  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifDias: true, notifEmail: true },
  })
  const dias = usuario?.notifDias ?? 7

  const hoje = new Date()
  hoje.setUTCHours(0, 0, 0, 0)
  const limite = new Date(hoje)
  limite.setUTCDate(limite.getUTCDate() + dias)

  const cronogramas = await prisma.cronograma.findMany({
    where: { obra: { ...filtroObrasVisiveis(session), ativa: true } },
    orderBy: [{ obraId: "asc" }, { versao: "desc" }],
    distinct: ["obraId"],
    select: { id: true, versao: true, obraId: true, obra: { select: { nome: true } } },
  })

  const cronogramaIds = cronogramas.map((c) => c.id)

  const tarefas = await prisma.tarefa.findMany({
    where: {
      cronogramaId: { in: cronogramaIds },
      fim: { gte: hoje, lte: limite },
    },
    orderBy: { fim: "asc" },
    select: {
      id: true,
      idExterno: true,
      nome: true,
      nomeTraduzido: true,
      local: true,
      fim: true,
      cronogramaId: true,
    },
  })

  const tarefasComObra = tarefas.map((t) => {
    const cron = cronogramas.find((c) => c.id === t.cronogramaId)
    return { ...t, fim: t.fim.toISOString(), obraNome: cron?.obra.nome ?? "", obraId: cron?.obraId ?? null }
  })

  return NextResponse.json({ tarefas: tarefasComObra, dias, notifEmail: usuario?.notifEmail ?? false })
}

// POST — envia email de notificação para o usuário logado
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const userId = parseInt(session.user.id)
  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, nome: true, notifDias: true },
  })
  if (!usuario) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 })

  const dias = usuario.notifDias

  const hoje = new Date()
  hoje.setUTCHours(0, 0, 0, 0)
  const limite = new Date(hoje)
  limite.setUTCDate(limite.getUTCDate() + dias)

  const cronogramas = await prisma.cronograma.findMany({
    where: { obra: { ...filtroObrasVisiveis(session), ativa: true } },
    orderBy: [{ obraId: "asc" }, { versao: "desc" }],
    distinct: ["obraId"],
    select: { id: true, obraId: true, obra: { select: { nome: true } } },
  })

  const cronogramaIds = cronogramas.map((c) => c.id)

  const tarefas = await prisma.tarefa.findMany({
    where: {
      cronogramaId: { in: cronogramaIds },
      fim: { gte: hoje, lte: limite },
    },
    orderBy: { fim: "asc" },
    select: { idExterno: true, nome: true, nomeTraduzido: true, local: true, fim: true, cronogramaId: true },
  })

  if (tarefas.length === 0) {
    return NextResponse.json({ enviado: false, mensagem: "Nenhuma tarefa com prazo nos próximos dias" })
  }

  const linhasHtml = tarefas
    .map((t) => {
      const cron = cronogramas.find((c) => c.id === t.cronogramaId)
      const fim = t.fim.toLocaleDateString("pt-BR", { timeZone: "UTC", dateStyle: "short" })
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${t.idExterno}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${t.nomeTraduzido ?? t.nome}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${t.local}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${cron?.obra.nome ?? "—"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:bold;color:#dc2626">${fim}</td>
      </tr>`
    })
    .join("")

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:24px">
      <h2 style="color:#1e40af;margin-bottom:4px">Avantere — Prazos próximos</h2>
      <p style="color:#6b7280;margin-bottom:20px">Olá, ${usuario.nome}. Você tem <strong>${tarefas.length}</strong> tarefa${tarefas.length !== 1 ? "s" : ""} com prazo nos próximos <strong>${dias}</strong> dias.</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px 10px;text-align:left">ID</th>
            <th style="padding:8px 10px;text-align:left">Tarefa</th>
            <th style="padding:8px 10px;text-align:left">Local</th>
            <th style="padding:8px 10px;text-align:left">Obra</th>
            <th style="padding:8px 10px;text-align:left">Prazo</th>
          </tr>
        </thead>
        <tbody>${linhasHtml}</tbody>
      </table>
      <p style="color:#9ca3af;font-size:11px;margin-top:24px">Avantere · Gestão de Cronogramas de Obra</p>
    </div>`

  try {
    await enviarEmail({
      para: usuario.email,
      assunto: `Avantere — ${tarefas.length} tarefa${tarefas.length !== 1 ? "s" : ""} vencendo em ${dias} dias`,
      html,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json({ erro: msg }, { status: 500 })
  }

  return NextResponse.json({ enviado: true, total: tarefas.length })
}
