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
  if (!session || session.user.perfil !== "SUPER_ADMIN")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const userId = parseInt(params.id)

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, organizacaoId: true },
  })
  if (!usuario) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

  return NextResponse.json(usuario)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "SUPER_ADMIN")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const userId = parseInt(params.id)

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
