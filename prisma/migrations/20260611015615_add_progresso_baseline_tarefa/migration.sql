-- AlterTable
ALTER TABLE "Tarefa" ADD COLUMN     "fimBaseline" TIMESTAMP(3),
ADD COLUMN     "inicioBaseline" TIMESTAMP(3),
ADD COLUMN     "percentualConcluido" INTEGER NOT NULL DEFAULT 0;
