-- CreateEnum
CREATE TYPE "StatusManual" AS ENUM ('ANDAMENTO', 'COM_INTERFERENCIA', 'ATRASADO', 'CONCLUIDO');

-- AlterTable
ALTER TABLE "Tarefa" ADD COLUMN     "responsavel" TEXT,
ADD COLUMN     "statusManual" "StatusManual";
