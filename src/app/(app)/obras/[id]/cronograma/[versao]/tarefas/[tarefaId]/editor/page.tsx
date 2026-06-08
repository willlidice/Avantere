import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { EditorJpg } from "@/components/editor-jpg"

type Params = { params: { id: string; versao: string; tarefaId: string } }

export default async function EditorPage({ params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  // PRODUCAO não acessa editor (middleware já bloqueia, mas dupla verificação)
  if (session.user.perfil === "PRODUCAO") redirect("/tarefas")

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  const tarefaId = parseInt(params.tarefaId)
  if (isNaN(obraId) || isNaN(versao) || isNaN(tarefaId)) notFound()

  // GESTAO: verificar vínculo
  if (session.user.perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findFirst({
      where: { obraId, userId: parseInt(session.user.id) },
    })
    if (!vinculo) redirect("/obras")
  }

  const tarefa = await prisma.tarefa.findFirst({
    where: { id: tarefaId, cronograma: { obraId, versao } },
  })
  if (!tarefa) notFound()

  const obra = await prisma.obra.findUnique({ where: { id: obraId } })
  if (!obra) notFound()

  return (
    <div className="max-w-[1100px] mx-auto space-y-4">
      <div>
        <Link
          href={`/obras/${obraId}/cronograma`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao cronograma
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Editor de Imagem</h1>
        <p className="text-sm text-gray-500">
          {obra.nome} · v{versao} · {tarefa.nome}
        </p>
      </div>

      {/* Editor só funciona no desktop/tablet */}
      <div className="hidden md:block">
        <EditorJpg
          obraId={obraId}
          versao={versao}
          tarefaId={tarefaId}
          nomeTarefa={tarefa.nome}
          jpgEditadoUrl={tarefa.jpgEditadoUrl}
        />
      </div>

      {/* Mobile: aviso */}
      <div className="md:hidden flex flex-col items-center justify-center py-16 text-gray-400 text-center gap-3">
        <p className="text-sm">O editor está disponível apenas em desktop ou tablet.</p>
        {tarefa.jpgEditadoUrl && (
          <img
            src={tarefa.jpgEditadoUrl}
            alt="JPG editado"
            className="max-w-full rounded border mt-4"
          />
        )}
      </div>
    </div>
  )
}
