export function statusTarefa(tarefa: { inicio: string; fim: string }): "concluida" | "andamento" | "futura" {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const ini = new Date(tarefa.inicio)
  const fim = new Date(tarefa.fim)
  if (fim < hoje) return "concluida"
  if (ini > hoje) return "futura"
  return "andamento"
}
