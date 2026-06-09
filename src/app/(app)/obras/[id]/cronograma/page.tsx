import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { CronogramaView } from "./cronograma-view"

export default async function CronogramaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const obraId = parseInt(params.id)
  if (isNaN(obraId)) notFound()

  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: { aditivos: { where: { tipo: "PRAZO" }, orderBy: { criadoEm: "desc" }, take: 1 } },
  })
  if (!obra) notFound()

  // Data fim efetiva: último aditivo de prazo ou dataFim da obra
  const dataFimEfetiva =
    (obra.aditivos[0]?.dataFim ?? obra.dataFim)?.toISOString() ?? null

  const usuario = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { idioma: true },
  })
  const idioma = usuario?.idioma ?? "pt"

  // GESTAO: verificar vínculo
  if (session.user.perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findUnique({
      where: { userId_obraId: { userId: parseInt(session.user.id), obraId } },
    })
    if (!vinculo) redirect("/obras")
  }

  const cronogramas = await prisma.cronograma.findMany({
    where: { obraId },
    orderBy: { versao: "desc" },
    include: { _count: { select: { tarefas: true } } },
  })

  const cronogramasSerializados = cronogramas.map((c) => ({
    ...c,
    criadoEm: c.criadoEm.toISOString(),
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tarefasIniciais: any[] = []
  let versaoInicial: number | null = null

  if (cronogramas.length > 0) {
    const ultimo = cronogramas[0]
    versaoInicial = ultimo.versao
    const detalhe = await prisma.cronograma.findUnique({
      where: { obraId_versao: { obraId, versao: ultimo.versao } },
      include: {
        tarefas: {
          orderBy: { ordem: "asc" },
          include: { imagens: { orderBy: { ordem: "asc" } } },
        },
      },
    })
    if (detalhe) {
      tarefasIniciais = detalhe.tarefas.map((t) => ({
        ...t,
        inicio: t.inicio.toISOString(),
        fim: t.fim.toISOString(),
      }))
    }
  }

  return (
    <CronogramaView
      obraId={obraId}
      nomeObra={obra.nome}
      perfil={session.user.perfil}
      idioma={idioma}
      cronogramas={cronogramasSerializados}
      tarefasIniciais={tarefasIniciais}
      versaoInicial={versaoInicial}
      dataFimObra={dataFimEfetiva}
      dadosObra={{
        cliente: obra.cliente,
        cnpjCliente: obra.cnpjCliente,
        cnpjObra: obra.cnpjObra,
        cnoObra: obra.cnoObra,
        dataInicio: obra.dataInicio?.toISOString() ?? null,
        dataFim: obra.dataFim?.toISOString() ?? null,
        escopo: obra.escopo,
        valorContrato: obra.valorContrato ? Number(obra.valorContrato) : null,
      }}
    />
  )
}
