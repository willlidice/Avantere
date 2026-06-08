"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Search, Loader2, MapPin, Calendar, User, Building2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useIdioma } from "@/contexts/idioma-context"

interface Tarefa {
  id: number
  idExterno: string
  nome: string
  nomeTraduzido: string | null
  local: string
  responsavel: string | null
  statusManual: string | null
  inicio: string
  fim: string
  obraId: number
  obraNome: string
  versao: number
  cronogramaId: number
}

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  ANDAMENTO: { label: "Em andamento", cor: "bg-green-100 text-green-700 border-green-200" },
  COM_INTERFERENCIA: { label: "Com interferência", cor: "bg-orange-100 text-orange-700 border-orange-200" },
  ATRASADO: { label: "Atrasado", cor: "bg-red-100 text-red-700 border-red-200" },
  CONCLUIDO: { label: "Concluído", cor: "bg-gray-100 text-gray-500 border-gray-200" },
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

export default function BuscaPage() {
  useIdioma()
  const [busca, setBusca] = useState("")
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [buscado, setBuscado] = useState(false)

  const pesquisar = useCallback(async (termo: string) => {
    const t = termo.trim()
    if (!t) { setTarefas([]); setBuscado(false); return }
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch(`/api/busca?q=${encodeURIComponent(t)}`)
      const data = await res.json()
      if (!res.ok) { setErro(data.erro ?? "Erro na busca"); return }
      setTarefas(data.tarefas ?? [])
      setBuscado(true)
    } catch {
      setErro("Erro de conexão")
    } finally {
      setCarregando(false)
    }
  }, [])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") pesquisar(busca)
  }

  const agrupado = tarefas.reduce<Record<string, Tarefa[]>>((acc, t) => {
    const chave = `${t.obraNome} (v${t.versao})`
    if (!acc[chave]) acc[chave] = []
    acc[chave].push(t)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">
          Global
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Busca Global</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pesquise tarefas por nome, local, responsável ou ID em todas as obras</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Nome da tarefa, responsável, local, ID externo..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            autoFocus
          />
        </div>
        <button
          onClick={() => pesquisar(busca)}
          disabled={carregando || !busca.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Buscar
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      {buscado && !carregando && tarefas.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma tarefa encontrada para &ldquo;{busca}&rdquo;</p>
        </div>
      )}

      {Object.entries(agrupado).map(([obraLabel, obraTarefas]) => (
        <div key={obraLabel} className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
            <h2 className="font-semibold text-gray-800 text-sm">{obraLabel}</h2>
            <Badge variant="secondary" className="text-xs">{obraTarefas.length}</Badge>
          </div>
          <div className="space-y-1.5 pl-6">
            {obraTarefas.map((t) => {
              const status = t.statusManual ? STATUS_LABEL[t.statusManual] : null
              return (
                <Link
                  key={t.id}
                  href={`/obras/${t.obraId}/cronograma`}
                  className="block border rounded-lg p-3 bg-white hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border rounded px-1.5 py-0.5">
                          {t.idExterno}
                        </span>
                        {status && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.cor}`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{t.nome}</p>
                      {t.nomeTraduzido && (
                        <p className="text-xs text-blue-600 truncate">{t.nomeTraduzido}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                    {t.local && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {t.local}
                      </span>
                    )}
                    {t.responsavel && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {t.responsavel}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatarData(t.inicio)} → {formatarData(t.fim)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
