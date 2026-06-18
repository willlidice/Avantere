import nodemailer from "nodemailer"

export async function enviarEmail({
  para,
  assunto,
  html,
}: {
  para: string
  assunto: string
  html: string
}) {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM ?? user

  if (!host || !user || !pass) {
    throw new Error("SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env.local")
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transport.sendMail({ from, to: para, subject: assunto, html })
}

const PERFIL_LABEL_EMAIL: Record<string, string> = {
  ADMIN: "Administrador",
  GESTAO: "Gestão",
  PRODUCAO: "Produção",
}

export async function enviarEmailBoasVindas({
  nome,
  email,
  senha,
  perfil,
}: {
  nome: string
  email: string
  senha: string
  perfil: string
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? "https://app.avantere.com.br"
  await enviarEmail({
    para: email,
    assunto: "Bem-vindo ao Avantere — Suas credenciais de acesso",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#222">
        <div style="background:#1c1917;padding:24px 32px;border-radius:8px 8px 0 0">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:28px;height:28px;background:#d97706;display:flex;align-items:center;justify-content:center;border-radius:3px">
              <span style="color:#fff;font-weight:bold;font-size:14px">A</span>
            </div>
            <span style="color:#f5f5f4;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-size:13px">Avantere</span>
          </div>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Olá, ${nome}!</h2>
          <p style="color:#6b7280;margin:0 0 24px;font-size:14px">Sua conta no Avantere foi criada. Abaixo estão suas credenciais de acesso:</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:13px"><strong style="color:#374151">E-mail:</strong> <span style="color:#1d4ed8">${email}</span></p>
            <p style="margin:0 0 8px;font-size:13px"><strong style="color:#374151">Senha:</strong> <span style="color:#374151">${senha}</span></p>
            <p style="margin:0;font-size:13px"><strong style="color:#374151">Perfil:</strong> ${PERFIL_LABEL_EMAIL[perfil] ?? perfil}</p>
          </div>
          <a href="${appUrl}/login" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:600;font-size:14px">Acessar o sistema</a>
          <p style="color:#9ca3af;font-size:11px;margin-top:24px">Recomendamos alterar sua senha no primeiro acesso em Configurações → Alterar Senha.</p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0">
          <p style="color:#d1d5db;font-size:10px;margin:0">© ${new Date().getFullYear()} Avantere · suporte@avantere.com.br</p>
        </div>
      </div>
    `,
  })
}
