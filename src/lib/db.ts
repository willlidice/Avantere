// ============================================
// 🗄️ AVANTERE - CLIENTE PRISMA (BANCO DE DADOS)
// ============================================

import { PrismaClient } from "@prisma/client";

// Declaração global para evitar múltiplas instâncias em desenvolvimento
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

// Função para criar o cliente Prisma
function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Em produção, cria uma nova instância
// Em desenvolvimento, reutiliza a instância existente (evita hot-reload issues)
export const db = globalThis.cachedPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.cachedPrisma = db;
}

// Alias para compatibilidade
export const prisma = db;
