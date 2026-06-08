-- CreateTable
CREATE TABLE "TarefaImagem" (
    "id" SERIAL NOT NULL,
    "tarefaId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT '',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarefaImagem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TarefaImagem" ADD CONSTRAINT "TarefaImagem_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "Tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
