-- CreateTable
CREATE TABLE "LogEdicao" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "obraId" INTEGER,
    "cronogramaId" INTEGER,
    "tarefaId" INTEGER,
    "acao" TEXT NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogEdicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogEdicao_obraId_idx" ON "LogEdicao"("obraId");

-- CreateIndex
CREATE INDEX "LogEdicao_tarefaId_idx" ON "LogEdicao"("tarefaId");

-- CreateIndex
CREATE INDEX "LogEdicao_userId_idx" ON "LogEdicao"("userId");

-- AddForeignKey
ALTER TABLE "LogEdicao" ADD CONSTRAINT "LogEdicao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
