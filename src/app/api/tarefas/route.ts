import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const userId = parseInt(session.user.id)
  const isAdmin = session.user.perfil === "ADMIN"

  const obras = isAdmin
    ? await prisma.obra.findMany({ where: { ativa: true }, orderBy: { nome: "asc" } })
    : await prisma.obra.findMany({
        where: { ativa: true, usuarios: { some: { userId } } },
        orderBy: { nome: "asc" },
      })

  const resultado = []

  for (const obra of obras) {
    const cronograma = await prisma.cronograma.findFirst({
      where: { obraId: obra.id },
      orderBy: { versao: "desc" },
      include: {
        tarefas: {
          orderBy: { ordem: "asc" },
          include: { imagens: { orderBy: { ordem: "asc" } } },
        },
      },
    })

    if (!cronograma) continue

    resultado.push({
      obraId: obra.id,
      obraNome: obra.nome,
      versao: cronograma.versao,
      cronogramaId: cronograma.id,
      tarefas: cronograma.tarefas,
    })
  }

  return NextResponse.json({ obras: resultado })
}
