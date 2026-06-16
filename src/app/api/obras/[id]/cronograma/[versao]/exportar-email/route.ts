import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enviarEmail } from "@/lib/email"
import { temAcessoObra } from "@/lib/acesso-obra"

type Params = { params: { id: string; versao: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)

  if (isNaN(obraId) || isNaN(versao))
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const { destinatario } = await req.json()
  if (!destinatario?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario.trim()))
    return NextResponse.json({ erro: "E-mail destinatário inválido" }, { status: 400 })

  const cronograma = await prisma.cronograma.findUnique({
    where: { obraId_versao: { obraId, versao } },
    include: {
      obra: { select: { nome: true } },
      tarefas: {
        where: { nomeTraduzido: { not: null } },
        orderBy: { ordem: "asc" },
        select: {
          idExterno: true,
          nome: true,
          nomeTraduzido: true,
          local: true,
          quantidade: true,
          unidade: true,
          inicio: true,
          fim: true,
        },
      },
    },
  })

  if (!cronograma) return NextResponse.json({ erro: "Cronograma não encontrado" }, { status: 404 })
  if (cronograma.tarefas.length === 0)
    return NextResponse.json({ erro: "Nenhuma tarefa traduzida para enviar" }, { status: 400 })

  function fmt(d: Date) {
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  const linhas = cronograma.tarefas
    .map(
      (t) => `<tr>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-family:monospace;font-size:11px;color:#6b7280">${t.idExterno}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;color:#1e40af;font-weight:600">${t.nomeTraduzido}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${t.nome}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px">${t.local}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;white-space:nowrap">${t.quantidade.toLocaleString("pt-BR")} ${t.unidade}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;white-space:nowrap">${fmt(new Date(t.inicio))}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;white-space:nowrap">${fmt(new Date(t.fim))}</td>
      </tr>`
    )
    .join("")

  try {
    await enviarEmail({
      para: destinatario.trim(),
      assunto: `Cronograma Traduzido — ${cronograma.obra.nome} v${versao}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:900px;color:#222">
          <div style="background:#1c1917;padding:16px 24px;border-radius:6px 6px 0 0;display:flex;align-items:center;gap:10px">
            <div style="width:24px;height:24px;background:#d97706;display:flex;align-items:center;justify-content:center;border-radius:3px">
              <span style="color:#fff;font-weight:bold;font-size:12px">A</span>
            </div>
            <span style="color:#f5f5f4;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-size:12px">Avantere</span>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 6px 6px">
            <h2 style="margin:0 0 4px;font-size:18px">Cronograma Traduzido</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:13px">${cronograma.obra.nome} · Versão ${versao} · ${cronograma.tarefas.length} tarefas</p>
            <div style="overflow-x:auto">
              <table style="border-collapse:collapse;width:100%;min-width:600px">
                <thead>
                  <tr style="background:#f9fafb">
                    <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left;font-size:11px;color:#374151;font-weight:700;white-space:nowrap">ID</th>
                    <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left;font-size:11px;color:#1e40af;font-weight:700">Tradução PT-BR</th>
                    <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left;font-size:11px;color:#374151;font-weight:700">Nome Original</th>
                    <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left;font-size:11px;color:#374151;font-weight:700">Local</th>
                    <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left;font-size:11px;color:#374151;font-weight:700">Qtd</th>
                    <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left;font-size:11px;color:#374151;font-weight:700;white-space:nowrap">Início</th>
                    <th style="padding:8px 10px;border:1px solid #e5e7eb;text-align:left;font-size:11px;color:#374151;font-weight:700;white-space:nowrap">Fim</th>
                  </tr>
                </thead>
                <tbody>${linhas}</tbody>
              </table>
            </div>
            <p style="margin-top:20px;font-size:11px;color:#9ca3af">Enviado por ${session.user.name} via Avantere · ${new Date().toLocaleString("pt-BR")}</p>
          </div>
        </div>
      `,
    })
    return NextResponse.json({ ok: true, total: cronograma.tarefas.length })
  } catch {
    return NextResponse.json({ erro: "Falha ao enviar email. Verifique configurações SMTP." }, { status: 500 })
  }
}
