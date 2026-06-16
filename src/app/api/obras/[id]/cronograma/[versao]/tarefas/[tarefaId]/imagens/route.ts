import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadJpgParaR2 } from "@/lib/r2"
import { temAcessoObra } from "@/lib/acesso-obra"

type Params = { params: { id: string; versao: string; tarefaId: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  const tarefaId = parseInt(params.tarefaId)

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const imagens = await prisma.tarefaImagem.findMany({
    where: { tarefaId },
    orderBy: { ordem: "asc" },
  })

  return NextResponse.json({ imagens })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  const tarefaId = parseInt(params.tarefaId)

  if (isNaN(obraId) || isNaN(versao) || isNaN(tarefaId)) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })
  }

  if (!(await temAcessoObra(session, obraId)))
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })

  const tarefa = await prisma.tarefa.findFirst({
    where: { id: tarefaId, cronograma: { obraId, versao } },
  })
  if (!tarefa) return NextResponse.json({ erro: "Tarefa não encontrada" }, { status: 404 })

  const formData = await req.formData()
  const arquivo = formData.get("imagem") as File | null
  const nome = (formData.get("nome") as string) ?? ""

  if (!arquivo) return NextResponse.json({ erro: "Arquivo não enviado" }, { status: 400 })

  const MAX_BYTES = 10 * 1024 * 1024
  if (arquivo.size > MAX_BYTES)
    return NextResponse.json({ erro: "Imagem excede o limite de 10 MB" }, { status: 413 })

  const bytes = await arquivo.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff)
    return NextResponse.json({ erro: "Arquivo deve ser uma imagem JPEG válida" }, { status: 400 })

  const ultima = await prisma.tarefaImagem.findFirst({
    where: { tarefaId },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  })
  const proxOrdem = (ultima?.ordem ?? -1) + 1

  const chave = `obras/${obraId}/cronograma/${versao}/tarefas/${tarefaId}/imagens/${Date.now()}.jpg`

  try {
    const url = await uploadJpgParaR2(chave, buffer)
    const imagem = await prisma.tarefaImagem.create({
      data: { tarefaId, url, nome, ordem: proxOrdem },
    })
    return NextResponse.json(imagem, { status: 201 })
  } catch {
    return NextResponse.json({ erro: "Falha no upload" }, { status: 500 })
  }
}
