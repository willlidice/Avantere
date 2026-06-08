import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { userId: parseInt(session.user.id) },
    create: {
      userId: parseInt(session.user.id),
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    update: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  await prisma.pushSubscription.deleteMany({
    where: { userId: parseInt(session.user.id) },
  })

  return NextResponse.json({ ok: true })
}
