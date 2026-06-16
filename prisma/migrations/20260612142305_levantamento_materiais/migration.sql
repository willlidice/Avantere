-- CreateEnum
CREATE TYPE "StatusLevantamento" AS ENUM ('AGUARDANDO', 'PROCESSANDO', 'CONCLUIDO', 'ERRO', 'APROVADO');

-- CreateTable
CREATE TABLE "LevantamentoJob" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "status" "StatusLevantamento" NOT NULL DEFAULT 'AGUARDANDO',
    "scoreGeral" DOUBLE PRECISION,
    "aprovadoPorId" INTEGER,
    "aprovadoEm" TIMESTAMP(3),
    "criadoPorId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,

    CONSTRAINT "LevantamentoJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArquivoLevantamento" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArquivoLevantamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemLevantamento" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION,
    "unidade" TEXT,
    "scoreConfianca" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "arquivoOrigem" TEXT,
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "editado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ItemLevantamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LevantamentoJob_obraId_idx" ON "LevantamentoJob"("obraId");

-- CreateIndex
CREATE INDEX "ArquivoLevantamento_jobId_idx" ON "ArquivoLevantamento"("jobId");

-- CreateIndex
CREATE INDEX "ItemLevantamento_jobId_idx" ON "ItemLevantamento"("jobId");

-- AddForeignKey
ALTER TABLE "LevantamentoJob" ADD CONSTRAINT "LevantamentoJob_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArquivoLevantamento" ADD CONSTRAINT "ArquivoLevantamento_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "LevantamentoJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemLevantamento" ADD CONSTRAINT "ItemLevantamento_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "LevantamentoJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
