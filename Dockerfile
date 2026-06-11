# ── 1. Dependências ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 2. Build ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── 3. Runner (imagem final mínima) ───────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# App Next.js standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma: schema + migrations (necessários para migrate deploy) + cliente gerado
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps    /app/node_modules/prisma  ./node_modules/prisma
COPY --from=deps    /app/node_modules/@prisma ./node_modules/@prisma

# Entrypoint: roda migrations antes de iniciar o servidor
RUN printf '#!/bin/sh\nset -e\necho "[avantere] prisma migrate deploy..."\nnode /app/node_modules/prisma/build/index.js migrate deploy\necho "[avantere] iniciando servidor..."\nexec node /app/server.js\n' \
    > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
