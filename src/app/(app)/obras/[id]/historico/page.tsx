"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ClockIcon, User, Trash2, Edit, Languages, FileSpreadsheet, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LogEntry {
  id: number
  userId: number
  obraId: number | null
  cronogramaId: number | null
  tarefaId: number | null
  acao: string
  dadosAntes: Record<string, unknown> | null
  dadosDepois: Record<string, unknown> | null
  criadoEm: string
  user: { nome: string; email: string; perfil: string }
}

const ACOES: Record<string, { label: string; icon: React.ElementType; cor: string }> = {
  EDITAR_TAREFA: { label: "Edição de tarefa", icon: Edit, cor: "bg-blue-100 text-blue-800 border-blue-200" },
  EXCLUIR_TAREFA: { label: "Exclusão de tarefa", icon: Trash2, cor: "bg-red-100 text-red-800 border-red-200" },
  TRADUZIR_LOTE: { label: "Tradução em lote", icon: Languages, cor: "bg-purple-100 text-purple-800 border-purple-200" },
  UPLOAD_XLSX: { label: "Upload de cronograma", icon: FileSpreadsheet, cor: "bg-green-100 text-green-800 border-green-200" },
  ZERAR_TAREFAS: { label: "Tarefas zeradas", icon: AlertTriangle, cor: "bg-orange-100 text-orange-800 border-orange-200" },
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

export default function HistoricoPage() {
  const params = useParams<{ id: string }>()
  const obraId = params.id
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/obras/${obraId}/historico`)
      .then((r) => r.json())
      .then((d) => {
        if (d.erro) setErro(d.erro)
        else setLogs(d.logs ?? [])
      })
      .catch(() => setErro("Erro ao carregar histórico"))
      .finally(() => setCarregando(false))
  }, [obraId])

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      <div>
        <Link
          href={`/obras/${obraId}/cronograma`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cronograma
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClockIcon className="h-6 w-6 text-gray-400" />
          Histórico de edições
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Registro de alterações realizadas nesta obra</p>
      </div>

      {carregando && (
        <div className="text-center py-16 text-gray-400 text-sm">Carregando histórico...</div>
      )}

      {erro && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">{erro}</div>
      )}

      {!carregando && !erro && logs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ClockIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma alteração registrada ainda.</p>
        </div>
      )}

      {!carregando && logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((log) => {
            const meta = ACOES[log.acao] ?? { label: log.acao, icon: Edit, cor: "bg-gray-100 text-gray-700 border-gray-200" }
            const Icon = meta.icon
            return (
              <div key={log.id} className="border rounded-lg p-4 bg-white flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.cor}`}>
                      {meta.label}
                    </span>
                    {log.cronogramaId && (
                      <span className="text-xs text-gray-400">versão {log.cronogramaId}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span className="font-medium text-gray-700">{log.user.nome}</span>
                    <span className="text-gray-300">·</span>
                    <span>{log.user.email}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{log.user.perfil}</Badge>
                  </div>
                  {log.dadosAntes && (
                    <details className="mt-1">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                        Ver dados alterados
                      </summary>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-red-50 border border-red-100 rounded p-2">
                          <p className="text-[10px] text-red-400 uppercase font-semibold mb-1">Antes</p>
                          <pre className="text-gray-700 whitespace-pre-wrap break-all">{JSON.stringify(log.dadosAntes, null, 2)}</pre>
                        </div>
                        {log.dadosDepois && (
                          <div className="bg-green-50 border border-green-100 rounded p-2">
                            <p className="text-[10px] text-green-500 uppercase font-semibold mb-1">Depois</p>
                            <pre className="text-gray-700 whitespace-pre-wrap break-all">{JSON.stringify(log.dadosDepois, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
                <div className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                  {formatarDataHora(log.criadoEm)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
