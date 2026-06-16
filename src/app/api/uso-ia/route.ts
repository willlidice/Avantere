import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "SUPER_ADMIN")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  const totalTraduzidas = await prisma.tarefa.count({
    where: { nomeTraduzido: { not: null } },
  })

  const totalTarefas = await prisma.tarefa.count()

  let saldoCredito: string | null = null
  let gastoMes: string | null = null
  let erroAnthropic: string | null = null

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      const res = await fetch("https://api.anthropic.com/v1/organizations/usage", {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = await res.json()
        saldoCredito = data.credit_balance ?? null
        gastoMes = data.monthly_spend ?? null
      } else {
        erroAnthropic = "API não disponível"
      }
    }
  } catch {
    erroAnthropic = "Não foi possível consultar a API Anthropic"
  }

  return NextResponse.json({
    totalTraduzidas,
    totalTarefas,
    saldoCredito,
    gastoMes,
    erroAnthropic,
    linkDashboard: "https://console.anthropic.com",
  })
}
