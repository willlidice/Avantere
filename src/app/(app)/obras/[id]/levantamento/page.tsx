"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  PackageSearch,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Eye,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Job {
  id: number
  status: string
  scoreGeral: number | null
  criadoEm: string
  observacoes: string | null
  _count: { itens: number; arquivos: number }
  arquivos: { id: number; nome: string; tipo: string }[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cor: string }> = {
  AGUARDANDO: { label: "Aguardando", icon: Clock, cor: "bg-stone-100 text-stone-600 border-stone-200" },
  PROCESSANDO: { label: "Processando", icon: Loader2, cor: "bg-blue-100 text-blue-700 border-blue-200" },
  AGUARDANDO_RESPOSTAS: { label: "Responder perguntas", icon: MessageSquare, cor: "bg-orange-100 text-orange-700 border-orange-200" },
  CONCLUIDO: { label: "Concluído", icon: CheckCircle2, cor: "bg-green-100 text-green-700 border-green-200" },
  ERRO: { label: "Erro", icon: XCircle, cor: "bg-red-100 text-red-700 border-red-200" },
  APROVADO: { label: "Aprovado", icon: CheckCircle2, cor: "bg-amber-100 dark:bg-blue-900/40 text-amber-700 dark:text-blue-300 border-amber-200 dark:border-blue-700" },
}

export default function LevantamentoPage() {
  const params = useParams<{ id: string }>()
  const obraId = params.id

  const [avisoVisivel, setAvisoVisivel] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [arquivosSelecionados, setArquivosSelecionados] = useState<File[]>([])
  const [enviando, setEnviando] = useState(false)
  const [erroUpload, setErroUpload] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function carregarJobs() {
    setCarregando(true)
    try {
      const res = await fetch(`/api/obras/${obraId}/levantamento`)
      const data = await res.json()
      if (data.erro) setErro(data.erro)
      else setJobs(data)
    } catch {
      setErro("Erro ao carregar levantamentos")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarJobs() }, [obraId])

  function handleArquivos(files: FileList | null) {
    if (!files) return
    const lista = Array.from(files).slice(0, 10)
    setArquivosSelecionados(lista)
    setErroUpload(null)
  }

  async function enviarArquivos() {
    if (!arquivosSelecionados.length) return
    setEnviando(true)
    setErroUpload(null)
    try {
      const form = new FormData()
      arquivosSelecionados.forEach((f) => form.append("arquivos", f))
      const res = await fetch(`/api/obras/${obraId}/levantamento`, { method: "POST", body: form })
      const texto = await res.text()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {}
      try { data = JSON.parse(texto) } catch { /* resposta não é JSON */ }
      if (!res.ok) {
        setErroUpload(data.erro ?? `Erro do servidor (${res.status})`)
        return
      }
      setDialogAberto(false)
      setArquivosSelecionados([])
      carregarJobs()
    } catch (err) {
      setErroUpload(`Erro: ${err instanceof Error ? err.message : "conexão"}`)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/obras/${obraId}/cronograma`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-amber-600 dark:text-blue-400" />
            <h1 className="text-lg font-semibold text-stone-900">Levantamento de Materiais</h1>
          </div>
        </div>
        <Button onClick={() => { setDialogAberto(true); setArquivosSelecionados([]); setErroUpload(null) }} size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Novo levantamento
        </Button>
      </div>

      {/* Aviso sobre limitações */}
      <div className="rounded-md border border-amber-300 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-900/25 p-3 text-sm font-medium text-amber-900 dark:text-amber-200 flex gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Aceita <strong>XLSX</strong> (memorial de quantitativos) e <strong>PDF de 1 página</strong> (especificações técnicas).
          PDFs escaneados (imagem) e arquivos DXF/DWG não são suportados nesta versão.
        </span>
      </div>

      {/* Lista de jobs */}
      {carregando ? (
        <div className="flex items-center justify-center py-12 text-stone-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
        </div>
      ) : erro ? (
        <div className="text-red-600 text-sm">{erro}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <PackageSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum levantamento criado ainda.</p>
          <p className="text-xs mt-1">Clique em &quot;Novo levantamento&quot; para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.AGUARDANDO
            const Icon = cfg.icon
            return (
              <div key={job.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs border ${cfg.cor}`}>
                        <Icon className={`w-3 h-3 mr-1 ${job.status === "PROCESSANDO" ? "animate-spin" : ""}`} />
                        {cfg.label}
                      </Badge>
                      {job.scoreGeral != null && (
                        <span className="text-xs text-stone-500">
                          Confiança: <strong>{Math.round(job.scoreGeral * 100)}%</strong>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400">
                      {new Date(job.criadoEm).toLocaleString("pt-BR")} ·{" "}
                      {job._count.arquivos} arquivo{job._count.arquivos !== 1 ? "s" : ""} ·{" "}
                      {job._count.itens} item{job._count.itens !== 1 ? "s" : ""}
                    </div>
                    {job.arquivos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.arquivos.map((arq) => (
                          <span key={arq.id} className="flex items-center gap-1 text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                            {arq.tipo === "pdf" ? (
                              <FileText className="w-3 h-3" />
                            ) : (
                              <FileSpreadsheet className="w-3 h-3" />
                            )}
                            {arq.nome}
                          </span>
                        ))}
                      </div>
                    )}
                    {job.observacoes && (
                      <p className="text-xs text-red-600 mt-1">{job.observacoes}</p>
                    )}
                  </div>
                  {["CONCLUIDO", "APROVADO", "AGUARDANDO_RESPOSTAS"].includes(job.status) && (
                    <Link href={`/obras/${obraId}/levantamento/${job.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" /> Ver
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Aviso beta — exibido sempre ao entrar */}
      {avisoVisivel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 px-6 pt-6 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs uppercase tracking-wide font-semibold">Levantamento de Materiais</p>
                  <h2 className="text-white font-bold text-lg leading-tight">Ferramenta em fase de teste</h2>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                Esta ferramenta utiliza inteligência artificial para extrair quantitativos de materiais a partir de documentos PDF e planilhas XLSX.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/25 border border-amber-300 dark:border-amber-600/60 rounded-lg p-4 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 leading-snug">
                    Todas as informações geradas devem ser revisadas por profissional habilitado antes de qualquer uso.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 leading-snug">
                    A Avantere não se responsabiliza por levantamentos incorretos, omissões ou divergências nos quantitativos extraídos.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 pt-2 border-t dark:border-gray-700">
              <Button onClick={() => setAvisoVisivel(false)} className="w-full">
                Entendi, continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de upload */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo levantamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-stone-500">
              Envie até 10 arquivos XLSX ou PDF (1 página cada, máx 20 MB por arquivo).
            </p>

            {/* Área de drop */}
            <div
              className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-amber-400 dark:hover:border-blue-500 hover:bg-amber-50 dark:hover:bg-blue-950/20 transition-colors"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleArquivos(e.dataTransfer.files) }}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-stone-400" />
              <p className="text-sm text-stone-600">Arraste os arquivos ou clique para selecionar</p>
              <p className="text-xs text-stone-400 mt-1">XLSX, PDF (1 pág.) · Máx 10 arquivos · 20 MB cada</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.pdf"
              multiple
              className="hidden"
              onChange={(e) => handleArquivos(e.target.files)}
            />

            {/* Lista de arquivos selecionados */}
            {arquivosSelecionados.length > 0 && (
              <div className="space-y-1">
                {arquivosSelecionados.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-stone-700 bg-stone-50 rounded px-3 py-1.5">
                    {f.type === "application/pdf" ? (
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />
                    )}
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto text-xs text-stone-400 shrink-0">
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}

            {erroUpload && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {erroUpload}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogAberto(false)} disabled={enviando}>
                Cancelar
              </Button>
              <Button
                onClick={enviarArquivos}
                disabled={!arquivosSelecionados.length || enviando}
              >
                {enviando ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Processar</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
