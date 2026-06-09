"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  History,
  GitCompare,
  FileDown,
  Loader2,
  Languages,
  Image,
  CalendarDays,
  CalendarRange,
  ListFilter,
  CheckSquare,
  ChevronDown,
  Edit,
  Eye,
  ImagePlus,
  Images,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Camera,
  Send,
  BarChart2,
  List,
  Settings,
  ChevronUp,
  AlertTriangle,
  PlusCircle,
  Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { t } from "@/lib/i18n"
import * as XLSX from "xlsx"
import { GanttInterativo } from "@/components/gantt-interativo"

interface CronogramaResumo {
  id: number
  versao: number
  criadoEm: string
  _count: { tarefas: number }
}

interface TarefaImagem {
  id: number
  url: string
  nome: string
  ordem: number
}

interface TraducaoJson {
  id: number
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
  statusManual: string | null
  dataConclusaoReal?: string | null
  imagens: TarefaImagem[]
}

type Filtro = "todas" | "hoje" | "semana" | "sem-traducao"

const ZOOM_STEPS = [75, 90, 100, 115, 130]

function truncarTexto(texto: string, maxPalavras = 5): string {
  const palavras = texto.trim().split(/\s+/)
  if (palavras.length <= maxPalavras) return texto
  return palavras.slice(0, maxPalavras).join(" ") + "…"
}

interface DadosObra {
  cliente?: string | null
  cnpjCliente?: string | null
  cnpjObra?: string | null
  cnoObra?: string | null
  dataInicio?: string | null
  dataFim?: string | null
  escopo?: string | null
  valorContrato?: number | null
}

interface Props {
  obraId: number
  nomeObra: string
  perfil: string
  idioma: string
  cronogramas: CronogramaResumo[]
  tarefasIniciais: Tarefa[]
  versaoInicial: number | null
  dataFimObra?: string | null
  dadosObra?: DadosObra
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function toInputDate(iso: string) {
  return iso ? iso.split("T")[0] : ""
}

function calcularFiltro(tarefas: Tarefa[], filtro: Filtro): Tarefa[] {
  if (filtro === "todas") return tarefas
  if (filtro === "sem-traducao") return tarefas.filter((t) => !t.nomeTraduzido)

  const agora = new Date()
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
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

export function CronogramaView({
  obraId,
  nomeObra,
  perfil,
  idioma,
  cronogramas: cronogramasIniciais,
  tarefasIniciais,
  versaoInicial,
  dataFimObra,
  dadosObra,
}: Props) {
  const [cronogramas, setCronogramas] = useState(cronogramasIniciais)
  const [versaoSelecionada, setVersaoSelecionada] = useState<number | null>(versaoInicial)
  const [tarefas, setTarefas] = useState<Tarefa[]>(tarefasIniciais)
  const [carregandoVersao, setCarregandoVersao] = useState(false)
  const [uploadErro, setUploadErro] = useState<string | null>(null)
  const [uploadSucesso, setUploadSucesso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [traduzindo, setTraduzindo] = useState(false)
  const [traducaoMensagem, setTraducaoMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null)
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [filtroLocal, setFiltroLocal] = useState<string>("")
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set())
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | null>(null)
  const [formEdicao, setFormEdicao] = useState<Record<string, string>>({})
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [edicaoErro, setEdicaoErro] = useState<string | null>(null)
  const [galeriaAberta, setGaleriaAberta] = useState<Tarefa | null>(null)
  const [imagemExpandida, setImagemExpandida] = useState<string | null>(null)
  const [imagemExpandidaIdx, setImagemExpandidaIdx] = useState<number>(0)
  const [uploadandoImagem, setUploadandoImagem] = useState(false)
  const [erroGaleria, setErroGaleria] = useState<string | null>(null)
  const [deletandoImagemId, setDeletandoImagemId] = useState<number | null>(null)
  const inputImagemRef = useRef<HTMLInputElement>(null)
  const inputCameraRef = useRef<HTMLInputElement>(null)
  const [zoom, setZoom] = useState(75)
  const [viewMode, setViewMode] = useState<"lista" | "gantt">("lista")
  const [sortColuna, setSortColuna] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [comentariosDetalhe, setComentariosDetalhe] = useState<{ id: number; userNome: string; texto: string; criadoEm: string }[]>([])
  const [loadingComentarios, setLoadingComentarios] = useState(false)
  const [novoComentario, setNovoComentario] = useState("")
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [confirmarZerar, setConfirmarZerar] = useState(false)
  const [zerandoTarefas, setZerandoTarefas] = useState(false)
  const [tarefaParaDeletar, setTarefaParaDeletar] = useState<Tarefa | null>(null)
  const [deletandoTarefaId, setDeletandoTarefaId] = useState<number | null>(null)
  const [mostrarExportar, setMostrarExportar] = useState(false)
  const [tarefaDetalhe, setTarefaDetalhe] = useState<Tarefa | null>(null)
  const [detalheExpandido, setDetalheExpandido] = useState(false)
  const [detalheImagemIdx, setDetalheImagemIdx] = useState(0)
  // Dependências (antecessoras/predecessoras)
  const [relacoesTarefa, setRelacoesTarefa] = useState<{
    antecessoras: { relacaoId: number; id: number; idExterno: string; nome: string }[]
    sucessoras: { relacaoId: number; id: number; idExterno: string; nome: string }[]
  } | null>(null)
  const [novaAntecessoraId, setNovaAntecessoraId] = useState("")
  const [cascadeRelacoes, setCascadeRelacoes] = useState(false)
  const [erroDependencia, setErroDependencia] = useState<string | null>(null)
  const [salvandoDependencia, setSalvandoDependencia] = useState(false)

  // Prompt customizado (feature 1)
  const [promptCustomizado, setPromptCustomizado] = useState<string>("")
  const [modalPromptAberto, setModalPromptAberto] = useState(false)
  const [promptRascunho, setPromptRascunho] = useState("")
  // Nova tarefa manual (feature 2)
  const [modalNovaTarefaAberto, setModalNovaTarefaAberto] = useState(false)
  const [formNovaTarefa, setFormNovaTarefa] = useState<Record<string, string>>({})
  const [criandoTarefa, setCriandoTarefa] = useState(false)
  const [erroNovaTarefa, setErroNovaTarefa] = useState<string | null>(null)
  // Filtro local expandido (feature 5)
  const [filtroLocalExpandido, setFiltroLocalExpandido] = useState(false)
  // Resize colunas tabela (feature 6)
  const [colWidths, setColWidths] = useState<Record<string, number>>({ nome: 240, local: 120, responsavel: 120, inicio: 110, fim: 110 })
  const resizandoColRef = useRef<{ col: string; startX: number; startW: number } | null>(null)

  const podeEditar = perfil === "ADMIN" || perfil === "GESTAO"

  // Alerta se cronograma ultrapassa data fim da obra
  const alertaDataFim = (() => {
    if (!dataFimObra || tarefas.length === 0) return null
    const limiteObra = new Date(dataFimObra)
    const maxFimTarefa = tarefas.reduce<Date | null>((acc, t) => {
      const d = new Date(t.fim)
      return !acc || d > acc ? d : acc
    }, null)
    if (maxFimTarefa && maxFimTarefa > limiteObra) return { maxFimTarefa, limiteObra }
    return null
  })()

  const tarefasFiltradas = calcularFiltro(tarefas, filtro)
  const locaisUnicos = Array.from(new Set(tarefas.map((t) => t.local).filter(Boolean))).sort()
  const tarefasExibidas = filtroLocal === "" ? tarefasFiltradas : tarefasFiltradas.filter((t) => t.local === filtroLocal)

  function toggleSort(coluna: string) {
    if (sortColuna === coluna) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortColuna(coluna)
      setSortDir("asc")
    }
  }

  function SortIcon({ coluna }: { coluna: string }) {
    if (sortColuna !== coluna) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-blue-600" />
      : <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />
  }

  const tarefasOrdenadas = sortColuna
    ? [...tarefasExibidas].sort((a, b) => {
        let va: string | number = ""
        let vb: string | number = ""
        if (sortColuna === "local") { va = a.local ?? ""; vb = b.local ?? "" }
        else if (sortColuna === "responsavel") { va = a.responsavel ?? ""; vb = b.responsavel ?? "" }
        else if (sortColuna === "inicio") { va = a.inicio; vb = b.inicio }
        else if (sortColuna === "fim") { va = a.fim; vb = b.fim }
        else if (sortColuna === "nome") { va = a.nome; vb = b.nome }
        const cmp = String(va).localeCompare(String(vb))
        return sortDir === "asc" ? cmp : -cmp
      })
    : tarefasExibidas

  async function carregarComentarios(tarefaId: number) {
    if (!versaoSelecionada) return
    setLoadingComentarios(true)
    try {
      const res = await fetch(`/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefaId}/comentarios`)
      if (res.ok) setComentariosDetalhe(await res.json())
    } finally {
      setLoadingComentarios(false)
    }
  }

  async function enviarComentario(tarefaId: number) {
    if (!novoComentario.trim() || !versaoSelecionada) return
    setEnviandoComentario(true)
    try {
      const res = await fetch(`/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefaId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: novoComentario }),
      })
      if (res.ok) {
        const novo = await res.json()
        setComentariosDetalhe((prev) => [...prev, novo])
        setNovoComentario("")
      }
    } finally {
      setEnviandoComentario(false)
    }
  }

  async function deletarComentario(comentarioId: number, tarefaId: number) {
    if (!versaoSelecionada) return
    await fetch(`/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefaId}/comentarios`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentarioId }),
    })
    setComentariosDetalhe((prev) => prev.filter((c) => c.id !== comentarioId))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tarefaDetalhe) carregarComentarios(tarefaDetalhe.id) }, [tarefaDetalhe?.id])

  useEffect(() => {
    if (!tarefaEditando || !versaoSelecionada) { setRelacoesTarefa(null); return }
    setRelacoesTarefa(null)
    setErroDependencia(null)
    fetch(`/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefaEditando.id}/relacoes`)
      .then((r) => r.json())
      .then((d) => setRelacoesTarefa(d))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefaEditando?.id])

  useEffect(() => {
    const saved = localStorage.getItem(`prompt_traducao_${obraId}`)
    if (saved) setPromptCustomizado(saved)
  }, [obraId])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!resizandoColRef.current) return
      const { col, startX, startW } = resizandoColRef.current
      const novoW = Math.max(60, startW + (e.clientX - startX))
      setColWidths((prev) => ({ ...prev, [col]: novoW }))
    }
    function onMouseUp() {
      resizandoColRef.current = null
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [])
  const tarefasSemTraducao = tarefas.filter((t) => !t.nomeTraduzido).length
  const tarefasTraduzidas = tarefas.filter((t) => t.nomeTraduzido)

  const todosVisivelSelecionados =
    tarefasExibidas.length > 0 && tarefasExibidas.every((t) => selecionadas.has(t.id))
  const algunsVisivelSelecionados =
    tarefasExibidas.some((t) => selecionadas.has(t.id)) && !todosVisivelSelecionados

  const labelTraduzir =
    selecionadas.size > 0
      ? `${t(idioma, "traduzindo").replace("...", "")} ${selecionadas.size} selecionada${selecionadas.size > 1 ? "s" : ""}`
      : tarefasSemTraducao > 0
      ? `Traduzir ${tarefasSemTraducao} ${t(idioma, "semTraducaoFiltro").toLowerCase()}`
      : null

  function toggleTarefa(id: number) {
    setSelecionadas((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function toggleTodos() {
    if (todosVisivelSelecionados) {
      setSelecionadas((prev) => {
        const novo = new Set(prev)
        tarefasExibidas.forEach((tarefa) => novo.delete(tarefa.id))
        return novo
      })
    } else {
      setSelecionadas((prev) => {
        const novo = new Set(prev)
        tarefasExibidas.forEach((tarefa) => novo.add(tarefa.id))
        return novo
      })
    }
  }

  function abrirEdicao(tarefa: Tarefa) {
    setFormEdicao({
      nome: tarefa.nome,
      nomeTraduzido: tarefa.nomeTraduzido ?? "",
      local: tarefa.local,
      quantidade: String(tarefa.quantidade),
      unidade: tarefa.unidade,
      inicio: toInputDate(tarefa.inicio),
      fim: toInputDate(tarefa.fim),
      responsavel: tarefa.responsavel ?? "",
    })
    setEdicaoErro(null)
    setTarefaEditando(tarefa)
  }

  async function salvarEdicao() {
    if (!tarefaEditando || !versaoSelecionada) return
    setSalvandoEdicao(true)
    setEdicaoErro(null)
    try {
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefaEditando.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: formEdicao.nome,
            nomeTraduzido: formEdicao.nomeTraduzido || null,
            local: formEdicao.local,
            quantidade: parseFloat(formEdicao.quantidade),
            unidade: formEdicao.unidade,
            inicio: formEdicao.inicio,
            fim: formEdicao.fim,
            responsavel: formEdicao.responsavel || null,
            cascadeRelacoes,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setEdicaoErro(data.erro ?? "Erro ao salvar")
      } else {
        setTarefas((prev) =>
          prev.map((tarefa) => (tarefa.id === tarefaEditando.id ? { ...tarefa, ...data } : tarefa))
        )
        setTarefaEditando(null)
      }
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function adicionarAntecessora() {
    if (!tarefaEditando || !versaoSelecionada || !novaAntecessoraId) return
    setSalvandoDependencia(true)
    setErroDependencia(null)
    const res = await fetch(
      `/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefaEditando.id}/relacoes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ antecessoraId: parseInt(novaAntecessoraId) }),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      setErroDependencia(data.erro ?? "Erro ao adicionar dependência")
    } else {
      const tarefa = tarefas.find((t) => t.id === parseInt(novaAntecessoraId))
      if (tarefa) {
        setRelacoesTarefa((prev) => prev ? {
          ...prev,
          antecessoras: [...prev.antecessoras, { relacaoId: data.id, id: tarefa.id, idExterno: tarefa.idExterno, nome: tarefa.nome }],
        } : prev)
      }
      setNovaAntecessoraId("")
    }
    setSalvandoDependencia(false)
  }

  async function removerRelacao(relacaoId: number, tipo: "antecessora" | "sucessora") {
    if (!tarefaEditando || !versaoSelecionada) return
    const res = await fetch(
      `/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefaEditando.id}/relacoes`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relacaoId }),
      }
    )
    if (res.ok) {
      setRelacoesTarefa((prev) => prev ? {
        antecessoras: tipo === "antecessora" ? prev.antecessoras.filter((r) => r.relacaoId !== relacaoId) : prev.antecessoras,
        sucessoras: tipo === "sucessora" ? prev.sucessoras.filter((r) => r.relacaoId !== relacaoId) : prev.sucessoras,
      } : prev)
    }
  }

  async function excluirTarefa(tarefa: Tarefa) {
    if (!versaoSelecionada) return
    setDeletandoTarefaId(tarefa.id)
    try {
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefa.id}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        setTarefas((prev) => prev.filter((item) => item.id !== tarefa.id))
        setCronogramas((prev) =>
          prev.map((c) =>
            c.versao === versaoSelecionada
              ? { ...c, _count: { tarefas: c._count.tarefas - 1 } }
              : c
          )
        )
        setSelecionadas((prev) => {
          const novo = new Set(prev)
          novo.delete(tarefa.id)
          return novo
        })
      }
    } finally {
      setDeletandoTarefaId(null)
      setTarefaParaDeletar(null)
    }
  }

  async function zerarTodasTarefas() {
    if (!versaoSelecionada) return
    setZerandoTarefas(true)
    try {
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas`,
        { method: "DELETE" }
      )
      if (res.ok) {
        setTarefas([])
        setSelecionadas(new Set())
        setCronogramas((prev) =>
          prev.map((c) =>
            c.versao === versaoSelecionada ? { ...c, _count: { tarefas: 0 } } : c
          )
        )
      }
    } finally {
      setZerandoTarefas(false)
      setConfirmarZerar(false)
    }
  }

  // Exportar XLSX
  function exportarXLSX(traduzido: boolean) {
    const dados = tarefas.map((tarefa) => ({
      ID: tarefa.idExterno,
      TAREFA: traduzido ? (tarefa.nomeTraduzido ?? tarefa.nome) : tarefa.nome,
      LOCAL: tarefa.local,
      QUANTIDADE: tarefa.quantidade,
      UNIDADE: tarefa.unidade,
      "DATA INICIO": formatarData(tarefa.inicio),
      "DATA FIM": formatarData(tarefa.fim),
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cronograma")
    XLSX.writeFile(wb, `cronograma-v${versaoSelecionada}${traduzido ? "-traduzido" : ""}.xlsx`)
    setMostrarExportar(false)
  }

  // Exportar Gantt PDF
  function exportarGantt(traduzido: boolean) {
    if (tarefas.length === 0) return

    const datas = tarefas.flatMap((t) => [new Date(t.inicio), new Date(t.fim)])
    const minMs = Math.min(...datas.map((d) => d.getTime()))
    const maxMs = Math.max(...datas.map((d) => d.getTime()))
    const minData = new Date(minMs)
    const maxData = new Date(maxMs)
    const totalMs = maxData.getTime() - minData.getTime() || 1

    function esq(iso: string) {
      return Math.max(0, ((new Date(iso).getTime() - minData.getTime()) / totalMs) * 100)
    }
    function larg(ini: string, fim: string) {
      return Math.max(0.3, ((new Date(fim).getTime() - new Date(ini).getTime()) / totalMs) * 100)
    }

    const meses: { label: string; pct: number }[] = []
    let cur = new Date(Date.UTC(minData.getUTCFullYear(), minData.getUTCMonth(), 1))
    while (cur <= maxData) {
      meses.push({
        label: cur.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }),
        pct: Math.max(0, ((cur.getTime() - minData.getTime()) / totalMs) * 100),
      })
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1))
    }

    const CORES = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16"]

    const linhasHtml = tarefas
      .map((tarefa, i) => {
        const nome = traduzido ? (tarefa.nomeTraduzido ?? tarefa.nome) : tarefa.nome
        const cor = CORES[i % CORES.length]
        const left = esq(tarefa.inicio)
        const width = larg(tarefa.inicio, tarefa.fim)
        return `<tr>
          <td class="td-nome" title="${nome}">${tarefa.idExterno} — ${nome.length > 50 ? nome.slice(0, 48) + "…" : nome}</td>
          <td class="td-barra">
            <div class="barra-wrap">
              <div class="barra" style="margin-left:${left.toFixed(2)}%;width:${width.toFixed(2)}%;background:${cor}" title="${formatarData(tarefa.inicio)} – ${formatarData(tarefa.fim)}"></div>
            </div>
          </td>
        </tr>`
      })
      .join("")

    const mesesHtml = meses
      .map((m) => `<div class="mes-label" style="left:${m.pct.toFixed(2)}%">${m.label}</div>`)
      .join("")

    const html = `<!DOCTYPE html><html><head>
      <title>Gantt — ${nomeObra} v${versaoSelecionada}</title>
      <meta charset="utf-8">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:9px;padding:16px;color:#222}
        h1{font-size:13px;margin-bottom:2px}
        p.sub{font-size:10px;color:#666;margin-bottom:10px}
        .meses{position:relative;height:18px;margin-left:220px;margin-bottom:4px;border-bottom:1px solid #ddd}
        .mes-label{position:absolute;top:2px;font-size:8px;color:#888;white-space:nowrap}
        table{width:100%;border-collapse:collapse}
        tr:nth-child(even){background:#f9f9f9}
        .td-nome{width:220px;padding:2px 6px 2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:middle}
        .td-barra{padding:1px 0;vertical-align:middle}
        .barra-wrap{position:relative;width:100%;height:14px;background:#f0f0f0;border-radius:2px;overflow:hidden}
        .barra{position:absolute;top:1px;height:12px;border-radius:2px;opacity:.85;min-width:2px}
        @media print{body{padding:8px}h1{font-size:11px}}
      </style></head><body>
      <h1>Gantt${traduzido ? " (Traduzido)" : ""} — ${nomeObra}</h1>
      <p class="sub">Versão ${versaoSelecionada} · ${tarefas.length} tarefas · ${formatarData(minData.toISOString())} a ${formatarData(maxData.toISOString())}</p>
      <div class="meses">${mesesHtml}</div>
      <table><tbody>${linhasHtml}</tbody></table>
      </body></html>`

    const janela = window.open("", "_blank")
    if (janela) {
      janela.document.write(html)
      janela.document.close()
      setTimeout(() => janela.print(), 500)
    }
    setMostrarExportar(false)
  }

  // Exportar PDF via print
  function exportarPDF(traduzido: boolean) {
    const linhas = tarefas
      .map(
        (tarefa) => `<tr>
          <td>${tarefa.idExterno}</td>
          <td>${traduzido ? (tarefa.nomeTraduzido ?? tarefa.nome) : tarefa.nome}</td>
          <td>${tarefa.local}</td>
          <td>${tarefa.quantidade.toLocaleString("pt-BR")} ${tarefa.unidade}</td>
          <td>${formatarData(tarefa.inicio)}</td>
          <td>${formatarData(tarefa.fim)}</td>
        </tr>`
      )
      .join("")

    const html = `<!DOCTYPE html><html><head>
      <title>Cronograma — ${nomeObra} v${versaoSelecionada}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:10px;margin:20px}
        h1{font-size:14px;margin-bottom:4px}
        p{font-size:11px;color:#666;margin:0 0 12px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:4px 6px;text-align:left}
        th{background:#f5f5f5;font-weight:bold}
      </style></head><body>
      <h1>Cronograma${traduzido ? " (Traduzido)" : ""} — ${nomeObra}</h1>
      <p>Versão ${versaoSelecionada} · ${tarefas.length} tarefas</p>
      <table>
        <thead><tr>
          <th>ID</th><th>Tarefa</th><th>Local</th><th>Quantidade</th><th>Início</th><th>Fim</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
      </table></body></html>`

    const janela = window.open("", "_blank")
    if (janela) {
      janela.document.write(html)
      janela.document.close()
      setTimeout(() => janela.print(), 400)
    }
    setMostrarExportar(false)
  }

  function todasImagensTarefa(tarefa: Tarefa): { url: string; id?: number; tipo: "editada" | "upload" }[] {
    const lista: { url: string; id?: number; tipo: "editada" | "upload" }[] = []
    const imagensUrls = new Set(tarefa.imagens.map((img) => img.url))
    if (tarefa.jpgEditadoUrl && !imagensUrls.has(tarefa.jpgEditadoUrl)) {
      lista.push({ url: tarefa.jpgEditadoUrl, tipo: "editada" })
    }
    tarefa.imagens.forEach((img) => {
      const tipo: "editada" | "upload" = img.nome.startsWith("editor-") ? "editada" : "upload"
      lista.push({ url: img.url, id: img.id, tipo })
    })
    return lista
  }

  function abrirGaleria(tarefa: Tarefa, idxInicial = 0) {
    setGaleriaAberta(tarefa)
    setErroGaleria(null)
    const todas = todasImagensTarefa(tarefa)
    if (todas.length > 0) {
      setImagemExpandida(todas[idxInicial]?.url ?? null)
      setImagemExpandidaIdx(idxInicial)
    } else {
      setImagemExpandida(null)
      setImagemExpandidaIdx(0)
    }
  }

  function navegarGaleria(direcao: 1 | -1) {
    if (!galeriaAberta) return
    const todas = todasImagensTarefa(galeriaAberta)
    const novo = (imagemExpandidaIdx + direcao + todas.length) % todas.length
    setImagemExpandidaIdx(novo)
    setImagemExpandida(todas[novo].url)
  }

  async function uploadImagemGaleria(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !galeriaAberta || !versaoSelecionada) return
    setUploadandoImagem(true)
    setErroGaleria(null)
    try {
      const form = new FormData()
      form.append("imagem", file)
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${galeriaAberta.id}/imagens`,
        { method: "POST", body: form }
      )
      const data = await res.json()
      if (!res.ok) {
        setErroGaleria(data.erro ?? "Erro ao fazer upload")
      } else {
        const novaImagem: TarefaImagem = data
        setTarefas((prev) =>
          prev.map((tarefa) =>
            tarefa.id === galeriaAberta.id
              ? { ...tarefa, imagens: [...tarefa.imagens, novaImagem] }
              : tarefa
          )
        )
        setGaleriaAberta((prev) =>
          prev ? { ...prev, imagens: [...prev.imagens, novaImagem] } : prev
        )
        setImagemExpandida(novaImagem.url)
        setImagemExpandidaIdx(todasImagensTarefa(galeriaAberta).length)
      }
    } finally {
      setUploadandoImagem(false)
      if (inputImagemRef.current) inputImagemRef.current.value = ""
    }
  }

  async function deletarImagem(imagemId: number) {
    if (!galeriaAberta || !versaoSelecionada) return
    setDeletandoImagemId(imagemId)
    setErroGaleria(null)
    try {
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${galeriaAberta.id}/imagens/${imagemId}`,
        { method: "DELETE" }
      )
      const data = await res.json()
      if (!res.ok) {
        setErroGaleria(data.erro ?? "Erro ao deletar")
        return
      }
      const novasImagens = galeriaAberta.imagens.filter((img) => img.id !== imagemId)
      const novoJpg = data.jpgEditadoUrl !== undefined ? data.jpgEditadoUrl : galeriaAberta.jpgEditadoUrl
      setTarefas((prev) =>
        prev.map((tarefa) =>
          tarefa.id === galeriaAberta.id ? { ...tarefa, imagens: novasImagens, jpgEditadoUrl: novoJpg } : tarefa
        )
      )
      const tarefaAtualizada = { ...galeriaAberta, imagens: novasImagens, jpgEditadoUrl: novoJpg }
      setGaleriaAberta(tarefaAtualizada)
      const todas = todasImagensTarefa(tarefaAtualizada)
      if (todas.length === 0) {
        setImagemExpandida(null)
        setImagemExpandidaIdx(0)
      } else {
        const novoIdx = Math.min(imagemExpandidaIdx, todas.length - 1)
        setImagemExpandidaIdx(novoIdx)
        setImagemExpandida(todas[novoIdx].url)
      }
    } finally {
      setDeletandoImagemId(null)
    }
  }

  async function mudarVersao(versao: string | null) {
    if (!versao) return
    const v = parseInt(versao)
    setVersaoSelecionada(v)
    setCarregandoVersao(true)
    setSelecionadas(new Set())
    setFiltro("todas")
    setFiltroLocal("")
    setTraducaoMensagem(null)
    try {
      const res = await fetch(`/api/obras/${obraId}/cronograma/${v}`)
      if (res.ok) {
        const data = await res.json()
        setTarefas(data.tarefas)
      }
    } finally {
      setCarregandoVersao(false)
    }
  }

  async function enviarArquivo() {
    if (!arquivo) return
    setUploadErro(null)
    setUploadSucesso(null)
    setEnviando(true)

    const form = new FormData()
    form.append("arquivo", arquivo)

    try {
      const res = await fetch(`/api/obras/${obraId}/cronograma`, {
        method: "POST",
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        setUploadErro(data.erro ?? "Erro ao enviar arquivo")
      } else {
        const novoResumo: CronogramaResumo = {
          id: data.id,
          versao: data.versao,
          criadoEm: data.criadoEm,
          _count: { tarefas: data.tarefas.length },
        }
        setCronogramas((prev) => [novoResumo, ...prev])
        setVersaoSelecionada(data.versao)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTarefas(data.tarefas.map((tarefa: any) => ({ ...tarefa, imagens: tarefa.imagens ?? [] })))
        setSelecionadas(new Set())
        setFiltro("todas")
        setUploadSucesso(`Versão ${data.versao} importada com sucesso (${data.tarefas.length} tarefas)`)
        setArquivo(null)
        if (inputRef.current) inputRef.current.value = ""
      }
    } finally {
      setEnviando(false)
    }
  }

  async function traduzirTarefas() {
    if (!versaoSelecionada) return
    setTraduzindo(true)
    setTraducaoMensagem(null)

    const ids = selecionadas.size > 0 ? Array.from(selecionadas) : undefined

    try {
      const res = await fetch(`/api/obras/${obraId}/cronograma/${versaoSelecionada}/traduzir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(ids ? { ids } : {}),
          ...(promptCustomizado ? { promptCustomizado } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTraducaoMensagem({ tipo: "erro", texto: data.erro ?? "Erro na tradução" })
      } else if (data.traduzidas === 0) {
        setTraducaoMensagem({ tipo: "sucesso", texto: t(idioma, "todasJaTraduzidas") })
      } else {
        setTraducaoMensagem({
          tipo: "sucesso",
          texto: `${data.traduzidas} tarefa${data.traduzidas > 1 ? "s" : ""} traduzida${data.traduzidas > 1 ? "s" : ""} com sucesso.`,
        })
        setSelecionadas(new Set())
        const res2 = await fetch(`/api/obras/${obraId}/cronograma/${versaoSelecionada}`)
        if (res2.ok) {
          const data2 = await res2.json()
          setTarefas(data2.tarefas)
        }
      }
    } finally {
      setTraduzindo(false)
    }
  }

  async function criarTarefa() {
    if (!versaoSelecionada) return
    const { idExterno, nome, local, quantidade, unidade, inicio, fim, responsavel } = formNovaTarefa
    if (!idExterno?.trim() || !nome?.trim() || !local?.trim() || !unidade?.trim() || !inicio || !fim) {
      setErroNovaTarefa("Preencha todos os campos obrigatórios: ID, Nome, Local, Unidade, Início, Fim")
      return
    }
    setCriandoTarefa(true)
    setErroNovaTarefa(null)
    try {
      const res = await fetch(`/api/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idExterno: idExterno.trim(),
          nome: nome.trim(),
          local: local.trim(),
          quantidade: parseFloat(quantidade) || 1,
          unidade: unidade.trim(),
          inicio,
          fim,
          responsavel: responsavel?.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErroNovaTarefa(data.erro ?? "Erro ao criar tarefa")
      } else {
        setTarefas((prev) => [...prev, { ...data, imagens: data.imagens ?? [] }])
        setCronogramas((prev) =>
          prev.map((c) =>
            c.versao === versaoSelecionada ? { ...c, _count: { tarefas: c._count.tarefas + 1 } } : c
          )
        )
        setModalNovaTarefaAberto(false)
      }
    } finally {
      setCriandoTarefa(false)
    }
  }

  const cronogramaAtual = cronogramas.find((c) => c.versao === versaoSelecionada)

  const FILTROS: { valor: Filtro; label: string; icon: React.ElementType }[] = [
    { valor: "todas", label: t(idioma, "todas"), icon: ListFilter },
    { valor: "hoje", label: t(idioma, "hoje"), icon: CalendarDays },
    { valor: "semana", label: t(idioma, "estaSemana"), icon: CalendarRange },
    { valor: "sem-traducao", label: t(idioma, "semTraducaoFiltro"), icon: Languages },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Alerta: cronograma ultrapassa data fim da obra */}
      {alertaDataFim && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Cronograma além da data fim contratual</p>
            <p className="text-xs text-red-700 mt-0.5">
              A tarefa mais longa termina em{" "}
              <strong>{alertaDataFim.maxFimTarefa.toLocaleDateString("pt-BR", { timeZone: "UTC" })}</strong>, mas a data
              fim da obra é{" "}
              <strong>{alertaDataFim.limiteObra.toLocaleDateString("pt-BR", { timeZone: "UTC" })}</strong>.
              Revise o cronograma ou cadastre um aditivo de prazo.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href="/obras"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t(idioma, "obras")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t(idioma, "cronograma")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{nomeObra}</p>
          {dadosObra && (dadosObra.cnpjObra || dadosObra.cliente || dadosObra.cnpjCliente || dadosObra.cnoObra || dadosObra.valorContrato) && (
            <div className="flex flex-wrap gap-3 mt-2">
              {dadosObra.cnpjObra && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  CNPJ Obra: <strong>{dadosObra.cnpjObra}</strong>
                </span>
              )}
              {dadosObra.cnoObra && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  CNO: <strong>{dadosObra.cnoObra}</strong>
                </span>
              )}
              {dadosObra.cliente && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Cliente: <strong>{dadosObra.cliente}</strong>
                </span>
              )}
              {dadosObra.cnpjCliente && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  CNPJ Cliente: <strong>{dadosObra.cnpjCliente}</strong>
                </span>
              )}
              {dadosObra.valorContrato != null && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Contrato: <strong>{dadosObra.valorContrato.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {podeEditar && (
            <>
              {cronogramas.length >= 2 && (
                <Link href={`/obras/${obraId}/cronograma/comparar`}>
                  <Button variant="outline" size="sm">
                    <GitCompare className="h-4 w-4 mr-2" />
                    Comparar
                  </Button>
                </Link>
              )}
              <Link href={`/obras/${obraId}/historico`}>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
              </Link>
            </>
          )}
          <a href="/api/modelo-xlsx" download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t(idioma, "modeloXlsx")}
            </Button>
          </a>
        </div>
      </div>

      {/* Upload */}
      {podeEditar && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <p className="text-sm font-medium text-gray-700">{t(idioma, "importarVersao")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="sr-only"
                onChange={(e) => {
                  setArquivo(e.target.files?.[0] ?? null)
                  setUploadErro(null)
                  setUploadSucesso(null)
                }}
              />
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white text-sm hover:bg-gray-50 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                {arquivo ? arquivo.name : t(idioma, "selecionarXlsx")}
              </div>
            </label>
            <Button size="sm" disabled={!arquivo || enviando} onClick={enviarArquivo}>
              {enviando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {enviando ? t(idioma, "importando") : t(idioma, "importar")}
            </Button>
          </div>
          {uploadErro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{uploadErro}</p>
          )}
          {uploadSucesso && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{uploadSucesso}</p>
          )}
          <p className="text-xs text-gray-400">{t(idioma, "colunasObrigatorias")}</p>
        </div>
      )}

      {/* Sem cronograma */}
      {cronogramas.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t(idioma, "nenhumCronograma")}</p>
          {podeEditar && <p className="text-xs mt-1">{t(idioma, "importeXlsx")}</p>}
        </div>
      )}

      {/* Versões + tarefas */}
      {cronogramas.length > 0 && (
        <div className="space-y-4">
          {/* Linha: versão + ações */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">{t(idioma, "versao")}:</span>
              <Select value={String(versaoSelecionada)} onValueChange={mudarVersao}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cronogramas.map((c) => (
                    <SelectItem key={c.id} value={String(c.versao)}>
                      {`v${c.versao} — ${c._count.tarefas} tarefas`}
                      <span className="text-gray-400 text-xs ml-1">
                        ({new Date(c.criadoEm).toLocaleDateString("pt-BR")})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cronogramaAtual && (
                <Badge variant="secondary">{cronogramaAtual._count.tarefas} tarefas</Badge>
              )}
              {/* Toggle lista/gantt */}
              {tarefas.length > 0 && (
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("lista")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${viewMode === "lista" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    <List className="h-3.5 w-3.5" />
                    Lista
                  </button>
                  <button
                    onClick={() => setViewMode("gantt")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${viewMode === "gantt" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    Gantt
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Traduzir */}
              {podeEditar && labelTraduzir && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={traduzindo} onClick={traduzirTarefas}>
                    {traduzindo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Languages className="h-4 w-4 mr-2" />}
                    {traduzindo ? t(idioma, "traduzindo") : labelTraduzir}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="Configurar prompt de tradução"
                    onClick={() => { setPromptRascunho(promptCustomizado); setModalPromptAberto(true) }}
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              )}

              {/* Nova tarefa manual */}
              {podeEditar && versaoSelecionada && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFormNovaTarefa({ idExterno: "", nome: "", local: "", quantidade: "1", unidade: "un", inicio: "", fim: "", responsavel: "" })
                    setErroNovaTarefa(null)
                    setModalNovaTarefaAberto(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tarefa
                </Button>
              )}

              {/* Exportar */}
              {tarefas.length > 0 && (
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMostrarExportar((v) => !v)}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    {t(idioma, "exportar")}
                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  </Button>
                  {mostrarExportar && (
                    <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 min-w-[200px] py-1">
                      <button
                        onClick={() => exportarXLSX(false)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                        {t(idioma, "exportarXlsxOriginal")}
                      </button>
                      {tarefasTraduzidas.length > 0 && (
                        <button
                          onClick={() => exportarXLSX(true)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                          {t(idioma, "exportarXlsxTraduzido")}
                        </button>
                      )}
                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={() => exportarPDF(false)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FileDown className="h-3.5 w-3.5 text-red-500" />
                        {t(idioma, "exportarPdfOriginal")}
                      </button>
                      {tarefasTraduzidas.length > 0 && (
                        <button
                          onClick={() => exportarPDF(true)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FileDown className="h-3.5 w-3.5 text-indigo-500" />
                          {t(idioma, "exportarPdfTraduzido")}
                        </button>
                      )}
                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={() => exportarGantt(false)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <CalendarRange className="h-3.5 w-3.5 text-teal-500" />
                        Gantt PDF (original)
                      </button>
                      {tarefasTraduzidas.length > 0 && (
                        <button
                          onClick={() => exportarGantt(true)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <CalendarRange className="h-3.5 w-3.5 text-teal-700" />
                          Gantt PDF (traduzido)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Zerar tarefas */}
              {podeEditar && tarefas.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => setConfirmarZerar(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t(idioma, "zerarTarefas")}
                </Button>
              )}
            </div>
          </div>

          {/* Filtros + Ver traduzidas */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTROS.map(({ valor, label, icon: Icon }) => {
              const ativo = filtro === valor
              const contagem =
                valor === "todas" ? tarefas.length : calcularFiltro(tarefas, valor).length
              return (
                <button
                  key={valor}
                  onClick={() => { setFiltro(valor); setSelecionadas(new Set()) }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    ativo
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${ativo ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {contagem}
                  </span>
                </button>
              )
            })}

            {tarefasTraduzidas.length > 0 && versaoSelecionada && (
              <Link
                href={`/obras/${obraId}/cronograma/${versaoSelecionada}/traduzidas`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Languages className="h-3.5 w-3.5" />
                {t(idioma, "verTraduzidas")}
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-600">
                  {tarefasTraduzidas.length}
                </span>
              </Link>
            )}

            {selecionadas.size > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <CheckSquare className="h-3.5 w-3.5" />
                {selecionadas.size} selecionada{selecionadas.size > 1 ? "s" : ""}
                <button onClick={() => setSelecionadas(new Set())} className="ml-1 hover:text-amber-900 font-bold">
                  ×
                </button>
              </span>
            )}
          </div>

          {/* Filtro por local — expansível */}
          {locaisUnicos.length > 1 && (
            <div className="space-y-1.5">
              <button
                onClick={() => setFiltroLocalExpandido((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors select-none"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="font-medium">Local</span>
                {filtroLocal && (
                  <span className="bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                    {filtroLocal}
                    <span
                      className="hover:opacity-70 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setFiltroLocal("") }}
                    >×</span>
                  </span>
                )}
                {!filtroLocal && (
                  <span className="text-[10px] text-gray-400">({locaisUnicos.length} locais)</span>
                )}
                {filtroLocalExpandido
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />
                }
              </button>
              {filtroLocalExpandido && (
                <div className="flex items-center gap-2 flex-wrap pl-5">
                  <button
                    onClick={() => setFiltroLocal("")}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border transition-colors ${
                      filtroLocal === ""
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    Todos
                    <span className={`ml-1.5 px-1 py-0.5 rounded text-[10px] font-semibold ${filtroLocal === "" ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-500"}`}>
                      {tarefasFiltradas.length}
                    </span>
                  </button>
                  {locaisUnicos.map((local) => {
                    const count = tarefasFiltradas.filter((t) => t.local === local).length
                    const ativo = filtroLocal === local
                    return (
                      <button
                        key={local}
                        onClick={() => setFiltroLocal(ativo ? "" : local)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border transition-colors ${
                          ativo
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {local}
                        <span className={`ml-1.5 px-1 py-0.5 rounded text-[10px] font-semibold ${ativo ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-500"}`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {traducaoMensagem && (
            <p className={`text-sm rounded px-3 py-2 border flex items-center gap-2 flex-wrap ${
              traducaoMensagem.tipo === "sucesso"
                ? "text-green-700 bg-green-50 border-green-200"
                : "text-red-600 bg-red-50 border-red-200"
            }`}>
              {traducaoMensagem.texto}
              {traducaoMensagem.tipo === "sucesso" && tarefasTraduzidas.length > 0 && versaoSelecionada && (
                <Link
                  href={`/obras/${obraId}/cronograma/${versaoSelecionada}/traduzidas`}
                  className="underline hover:no-underline text-green-700 font-medium ml-1"
                >
                  {t(idioma, "verTarefasTraduzidas")}
                </Link>
              )}
            </p>
          )}

          {carregandoVersao ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm">{t(idioma, "carregandoTarefas")}</span>
            </div>
          ) : (
            <>
              {tarefasOrdenadas.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">{filtroLocal ? `Nenhuma tarefa no local "${filtroLocal}"` : t(idioma, "nenhumaTarefaFiltro")}</p>
                </div>
              )}

              {/* Gantt interativo */}
              {viewMode === "gantt" && tarefasOrdenadas.length > 0 && (
                <GanttInterativo
                  tarefas={tarefasOrdenadas}
                  podeEditar={podeEditar}
                  obraId={obraId}
                  versao={versaoSelecionada!}
                  onAtualizar={(id, inicio, fim) => {
                    setTarefas((prev) => prev.map((t) => t.id === id ? { ...t, inicio, fim } : t))
                  }}
                />
              )}

              {/* Desktop table */}
              {viewMode === "lista" && tarefasOrdenadas.length > 0 && (
                <div className="hidden md:block space-y-2">
                  {/* Controles de zoom */}
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-400">{t(idioma, "zoom")}:</span>
                    <div className="flex items-center gap-1 border rounded-md bg-white p-0.5">
                      <button
                        onClick={() => setZoom((z) => {
                          const idx = ZOOM_STEPS.indexOf(z)
                          return ZOOM_STEPS[Math.max(0, idx - 1)]
                        })}
                        disabled={zoom === ZOOM_STEPS[0]}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                        title="Diminuir zoom"
                      >
                        <ZoomOut className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <span className="text-xs font-medium text-gray-600 w-10 text-center">{zoom}%</span>
                      <button
                        onClick={() => setZoom((z) => {
                          const idx = ZOOM_STEPS.indexOf(z)
                          return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, idx + 1)]
                        })}
                        disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                        title="Aumentar zoom"
                      >
                        <ZoomIn className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      {zoom !== 75 && (
                        <button
                          onClick={() => setZoom(75)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Restaurar zoom"
                        >
                          <RotateCcw className="h-3 w-3 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    className="border rounded-lg overflow-auto"
                    style={{ maxHeight: "calc(100vh - 300px)" }}
                  >
                    <div style={{ zoom: `${zoom}%` }}>
                      <Table className="min-w-[1140px]">
                        <TableHeader className="sticky top-0 z-10 bg-gray-50">
                          <TableRow className="bg-gray-50">
                            {podeEditar && (
                              <TableHead className="w-10">
                                <Checkbox
                                  checked={todosVisivelSelecionados}
                                  onCheckedChange={toggleTodos}
                                  aria-label="Selecionar todas"
                                  className={algunsVisivelSelecionados ? "opacity-50" : ""}
                                />
                              </TableHead>
                            )}
                            <TableHead className="w-10">#</TableHead>
                            <TableHead className="w-20">{t(idioma, "thId")}</TableHead>
                            <TableHead className="relative" style={{ minWidth: colWidths.nome, width: colWidths.nome }}>
                              <button onClick={() => toggleSort("nome")} className="flex items-center hover:text-blue-600">
                                {t(idioma, "thTarefa")}<SortIcon coluna="nome" />
                              </button>
                              <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-300/40 active:bg-blue-400/50"
                                onMouseDown={(e) => { e.preventDefault(); resizandoColRef.current = { col: "nome", startX: e.clientX, startW: colWidths.nome } }} />
                            </TableHead>
                            <TableHead className="relative" style={{ minWidth: colWidths.local, width: colWidths.local }}>
                              <button onClick={() => toggleSort("local")} className="flex items-center hover:text-blue-600">
                                {t(idioma, "thLocal")}<SortIcon coluna="local" />
                              </button>
                              <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-300/40 active:bg-blue-400/50"
                                onMouseDown={(e) => { e.preventDefault(); resizandoColRef.current = { col: "local", startX: e.clientX, startW: colWidths.local } }} />
                            </TableHead>
                            <TableHead className="relative" style={{ minWidth: colWidths.responsavel, width: colWidths.responsavel }}>
                              <button onClick={() => toggleSort("responsavel")} className="flex items-center hover:text-blue-600">
                                Responsável<SortIcon coluna="responsavel" />
                              </button>
                              <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-300/40 active:bg-blue-400/50"
                                onMouseDown={(e) => { e.preventDefault(); resizandoColRef.current = { col: "responsavel", startX: e.clientX, startW: colWidths.responsavel } }} />
                            </TableHead>
                            <TableHead className="w-20 text-right">{t(idioma, "thQtde")}</TableHead>
                            <TableHead className="w-16">{t(idioma, "thUn")}</TableHead>
                            <TableHead className="relative" style={{ minWidth: colWidths.inicio, width: colWidths.inicio }}>
                              <button onClick={() => toggleSort("inicio")} className="flex items-center hover:text-blue-600">
                                {t(idioma, "thInicio")}<SortIcon coluna="inicio" />
                              </button>
                              <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-300/40 active:bg-blue-400/50"
                                onMouseDown={(e) => { e.preventDefault(); resizandoColRef.current = { col: "inicio", startX: e.clientX, startW: colWidths.inicio } }} />
                            </TableHead>
                            <TableHead className="relative" style={{ minWidth: colWidths.fim, width: colWidths.fim }}>
                              <button onClick={() => toggleSort("fim")} className="flex items-center hover:text-blue-600">
                                {t(idioma, "thFim")}<SortIcon coluna="fim" />
                              </button>
                              <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-300/40 active:bg-blue-400/50"
                                onMouseDown={(e) => { e.preventDefault(); resizandoColRef.current = { col: "fim", startX: e.clientX, startW: colWidths.fim } }} />
                            </TableHead>
                            {podeEditar && <TableHead className="w-32 text-center">{t(idioma, "thAcoes")}</TableHead>}
                            <TableHead className="w-20 text-center">{t(idioma, "thJpg")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tarefasOrdenadas.map((tarefa) => (
                            <TableRow
                              key={tarefa.id}
                              className={selecionadas.has(tarefa.id) ? "bg-blue-50" : undefined}
                            >
                              {podeEditar && (
                                <TableCell>
                                  <Checkbox
                                    checked={selecionadas.has(tarefa.id)}
                                    onCheckedChange={() => toggleTarefa(tarefa.id)}
                                    aria-label={`Selecionar ${tarefa.nome}`}
                                  />
                                </TableCell>
                              )}
                              <TableCell className="text-gray-400 text-xs">{tarefa.ordem}</TableCell>
                              <TableCell className="text-xs font-mono">{tarefa.idExterno}</TableCell>
                              <TableCell>
                                <p className="font-medium text-sm">{tarefa.nome}</p>
                                {tarefa.nomeTraduzido && (
                                  <button
                                    onClick={() => { setTarefaDetalhe(tarefa); setDetalheImagemIdx(0) }}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left flex items-center gap-1 mt-0.5"
                                    title={tarefa.nomeTraduzido}
                                  >
                                    {truncarTexto(tarefa.nomeTraduzido)}
                                  </button>
                                )}
                              </TableCell>

                              <TableCell className="text-sm">{tarefa.local}</TableCell>
                              <TableCell className="text-sm text-gray-500">{tarefa.responsavel || "—"}</TableCell>
                              <TableCell className="text-right text-sm">
                                {tarefa.quantidade.toLocaleString("pt-BR")}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">{tarefa.unidade}</TableCell>
                              <TableCell className="text-sm">{formatarData(tarefa.inicio)}</TableCell>
                              <TableCell className="text-sm">{formatarData(tarefa.fim)}</TableCell>
                              {podeEditar && (
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-0.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => abrirEdicao(tarefa)}
                                      title={t(idioma, "editarTarefa")}
                                    >
                                      <Edit className="h-4 w-4 text-gray-500" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => abrirGaleria(tarefa)}
                                      title={t(idioma, "imagens")}
                                    >
                                      <Images className="h-4 w-4 text-gray-400" />
                                    </Button>
                                    <Link
                                      href={`/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefa.id}/editor`}
                                      title={t(idioma, "editor")}
                                    >
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                        {tarefa.jpgEditadoUrl ? (
                                          <Image className="h-4 w-4 text-blue-600" />
                                        ) : (
                                          <ImagePlus className="h-4 w-4 text-gray-400" />
                                        )}
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => setTarefaParaDeletar(tarefa)}
                                      title={t(idioma, "excluirTarefa")}
                                      disabled={deletandoTarefaId === tarefa.id}
                                    >
                                      {deletandoTarefaId === tarefa.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                                      ) : (
                                        <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="text-center">
                                {(() => {
                                  const todas = todasImagensTarefa(tarefa)
                                  if (todas.length === 0) {
                                    return podeEditar ? (
                                      <button
                                        onClick={() => abrirGaleria(tarefa)}
                                        title={t(idioma, "adicionarImagem")}
                                        className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100"
                                      >
                                        <ImagePlus className="h-4 w-4 text-gray-300" />
                                      </button>
                                    ) : null
                                  }
                                  return (
                                    <button
                                      onClick={() => abrirGaleria(tarefa)}
                                      className="inline-flex items-center gap-1 group"
                                    >
                                      <div className="flex flex-wrap gap-1">
                                        {todas.slice(0, 3).map((img, i) => (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            key={i}
                                            src={img.url}
                                            alt={`Imagem ${i + 1}`}
                                            className="h-8 w-10 object-cover rounded border border-gray-200 group-hover:border-blue-300 transition-colors shadow-sm"
                                          />
                                        ))}
                                      </div>
                                      {todas.length > 3 && (
                                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 rounded px-1 py-0.5">
                                          +{todas.length - 3}
                                        </span>
                                      )}
                                    </button>
                                  )
                                })()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile cards */}
              {viewMode === "lista" && tarefasOrdenadas.length > 0 && (
                <div className="md:hidden space-y-3">
                  {tarefasOrdenadas.map((tarefa) => (
                    <div
                      key={tarefa.id}
                      className={`border rounded-lg p-4 bg-white space-y-2 ${
                        selecionadas.has(tarefa.id) ? "border-blue-400 bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          {podeEditar && (
                            <Checkbox
                              checked={selecionadas.has(tarefa.id)}
                              onCheckedChange={() => toggleTarefa(tarefa.id)}
                              aria-label={`Selecionar ${tarefa.nome}`}
                              className="mt-0.5 shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{tarefa.nome}</p>
                            {tarefa.nomeTraduzido && (
                              <button
                                onClick={() => { setTarefaDetalhe(tarefa); setDetalheImagemIdx(0) }}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left"
                                title={tarefa.nomeTraduzido}
                              >
                                {truncarTexto(tarefa.nomeTraduzido)}
                              </button>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-gray-400 shrink-0">{tarefa.idExterno}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{tarefa.local}</span>
                        <span>{tarefa.quantidade.toLocaleString("pt-BR")} {tarefa.unidade}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Início: {formatarData(tarefa.inicio)}</span>
                        <span>Fim: {formatarData(tarefa.fim)}</span>
                      </div>
                      {(() => {
                        const todas = todasImagensTarefa(tarefa)
                        if (todas.length === 0) return null
                        return (
                          <button
                            onClick={() => abrirGaleria(tarefa)}
                            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <div className="flex -space-x-1.5">
                              {todas.slice(0, 3).map((img, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={i}
                                  src={img.url}
                                  alt={`Imagem ${i + 1}`}
                                  className="h-10 w-14 object-cover rounded border-2 border-white shadow-sm"
                                />
                              ))}
                            </div>
                            <span className="flex items-center gap-1 hover:underline">
                              <Images className="h-3.5 w-3.5" />
                              {todas.length} imagem{todas.length > 1 ? "ns" : ""}
                            </span>
                          </button>
                        )
                      })()}
                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        {podeEditar && (
                          <>
                            <button
                              onClick={() => abrirEdicao(tarefa)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              {t(idioma, "editarDados")}
                            </button>
                            <button
                              onClick={() => abrirGaleria(tarefa)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <Images className="h-3.5 w-3.5" />
                              {t(idioma, "imagens")}
                            </button>
                            <Link
                              href={`/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefa.id}/editor`}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:underline"
                            >
                              <Image className="h-3.5 w-3.5" />
                              {t(idioma, "editor")}
                            </Link>
                            <button
                              onClick={() => setTarefaParaDeletar(tarefa)}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {t(idioma, "excluir")}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Fechar dropdown exportar ao clicar fora */}
      {mostrarExportar && (
        <div className="fixed inset-0 z-10" onClick={() => setMostrarExportar(false)} />
      )}

      {/* Modal: Detalhes da tradução */}
      <Dialog
        open={!!tarefaDetalhe}
        onOpenChange={(open) => {
          if (!open) { setTarefaDetalhe(null); setComentariosDetalhe([]); setNovoComentario(""); setDetalheExpandido(false) }
        }}
      >
        <DialogContent className={detalheExpandido ? "max-w-4xl max-h-[96vh] overflow-y-auto" : "max-w-2xl max-h-[90vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Languages className="h-5 w-5 text-blue-600 shrink-0" />
              <span className="truncate flex-1">{tarefaDetalhe?.nome}</span>
              <button
                onClick={() => setDetalheExpandido((v) => !v)}
                className="ml-auto text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                title={detalheExpandido ? "Recolher" : "Expandir"}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          {tarefaDetalhe && (() => {
            const imagensDetalhe = todasImagensTarefa(tarefaDetalhe)
            return (
              <div className="space-y-5 mt-1">
                {/* ID + nomes */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">ID</span>
                    <span className="text-xs font-mono font-medium text-gray-700 bg-white border rounded px-1.5 py-0.5">
                      {tarefaDetalhe.idExterno}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase mb-0.5">Nome original</p>
                    <p className="text-sm text-gray-600">{tarefaDetalhe.nome}</p>
                  </div>
                  {tarefaDetalhe.traducaoJson ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase mb-1">Resumo</p>
                        <p className="text-sm font-medium text-blue-900 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          {tarefaDetalhe.traducaoJson.resumoAtividade}
                        </p>
                      </div>
                      {tarefaDetalhe.traducaoJson.instrucoes && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase mb-1">Instruções</p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{tarefaDetalhe.traducaoJson.instrucoes}</p>
                        </div>
                      )}
                      {tarefaDetalhe.traducaoJson.subtarefas.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase mb-1">Passo a passo</p>
                          <ol className="space-y-1">
                            {tarefaDetalhe.traducaoJson.subtarefas.map((s: { ordem: number; descricao: string }) => (
                              <li key={s.ordem} className="flex gap-2 text-sm text-gray-700">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold mt-0.5">{s.ordem}</span>
                                {s.descricao}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {tarefaDetalhe.traducaoJson.materiais.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase mb-1">Materiais / Ferramentas</p>
                          <div className="flex flex-wrap gap-1">
                            {tarefaDetalhe.traducaoJson.materiais.map((m: string, i: number) => (
                              <span key={i} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded px-2 py-0.5">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {tarefaDetalhe.traducaoJson.observacoes && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase mb-1">Observações / Segurança</p>
                          <p className="text-sm text-orange-800 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">{tarefaDetalhe.traducaoJson.observacoes}</p>
                        </div>
                      )}
                      {tarefaDetalhe.traducaoJson.mesReferencia && (
                        <p className="text-[10px] text-gray-400">Mês de referência: {tarefaDetalhe.traducaoJson.mesReferencia}</p>
                      )}
                    </div>
                  ) : tarefaDetalhe.nomeTraduzido ? (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Tradução</p>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <p className="text-sm font-medium text-blue-900 leading-relaxed whitespace-pre-line">
                          {tarefaDetalhe.nomeTraduzido}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Infos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase mb-0.5">Local</p>
                    <p className="text-sm font-medium text-gray-800">{tarefaDetalhe.local || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase mb-0.5">Quantidade</p>
                    <p className="text-sm font-medium text-gray-800">
                      {tarefaDetalhe.quantidade.toLocaleString("pt-BR")} {tarefaDetalhe.unidade}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase mb-0.5">Início</p>
                    <p className="text-sm font-medium text-gray-800">{formatarData(tarefaDetalhe.inicio)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase mb-0.5">Fim</p>
                    <p className="text-sm font-medium text-gray-800">{formatarData(tarefaDetalhe.fim)}</p>
                  </div>
                </div>

                {tarefaDetalhe.statusManual === "CONCLUIDO" && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
                    <p className="text-[10px] text-blue-500 uppercase font-semibold tracking-wide">Comparativo Previsto × Realizado</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase mb-0.5">Fim previsto</p>
                        <p className="text-sm font-semibold text-gray-800">{formatarData(tarefaDetalhe.fim)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase mb-0.5">Conclusão real</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {tarefaDetalhe.dataConclusaoReal
                            ? formatarData(tarefaDetalhe.dataConclusaoReal)
                            : <span className="text-gray-400 font-normal italic">Não informado</span>}
                        </p>
                      </div>
                    </div>
                    {tarefaDetalhe.dataConclusaoReal && (() => {
                      const previsto = new Date(tarefaDetalhe.fim)
                      const real = new Date(tarefaDetalhe.dataConclusaoReal!)
                      const diffDias = Math.round((real.getTime() - previsto.getTime()) / 86400000)
                      if (diffDias === 0) return <p className="text-xs font-medium text-green-700">✓ Concluído na data prevista</p>
                      if (diffDias < 0) return <p className="text-xs font-medium text-green-700">▲ {Math.abs(diffDias)} dia{Math.abs(diffDias) !== 1 ? "s" : ""} adiantado</p>
                      return <p className="text-xs font-medium text-red-600">▼ {diffDias} dia{diffDias !== 1 ? "s" : ""} de atraso</p>
                    })()}
                  </div>
                )}

                {/* Imagens */}
                {imagensDetalhe.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                      <Images className="h-3.5 w-3.5" />
                      Imagens ({imagensDetalhe.length})
                    </p>
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagensDetalhe[detalheImagemIdx]?.url}
                        alt="Imagem da tarefa"
                        className="w-full max-h-72 object-contain"
                      />
                      {imagensDetalhe.length > 1 && (
                        <>
                          <button
                            onClick={() => setDetalheImagemIdx((i) => (i - 1 + imagensDetalhe.length) % imagensDetalhe.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDetalheImagemIdx((i) => (i + 1) % imagensDetalhe.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                            {detalheImagemIdx + 1} / {imagensDetalhe.length}
                          </span>
                        </>
                      )}
                      <a
                        href={imagensDetalhe[detalheImagemIdx]?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded p-1.5"
                        title="Abrir em nova aba"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    {imagensDetalhe.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {imagensDetalhe.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setDetalheImagemIdx(i)}
                            className={`shrink-0 rounded overflow-hidden border-2 transition-colors ${
                              i === detalheImagemIdx ? "border-blue-500" : "border-transparent"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="" className="h-12 w-16 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Ações — botão de foto visível a TODOS os perfis */}
                <div className="flex items-center justify-between pt-1 border-t">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Adicionar Foto — todos os perfis */}
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                      onClick={() => {
                        setTarefaDetalhe(null)
                        abrirGaleria(tarefaDetalhe)
                      }}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Adicionar Foto
                    </Button>
                    {podeEditar && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTarefaDetalhe(null)
                            abrirEdicao(tarefaDetalhe)
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Editar
                        </Button>
                        {versaoSelecionada && (
                          <Link
                            href={`/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${tarefaDetalhe.id}/editor`}
                            onClick={() => setTarefaDetalhe(null)}
                          >
                            <Button variant="outline" size="sm">
                              <Image className="h-3.5 w-3.5 mr-1.5" />
                              Editor
                            </Button>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                  {/* Comentários */}
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Comentários
                      {comentariosDetalhe.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                          {comentariosDetalhe.length}
                        </span>
                      )}
                    </p>
                    {loadingComentarios ? (
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Carregando...
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {comentariosDetalhe.length === 0 && (
                          <p className="text-xs text-gray-400 italic">Nenhum comentário ainda.</p>
                        )}
                        {comentariosDetalhe.map((c) => (
                          <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs group relative">
                            <p className="font-semibold text-gray-700">{c.userNome} <span className="font-normal text-gray-400">· {new Date(c.criadoEm).toLocaleString("pt-BR")}</span></p>
                            <p className="text-gray-700 mt-0.5">{c.texto}</p>
                            {podeEditar && (
                              <button
                                onClick={() => tarefaDetalhe && deletarComentario(c.id, tarefaDetalhe.id)}
                                className="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                                title="Excluir"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={novoComentario}
                        onChange={(e) => setNovoComentario(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && tarefaDetalhe) enviarComentario(tarefaDetalhe.id) }}
                        placeholder="Adicionar comentário..."
                        className="flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <Button
                        size="sm"
                        disabled={!novoComentario.trim() || enviandoComentario}
                        onClick={() => tarefaDetalhe && enviarComentario(tarefaDetalhe.id)}
                        className="h-8"
                      >
                        {enviandoComentario ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => setTarefaDetalhe(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Tarefa */}
      <Dialog open={!!tarefaEditando} onOpenChange={(open) => { if (!open) setTarefaEditando(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-gray-600" />
              {t(idioma, "editarTarefa")}
            </DialogTitle>
          </DialogHeader>
          {tarefaEditando && (
            <div className="space-y-4 mt-1 overflow-y-auto flex-1 pr-1">
              <p className="text-xs text-gray-400 font-mono">ID: {tarefaEditando.idExterno}</p>
              <div className="space-y-1.5">
                <Label className="text-xs">{t(idioma, "nome")}</Label>
                <Input
                  value={formEdicao.nome ?? ""}
                  onChange={(e) => setFormEdicao((prev) => ({ ...prev, nome: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t(idioma, "traducaoPtBr")}</Label>
                <Textarea
                  value={formEdicao.nomeTraduzido ?? ""}
                  onChange={(e) => setFormEdicao((prev) => ({ ...prev, nomeTraduzido: e.target.value }))}
                  className="text-sm resize-none"
                  rows={3}
                  placeholder={t(idioma, "dejxeEmBranco")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t(idioma, "local")}</Label>
                <Input
                  value={formEdicao.local ?? ""}
                  onChange={(e) => setFormEdicao((prev) => ({ ...prev, local: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Responsável (encarregado)</Label>
                <Input
                  value={formEdicao.responsavel ?? ""}
                  onChange={(e) => setFormEdicao((prev) => ({ ...prev, responsavel: e.target.value }))}
                  className="text-sm"
                  placeholder="Nome do encarregado"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t(idioma, "quantidade")}</Label>
                  <Input
                    type="number"
                    value={formEdicao.quantidade ?? ""}
                    onChange={(e) => setFormEdicao((prev) => ({ ...prev, quantidade: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t(idioma, "unidade")}</Label>
                  <Input
                    value={formEdicao.unidade ?? ""}
                    onChange={(e) => setFormEdicao((prev) => ({ ...prev, unidade: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t(idioma, "inicio")}</Label>
                  <Input
                    type="date"
                    value={formEdicao.inicio ?? ""}
                    onChange={(e) => setFormEdicao((prev) => ({ ...prev, inicio: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t(idioma, "fim")}</Label>
                  <Input
                    type="date"
                    value={formEdicao.fim ?? ""}
                    onChange={(e) => setFormEdicao((prev) => ({ ...prev, fim: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              {/* Dependências */}
              <div className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/40">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dependências</p>
                {relacoesTarefa ? (
                  <>
                    {relacoesTarefa.antecessoras.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-400 mb-1">Antecessoras (esta tarefa depende de):</p>
                        {relacoesTarefa.antecessoras.map((r) => (
                          <div key={r.relacaoId} className="flex items-center justify-between py-0.5">
                            <span className="text-xs text-gray-700">{r.idExterno} — {r.nome.length > 30 ? r.nome.slice(0, 30) + "…" : r.nome}</span>
                            <button onClick={() => removerRelacao(r.relacaoId, "antecessora")} className="text-red-400 hover:text-red-600 ml-2">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {relacoesTarefa.sucessoras.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-400 mb-1">Sucessoras (dependem desta tarefa):</p>
                        {relacoesTarefa.sucessoras.map((r) => (
                          <div key={r.relacaoId} className="flex items-center justify-between py-0.5">
                            <span className="text-xs text-gray-700">{r.idExterno} — {r.nome.length > 30 ? r.nome.slice(0, 30) + "…" : r.nome}</span>
                            <button onClick={() => removerRelacao(r.relacaoId, "sucessora")} className="text-red-400 hover:text-red-600 ml-2">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Select value={novaAntecessoraId} onValueChange={(v) => setNovaAntecessoraId(v ?? "")}>
                        <SelectTrigger className="flex-1 text-xs h-8">
                          <SelectValue placeholder="Adicionar antecessora..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tarefas
                            .filter((t) => t.id !== tarefaEditando?.id && !relacoesTarefa.antecessoras.some((r) => r.id === t.id))
                            .map((t) => (
                              <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                                {t.idExterno} — {t.nome.length > 40 ? t.nome.slice(0, 40) + "…" : t.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" size="sm" variant="outline" onClick={adicionarAntecessora} disabled={!novaAntecessoraId || salvandoDependencia}>
                        <PlusCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {erroDependencia && <p className="text-xs text-red-600">{erroDependencia}</p>}
                  </>
                ) : (
                  <p className="text-xs text-gray-400">Carregando...</p>
                )}
              </div>

              {/* Cascade */}
              {relacoesTarefa && relacoesTarefa.sucessoras.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={cascadeRelacoes}
                    onCheckedChange={(v) => setCascadeRelacoes(Boolean(v))}
                  />
                  <span className="text-xs text-gray-600">
                    Mover tarefas dependentes ao salvar datas
                  </span>
                </label>
              )}

              {edicaoErro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{edicaoErro}</p>
              )}
            </div>
          )}
          {tarefaEditando && (
            <div className="flex justify-end gap-2 pt-3 border-t shrink-0 mt-2">
              <Button variant="outline" size="sm" onClick={() => setTarefaEditando(null)} disabled={salvandoEdicao}>
                {t(idioma, "cancelar")}
              </Button>
              <Button size="sm" onClick={salvarEdicao} disabled={salvandoEdicao}>
                {salvandoEdicao && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {salvandoEdicao ? t(idioma, "salvando") : t(idioma, "salvar")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar excluir tarefa */}
      <Dialog open={!!tarefaParaDeletar} onOpenChange={(open) => { if (!open) setTarefaParaDeletar(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              {t(idioma, "confirmarExcluirTarefaTitulo")}
            </DialogTitle>
          </DialogHeader>
          {tarefaParaDeletar && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t(idioma, "confirmarExcluirTarefaDesc")}</p>
              <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded px-3 py-2 font-mono">
                {tarefaParaDeletar.idExterno} — {tarefaParaDeletar.nome}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setTarefaParaDeletar(null)}>
                  {t(idioma, "cancelar")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletandoTarefaId === tarefaParaDeletar.id}
                  onClick={() => excluirTarefa(tarefaParaDeletar)}
                >
                  {deletandoTarefaId === tarefaParaDeletar.id && (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  )}
                  {t(idioma, "confirmar")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Configurar Prompt de Tradução */}
      <Dialog open={modalPromptAberto} onOpenChange={(open) => { if (!open) setModalPromptAberto(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Configurar Prompt de Tradução
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Instruções para a IA</Label>
              <textarea
                value={promptRascunho}
                onChange={(e) => setPromptRascunho(e.target.value)}
                rows={7}
                placeholder="Você é especialista em construção civil. Traduza as atividades abaixo para instruções de produção em português PT-BR."
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <p className="text-xs text-gray-400">
                Deixe em branco para usar o prompt padrão. O contexto da obra e as tarefas são sempre injetados automaticamente.
              </p>
            </div>
            {promptCustomizado && (
              <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <p className="text-xs text-amber-700 font-medium">Prompt personalizado ativo</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => {
                  setPromptCustomizado("")
                  setPromptRascunho("")
                  localStorage.removeItem(`prompt_traducao_${obraId}`)
                  setModalPromptAberto(false)
                }}
              >
                Restaurar padrão
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalPromptAberto(false)}>Cancelar</Button>
                <Button size="sm" onClick={() => {
                  const novo = promptRascunho.trim()
                  setPromptCustomizado(novo)
                  if (novo) localStorage.setItem(`prompt_traducao_${obraId}`, novo)
                  else localStorage.removeItem(`prompt_traducao_${obraId}`)
                  setModalPromptAberto(false)
                }}>
                  Salvar como padrão
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Nova Tarefa Manual */}
      <Dialog open={modalNovaTarefaAberto} onOpenChange={(open) => { if (!open) setModalNovaTarefaAberto(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-gray-600" />
              Adicionar Tarefa Manualmente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">ID <span className="text-red-500">*</span></Label>
                <Input
                  value={formNovaTarefa.idExterno ?? ""}
                  onChange={(e) => setFormNovaTarefa((p) => ({ ...p, idExterno: e.target.value }))}
                  placeholder="ex: A-001"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Local <span className="text-red-500">*</span></Label>
                <Input
                  value={formNovaTarefa.local ?? ""}
                  onChange={(e) => setFormNovaTarefa((p) => ({ ...p, local: e.target.value }))}
                  placeholder="ex: Térreo"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da Tarefa <span className="text-red-500">*</span></Label>
              <Input
                value={formNovaTarefa.nome ?? ""}
                onChange={(e) => setFormNovaTarefa((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Descrição da atividade"
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantidade</Label>
                <Input
                  type="number"
                  value={formNovaTarefa.quantidade ?? "1"}
                  onChange={(e) => setFormNovaTarefa((p) => ({ ...p, quantidade: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unidade <span className="text-red-500">*</span></Label>
                <Input
                  value={formNovaTarefa.unidade ?? ""}
                  onChange={(e) => setFormNovaTarefa((p) => ({ ...p, unidade: e.target.value }))}
                  placeholder="ex: m², un, vb"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Início <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formNovaTarefa.inicio ?? ""}
                  onChange={(e) => setFormNovaTarefa((p) => ({ ...p, inicio: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fim <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formNovaTarefa.fim ?? ""}
                  onChange={(e) => setFormNovaTarefa((p) => ({ ...p, fim: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Responsável (opcional)</Label>
              <Input
                value={formNovaTarefa.responsavel ?? ""}
                onChange={(e) => setFormNovaTarefa((p) => ({ ...p, responsavel: e.target.value }))}
                placeholder="Nome do encarregado"
                className="text-sm"
              />
            </div>
            {erroNovaTarefa && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{erroNovaTarefa}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setModalNovaTarefaAberto(false)} disabled={criandoTarefa}>Cancelar</Button>
              <Button size="sm" onClick={criarTarefa} disabled={criandoTarefa}>
                {criandoTarefa && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {criandoTarefa ? "Criando..." : "Criar Tarefa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar zerar todas as tarefas */}
      <Dialog open={confirmarZerar} onOpenChange={(open) => { if (!open && !zerandoTarefas) setConfirmarZerar(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              {t(idioma, "confirmarZerarTitulo")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{t(idioma, "confirmarZerarDesc")}</p>
            <p className="text-sm font-medium text-gray-700 bg-red-50 border border-red-100 rounded px-3 py-2">
              v{versaoSelecionada} — {cronogramaAtual?._count.tarefas ?? 0} tarefas
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmarZerar(false)}
                disabled={zerandoTarefas}
              >
                {t(idioma, "cancelar")}
              </Button>
              <Button variant="destructive" size="sm" disabled={zerandoTarefas} onClick={zerarTodasTarefas}>
                {zerandoTarefas && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {zerandoTarefas ? t(idioma, "excluindo") : t(idioma, "confirmar")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Galeria de Imagens */}
      <Dialog
        open={!!galeriaAberta}
        onOpenChange={(open) => { if (!open) { setGaleriaAberta(null); setImagemExpandida(null) } }}
      >
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Images className="h-5 w-5 text-blue-600" />
              {t(idioma, "imagens")} — {galeriaAberta?.nome}
              {galeriaAberta && (
                <span className="text-xs font-normal text-gray-400 ml-1">
                  ({todasImagensTarefa(galeriaAberta).length} imagem{todasImagensTarefa(galeriaAberta).length !== 1 ? "ns" : ""})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {galeriaAberta && (() => {
            const todas = todasImagensTarefa(galeriaAberta)
            const imgAtual = todas[imagemExpandidaIdx]

            return (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="relative flex-1 bg-gray-950 flex items-center justify-center min-h-0">
                  {imagemExpandida ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagemExpandida}
                        alt="Imagem ampliada"
                        className="max-w-full max-h-full object-contain"
                        style={{ maxHeight: "calc(92vh - 260px)" }}
                      />
                      {todas.length > 1 && (
                        <>
                          <button
                            onClick={() => navegarGaleria(-1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => navegarGaleria(1)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                        {imagemExpandidaIdx + 1} / {todas.length}
                      </span>
                      {podeEditar && imgAtual?.id && (
                        <button
                          onClick={() => deletarImagem(imgAtual.id!)}
                          disabled={deletandoImagemId === imgAtual.id}
                          className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg transition-colors"
                        >
                          {deletandoImagemId === imgAtual.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          {t(idioma, "excluir")}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500 text-sm flex flex-col items-center gap-2 py-10">
                      <Images className="h-10 w-10 opacity-30" />
                      <p>Nenhuma imagem ainda</p>
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t bg-white">
                  {erroGaleria && (
                    <p className="text-xs text-red-600 bg-red-50 border-b border-red-100 px-4 py-2">{erroGaleria}</p>
                  )}
                  <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto">
                    {todas.map((img, i) => (
                      <div key={img.id ?? `edit-${i}`} className="relative shrink-0 group">
                        <button
                          onClick={() => { setImagemExpandida(img.url); setImagemExpandidaIdx(i) }}
                          className={`block rounded overflow-hidden border-2 transition-colors ${
                            i === imagemExpandidaIdx ? "border-blue-500" : "border-transparent hover:border-gray-300"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={`Miniatura ${i + 1}`} className="h-16 w-20 object-cover" />
                        </button>
                        {img.tipo === "editada" && (
                          <span className="absolute top-0.5 left-0.5 bg-blue-600 text-white text-[9px] px-1 rounded leading-tight">
                            editor
                          </span>
                        )}
                        {podeEditar && img.id && (
                          <button
                            onClick={() => deletarImagem(img.id!)}
                            disabled={deletandoImagemId === img.id}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          >
                            {deletandoImagemId === img.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}

                    {podeEditar && (
                      <>
                        <div className="shrink-0">
                          <input
                            ref={inputImagemRef}
                            type="file"
                            accept=".jpg,.jpeg,image/*"
                            className="sr-only"
                            onChange={uploadImagemGaleria}
                          />
                          <button
                            onClick={() => inputImagemRef.current?.click()}
                            disabled={uploadandoImagem}
                            className="h-16 w-20 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            {uploadandoImagem ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-5 w-5" />
                                <span className="text-[10px]">{t(idioma, "adicionarImagem")}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="shrink-0 md:hidden">
                          <input
                            ref={inputCameraRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="sr-only"
                            onChange={uploadImagemGaleria}
                          />
                          <button
                            onClick={() => inputCameraRef.current?.click()}
                            disabled={uploadandoImagem}
                            className="h-16 w-16 border-2 border-dashed border-green-300 hover:border-green-500 rounded flex flex-col items-center justify-center gap-1 text-green-400 hover:text-green-600 transition-colors"
                          >
                            <Camera className="h-5 w-5" />
                            <span className="text-[10px]">Câmera</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-4 pb-3 pt-0">
                    <div className="flex items-center gap-3">
                      {imagemExpandida && (
                        <a
                          href={imagemExpandida}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t(idioma, "abrirEmNovaAba")}
                        </a>
                      )}
                      {podeEditar && versaoSelecionada && (
                        <Link
                          href={`/obras/${obraId}/cronograma/${versaoSelecionada}/tarefas/${galeriaAberta.id}/editor`}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          onClick={() => setGaleriaAberta(null)}
                        >
                          <Image className="h-3.5 w-3.5" />
                          {galeriaAberta.jpgEditadoUrl ? "Editar no editor" : "Abrir editor"}
                        </Link>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setGaleriaAberta(null); setImagemExpandida(null) }}
                    >
                      {t(idioma, "fechar")}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
