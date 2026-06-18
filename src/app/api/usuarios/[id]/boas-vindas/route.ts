import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import crypto from "crypto"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { enviarEmailBoasVindas } from "@/lib/email"

function gerarSenhaTemporaria() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  const bytes = crypto.randomBytes(12)
  let senha = ""
  for (let i = 0; i < bytes.length; i++) senha += alfabeto[bytes[i] % alfabeto.length]
  return senha
}

export async function POST(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "SUPER_ADMIN")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const userId = parseInt(params.id)

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nome: true, email: true, perfil: true },
  })
  if (!usuario) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 })

  const senhaTemp = gerarSenhaTemporaria()
  const senhaHash = await bcrypt.hash(senhaTemp, 10)

  try {
    await enviarEmailBoasVindas({
      nome: usuario.nome,
      email: usuario.email,
      senha: senhaTemp,
      perfil: usuario.perfil,
    })
  } catch {
    return NextResponse.json({ erro: "Falha ao enviar e-mail. Senha não foi alterada." }, { status: 502 })
  }

  await prisma.user.update({ where: { id: userId }, data: { senha: senhaHash } })

  return NextResponse.json({ ok: true })
}
