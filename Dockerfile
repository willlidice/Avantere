FROM node:20-alpine AS source
WORKDIR /src
RUN apk add --no-cache git
RUN echo "bust-20260611-001" && git clone --depth 1 --branch master https://github.com/willlidice/Avantere .

FROM node:20-alpine AS deps
WORKDIR /app
COPY --from=source /src/package.json /src/package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=source /src .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
RUN printf '#!/bin/sh\nset -e\necho "[avantere] prisma migrate deploy..."\nnode /app/node_modules/prisma/build/index.js migrate deploy\necho "[avantere] iniciando..."\nexec node /app/server.js\n' \
    > /app/entrypoint.sh && chmod +x /app/entrypoint.sh
USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
