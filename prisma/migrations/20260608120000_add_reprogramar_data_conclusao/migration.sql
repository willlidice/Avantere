-- AlterEnum
ALTER TYPE "StatusManual" ADD VALUE 'REPROGRAMAR';

-- AlterTable
ALTER TABLE "Tarefa" ADD COLUMN "dataConclusaoReal" TIMESTAMP(3);
