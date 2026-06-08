import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "ADMIN")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const obraUsers = await prisma.obraUser.findMany({
    where: { obraId: parseInt(params.id) },
    include: {
      user: { select: { id: true, nome: true, email: true, perfil: true } },
    },
  })
  return NextResponse.json(obraUsers.map((ou) => ou.user))
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "ADMIN")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { userId } = await req.json()
  const obraUser = await prisma.obraUser.create({
    data: { obraId: parseInt(params.id), userId },
  })
  return NextResponse.json(obraUser, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "ADMIN")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { userId } = await req.json()
  await prisma.obraUser.delete({
    where: { userId_obraId: { userId, obraId: parseInt(params.id) } },
  })
  return NextResponse.json({ ok: true })
}
