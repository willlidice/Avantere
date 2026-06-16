import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { filtroObrasVisiveis } from "@/lib/acesso-obra"

const LIMITE_OBRAS_TRIAL = 3

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil)

  // ADMIN/SUPER_ADMIN também administram obras inativas; GESTAO/PRODUCAO só veem ativas (comportamento já existente).
  const obras = await prisma.obra.findMany({
    where: filtroObrasVisiveis(session, { apenasAtivas: !isAdmin }),
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

  // ADMIN precisa de vínculo ObraUser para acessar obras (igual GESTAO).
  // SUPER_ADMIN não precisa — já tem acesso irrestrito.
  if (session.user.perfil === "ADMIN") {
    await prisma.obraUser.create({
      data: { obraId: obra.id, userId: parseInt(session.user.id) },
    })
  }

  return NextResponse.json(obra, { status: 201 })
}
