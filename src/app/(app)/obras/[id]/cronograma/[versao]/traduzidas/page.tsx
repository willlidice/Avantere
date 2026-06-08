import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { TraduzidasView } from "./traduzidas-view"

export default async function TraduzidasPage({
  params,
}: {
  params: { id: string; versao: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.perfil === "PRODUCAO") redirect("/tarefas")

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  if (isNaN(obraId) || isNaN(versao)) notFound()

  const obra = await prisma.obra.findUnique({ where: { id: obraId } })
  if (!obra) notFound()

  if (session.user.perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findUnique({
      where: { userId_obraId: { userId: parseInt(session.user.id), obraId } },
    })
    if (!vinculo) redirect("/obras")
  }

  const cronograma = await prisma.cronograma.findUnique({
    where: { obraId_versao: { obraId, versao } },
    include: {
      tarefas: {
        orderBy: { ordem: "asc" },
      },
    },
  })
  if (!cronograma) notFound()

  const usuario = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { idioma: true },
  })

  const tarefasSerializadas = cronograma.tarefas.map((t) => ({
    ...t,
    inicio: t.inicio.toISOString(),
    fim: t.fim.toISOString(),
  }))

  return (
    <TraduzidasView
      obraId={obraId}
      nomeObra={obra.nome}
      versao={versao}
      tarefasIniciais={tarefasSerializadas}
      podeEditar={session.user.perfil === "ADMIN" || session.user.perfil === "GESTAO"}
      idioma={usuario?.idioma ?? "pt"}
    />
  )
}
