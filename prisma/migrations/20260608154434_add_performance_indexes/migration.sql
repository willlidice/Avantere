-- CreateIndex
CREATE INDEX "Cronograma_obraId_idx" ON "Cronograma"("obraId");

-- CreateIndex
CREATE INDEX "Obra_organizacaoId_ativa_idx" ON "Obra"("organizacaoId", "ativa");

-- CreateIndex
CREATE INDEX "ObraUser_userId_idx" ON "ObraUser"("userId");

-- CreateIndex
CREATE INDEX "TarefaImagem_tarefaId_idx" ON "TarefaImagem"("tarefaId");
