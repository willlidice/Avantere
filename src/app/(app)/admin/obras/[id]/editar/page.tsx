import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { temAcessoObra } from "@/lib/acesso-obra"
import { EditarObraForm } from "./editar-obra-form"

export default async function EditarObraPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil)) redirect("/obras")

  const obraId = parseInt(params.id)
  if (!(await temAcessoObra(session, obraId))) redirect("/obras")

  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      aditivos: { orderBy: { criadoEm: "asc" } },
      documentos: { orderBy: { criadoEm: "desc" } },
    },
  })
  if (!obra) notFound()

  const vinculados = await prisma.obraUser.findMany({
    where: { obraId },
    include: { user: { select: { id: true, nome: true, email: true, perfil: true } } },
  })

  const todosUsuarios = await prisma.user.findMany({
    where: { ativo: true, organizacaoId: obra.organizacaoId },
    select: { id: true, nome: true, email: true, perfil: true },
    orderBy: { nome: "asc" },
  })

  const vinculadosIds = new Set(vinculados.map((v) => v.userId))
  const disponiveis = todosUsuarios.filter((u) => !vinculadosIds.has(u.id))

  const obraSerializada = {
    ...obra,
    criadoEm: obra.criadoEm.toISOString(),
    dataInicio: obra.dataInicio?.toISOString() ?? null,
    dataFim: obra.dataFim?.toISOString() ?? null,
    valorContrato: obra.valorContrato ? Number(obra.valorContrato) : null,
    aditivos: obra.aditivos.map((a) => ({
      ...a,
      criadoEm: a.criadoEm.toISOString(),
      dataFim: a.dataFim?.toISOString() ?? null,
      valor: a.valor ? Number(a.valor) : null,
    })),
    documentos: obra.documentos.map((d) => ({
      ...d,
      criadoEm: d.criadoEm.toISOString(),
    })),
  }

  return (
    <EditarObraForm
      obra={obraSerializada}
      vinculados={vinculados.map((v) => v.user)}
      disponiveis={disponiveis}
    />
  )
}
