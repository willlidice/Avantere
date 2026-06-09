import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { enviarEmail } from "@/lib/email"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const { permitido, tentarNovamenteEm } = checkRateLimit(
    `sugestoes:${session.user.id}`,
    5,
    60 * 60 * 1000 // 5 sugestões por hora por usuário
  )
  if (!permitido)
    return NextResponse.json(
      { erro: `Muitas sugestões. Tente novamente em ${tentarNovamenteEm}s.` },
      { status: 429 }
    )

  const { tipo, titulo, descricao } = await req.json()

  if (!tipo?.trim() || !descricao?.trim())
    return NextResponse.json({ erro: "Preencha todos os campos obrigatórios" }, { status: 400 })

  const tiposValidos = ["melhoria", "bug", "novo-recurso", "outro"]
  if (!tiposValidos.includes(tipo))
    return NextResponse.json({ erro: "Tipo inválido" }, { status: 400 })

  const tipoLabel: Record<string, string> = {
    melhoria: "Melhoria",
    bug: "Correção de bug",
    "novo-recurso": "Novo recurso",
    outro: "Outro",
  }

  try {
    await enviarEmail({
      para: "suporte@avantere.com.br",
      assunto: `[Sugestão] ${tipoLabel[tipo]}: ${titulo || "(sem título)"}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;color:#222">
          <h2 style="margin:0 0 8px;font-size:18px">Nova sugestão recebida</h2>
          <p style="margin:0 0 16px;color:#6b7280;font-size:13px">
            Enviada por <strong>${session.user.name}</strong> (${session.user.email})
          </p>
          <table style="border-collapse:collapse;width:100%">
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:12px;font-weight:600;color:#374151;width:120px">Tipo</td>
              <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px">${tipoLabel[tipo]}</td>
            </tr>
            ${titulo ? `<tr>
              <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:12px;font-weight:600;color:#374151">Título</td>
              <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px">${titulo}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:12px;font-weight:600;color:#374151;vertical-align:top">Descrição</td>
              <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;white-space:pre-wrap">${descricao}</td>
            </tr>
          </table>
          <p style="margin-top:16px;font-size:11px;color:#9ca3af">Avantere · ${new Date().toLocaleString("pt-BR")}</p>
        </div>
      `,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ erro: "Erro ao enviar sugestão. Tente novamente." }, { status: 500 })
  }
}
