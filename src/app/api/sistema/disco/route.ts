import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { statfsSync } from "fs"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { authOptions } from "@/lib/auth"
import { r2 } from "@/lib/r2"

interface CacheR2 {
  usadoBytes: number
  totalObjetos: number
  calculadoEm: number
}

let cacheR2: CacheR2 | null = null
const TTL_CACHE_MS = 5 * 60 * 1000

async function calcularUsoR2(): Promise<{ usadoBytes: number; totalObjetos: number }> {
  let usadoBytes = 0
  let totalObjetos = 0
  let continuationToken: string | undefined

  do {
    const resp = await r2.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME!,
        ContinuationToken: continuationToken,
      }),
    )
    for (const obj of resp.Contents ?? []) {
      usadoBytes += obj.Size ?? 0
      totalObjetos += 1
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined
  } while (continuationToken)

  return { usadoBytes, totalObjetos }
}

async function obterUsoR2Cacheado() {
  const agora = Date.now()
  if (cacheR2 && agora - cacheR2.calculadoEm < TTL_CACHE_MS) return cacheR2
  const resultado = await calcularUsoR2()
  cacheR2 = { ...resultado, calculadoEm: agora }
  return cacheR2
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "SUPER_ADMIN")
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 })

  // Container Alpine sem volume nomeado dedicado: o overlay do Docker aponta
  // pro disco real do host (Easypanel/Swarm), então isto reflete o disco
  // TOTAL do VPS, compartilhado entre todos os apps hospedados ali.
  let vps: { usadoBytes: number; totalBytes: number; pct: number } | null = null
  let erroVps: string | null = null
  try {
    const stats = statfsSync("/app")
    const totalBytes = stats.bsize * stats.blocks
    const usadoBytes = totalBytes - stats.bsize * stats.bfree
    vps = { usadoBytes, totalBytes, pct: totalBytes > 0 ? Math.round((usadoBytes / totalBytes) * 100) : 0 }
  } catch {
    erroVps = "Não foi possível ler o uso de disco do servidor"
  }

  let r2Dados: { usadoBytes: number; totalObjetos: number } | null = null
  let erroR2: string | null = null
  try {
    r2Dados = await obterUsoR2Cacheado()
  } catch {
    erroR2 = "Não foi possível consultar o uso do bucket R2"
  }

  return NextResponse.json({ vps, erroVps, r2: r2Dados, erroR2 })
}
