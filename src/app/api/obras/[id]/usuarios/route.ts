import { NextRequest, NextResponse } from "next/server"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { temAcessoObra } from "@/lib/acesso-obra"

async function podeGerenciar(session: Session | null, obraId: number) {
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil)) return false
  return temAcessoObra(session, obraId)
}

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await podeGerenciar(session, obraId)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const obraUsers = await prisma.obraUser.findMany({
    where: { obraId },
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
  const obraId = parseInt(params.id)
  if (!(await podeGerenciar(session, obraId)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { userId } = await req.json()
  const obraUser = await prisma.obraUser.create({
    data: { obraId, userId },
  })
  return NextResponse.json(obraUser, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await podeGerenciar(session, obraId)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { userId } = await req.json()
  await prisma.obraUser.delete({
    where: { userId_obraId: { userId, obraId } },
  })
  return NextResponse.json({ ok: true })
}
