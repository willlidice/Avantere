# ── 1. Source (git clone) ─────────────────────────────────────────────────────
FROM node:20-alpine AS source
WORKDIR /src
RUN apk add --no-cache git
# Atualizar o sufixo a cada deploy para forçar novo clone
RUN echo "bust-20260611-003" && \
    git clone --depth 1 --branch master https://github.com/willlidice/Avantere .

# ── 2. Dependências ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY --from=source /src/package.json /src/package-lock.json ./
RUN npm ci

# ── 3. Build ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps   /app/node_modules ./node_modules
COPY --from=source /src              .
RUN npx prisma generate && npm run build

# ── 4. Runner (imagem final mínima) ───────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid  1001 nextjs

# Aplicação Next.js standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder                        /app/public           ./public

# Prisma: schema + migrations + cliente gerado
COPY --from=builder --chown=nextjs:nodejs /app/prisma               ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules/prisma  ./node_modules/prisma
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Entrypoint: roda migrate deploy antes de iniciar (idempotente)
RUN echo '#!/bin/sh'                                                     >  /app/entrypoint.sh && \
    echo 'set -e'                                                        >> /app/entrypoint.sh && \
    echo 'node /app/node_modules/prisma/build/index.js migrate deploy'  >> /app/entrypoint.sh && \
    echo 'exec node /app/server.js'                                      >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
