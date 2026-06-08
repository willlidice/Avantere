import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const usuario = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { id: true, nome: true, email: true, perfil: true, idioma: true, notifEmail: true, notifDias: true },
  })

  return NextResponse.json(usuario)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const userId = parseInt(session.user.id)

  if (body.tipo === "senha") {
    const { senhaAtual, novaSenha } = body

    if (!senhaAtual || !novaSenha)
      return NextResponse.json({ erro: "Campos obrigatórios ausentes" }, { status: 400 })

    if (novaSenha.length < 8)
      return NextResponse.json({ erro: "Nova senha deve ter pelo menos 8 caracteres" }, { status: 400 })

    const usuario = await prisma.user.findUnique({ where: { id: userId } })
    if (!usuario) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 })

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha)
    if (!senhaValida)
      return NextResponse.json({ erro: "Senha atual incorreta" }, { status: 400 })

    const hash = await bcrypt.hash(novaSenha, 10)
    await prisma.user.update({ where: { id: userId }, data: { senha: hash } })

    return NextResponse.json({ ok: true })
  }

  if (body.tipo === "idioma") {
    const idiomasValidos = ["pt", "en", "es"]
    if (!idiomasValidos.includes(body.idioma))
      return NextResponse.json({ erro: "Idioma inválido" }, { status: 400 })

    await prisma.user.update({ where: { id: userId }, data: { idioma: body.idioma } })
    return NextResponse.json({ ok: true })
  }

  if (body.tipo === "notificacoes") {
    const { notifEmail, notifDias } = body
    const data: Record<string, unknown> = {}
    if (typeof notifEmail === "boolean") data.notifEmail = notifEmail
    if (typeof notifDias === "number" && notifDias >= 1 && notifDias <= 90) data.notifDias = notifDias
    if (Object.keys(data).length === 0)
      return NextResponse.json({ erro: "Nenhum campo válido" }, { status: 400 })
    await prisma.user.update({ where: { id: userId }, data })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ erro: "Tipo de operação inválido" }, { status: 400 })
}
