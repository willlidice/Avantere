import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deletarDoR2 } from "@/lib/r2"
import { temAcessoObra } from "@/lib/acesso-obra"

type Params = { params: { id: string; versao: string; tarefaId: string; imagemId: string } }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO")
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  const tarefaId = parseInt(params.tarefaId)
  const imagemId = parseInt(params.imagemId)

  if (isNaN(obraId) || isNaN(versao) || isNaN(tarefaId) || isNaN(imagemId)) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })
  }

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Sem acesso à obra" }, { status: 403 })

  const imagem = await prisma.tarefaImagem.findFirst({
    where: {
      id: imagemId,
      tarefaId,
      tarefa: { cronograma: { obraId, versao } },
    },
    include: { tarefa: { select: { jpgEditadoUrl: true } } },
  })
  if (!imagem) return NextResponse.json({ erro: "Imagem não encontrada" }, { status: 404 })

  try {
    const chave = imagem.url.split("/").slice(3).join("/")
    await deletarDoR2(chave)
  } catch {
    // ignora falha no R2, remove do banco de qualquer forma
  }

  await prisma.tarefaImagem.delete({ where: { id: imagemId } })

  let novoJpgEditadoUrl: string | null = imagem.tarefa.jpgEditadoUrl
  if (imagem.tarefa.jpgEditadoUrl === imagem.url) {
    const ultima = await prisma.tarefaImagem.findFirst({
      where: { tarefaId, nome: { startsWith: "editor-" } },
      orderBy: { ordem: "desc" },
    })
    novoJpgEditadoUrl = ultima?.url ?? null
    await prisma.tarefa.update({
      where: { id: tarefaId },
      data: { jpgEditadoUrl: novoJpgEditadoUrl },
    })
  }

  return NextResponse.json({ ok: true, jpgEditadoUrl: novoJpgEditadoUrl })
}
