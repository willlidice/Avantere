-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('TRIAL', 'PRO', 'ENTERPRISE');

-- AlterEnum
ALTER TYPE "Perfil" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "organizacaoId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "organizacaoId" INTEGER;

-- CreateTable
CREATE TABLE "Organizacao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plano" "Plano" NOT NULL DEFAULT 'TRIAL',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "trialFim" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convite" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organizacaoId" INTEGER NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'GESTAO',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizacao_slug_key" ON "Organizacao"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Convite_token_key" ON "Convite"("token");

-- CreateIndex
CREATE INDEX "Convite_token_idx" ON "Convite"("token");

-- CreateIndex
CREATE INDEX "Convite_organizacaoId_idx" ON "Convite"("organizacaoId");

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
