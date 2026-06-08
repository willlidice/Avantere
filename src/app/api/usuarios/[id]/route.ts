import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Perfil } from "@prisma/client"

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const userId = parseInt(params.id)
  const orgId = session.user.organizacaoId

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, organizacaoId: true },
  })
  if (!usuario) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

  // ADMIN só acessa usuários da própria org
  if (session.user.perfil === "ADMIN" && orgId && usuario.organizacaoId !== orgId)
    return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

  return NextResponse.json(usuario)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const userId = parseInt(params.id)
  const orgId = session.user.organizacaoId

  // ADMIN verifica se usuário pertence à mesma org
  if (session.user.perfil === "ADMIN" && orgId) {
    const existente = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizacaoId: true },
    })
    if (!existente || existente.organizacaoId !== orgId)
      return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.nome !== undefined) data.nome = body.nome.trim()
  if (body.email !== undefined) data.email = body.email.trim().toLowerCase()
  if (body.perfil !== undefined) data.perfil = body.perfil as Perfil
  if (body.ativo !== undefined) data.ativo = body.ativo
  if (body.senha) data.senha = await bcrypt.hash(body.senha, 10)

  const usuario = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  })
  return NextResponse.json(usuario)
}
