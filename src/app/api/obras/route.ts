import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const LIMITE_OBRAS_TRIAL = 3

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const orgId = session.user.organizacaoId
  const isAdmin = session.user.perfil === "ADMIN" || session.user.perfil === "SUPER_ADMIN"
  const isSuperAdmin = session.user.perfil === "SUPER_ADMIN"

  // SUPER_ADMIN vê tudo; ADMIN vê apenas da própria org
  const obras = isAdmin && !isSuperAdmin
    ? await prisma.obra.findMany({
        where: { organizacaoId: orgId ?? undefined },
        orderBy: { criadoEm: "desc" },
      })
    : isSuperAdmin
    ? await prisma.obra.findMany({ orderBy: { criadoEm: "desc" } })
    : await prisma.obra.findMany({
        where: {
          ativa: true,
          organizacaoId: orgId ?? undefined,
          usuarios: { some: { userId: parseInt(session.user.id) } },
        },
        orderBy: { criadoEm: "desc" },
      })

  return NextResponse.json(obras)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  // Enforça limite de obras no plano TRIAL
  const orgId = session.user.organizacaoId
  if (orgId && session.user.plano === "TRIAL") {
    const total = await prisma.obra.count({ where: { organizacaoId: orgId } })
    if (total >= LIMITE_OBRAS_TRIAL) {
      return NextResponse.json(
        {
          erro: `Plano Trial permite até ${LIMITE_OBRAS_TRIAL} obras. Faça upgrade para o plano Pro para criar obras ilimitadas.`,
          limiteTrial: true,
        },
        { status: 403 }
      )
    }
  }

  const { nome } = await req.json()
  if (!nome?.trim())
    return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 })

  const obra = await prisma.obra.create({
    data: {
      nome: nome.trim(),
      organizacaoId: orgId ?? null,
    },
  })
  return NextResponse.json(obra, { status: 201 })
}
