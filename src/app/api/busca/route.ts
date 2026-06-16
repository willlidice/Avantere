import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { filtroObrasVisiveis } from "@/lib/acesso-obra"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ tarefas: [] })

  const obraFilter = { cronograma: { obra: filtroObrasVisiveis(session) } }

  const tarefas = await prisma.tarefa.findMany({
    where: {
      ...obraFilter,
      OR: [
        { nome: { contains: q, mode: "insensitive" } },
        { nomeTraduzido: { contains: q, mode: "insensitive" } },
        { local: { contains: q, mode: "insensitive" } },
        { idExterno: { contains: q, mode: "insensitive" } },
        { responsavel: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      cronograma: {
        select: { versao: true, id: true, obraId: true, obra: { select: { nome: true } } },
      },
    },
    orderBy: [{ cronograma: { obraId: "asc" } }, { ordem: "asc" }],
    take: 200,
  })

  const resultado = tarefas.map((t) => ({
    id: t.id,
    idExterno: t.idExterno,
    nome: t.nome,
    nomeTraduzido: t.nomeTraduzido,
    local: t.local,
    responsavel: t.responsavel,
    statusManual: t.statusManual,
    inicio: t.inicio,
    fim: t.fim,
    obraId: t.cronograma.obraId,
    obraNome: t.cronograma.obra.nome,
    versao: t.cronograma.versao,
    cronogramaId: t.cronograma.id,
  }))

  return NextResponse.json({ tarefas: resultado })
}
