import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { checkRateLimit } from "@/lib/rate-limit"

// Trial de 14 dias a partir do cadastro
const DIAS_TRIAL = 14

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

export async function POST(req: NextRequest) {
  // 5 cadastros por hora por IP — bloqueia automação de criação de orgs
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  const { permitido, tentarNovamenteEm } = checkRateLimit(`registro:${ip}`, 5, 60 * 60 * 1000)
  if (!permitido) {
    return NextResponse.json(
      { erro: `Muitas tentativas de cadastro. Aguarde ${tentarNovamenteEm} segundo(s).` },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 })

  const { nomeEmpresa, nomeUsuario, email, senha } = body

  if (!nomeEmpresa?.trim() || !nomeUsuario?.trim() || !email?.trim() || !senha)
    return NextResponse.json({ erro: "Todos os campos são obrigatórios" }, { status: 400 })

  if (senha.length < 8)
    return NextResponse.json({ erro: "Senha deve ter pelo menos 8 caracteres" }, { status: 400 })

  const emailNorm = email.trim().toLowerCase()
  const existe = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (existe) return NextResponse.json({ erro: "Email já cadastrado" }, { status: 400 })

  // Gerar slug único para a organização
  const baseSlug = gerarSlug(nomeEmpresa.trim())
  let slug = baseSlug
  let tentativa = 1
  while (await prisma.organizacao.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${tentativa++}`
  }

  const trialFim = new Date()
  trialFim.setDate(trialFim.getDate() + DIAS_TRIAL)

  const senhaHash = await bcrypt.hash(senha, 10)

  // Cria org e admin em transação atômica
  const { usuario } = await prisma.$transaction(async (tx) => {
    const org = await tx.organizacao.create({
      data: {
        nome: nomeEmpresa.trim(),
        slug,
        plano: "TRIAL",
        trialFim,
      },
    })

    const usuario = await tx.user.create({
      data: {
        nome: nomeUsuario.trim(),
        email: emailNorm,
        senha: senhaHash,
        perfil: "ADMIN",
        organizacaoId: org.id,
        onboardingStep: 0,
      },
      select: { id: true, nome: true, email: true, perfil: true },
    })

    return { org, usuario }
  })

  return NextResponse.json(
    { mensagem: "Conta criada com sucesso. Faça login para continuar.", usuario },
    { status: 201 }
  )
}
