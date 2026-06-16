-- AlterEnum
ALTER TYPE "StatusLevantamento" ADD VALUE 'AGUARDANDO_RESPOSTAS';

-- AlterTable
ALTER TABLE "LevantamentoJob" ADD COLUMN     "perguntas" JSONB;
