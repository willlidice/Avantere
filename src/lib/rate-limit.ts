// Rate limiter em memória com janela fixa.
// Funciona em instância única (Next.js dev e single-server).
// Para produção multi-instância: substituir por @upstash/ratelimit + Redis.

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore: Map<string, { count: number; resetAt: number }>
}

const store: Map<string, { count: number; resetAt: number }> =
  globalForRateLimit.rateLimitStore ??
  (globalForRateLimit.rateLimitStore = new Map())

export function checkRateLimit(
  key: string,
  limite: number,
  janelaMseg: number
): { permitido: boolean; tentarNovamenteEm: number } {
  const agora = Date.now()
  const entrada = store.get(key)

  if (!entrada || agora >= entrada.resetAt) {
    store.set(key, { count: 1, resetAt: agora + janelaMseg })
    return { permitido: true, tentarNovamenteEm: 0 }
  }

  if (entrada.count >= limite) {
    return {
      permitido: false,
      tentarNovamenteEm: Math.ceil((entrada.resetAt - agora) / 1000),
    }
  }

  entrada.count++
  return { permitido: true, tentarNovamenteEm: 0 }
}
