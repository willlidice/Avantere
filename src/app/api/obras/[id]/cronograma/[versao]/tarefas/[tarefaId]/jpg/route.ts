import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadJpgParaR2 } from "@/lib/r2"

type Params = { params: { id: string; versao: string; tarefaId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO") {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 })
  }

  const obraId = parseInt(params.id)
  const versao = parseInt(params.versao)
  const tarefaId = parseInt(params.tarefaId)

  if (isNaN(obraId) || isNaN(versao) || isNaN(tarefaId)) {
    return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 })
  }

  // Verificar acesso à obra (ADMIN vê tudo, GESTAO só vinculadas)
  if (session.user.perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findFirst({
      where: { obraId, userId: parseInt(session.user.id) },
    })
    if (!vinculo) return NextResponse.json({ erro: "Sem acesso à obra" }, { status: 403 })
  }

  // Verificar tarefa pertence ao cronograma/versão corretos
  const tarefa = await prisma.tarefa.findFirst({
    where: {
      id: tarefaId,
      cronograma: { obraId, versao },
    },
  })
  if (!tarefa) return NextResponse.json({ erro: "Tarefa não encontrada" }, { status: 404 })

  const formData = await req.formData()
  const arquivo = formData.get("jpg") as File | null
  if (!arquivo) return NextResponse.json({ erro: "Arquivo JPG não enviado" }, { status: 400 })

  const MAX_JPG_BYTES = 25 * 1024 * 1024 // 25 MB (pixelRatio 3 gera arquivos maiores)
  if (arquivo.size > MAX_JPG_BYTES)
    return NextResponse.json({ erro: "Imagem excede o limite de 10 MB" }, { status: 413 })

  const bytes = await arquivo.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Valida magic bytes JPEG: FF D8 FF
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff)
    return NextResponse.json({ erro: "Arquivo deve ser uma imagem JPEG válida" }, { status: 400 })
  const timestamp = Date.now()
  const chave = `obras/${obraId}/cronograma/${versao}/tarefas/${tarefaId}/editor/${timestamp}.jpg`

  try {
    const url = await uploadJpgParaR2(chave, buffer)

    const ultima = await prisma.tarefaImagem.findFirst({
      where: { tarefaId },
      orderBy: { ordem: "desc" },
      select: { ordem: true },
    })
    const proxOrdem = (ultima?.ordem ?? -1) + 1

    const [novaImagem, atualizada] = await prisma.$transaction([
      prisma.tarefaImagem.create({
        data: { tarefaId, url, nome: `editor-${timestamp}.jpg`, ordem: proxOrdem },
      }),
      prisma.tarefa.update({
        where: { id: tarefaId },
        data: { jpgEditadoUrl: url },
      }),
    ])

    return NextResponse.json({ jpgEditadoUrl: atualizada.jpgEditadoUrl, imagem: novaImagem })
  } catch {
    return NextResponse.json({ erro: "Falha no upload" }, { status: 500 })
  }
}
