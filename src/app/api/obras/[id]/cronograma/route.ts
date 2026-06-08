import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

const COLUNAS = ["ID", "TAREFA", "LOCAL", "QUANTIDADE", "UNIDADE", "DATA INICIO", "DATA FIM"]

function toDate(val: unknown): Date {
  if (val instanceof Date) return val
  if (typeof val === "number") return new Date(Math.round((val - 25569) * 86400 * 1000))
  return new Date(String(val))
}

async function verificarAcesso(userId: number, obraId: number, perfil: string) {
  if (perfil === "GESTAO") {
    const vinculo = await prisma.obraUser.findUnique({
      where: { userId_obraId: { userId, obraId } },
    })
    return !!vinculo
  }
  return perfil === "ADMIN"
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const obraId = parseInt(params.id)
  const temAcesso = await verificarAcesso(parseInt(session.user.id), obraId, session.user.perfil)
  if (!temAcesso) return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const cronogramas = await prisma.cronograma.findMany({
    where: { obraId },
    orderBy: { versao: "desc" },
    include: { _count: { select: { tarefas: true } } },
  })

  return NextResponse.json(cronogramas)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  if (session.user.perfil === "PRODUCAO")
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const obraId = parseInt(params.id)
  const temAcesso = await verificarAcesso(parseInt(session.user.id), obraId, session.user.perfil)
  if (!temAcesso) return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const formData = await req.formData()
  const arquivo = formData.get("arquivo") as File | null

  if (!arquivo) return NextResponse.json({ erro: "Arquivo não enviado" }, { status: 400 })
  if (!arquivo.name.endsWith(".xlsx"))
    return NextResponse.json({ erro: "Apenas arquivos .xlsx são aceitos" }, { status: 400 })

  const MAX_XLSX_BYTES = 5 * 1024 * 1024 // 5 MB
  if (arquivo.size > MAX_XLSX_BYTES)
    return NextResponse.json({ erro: "Arquivo excede o limite de 5 MB" }, { status: 413 })

  const buffer = Buffer.from(await arquivo.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: true })

  if (rows.length === 0)
    return NextResponse.json({ erro: "Planilha vazia" }, { status: 400 })

  const normalizarHeader = (h: string) =>
    h.trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

  const headers = Object.keys(rows[0]).map(normalizarHeader)
  const faltando = COLUNAS.filter((c) => !headers.includes(c))
  if (faltando.length > 0)
    return NextResponse.json(
      { erro: `Colunas obrigatórias faltando: ${faltando.join(", ")}` },
      { status: 400 }
    )

  // Normaliza headers para mapear exato
  const headerMap: Record<string, string> = {}
  Object.keys(rows[0]).forEach((h) => {
    headerMap[normalizarHeader(h)] = h
  })

  const ultima = await prisma.cronograma.findFirst({
    where: { obraId },
    orderBy: { versao: "desc" },
  })
  const novaVersao = (ultima?.versao ?? 0) + 1

  const tarefas = rows.map((row, index) => ({
    idExterno: String(row[headerMap["ID"]] ?? ""),
    nome: String(row[headerMap["TAREFA"]] ?? ""),
    local: String(row[headerMap["LOCAL"]] ?? ""),
    quantidade: parseFloat(String(row[headerMap["QUANTIDADE"]] ?? "0")) || 0,
    unidade: String(row[headerMap["UNIDADE"]] ?? ""),
    inicio: toDate(row[headerMap["DATA INICIO"]]),
    fim: toDate(row[headerMap["DATA FIM"]]),
    ordem: index + 1,
  }))

  const cronograma = await prisma.cronograma.create({
    data: {
      obraId,
      versao: novaVersao,
      tarefas: { create: tarefas },
    },
    include: {
      tarefas: { orderBy: { ordem: "asc" } },
      _count: { select: { tarefas: true } },
    },
  })

  return NextResponse.json(cronograma, { status: 201 })
}
