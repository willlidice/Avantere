import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Perfil } from "@prisma/client"

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
  return NextResponse.json(usuario, { status: 201 })
}
