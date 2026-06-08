-- CreateEnum
CREATE TYPE "TipoAditivo" AS ENUM ('PRAZO', 'VALOR');

-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "cliente" TEXT,
ADD COLUMN     "cnoObra" TEXT,
ADD COLUMN     "cnpjCliente" TEXT,
ADD COLUMN     "cnpjObra" TEXT,
ADD COLUMN     "dataFim" TIMESTAMP(3),
ADD COLUMN     "dataInicio" TIMESTAMP(3),
ADD COLUMN     "escopo" TEXT,
ADD COLUMN     "valorContrato" DECIMAL(15,2);

-- CreateTable
CREATE TABLE "Aditivo" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "tipo" "TipoAditivo" NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL(15,2),
    "dataFim" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aditivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT,
    "tamanho" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarefaRelacao" (
    "id" SERIAL NOT NULL,
    "antecessoraId" INTEGER NOT NULL,
    "sucessoraId" INTEGER NOT NULL,

    CONSTRAINT "TarefaRelacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aditivo_obraId_idx" ON "Aditivo"("obraId");

-- CreateIndex
CREATE INDEX "Documento_obraId_idx" ON "Documento"("obraId");

-- CreateIndex
CREATE INDEX "TarefaRelacao_antecessoraId_idx" ON "TarefaRelacao"("antecessoraId");

-- CreateIndex
CREATE INDEX "TarefaRelacao_sucessoraId_idx" ON "TarefaRelacao"("sucessoraId");

-- CreateIndex
CREATE UNIQUE INDEX "TarefaRelacao_antecessoraId_sucessoraId_key" ON "TarefaRelacao"("antecessoraId", "sucessoraId");

-- CreateIndex
CREATE INDEX "Tarefa_cronogramaId_idx" ON "Tarefa"("cronogramaId");

-- AddForeignKey
ALTER TABLE "Aditivo" ADD CONSTRAINT "Aditivo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaRelacao" ADD CONSTRAINT "TarefaRelacao_antecessoraId_fkey" FOREIGN KEY ("antecessoraId") REFERENCES "Tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaRelacao" ADD CONSTRAINT "TarefaRelacao_sucessoraId_fkey" FOREIGN KEY ("sucessoraId") REFERENCES "Tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
