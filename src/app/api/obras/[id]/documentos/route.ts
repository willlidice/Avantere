import { NextRequest, NextResponse } from "next/server"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadArquivoParaR2, deletarDoR2 } from "@/lib/r2"
import { temAcessoObra } from "@/lib/acesso-obra"

const TIPOS_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]
const TAMANHO_MAX = 20 * 1024 * 1024 // 20 MB

async function verificarAcesso(obraId: number, session: Session | null) {
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "GESTAO"].includes(session.user.perfil))
    return false
  return temAcessoObra(session, obraId)
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await verificarAcesso(obraId, session)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const documentos = await prisma.documento.findMany({ where: { obraId }, orderBy: { criadoEm: "desc" } })
  return NextResponse.json(documentos)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await verificarAcesso(obraId, session)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const formData = await req.formData()
  const arquivo = formData.get("arquivo") as File | null
  if (!arquivo) return NextResponse.json({ erro: "Arquivo não enviado" }, { status: 400 })
  if (!TIPOS_PERMITIDOS.includes(arquivo.type))
    return NextResponse.json({ erro: "Tipo de arquivo não permitido" }, { status: 400 })
  if (arquivo.size > TAMANHO_MAX)
    return NextResponse.json({ erro: "Arquivo muito grande (máx 20 MB)" }, { status: 400 })

  const buffer = Buffer.from(await arquivo.arrayBuffer())
  const chave = `documentos/obra-${obraId}/${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const url = await uploadArquivoParaR2(chave, buffer, arquivo.type)

  const documento = await prisma.documento.create({
    data: { obraId, nome: arquivo.name, url, tipo: arquivo.type, tamanho: arquivo.size },
  })
  return NextResponse.json(documento, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const obraId = parseInt(params.id)
  if (!(await verificarAcesso(obraId, session)))
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const { documentoId } = await req.json()
  const doc = await prisma.documento.findFirst({ where: { id: Number(documentoId), obraId } })
  if (!doc) return NextResponse.json({ erro: "Documento não encontrado" }, { status: 404 })

  const chave = doc.url.replace(`${process.env.R2_PUBLIC_URL}/`, "")
  await deletarDoR2(chave).catch(() => {})
  await prisma.documento.delete({ where: { id: doc.id } })
  return NextResponse.json({ ok: true })
}
