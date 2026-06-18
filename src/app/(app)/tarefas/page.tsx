"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Building2,
  Loader2,
  AlertCircle,
  Languages,
  MapPin,
  Calendar,
  Package,
  ChevronDown,
  ChevronUp,
  Images,
  Eye,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  ListFilter,
  User,
  Bell,
  BellOff,
  Clock,
  MessageSquare,
  Send,
  X,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Camera,
  FolderOpen,
} from "lucide-react"
import { useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useIdioma } from "@/contexts/idioma-context"
import { t } from "@/lib/i18n"

type StatusManual = "ANDAMENTO" | "COM_INTERFERENCIA" | "ATRASADO" | "CONCLUIDO" | "REPROGRAMAR" | null

interface TarefaImagem {
  id: number
  url: string
  nome: string
  ordem: number
}

interface TraducaoJson {
  resumoAtividade: string
  instrucoes: string | null
  materiais: string[]
  observacoes: string | null
  mesReferencia: string
  subtarefas: { ordem: number; descricao: string }[]
}

interface Tarefa {
  id: number
  idExterno: string
  nome: string
  nomeTraduzido: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  traducaoJson: TraducaoJson | null | any
  local: string
  quantidade: number
  unidade: string
  inicio: string
  fim: string
  ordem: number
  jpgEditadoUrl: string | null
  responsavel: string | null
  statusManual: StatusManual
  dataConclusaoReal?: string | null
  imagens: TarefaImagem[]
  // para saber qual obra/cronograma pertence (injetado no cliente)
  obraId?: number
  versao?: number
  cronogramaId?: number
}

interface ObraComTarefas {
  obraId: number
  obraNome: string
  versao: number
  cronogramaId: number
  tarefas: Tarefa[]
}

type FiltroTempo = "todas" | "hoje" | "semana"

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function todasImagensTarefa(tarefa: Tarefa): { url: string; id?: number }[] {
  const lista: { url: string; id?: number }[] = []
  const urls = new Set(tarefa.imagens.map((i) => i.url))
  if (tarefa.jpgEditadoUrl && !urls.has(tarefa.jpgEditadoUrl)) {
    lista.push({ url: tarefa.jpgEditadoUrl })
  }
  tarefa.imagens.forEach((img) => lista.push({ url: img.url, id: img.id }))
  return lista
}

function statusEfetivo(tarefa: Tarefa): { key: string; label: string; cor: string } {
  // status manual sobrepõe datas
  if (tarefa.statusManual) {
    const mapa: Record<string, { label: string; cor: string }> = {
      ANDAMENTO: { label: "Em andamento", cor: "bg-green-100 text-green-700 border-green-200" },
      COM_INTERFERENCIA: { label: "Com interferência", cor: "bg-orange-100 text-orange-700 border-orange-200" },
      ATRASADO: { label: "Atrasado", cor: "bg-red-100 text-red-700 border-red-200" },
      CONCLUIDO: { label: "Concluído", cor: "bg-gray-100 text-gray-500 border-gray-200" },
      REPROGRAMAR: { label: "Reprogramar", cor: "bg-purple-100 text-purple-700 border-purple-200" },
    }
    return { key: tarefa.statusManual, ...mapa[tarefa.statusManual] }
  }
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const ini = new Date(tarefa.inicio)
  const fim = new Date(tarefa.fim)
  if (fim < hoje) return { key: "concluida", label: "Concluída", cor: "bg-gray-100 text-gray-500 border-gray-200" }
  if (ini > hoje) return { key: "futura", label: "Futura", cor: "bg-blue-100 text-blue-700 border-blue-200" }
  return { key: "andamento", label: "Em andamento", cor: "bg-green-100 text-green-700 border-green-200" }
}

// statusTarefa movido para @/lib/status-tarefa

function filtrarPorTempo(tarefas: Tarefa[], filtro: FiltroTempo): Tarefa[] {
  if (filtro === "todas") return tarefas
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fimHoje = new Date(hoje.getTime() + 86400000 - 1)
  const diaSemana = hoje.getDay()
  const inicioSemana = new Date(hoje.getTime() - diaSemana * 86400000)
  const fimSemana = new Date(inicioSemana.getTime() + 7 * 86400000 - 1)
  return tarefas.filter((tarefa) => {
    const ini = new Date(tarefa.inicio)
    const fim = new Date(tarefa.fim)
    if (filtro === "hoje") return ini <= fimHoje && fim >= hoje
    if (filtro === "semana") return ini <= fimSemana && fim >= inicioSemana
    return true
  })
}

const STATUS_OPCOES: { valor: StatusManual; label: string; cor: string }[] = [
  { valor: null, label: "Auto (por datas)", cor: "bg-gray-50 text-gray-500 border-gray-200" },
  { valor: "ANDAMENTO", label: "Em andamento", cor: "bg-green-100 text-green-700 border-green-200" },
  { valor: "COM_INTERFERENCIA", label: "Com interferência", cor: "bg-orange-100 text-orange-700 border-orange-200" },
  { valor: "ATRASADO", label: "Atrasado", cor: "bg-red-100 text-red-700 border-red-200" },
  { valor: "CONCLUIDO", label: "Concluído", cor: "bg-gray-100 text-gray-500 border-gray-200" },
  { valor: "REPROGRAMAR", label: "Reprogramar", cor: "bg-purple-100 text-purple-700 border-purple-200" },
]

function SeletorStatus({ tarefa, obraId, versao, onChange }: {
  tarefa: Tarefa
  obraId: number
  versao: number
  onChange: (statusManual: StatusManual, dataConclusaoReal?: string | null) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [pedirData, setPedirData] = useState(false)
  const [dataConclusao, setDataConclusao] = useState("")
  const atual = statusEfetivo(tarefa)

  async function selecionar(valor: StatusManual, dataConclusaoReal?: string | null) {
    setAberto(false)
    setPedirData(false)
    if (valor === tarefa.statusManual && !dataConclusaoReal) return
    setSalvando(true)
    try {
      const body: Record<string, unknown> = { statusManual: valor }
      if (dataConclusaoReal !== undefined) body.dataConclusaoReal = dataConclusaoReal || null
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versao}/tarefas/${tarefa.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      if (res.ok) onChange(valor, dataConclusaoReal)
    } finally {
      setSalvando(false)
    }
  }

  function clicarOpcao(valor: StatusManual) {
    if (valor === "CONCLUIDO") {
      setPedirData(true)
      setDataConclusao(tarefa.dataConclusaoReal ? tarefa.dataConclusaoReal.split("T")[0] : "")
    } else {
      selecionar(valor)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setAberto((v) => !v); if (aberto) setPedirData(false) }}
        disabled={salvando}
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors ${atual.cor} hover:opacity-80`}
      >
        {salvando ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        {atual.label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setAberto(false); setPedirData(false) }} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[210px]">
            {!pedirData ? (
              STATUS_OPCOES.map((opt) => (
                <button
                  key={String(opt.valor)}
                  onClick={() => clicarOpcao(opt.valor)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 ${tarefa.statusManual === opt.valor ? "font-semibold" : ""}`}
                >
                  <span className={`w-2 h-2 rounded-full border ${opt.cor}`} />
                  {opt.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Data de conclusão:</p>
                <input
                  type="date"
                  value={dataConclusao}
                  onChange={(e) => setDataConclusao(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
                  autoFocus
                />
                <p className="text-[10px] text-gray-400">Opcional — para comparativo previsto × realizado</p>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => selecionar("CONCLUIDO", dataConclusao || null)}
                    className="flex-1 bg-gray-800 text-white text-xs py-1.5 rounded hover:bg-gray-700"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setPedirData(false)}
                    className="text-xs text-gray-500 px-2 hover:text-gray-700"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface Comentario { id: number; userNome: string; texto: string; criadoEm: string }
interface HistoricoStatus { id: number; criadoEm: string; userNome: string; statusAntes: string; statusDepois: string }

function PopupTarefa({ tarefa, obraId, versao, idioma, onClose, onStatusChange, onResize, onImageAdded }: {
  tarefa: Tarefa
  obraId: number
  versao: number
  idioma: string
  onClose: () => void
  onStatusChange: (id: number, statusManual: StatusManual, dataConclusaoReal?: string | null) => void
  onResize?: (tamanho: "sm" | "md" | "lg") => void
  onImageAdded?: (img: TarefaImagem) => void
}) {
  const [imagemIdx, setImagemIdx] = useState(0)
  const [imagensLocais, setImagensLocais] = useState<TarefaImagem[]>(tarefa.imagens)
  const imagensDetalhe = todasImagensTarefa({ ...tarefa, imagens: imagensLocais })
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [novoComentario, setNovoComentario] = useState("")
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [historicoStatus, setHistoricoStatus] = useState<HistoricoStatus[]>([])
  const [abaAtiva, setAbaAtiva] = useState<"detalhes" | "comentarios" | "historico">("detalhes")
  const [uploadandoFoto, setUploadandoFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState<string | null>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const inputCameraRef = useRef<HTMLInputElement>(null)

  async function uploadFoto(file: File) {
    setUploadandoFoto(true)
    setErroFoto(null)
    try {
      const form = new FormData()
      form.append("imagem", file)
      form.append("nome", file.name)
      const res = await fetch(`/api/obras/${obraId}/cronograma/${versao}/tarefas/${tarefa.id}/imagens`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) {
        const d = await res.json()
        setErroFoto(d.erro ?? "Erro ao enviar foto")
      } else {
        const novaImagem = await res.json()
        setImagensLocais((prev) => [...prev, novaImagem])
        setImagemIdx(imagensLocais.length)
        onImageAdded?.(novaImagem)
      }
    } finally {
      setUploadandoFoto(false)
    }
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFoto(file)
    e.target.value = ""
  }

  useEffect(() => {
    fetch(`/api/obras/${obraId}/cronograma/${versao}/tarefas/${tarefa.id}/comentarios`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setComentarios(d) })
      .catch(() => {})
    fetch(`/api/obras/${obraId}/cronograma/${versao}/tarefas/${tarefa.id}/historico-status`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setHistoricoStatus(d) })
      .catch(() => {})
  }, [tarefa.id, obraId, versao])

  async function enviarComentario() {
    if (!novoComentario.trim()) return
    setEnviandoComentario(true)
    try {
      const res = await fetch(`/api/obras/${obraId}/cronograma/${versao}/tarefas/${tarefa.id}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: novoComentario }),
      })
      if (res.ok) {
        const novo = await res.json()
        setComentarios((prev) => [...prev, novo])
        setNovoComentario("")
      }
    } finally {
      setEnviandoComentario(false)
    }
  }

  async function deletarComentario(id: number) {
    await fetch(`/api/obras/${obraId}/cronograma/${versao}/tarefas/${tarefa.id}/comentarios`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentarioId: id }),
    })
    setComentarios((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <>
      {/* Header com ID + status */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-3 flex-wrap">
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 shrink-0">
          {tarefa.idExterno}
        </span>
        <SeletorStatus
          tarefa={tarefa}
          obraId={obraId}
          versao={versao}
          onChange={(s, d) => onStatusChange(tarefa.id, s, d)}
        />
        {tarefa.nomeTraduzido && (
          <span className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
            <Languages className="h-3 w-3" />
            {t(idioma, "traducaoLabel")}
          </span>
        )}
        {onResize && (
          <div className="ml-auto flex items-center gap-0.5 shrink-0">
            {(["sm", "md", "lg"] as const).map((s, i) => (
              <button
                key={s}
                onClick={() => onResize(s)}
                title={s === "sm" ? "Compacto" : s === "md" ? "Médio" : "Grande"}
                className="text-[10px] px-1.5 py-0.5 rounded border text-gray-400 hover:text-gray-700 hover:border-gray-400 transition-colors"
              >
                {i === 0 ? "S" : i === 1 ? "M" : "L"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nome / Tradução (título) */}
      <div className="px-5 pb-4">
        {tarefa.nomeTraduzido ? (
          <>
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-1">
              {tarefa.traducaoJson?.resumoAtividade ?? tarefa.nome}
            </h2>
            <p className="text-xs text-gray-400 italic">{tarefa.nome}</p>
          </>
        ) : (
          <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
            {tarefa.nome}
          </h2>
        )}
      </div>

      <Separator />

      {/* Conteúdo traduzido estruturado */}
      {tarefa.traducaoJson && (
        <div className="px-5 py-4 space-y-4">
          {tarefa.traducaoJson.instrucoes && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">Instruções gerais</p>
              <p className="text-sm text-blue-900 leading-relaxed">{tarefa.traducaoJson.instrucoes}</p>
            </div>
          )}

          {tarefa.traducaoJson.subtarefas?.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Passo a passo</p>
              <ol className="space-y-2">
                {tarefa.traducaoJson.subtarefas.map((s: { ordem: number; descricao: string }) => (
                  <li key={s.ordem} className="flex gap-2.5 text-sm text-gray-700">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-blue-900/40 text-amber-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {s.ordem}
                    </span>
                    <span className="leading-snug">{s.descricao}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tarefa.traducaoJson.materiais?.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1.5">Materiais / Ferramentas</p>
              <div className="flex flex-wrap gap-1.5">
                {tarefa.traducaoJson.materiais.map((m: string, i: number) => (
                  <span key={i} className="text-xs bg-amber-50 dark:bg-blue-950/20 text-amber-800 dark:text-blue-300 border border-amber-200 dark:border-blue-800/50 rounded px-2 py-0.5">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tarefa.traducaoJson.observacoes && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-orange-500 uppercase font-semibold mb-1">Segurança / Observações</p>
              <p className="text-sm text-orange-900 leading-relaxed">{tarefa.traducaoJson.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* Fallback: nomeTraduzido sem traducaoJson estruturado */}
      {!tarefa.traducaoJson && tarefa.nomeTraduzido && (
        <div className="px-5 py-4">
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1.5">Tradução</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-lg px-3 py-2.5">
            {tarefa.nomeTraduzido}
          </p>
        </div>
      )}

      <Separator />

      {/* Abas */}
      <div className="flex gap-0 px-5 pt-3">
        {([
          { key: "detalhes", label: "Detalhes" },
          { key: "comentarios", label: `Comentários${comentarios.length > 0 ? ` (${comentarios.length})` : ""}` },
          { key: "historico", label: `Histórico${historicoStatus.length > 0 ? ` (${historicoStatus.length})` : ""}` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setAbaAtiva(key)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              abaAtiva === key
                ? "border-amber-500 dark:border-blue-400 text-amber-700 dark:text-blue-300"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid de detalhes */}
      {abaAtiva === "detalhes" && (
        <div className="grid grid-cols-2 gap-3 px-5 py-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">{t(idioma, "local")}</p>
            <p className="text-sm text-gray-800">{tarefa.local || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">{t(idioma, "quantidade")}</p>
            <p className="text-sm text-gray-800">{tarefa.quantidade.toLocaleString("pt-BR")} {tarefa.unidade}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">{t(idioma, "inicio")}</p>
            <p className="text-sm text-gray-800">{formatarData(tarefa.inicio)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">{t(idioma, "fim")}</p>
            <p className="text-sm text-gray-800">{formatarData(tarefa.fim)}</p>
          </div>
          {tarefa.responsavel && (
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Responsável</p>
              <p className="text-sm text-gray-800 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-gray-400" />
                {tarefa.responsavel}
              </p>
            </div>
          )}
          {tarefa.statusManual === "CONCLUIDO" && (
            <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
              <p className="text-[10px] text-blue-500 uppercase font-semibold tracking-wide">Comparativo Previsto × Realizado</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-gray-400">Fim previsto</p>
                  <p className="text-sm font-semibold text-gray-800">{formatarData(tarefa.fim)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Conclusão real</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {tarefa.dataConclusaoReal ? formatarData(tarefa.dataConclusaoReal) : <span className="text-gray-400 font-normal italic">Não informado</span>}
                  </p>
                </div>
              </div>
              {tarefa.dataConclusaoReal && (() => {
                const previsto = new Date(tarefa.fim)
                const real = new Date(tarefa.dataConclusaoReal!)
                const diffDias = Math.round((real.getTime() - previsto.getTime()) / 86400000)
                if (diffDias === 0) return <p className="text-xs font-medium text-green-700">✓ Concluído na data prevista</p>
                if (diffDias < 0) return <p className="text-xs font-medium text-green-700">▲ {Math.abs(diffDias)} dia{Math.abs(diffDias) !== 1 ? "s" : ""} adiantado</p>
                return <p className="text-xs font-medium text-red-600">▼ {diffDias} dia{diffDias !== 1 ? "s" : ""} de atraso</p>
              })()}
            </div>
          )}
        </div>
      )}

      {/* Aba: Comentários */}
      {abaAtiva === "comentarios" && (
        <div className="px-5 py-4 space-y-3">
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {comentarios.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-4">Nenhum comentário ainda.</p>
            )}
            {comentarios.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs group relative">
                <p className="font-semibold text-gray-700">
                  {c.userNome}
                  <span className="font-normal text-gray-400 ml-1">· {new Date(c.criadoEm).toLocaleString("pt-BR")}</span>
                </p>
                <p className="text-gray-700 mt-0.5">{c.texto}</p>
                <button
                  onClick={() => deletarComentario(c.id)}
                  className="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") enviarComentario() }}
              placeholder="Adicionar comentário..."
              className="flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-blue-400"
            />
            <Button
              size="sm"
              disabled={!novoComentario.trim() || enviandoComentario}
              onClick={enviarComentario}
              className="h-8 shrink-0"
            >
              {enviandoComentario ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      )}

      {/* Aba: Histórico de status */}
      {abaAtiva === "historico" && (
        <div className="px-5 py-4 space-y-2">
          {historicoStatus.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-4">Nenhuma alteração registrada.</p>
          )}
          {historicoStatus.map((h) => (
            <div key={h.id} className="flex items-start gap-2 text-xs border-l-2 border-amber-200 dark:border-blue-700 pl-3 py-1">
              <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-700">
                  <span className="line-through text-gray-400">{h.statusAntes}</span>
                  {" → "}
                  <span className="font-semibold text-amber-700 dark:text-blue-300">{h.statusDepois}</span>
                </p>
                <p className="text-gray-400 mt-0.5">{h.userNome} · {new Date(h.criadoEm).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Imagens (só na aba detalhes) */}
      {abaAtiva === "detalhes" && imagensDetalhe.length > 0 && (
        <>
          <Separator />
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Images className="h-3.5 w-3.5" />
              {t(idioma, "imagens")} ({imagensDetalhe.length})
            </p>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagensDetalhe[imagemIdx]?.url}
                alt="Imagem da tarefa"
                className="w-full max-h-64 object-contain"
              />
              {imagensDetalhe.length > 1 && (
                <>
                  <button
                    onClick={() => setImagemIdx((i) => (i - 1 + imagensDetalhe.length) % imagensDetalhe.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setImagemIdx((i) => (i + 1) % imagensDetalhe.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    {imagemIdx + 1} / {imagensDetalhe.length}
                  </span>
                </>
              )}
              <a
                href={imagensDetalhe[imagemIdx]?.url}
                target="_blank"
                rel="noreferrer"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded p-1.5"
                title={t(idioma, "abrirEmNovaAba")}
              >
                <Eye className="h-3.5 w-3.5" />
              </a>
            </div>
            {imagensDetalhe.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {imagensDetalhe.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImagemIdx(i)}
                    className={`shrink-0 rounded overflow-hidden border-2 transition-colors ${
                      i === imagemIdx ? "border-amber-500 dark:border-blue-400" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-12 w-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Botão foto — visível a todos os perfis */}
      <Separator />
      <div className="px-5 py-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Registrar foto</p>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            disabled={uploadandoFoto}
            onClick={() => inputCameraRef.current?.click()}
          >
            {uploadandoFoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {uploadandoFoto ? "Enviando..." : "Câmera"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={uploadandoFoto}
            onClick={() => inputFotoRef.current?.click()}
          >
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
            Arquivo
          </Button>
        </div>
        {erroFoto && <p className="text-xs text-red-500">{erroFoto}</p>}
        <input ref={inputFotoRef} type="file" accept=".jpg,.jpeg,image/*" className="hidden" onChange={handleFotoChange} />
        <input ref={inputCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoChange} />
      </div>

      {/* Rodapé */}
      <div className="flex justify-end px-5 pb-5 pt-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t(idioma, "fechar")}
        </Button>
      </div>
    </>
  )
}

function CardTarefa({ tarefa, onVerDetalhes }: { tarefa: Tarefa; onVerDetalhes: () => void }) {
  const status = statusEfetivo(tarefa)
  const imagens = todasImagensTarefa(tarefa)

  return (
    <div
      className="border rounded-xl p-4 bg-white dark:bg-card space-y-3 hover:border-amber-300 dark:hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer"
      onClick={onVerDetalhes}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border">
              {tarefa.idExterno}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.cor}`}>
              {status.label}
            </span>
          </div>
          {tarefa.nomeTraduzido ? (
            <>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                {tarefa.traducaoJson?.resumoAtividade ?? tarefa.nome}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 italic truncate">{tarefa.nome}</p>
            </>
          ) : (
            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{tarefa.nome}</p>
          )}
          {tarefa.responsavel && (
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <User className="h-3 w-3" />
              {tarefa.responsavel}
            </p>
          )}
        </div>
        {imagens.length > 0 && (
          <div className="shrink-0 flex -space-x-2">
            {imagens.slice(0, 2).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img.url}
                alt=""
                className="h-10 w-14 object-cover rounded border-2 border-white shadow-sm"
              />
            ))}
            {imagens.length > 2 && (
              <span className="h-10 w-8 bg-gray-100 border-2 border-white rounded flex items-center justify-center text-[10px] font-bold text-gray-500">
                +{imagens.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {tarefa.local && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {tarefa.local}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          {tarefa.quantidade.toLocaleString("pt-BR")} {tarefa.unidade}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatarData(tarefa.inicio)} → {formatarData(tarefa.fim)}
        </span>
      </div>
    </div>
  )
}

function ObraAccordion({
  obra,
  idioma,
  filtroTempo,
  filtroLocal,
  filtroResponsavel,
  onStatusChange,
  onImageAdded,
}: {
  obra: ObraComTarefas
  idioma: string
  filtroTempo: FiltroTempo
  filtroLocal: string
  filtroResponsavel: string
  onStatusChange: (tarefaId: number, statusManual: StatusManual, dataConclusaoReal?: string | null) => void
  onImageAdded?: (tarefaId: number, img: TarefaImagem) => void
}) {
  const [aberta, setAberta] = useState(true)
  const [tarefaDetalhe, setTarefaDetalhe] = useState<Tarefa | null>(null)
  const [dialogSize, setDialogSize] = useState<"sm" | "md" | "lg">("sm")

  const dialogSizeClass = {
    sm: "max-w-lg",
    md: "max-w-2xl",
    lg: "max-w-4xl",
  }[dialogSize]

  const tarefasFiltradas = filtrarPorTempo(obra.tarefas, filtroTempo)
    .filter((tarefa) => filtroLocal === "" || tarefa.local === filtroLocal)
    .filter((tarefa) => filtroResponsavel === "" || tarefa.responsavel === filtroResponsavel)

  const traduzidas = obra.tarefas.filter((tarefa) => tarefa.nomeTraduzido).length
  const total = obra.tarefas.length

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        onClick={() => setAberta((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-amber-100 dark:bg-blue-900/40 rounded-lg shrink-0">
            <Building2 className="h-4 w-4 text-amber-600 dark:text-blue-400" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{obra.obraNome}</p>
            <p className="text-xs text-gray-400">
              {total} {t(idioma, "tarefasMenu").toLowerCase()} · v{obra.versao}
              {tarefasFiltradas.length !== total && (
                <span className="ml-2 text-amber-600 dark:text-blue-400 font-medium">({tarefasFiltradas.length} visíveis)</span>
              )}
              {traduzidas > 0 && (
                <span className="ml-2 text-amber-600 dark:text-blue-400 font-medium">
                  {traduzidas} {t(idioma, "totalTraduzidas").toLowerCase()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {traduzidas === total && total > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              <Languages className="h-3 w-3 mr-1" />
              100%
            </Badge>
          )}
          {aberta ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {aberta && (
        <div className="px-4 pb-4 space-y-2 border-t bg-gray-50/50">
          {tarefasFiltradas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t(idioma, "nenhumaObraDisponivel")}</p>
          ) : (
            <div className="pt-3 space-y-2">
              {tarefasFiltradas.map((tarefa) => (
                <CardTarefa
                  key={tarefa.id}
                  tarefa={tarefa}
                  onVerDetalhes={() => setTarefaDetalhe(tarefa)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!tarefaDetalhe} onOpenChange={(open) => { if (!open) setTarefaDetalhe(null) }}>
        <DialogContent className={`${dialogSizeClass} max-h-[90vh] overflow-y-auto p-0 transition-all duration-200`}>
          {tarefaDetalhe && (
            <PopupTarefa
              tarefa={tarefaDetalhe}
              obraId={obra.obraId}
              versao={obra.versao}
              idioma={idioma}
              onClose={() => setTarefaDetalhe(null)}
              onResize={setDialogSize}
              onStatusChange={(id, statusManual, dataConclusaoReal) => {
                setTarefaDetalhe((prev) => prev && prev.id === id ? { ...prev, statusManual, dataConclusaoReal: dataConclusaoReal ?? prev.dataConclusaoReal } : prev)
                onStatusChange(id, statusManual, dataConclusaoReal)
              }}
              onImageAdded={(img) => onImageAdded?.(tarefaDetalhe.id, img)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TarefasPage() {
  const { idioma } = useIdioma()
  const [obras, setObras] = useState<ObraComTarefas[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [filtroTempo, setFiltroTempo] = useState<FiltroTempo>("todas")
  const [filtroLocal, setFiltroLocal] = useState("")
  const [filtroResponsavel, setFiltroResponsavel] = useState("")
  const [pushAtivo, setPushAtivo] = useState(false)
  const [pushSuportado, setPushSuportado] = useState(false)
  const [pushCarregando, setPushCarregando] = useState(false)
  const [filtroLocalExpandido, setFiltroLocalExpandido] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setPushSuportado(true)
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setPushAtivo(!!sub)
        })
      })
    }
  }, [])

  const togglePush = useCallback(async () => {
    setPushCarregando(true)
    try {
      const reg = await navigator.serviceWorker.ready
      if (pushAtivo) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        await fetch("/api/push/subscribe", { method: "DELETE" })
        setPushAtivo(false)
      } else {
        const keyRes = await fetch("/api/push/vapid-key")
        if (!keyRes.ok) return
        const { publicKey } = await keyRes.json()
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        })
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        })
        setPushAtivo(true)
      }
    } catch {
      // push não disponível ou negado
    } finally {
      setPushCarregando(false)
    }
  }, [pushAtivo])

  function carregarTarefas() {
    setCarregando(true)
    setErro(null)
    fetch("/api/tarefas")
      .then((r) => r.json())
      .then((d) => {
        if (d.erro) setErro(d.erro)
        else setObras(d.obras ?? [])
      })
      .catch(() => setErro(t(idioma, "erroCarregarTarefas")))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregarTarefas()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onStatusChange(tarefaId: number, statusManual: StatusManual, dataConclusaoReal?: string | null) {
    setObras((prev) =>
      prev.map((obra) => ({
        ...obra,
        tarefas: obra.tarefas.map((tarefa) =>
          tarefa.id === tarefaId
            ? { ...tarefa, statusManual, ...(dataConclusaoReal !== undefined ? { dataConclusaoReal } : {}) }
            : tarefa
        ),
      }))
    )
  }

  // Todos os locais e responsáveis únicos
  const todosLocais = Array.from(
    new Set(obras.flatMap((o) => o.tarefas.map((tarefa) => tarefa.local)).filter(Boolean))
  ).sort()
  const todosResponsaveis = Array.from(
    new Set(obras.flatMap((o) => o.tarefas.map((tarefa) => tarefa.responsavel)).filter((r): r is string => !!r))
  ).sort()

  const obrasFiltradas = obras
    .map((obra) => ({
      ...obra,
      tarefas: busca.trim()
        ? obra.tarefas.filter((tarefa) =>
            tarefa.nome.toLowerCase().includes(busca.toLowerCase()) ||
            (tarefa.nomeTraduzido?.toLowerCase().includes(busca.toLowerCase()) ?? false) ||
            tarefa.local.toLowerCase().includes(busca.toLowerCase()) ||
            tarefa.idExterno.toLowerCase().includes(busca.toLowerCase()) ||
            (tarefa.responsavel?.toLowerCase().includes(busca.toLowerCase()) ?? false)
          )
        : obra.tarefas,
    }))
    .filter((o) => o.tarefas.length > 0 || !busca.trim())

  const totalTarefas = obras.reduce((s, o) => s + o.tarefas.length, 0)
  const totalTraduzidas = obras.reduce(
    (s, o) => s + o.tarefas.filter((tarefa) => tarefa.nomeTraduzido).length,
    0
  )

  const FILTROS_TEMPO: { valor: FiltroTempo; label: string; icon: React.ElementType }[] = [
    { valor: "todas", label: "Todas", icon: ListFilter },
    { valor: "hoje", label: "Hoje", icon: CalendarDays },
    { valor: "semana", label: "Esta semana", icon: CalendarRange },
  ]

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{t(idioma, "carregandoTarefas")}</span>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-red-500">
        <AlertCircle className="h-8 w-8" />
        <span className="text-sm font-medium">{erro}</span>
        <Button variant="outline" size="sm" onClick={carregarTarefas}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  // Dashboard PRODUCAO — stats
  const todasTarefas = obras.flatMap((o) => o.tarefas)
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const fimHoje = new Date(hoje.getTime() + 86400000 - 1)
  const statsHoje = todasTarefas.filter((t) => new Date(t.inicio) <= fimHoje && new Date(t.fim) >= hoje).length
  const statsAtrasadas = todasTarefas.filter((t) => {
    const fim = new Date(t.fim)
    return fim < hoje && t.statusManual !== "CONCLUIDO"
  }).length
  const statsInterferencia = todasTarefas.filter((t) => t.statusManual === "COM_INTERFERENCIA").length
  const statsConcluidas = todasTarefas.filter((t) => t.statusManual === "CONCLUIDO").length

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">
            {t(idioma, "tarefasMenu")}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t(idioma, "tarefasMenu")}</h1>
          {totalTarefas > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {totalTarefas} {t(idioma, "tarefasMenu").toLowerCase()}
              {totalTraduzidas > 0 && (
                <span className="ml-2 text-indigo-600 font-medium">
                  · {totalTraduzidas} {t(idioma, "totalTraduzidas").toLowerCase()}
                </span>
              )}
            </p>
          )}
        </div>
        {pushSuportado && (
          <button
            onClick={togglePush}
            disabled={pushCarregando}
            title={pushAtivo ? "Desativar notificações" : "Ativar notificações push"}
            className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
              pushAtivo
                ? "bg-amber-50 dark:bg-blue-950/20 text-amber-700 dark:text-blue-300 border-amber-300 dark:border-blue-700 hover:bg-amber-100 dark:hover:bg-blue-900/30"
                : "bg-white text-gray-500 border-gray-200 hover:border-amber-300 dark:hover:border-blue-500 hover:text-amber-600 dark:hover:text-blue-400"
            }`}
          >
            {pushCarregando ? <Loader2 className="h-4 w-4 animate-spin" /> : pushAtivo ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {pushAtivo ? "Notif. ativa" : "Notif. push"}
          </button>
        )}
      </div>

      {/* Dashboard cards */}
      {totalTarefas > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Hoje", value: statsHoje, icon: CalendarDays, cor: "bg-blue-50 text-blue-700 border-blue-200" },
            { label: "Atrasadas", value: statsAtrasadas, icon: AlertTriangle, cor: "bg-red-50 text-red-700 border-red-200" },
            { label: "Interferência", value: statsInterferencia, icon: ClipboardList, cor: "bg-orange-50 text-orange-700 border-orange-200" },
            { label: "Concluídas", value: statsConcluidas, icon: CheckCircle2, cor: "bg-green-50 text-green-700 border-green-200" },
          ].map(({ label, value, icon: Icon, cor }) => (
            <div key={label} className={`rounded-xl border p-3 flex items-center gap-3 ${cor}`}>
              <Icon className="h-5 w-5 shrink-0 opacity-70" />
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="text-[11px] font-medium mt-0.5 opacity-75">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalTarefas > 0 && (
        <div className="space-y-3">
          {/* Busca */}
          <input
            type="text"
            placeholder={t(idioma, "buscarNomeLocalId")}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-blue-400 focus:border-amber-400 dark:focus:border-blue-400"
          />

          {/* Filtros de tempo */}
          <div className="flex flex-wrap gap-2">
            {FILTROS_TEMPO.map(({ valor, label, icon: Icon }) => (
              <button
                key={valor}
                onClick={() => setFiltroTempo(valor)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filtroTempo === valor
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Filtro de local */}
          {todosLocais.length > 1 && (
            <div className="border border-gray-100 rounded-lg bg-gray-50/50">
              <button
                onClick={() => setFiltroLocalExpandido((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="font-medium">Local</span>
                  {filtroLocal && (
                    <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                      {filtroLocal}
                    </span>
                  )}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtroLocalExpandido ? "rotate-180" : ""}`} />
              </button>
              {filtroLocalExpandido && (
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFiltroLocal("")}
                    className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                      filtroLocal === ""
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    Todos
                  </button>
                  {todosLocais.map((local) => (
                    <button
                      key={local}
                      onClick={() => setFiltroLocal(filtroLocal === local ? "" : local)}
                      className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                        filtroLocal === local
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {local}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filtro de responsável */}
          {todosResponsaveis.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 shrink-0">
                <User className="h-3.5 w-3.5" />
                Responsável:
              </span>
              <button
                onClick={() => setFiltroResponsavel("")}
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                  filtroResponsavel === ""
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                Todos
              </button>
              {todosResponsaveis.map((resp) => (
                <button
                  key={resp}
                  onClick={() => setFiltroResponsavel(filtroResponsavel === resp ? "" : resp)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                    filtroResponsavel === resp
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {resp}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {obras.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t(idioma, "nenhumaObraDisponivel")}</p>
          <p className="text-xs mt-1 text-gray-300">{t(idioma, "vinculeAUmaObra")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {obrasFiltradas.map((obra) => (
            <ObraAccordion
              key={obra.obraId}
              obra={obra}
              idioma={idioma}
              filtroTempo={filtroTempo}
              filtroLocal={filtroLocal}
              filtroResponsavel={filtroResponsavel}
              onStatusChange={(id, s, d) => onStatusChange(id, s, d)}
              onImageAdded={(tarefaId, img) =>
                setObras((prev) =>
                  prev.map((o) =>
                    o.obraId === obra.obraId
                      ? { ...o, tarefas: o.tarefas.map((t) => t.id === tarefaId ? { ...t, imagens: [...t.imagens, img] } : t) }
                      : o
                  )
                )
              }
            />
          ))}
          {obrasFiltradas.length === 0 && busca && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">{t(idioma, "nenhumaTarefaFiltro")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
