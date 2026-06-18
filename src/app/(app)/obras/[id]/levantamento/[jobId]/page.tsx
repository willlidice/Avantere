"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Download,
  Check,
  Loader2,
  PackageSearch,
  MessageSquare,
  SkipForward,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface Pergunta {
  id: number
  pergunta: string
  resposta: string | null
}

interface Item {
  id: number
  categoria: string
  descricao: string
  quantidade: number | null
  unidade: string | null
  scoreConfianca: number
  arquivoOrigem: string | null
  memoriaCalculo: string | null
  revisado: boolean
  editado: boolean
}

interface Job {
  id: number
  status: string
  scoreGeral: number | null
  criadoEm: string
  aprovadoEm: string | null
  aprovadorNome: string | null
  observacoes: string | null
  perguntas: Pergunta[] | null
  itens: Item[]
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  if (pct >= 80) return <Badge className="text-xs bg-green-100 text-green-700 border-green-200">{pct}%</Badge>
  if (pct >= 60) return <Badge className="text-xs bg-amber-100 dark:bg-blue-900/40 text-amber-700 dark:text-blue-300 border-amber-200 dark:border-blue-700">{pct}%</Badge>
  return <Badge className="text-xs bg-red-100 text-red-700 border-red-200">{pct}%</Badge>
}

export default function LevantamentoDetalhe() {
  const params = useParams<{ id: string; jobId: string }>()
  const { id: obraId, jobId } = params

  const [job, setJob] = useState<Job | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState<number | null>(null)
  const [aprovando, setAprovando] = useState(false)
  const [respondendo, setRespondendo] = useState(false)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  // Respostas Q&A locais (id → texto)
  const [respostasQA, setRespostasQA] = useState<Record<number, string>>({})

  // Edição inline local
  const [edicoes, setEdicoes] = useState<Record<number, Partial<Item>>>({})

  async function carregar() {
    setCarregando(true)
    try {
      const res = await fetch(`/api/obras/${obraId}/levantamento/${jobId}`)
      const data = await res.json()
      if (data.erro) { setErro(data.erro); return }
      setJob(data)
    } catch {
      setErro("Erro ao carregar levantamento")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [obraId, jobId])

  function editarItem(id: number, campo: keyof Item, valor: unknown) {
    setEdicoes((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }))
  }

  function itemAtual(item: Item): Item {
    return { ...item, ...edicoes[item.id] }
  }

  async function salvarItem(id: number) {
    const changes = edicoes[id]
    if (!changes) return
    setSalvando(id)
    setErroAcao(null)
    try {
      const res = await fetch(`/api/obras/${obraId}/levantamento/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: [{ id, ...changes }] }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErroAcao(d.erro ?? "Erro ao salvar")
        return
      }
      // Aplica ao state do job
      setJob((prev) => prev ? {
        ...prev,
        itens: prev.itens.map((i) => i.id === id ? { ...i, ...changes, editado: true } : i),
      } : prev)
      setEdicoes((prev) => { const n = { ...prev }; delete n[id]; return n })
    } finally {
      setSalvando(null)
    }
  }

  async function toggleRevisado(item: Item) {
    const novoValor = !itemAtual(item).revisado
    setSalvando(item.id)
    setErroAcao(null)
    try {
      const res = await fetch(`/api/obras/${obraId}/levantamento/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: [{ id: item.id, revisado: novoValor }] }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErroAcao(d.erro ?? "Erro ao salvar")
        return
      }
      setJob((prev) => prev ? {
        ...prev,
        itens: prev.itens.map((i) => i.id === item.id ? { ...i, revisado: novoValor, editado: true } : i),
      } : prev)
    } finally {
      setSalvando(null)
    }
  }

  async function aprovar() {
    setAprovando(true)
    setErroAcao(null)
    try {
      const res = await fetch(`/api/obras/${obraId}/levantamento/${jobId}/aprovar`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setErroAcao(data.erro ?? "Erro ao aprovar"); return }
      carregar()
    } finally {
      setAprovando(false)
    }
  }

  async function responder(pular: boolean) {
    setRespondendo(true)
    setErroAcao(null)
    try {
      const respostas = Object.entries(respostasQA).map(([id, resposta]) => ({
        id: parseInt(id),
        resposta,
      }))
      const res = await fetch(`/api/obras/${obraId}/levantamento/${jobId}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas, pular }),
      })
      const data = await res.json()
      if (!res.ok) { setErroAcao(data.erro ?? "Erro ao processar"); return }
      carregar()
    } finally {
      setRespondendo(false)
    }
  }

  function exportar() {
    window.open(`/api/obras/${obraId}/levantamento/${jobId}/exportar`, "_blank")
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
      </div>
    )
  }
  if (erro || !job) {
    return <div className="text-red-600 text-sm p-4">{erro ?? "Levantamento não encontrado"}</div>
  }

  const aguardandoRespostas = job.status === "AGUARDANDO_RESPOSTAS"
  const itensAlerta = job.itens.filter((i) => i.scoreConfianca < 0.7 && !i.revisado)
  const podeAprovar = job.status === "CONCLUIDO" && itensAlerta.length === 0
  const aprovado = job.status === "APROVADO"
  const categorias = Array.from(new Set(job.itens.map((i) => i.categoria))).sort()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href={`/obras/${obraId}/levantamento`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <PackageSearch className="w-5 h-5 text-amber-600 dark:text-blue-400" />
            <h1 className="text-lg font-semibold text-stone-900">Levantamento #{job.id}</h1>
            {aguardandoRespostas ? (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">Aguardando respostas</Badge>
            ) : aprovado ? (
              <Badge className="bg-amber-100 dark:bg-blue-900/40 text-amber-700 dark:text-blue-300 border-amber-200 dark:border-blue-700">Aprovado</Badge>
            ) : (
              <Badge className="bg-green-100 text-green-700 border-green-200">Concluído</Badge>
            )}
            {job.scoreGeral != null && (
              <span className="text-sm text-stone-500">
                Confiança geral: <strong>{Math.round(job.scoreGeral * 100)}%</strong>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!aguardandoRespostas && (
            <Button variant="outline" size="sm" onClick={exportar} className="border-slate-500 bg-slate-700 text-slate-100 hover:bg-slate-600 hover:text-white dark:border-slate-500 dark:bg-slate-700">
              <Download className="w-4 h-4 mr-1" /> Exportar XLSX
            </Button>
          )}
          {!aprovado && !aguardandoRespostas && (
            <Button
              size="sm"
              disabled={!podeAprovar || aprovando}
              onClick={aprovar}
              title={!podeAprovar ? "Revise todos os itens com confiança baixa antes de aprovar" : ""}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-700 disabled:text-slate-400"
            >
              {aprovando ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              Aprovar levantamento
            </Button>
          )}
        </div>
      </div>

      {/* Seção Q&A — aguardando respostas do responsável técnico */}
      {aguardandoRespostas && job.perguntas && job.perguntas.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-orange-900 text-sm">
                Claude leu o projeto e tem perguntas para melhorar o levantamento
              </p>
              <p className="text-xs text-orange-700 mt-0.5">
                Responda o que souber — campos em branco serão ignorados. Você pode pular todas as perguntas.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {job.perguntas.map((p, idx) => (
              <div key={p.id} className="space-y-1.5">
                <label className="text-sm font-medium text-stone-800">
                  {idx + 1}. {p.pergunta}
                </label>
                <Textarea
                  placeholder="Sua resposta (opcional)..."
                  value={respostasQA[p.id] ?? ""}
                  onChange={(e) =>
                    setRespostasQA((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  className="text-sm min-h-[60px] resize-none bg-white"
                  disabled={respondendo}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => responder(true)}
              disabled={respondendo}
            >
              {respondendo ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <SkipForward className="w-4 h-4 mr-1.5" />
              )}
              Pular perguntas
            </Button>
            <Button
              size="sm"
              onClick={() => responder(false)}
              disabled={respondendo}
            >
              {respondendo ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              Gerar levantamento
            </Button>
          </div>
        </div>
      )}

      {/* Info de aprovação */}
      {aprovado && job.aprovadoEm && (
        <div className="rounded-md border border-amber-200 dark:border-blue-800/50 bg-amber-50 dark:bg-blue-950/20 p-3 text-sm text-amber-800 dark:text-blue-200 flex gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          Aprovado por <strong>{job.aprovadorNome ?? "–"}</strong> em{" "}
          {new Date(job.aprovadoEm).toLocaleString("pt-BR")}. Edição bloqueada.
        </div>
      )}

      {/* Alerta itens baixa confiança */}
      {itensAlerta.length > 0 && (
        <div className="rounded-md border border-amber-200 dark:border-blue-800/50 bg-amber-50 dark:bg-blue-950/20 p-3 text-sm text-amber-800 dark:text-blue-200 flex gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>{itensAlerta.length} item{itensAlerta.length !== 1 ? "ns" : ""}</strong> com confiança abaixo de 70% precisam de revisão antes da aprovação.
            Marque como revisado após verificar cada item.
          </span>
        </div>
      )}

      {erroAcao && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erroAcao}</div>
      )}

      {/* Tabela por categoria */}
      {categorias.map((cat) => {
        const itensCat = job.itens.filter((i) => i.categoria === cat)
        return (
          <div key={cat} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 px-1">
              {cat}
              <span className="ml-2 text-xs font-normal normal-case text-stone-400">
                ({itensCat.length} item{itensCat.length !== 1 ? "ns" : ""})
              </span>
            </h2>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 text-stone-500 text-xs">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Descrição</th>
                      <th className="text-right px-3 py-2 font-medium w-24">Qtd</th>
                      <th className="text-left px-3 py-2 font-medium w-20">Und</th>
                      <th className="text-center px-3 py-2 font-medium w-20">Confiança</th>
                      <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Arquivo</th>
                      <th className="text-center px-3 py-2 font-medium w-20">Revisado</th>
                      {!aprovado && <th className="w-16" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {itensCat.map((item) => {
                      const atual = itemAtual(item)
                      const temAlerta = item.scoreConfianca < 0.7 && !item.revisado
                      const temEdicao = !!edicoes[item.id]
                      return (
                        <tr key={item.id} className={cn(temAlerta && "bg-amber-50 dark:bg-blue-950/20")}>
                          <td className="px-3 py-2">
                            <div className="flex items-start gap-1.5">
                              {temAlerta && <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-blue-400 shrink-0 mt-1.5" />}
                              <div className="flex-1 min-w-0">
                                {aprovado ? (
                                  <span>{atual.descricao}</span>
                                ) : (
                                  <Input
                                    value={atual.descricao}
                                    onChange={(e) => editarItem(item.id, "descricao", e.target.value)}
                                    className="h-7 text-sm border-transparent hover:border-stone-300 focus:border-stone-400 bg-transparent px-1"
                                  />
                                )}
                                {item.memoriaCalculo && (
                                  <p className="text-xs text-stone-400 italic mt-0.5 leading-tight px-1">
                                    {item.memoriaCalculo}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {aprovado ? (
                              <span>{atual.quantidade ?? "–"}</span>
                            ) : (
                              <Input
                                type="number"
                                value={atual.quantidade ?? ""}
                                onChange={(e) =>
                                  editarItem(item.id, "quantidade", e.target.value === "" ? null : Number(e.target.value))
                                }
                                className="h-7 text-sm text-right border-transparent hover:border-stone-300 focus:border-stone-400 bg-transparent px-1 w-20 ml-auto"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {aprovado ? (
                              <span>{atual.unidade ?? "–"}</span>
                            ) : (
                              <Input
                                value={atual.unidade ?? ""}
                                onChange={(e) =>
                                  editarItem(item.id, "unidade", e.target.value || null)
                                }
                                className="h-7 text-sm border-transparent hover:border-stone-300 focus:border-stone-400 bg-transparent px-1 w-16"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <ScoreBadge score={item.scoreConfianca} />
                          </td>
                          <td className="px-3 py-2 text-xs text-stone-400 hidden md:table-cell truncate max-w-xs">
                            {item.arquivoOrigem ?? "–"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Checkbox
                              checked={atual.revisado}
                              disabled={aprovado || salvando === item.id}
                              onCheckedChange={() => toggleRevisado(item)}
                            />
                          </td>
                          {!aprovado && (
                            <td className="px-2 py-2 text-center">
                              {temEdicao && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                                  disabled={salvando === item.id}
                                  onClick={() => salvarItem(item.id)}
                                >
                                  {salvando === item.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}

      {job.itens.length === 0 && (
        <div className="text-center py-12 text-stone-400 text-sm">
          Nenhum item extraído. Verifique se o arquivo contém dados válidos.
        </div>
      )}
    </div>
  )
}
