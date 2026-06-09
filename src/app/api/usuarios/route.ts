import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Perfil } from "@prisma/client"
import { enviarEmail } from "@/lib/email"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const orgId = session.user.organizacaoId
  const isSuperAdmin = session.user.perfil === "SUPER_ADMIN"

  const usuarios = await prisma.user.findMany({
    where: isSuperAdmin ? {} : { organizacaoId: orgId ?? undefined },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true },
    orderBy: { criadoEm: "desc" },
  })
  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { nome, email, senha, perfil } = await req.json()

  if (!nome?.trim() || !email?.trim() || !senha || !perfil)
    return NextResponse.json({ erro: "Todos os campos são obrigatórios" }, { status: 400 })

  if (senha.length < 8)
    return NextResponse.json({ erro: "Senha deve ter pelo menos 8 caracteres" }, { status: 400 })

  const perfisValidos: Perfil[] = ["ADMIN", "GESTAO", "PRODUCAO"]
  if (!perfisValidos.includes(perfil))
    return NextResponse.json({ erro: "Perfil inválido" }, { status: 400 })

  const existe = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (existe) return NextResponse.json({ erro: "Email já cadastrado" }, { status: 400 })

  const orgId = session.user.organizacaoId
  const senhaHash = await bcrypt.hash(senha, 10)
  const usuario = await prisma.user.create({
    data: {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha: senhaHash,
      perfil: perfil as Perfil,
      organizacaoId: orgId ?? null,
    },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  })

  const appUrl = process.env.NEXTAUTH_URL ?? "https://app.avantere.com.br"
  const perfisLabel: Record<string, string> = { ADMIN: "Administrador", GESTAO: "Gestão", PRODUCAO: "Produção" }
  try {
    await enviarEmail({
      para: usuario.email,
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
            <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Olá, ${usuario.nome}!</h2>
            <p style="color:#6b7280;margin:0 0 24px;font-size:14px">Sua conta no Avantere foi criada. Abaixo estão suas credenciais de acesso:</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin-bottom:24px">
              <p style="margin:0 0 8px;font-size:13px"><strong style="color:#374151">E-mail:</strong> <span style="color:#1d4ed8">${usuario.email}</span></p>
              <p style="margin:0 0 8px;font-size:13px"><strong style="color:#374151">Senha:</strong> <span style="color:#374151">${senha}</span></p>
              <p style="margin:0;font-size:13px"><strong style="color:#374151">Perfil:</strong> ${perfisLabel[perfil] ?? perfil}</p>
            </div>
            <a href="${appUrl}/login" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:600;font-size:14px">Acessar o sistema</a>
            <p style="color:#9ca3af;font-size:11px;margin-top:24px">Recomendamos alterar sua senha no primeiro acesso em Configurações → Alterar Senha.</p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0">
            <p style="color:#d1d5db;font-size:10px;margin:0">© ${new Date().getFullYear()} Avantere · suporte@avantere.com.br</p>
          </div>
        </div>
      `,
    })
  } catch {
    // Email falhou mas usuário foi criado — não bloquear
  }

  return NextResponse.json(usuario, { status: 201 })
}
