"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Loader2, GripVertical, AlertTriangle, Users, RotateCcw, Maximize2, Minimize2 } from "lucide-react"

interface TarefaGantt {
  id: number
  idExterno: string
  nome: string
  nomeTraduzido: string | null
  local: string
  inicio: string
  fim: string
  responsavel: string | null
  statusManual: string | null
  percentualConcluido: number
  inicioBaseline?: string | null
  fimBaseline?: string | null
}

interface Props {
  tarefas: TarefaGantt[]
  relacoes?: { antecessoraId: number; sucessoraId: number }[]
  podeEditar: boolean
  obraId: number
  versao: number
  idioma?: string
  onAtualizar: (updates: { id: number; inicio: string; fim: string }[]) => void
  onRecarregar?: () => void
}

const LINHA_H = 34
const HEADER_H = 32
const MIN_DIAS = 1
const nomeW_MIN = 80
const nomeW_MAX = 500
const CORES_STATUS: Record<string, string> = {
  ANDAMENTO: "#10b981",
  COM_INTERFERENCIA: "#f97316",
  ATRASADO: "#ef4444",
  CONCLUIDO: "#6b7280",
  REPROGRAMAR: "#8b5cf6",
}
const COR_PADRAO = "#3b82f6"

function corPorStatus(statusManual: string | null, inicio: string, fim: string): string {
  if (statusManual && CORES_STATUS[statusManual]) return CORES_STATUS[statusManual]
  const hoje = Date.now()
  const fimMs = new Date(fim).getTime()
  if (fimMs < hoje) return "#ef4444"
  if (new Date(inicio).getTime() <= hoje && fimMs >= hoje) return "#10b981"
  return COR_PADRAO
}

function hashCorResponsavel(nome: string): string {
  let h = 5381
  for (let i = 0; i < nome.length; i++) h = ((h << 5) + h + nome.charCodeAt(i)) & 0x7fffffff
  const hue = h % 360
  return `hsl(${hue}, 60%, 45%)`
}

function isoParaMs(iso: string) { return new Date(iso).getTime() }

function msParaIso(ms: number) {
  const d = new Date(ms)
  return d.toISOString().split("T")[0]
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

type TipoArrastar = "mover" | "esquerda" | "direita"

interface Arrastando {
  tarefaId: number
  tipo: TipoArrastar
  startX: number
  startIni: number
  startFim: number
}

type OpcaoCascade = false | "imediatas" | true

export function GanttInterativo({ tarefas, relacoes = [], podeEditar, obraId, versao, onAtualizar, onRecarregar }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [larguraArea, setLarguraArea] = useState(600)
  const [arrastando, setArrastando] = useState<Arrastando | null>(null)
  const [preview, setPreview] = useState<Map<number, { inicio: string; fim: string }>>(new Map())
  const [salvando, setSalvando] = useState<Set<number>>(new Set())
  const [tooltip, setTooltip] = useState<{ tarefaId: number; x: number; y: number } | null>(null)
  const [nomeW, setNomeW] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gantt_nome_w")
      return saved ? Math.max(nomeW_MIN, Math.min(nomeW_MAX, parseInt(saved))) : 220
    }
    return 220
  })
  const resizandoNomeRef = useRef<{ startX: number; startW: number } | null>(null)
  const [pendentePropagacao, setPendentePropagacao] = useState<{ tarefaId: number; inicio: string; fim: string } | null>(null)
  const [opcaoCascade, setOpcaoCascade] = useState<OpcaoCascade>(false)
  const [mostrarCaminhoCritico, setMostrarCaminhoCritico] = useState(false)
  const [modoCor, setModoCor] = useState<"status" | "responsavel">("status")
  const [historicoAcoes, setHistoricoAcoes] = useState<Array<{ id: number; inicio: string; fim: string }[]>>([])
  const [desfazendo, setDesfazendo] = useState(false)
  const [telaCheia, setTelaCheia] = useState(false)
  const tarefasRef = useRef(tarefas)
  useEffect(() => { tarefasRef.current = tarefas }, [tarefas])

  useEffect(() => {
    function onFullscreenChange() { setTelaCheia(!!document.fullscreenElement) }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  async function toggleTelaCheia() {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      setLarguraArea(Math.max(400, entries[0].contentRect.width - nomeW - 20))
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomeW])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!resizandoNomeRef.current) return
      const delta = e.clientX - resizandoNomeRef.current.startX
      const novoW = Math.max(nomeW_MIN, Math.min(nomeW_MAX, resizandoNomeRef.current.startW + delta))
      setNomeW(novoW)
    }
    function onMouseUp() {
      if (resizandoNomeRef.current) {
        localStorage.setItem("gantt_nome_w", String(nomeW))
        resizandoNomeRef.current = null
      }
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomeW])

  if (tarefas.length === 0) {
    return <div className="text-center py-8 text-gray-400 text-sm">Nenhuma tarefa para exibir no Gantt.</div>
  }

  const datas = tarefas.flatMap((t) => [isoParaMs(t.inicio), isoParaMs(t.fim)])
  const minMs = Math.min(...datas)
  const maxMs = Math.max(...datas)
  const margem = (maxMs - minMs) * 0.03
  const inicioTotal = minMs - margem
  const fimTotal = maxMs + margem
  const totalMs = fimTotal - inicioTotal

  function msParaPx(ms: number) {
    return ((ms - inicioTotal) / totalMs) * larguraArea
  }
  function pxParaMs(px: number) {
    return inicioTotal + (px / larguraArea) * totalMs
  }

  // Caminho crítico: folga ≤ 1 dia entre fim da antecessora e início da sucessora
  const tarefaMap = new Map(tarefas.map((t) => [t.id, t]))
  const idsCaminhosCriticos = new Set<number>()
  if (mostrarCaminhoCritico) {
    for (const rel of relacoes) {
      const ant = tarefaMap.get(rel.antecessoraId)
      const suc = tarefaMap.get(rel.sucessoraId)
      if (!ant || !suc) continue
      const folga = isoParaMs(suc.inicio) - isoParaMs(ant.fim)
      if (folga <= 86400000) {
        idsCaminhosCriticos.add(ant.id)
        idsCaminhosCriticos.add(suc.id)
      }
    }
  }

  // Responsáveis únicos para legenda
  const responsaveisUnicos = Array.from(
    new Set(tarefas.map((t) => t.responsavel).filter(Boolean) as string[])
  ).sort()

  const hojePx = msParaPx(Date.now())
  const hojeVisivel = hojePx >= 0 && hojePx <= larguraArea

  const meses: { label: string; pct: number }[] = []
  const cur = new Date(inicioTotal)
  cur.setUTCDate(1)
  while (cur.getTime() <= fimTotal) {
    meses.push({
      label: cur.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }),
      pct: (cur.getTime() - inicioTotal) / totalMs,
    })
    cur.setUTCMonth(cur.getUTCMonth() + 1)
  }

  function tarefaComPreview(tarefa: TarefaGantt) {
    const pv = preview.get(tarefa.id)
    return pv ? { ...tarefa, ...pv } : tarefa
  }

  function iniciarArrastar(e: React.MouseEvent, tarefa: TarefaGantt, tipo: TipoArrastar) {
    if (!podeEditar) return
    e.preventDefault()
    const t = tarefaComPreview(tarefa)
    setArrastando({
      tarefaId: tarefa.id,
      tipo,
      startX: e.clientX,
      startIni: isoParaMs(t.inicio),
      startFim: isoParaMs(t.fim),
    })
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!arrastando) return
    const dx = e.clientX - arrastando.startX
    const dms = pxParaMs(msParaPx(arrastando.startIni) + dx) - arrastando.startIni

    let novoIni = arrastando.startIni
    let novoFim = arrastando.startFim
    const minDuracao = MIN_DIAS * 86400000

    if (arrastando.tipo === "mover") {
      novoIni = arrastando.startIni + dms
      novoFim = arrastando.startFim + dms
    } else if (arrastando.tipo === "esquerda") {
      novoIni = Math.min(arrastando.startIni + dms, arrastando.startFim - minDuracao)
    } else {
      novoFim = Math.max(arrastando.startFim + dms, arrastando.startIni + minDuracao)
    }

    setPreview((prev) => {
      const next = new Map(prev)
      next.set(arrastando.tarefaId, { inicio: msParaIso(novoIni), fim: msParaIso(novoFim) })
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastando, larguraArea, inicioTotal, totalMs])

  const onMouseUp = useCallback(async () => {
    if (!arrastando) return
    const pv = preview.get(arrastando.tarefaId)
    setArrastando(null)
    if (!pv) return

    const temRelacoes = relacoes.some(
      (r) => r.antecessoraId === arrastando.tarefaId || r.sucessoraId === arrastando.tarefaId
    )

    if (podeEditar && temRelacoes) {
      setPendentePropagacao({ tarefaId: arrastando.tarefaId, inicio: pv.inicio, fim: pv.fim })
      setOpcaoCascade(false)
      return
    }

    // Snapshot antes de salvar (para desfazer)
    const snapshot = tarefasRef.current.map(t => ({ id: t.id, inicio: t.inicio.split("T")[0], fim: t.fim.split("T")[0] }))
    setHistoricoAcoes(prev => [...prev.slice(-9), snapshot])

    setSalvando((prev) => new Set(prev).add(arrastando.tarefaId))
    try {
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versao}/tarefas/${arrastando.tarefaId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inicio: pv.inicio, fim: pv.fim }),
        }
      )
      if (res.ok) {
        onAtualizar([{ id: arrastando.tarefaId, inicio: pv.inicio, fim: pv.fim }])
        setPreview((prev) => { const next = new Map(prev); next.delete(arrastando.tarefaId); return next })
      } else {
        setPreview((prev) => { const next = new Map(prev); next.delete(arrastando.tarefaId); return next })
        setHistoricoAcoes(prev => prev.slice(0, -1))
      }
    } finally {
      setSalvando((prev) => { const next = new Set(prev); next.delete(arrastando.tarefaId); return next })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastando, preview, obraId, versao, relacoes, podeEditar])

  useEffect(() => {
    if (arrastando) {
      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("mouseup", onMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [arrastando, onMouseMove, onMouseUp])

  async function confirmarPropagacao() {
    if (!pendentePropagacao) return
    const { tarefaId, inicio, fim } = pendentePropagacao
    const cascadeEscolhido = opcaoCascade
    setPendentePropagacao(null)

    // Snapshot antes de salvar (para desfazer)
    const snapshot = tarefasRef.current.map(t => ({ id: t.id, inicio: t.inicio.split("T")[0], fim: t.fim.split("T")[0] }))
    setHistoricoAcoes(prev => [...prev.slice(-9), snapshot])

    setSalvando((prev) => new Set(prev).add(tarefaId))
    try {
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versao}/tarefas/${tarefaId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inicio, fim, cascadeRelacoes: cascadeEscolhido }),
        }
      )
      if (res.ok) {
        onAtualizar([{ id: tarefaId, inicio, fim }])
        setPreview((prev) => { const next = new Map(prev); next.delete(tarefaId); return next })
        if (cascadeEscolhido !== false) onRecarregar?.()
      } else {
        setPreview((prev) => { const next = new Map(prev); next.delete(tarefaId); return next })
        setHistoricoAcoes(prev => prev.slice(0, -1))
      }
    } finally {
      setSalvando((prev) => { const next = new Set(prev); next.delete(tarefaId); return next })
    }
  }

  function cancelarPropagacao() {
    if (!pendentePropagacao) return
    const id = pendentePropagacao.tarefaId
    setPendentePropagacao(null)
    setPreview((prev) => { const next = new Map(prev); next.delete(id); return next })
  }

  async function desfazer() {
    if (historicoAcoes.length === 0 || desfazendo) return
    const snapshot = historicoAcoes[historicoAcoes.length - 1]
    setHistoricoAcoes(prev => prev.slice(0, -1))
    setDesfazendo(true)
    try {
      const mapAtual = new Map(tarefasRef.current.map(t => [t.id, t]))
      const mudancas = snapshot.filter(s => {
        const t = mapAtual.get(s.id)
        if (!t) return false
        return t.inicio.split("T")[0] !== s.inicio || t.fim.split("T")[0] !== s.fim
      })
      if (mudancas.length > 0) {
        await Promise.all(mudancas.map(({ id, inicio, fim }) =>
          fetch(`/api/obras/${obraId}/cronograma/${versao}/tarefas/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inicio, fim, cascadeRelacoes: false }),
          })
        ))
        setPreview(prev => {
          const next = new Map(prev)
          mudancas.forEach(({ id }) => next.delete(id))
          return next
        })
        onRecarregar?.()
      }
    } finally {
      setDesfazendo(false)
    }
  }

  // Tooltip rico — encontra tarefa pelo ID
  const tarefaTooltip = tooltip ? tarefas.find((t) => t.id === tooltip.tarefaId) : null
  const tarefaTooltipPreview = tarefaTooltip ? tarefaComPreview(tarefaTooltip) : null

  function renderTooltip() {
    if (!tooltip || !tarefaTooltip || !tarefaTooltipPreview) return null
    const hojeMs = Date.now()
    const fimMs = isoParaMs(tarefaTooltipPreview.fim)
    const inicioMs = isoParaMs(tarefaTooltipPreview.inicio)
    const duracaoDias = Math.max(1, Math.round((fimMs - inicioMs) / 86400000))
    const diasRestantes = Math.round((fimMs - hojeMs) / 86400000)
    const nome = tarefaTooltipPreview.nomeTraduzido ?? tarefaTooltip.nome

    let statusTempo: string
    if (tarefaTooltip.percentualConcluido >= 100) {
      statusTempo = "Concluído"
    } else if (diasRestantes > 0) {
      statusTempo = `${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""} restante${diasRestantes !== 1 ? "s" : ""}`
    } else if (diasRestantes === 0) {
      statusTempo = "Vence hoje"
    } else {
      statusTempo = `${Math.abs(diasRestantes)} dia${Math.abs(diasRestantes) !== 1 ? "s" : ""} de atraso`
    }

    return (
      <div
        className="fixed z-50 pointer-events-none"
        style={{ left: tooltip.x + 14, top: tooltip.y - 8 }}
      >
        <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2.5 text-xs w-52 space-y-1.5">
          <p className="font-semibold leading-tight line-clamp-2 text-white/95">{nome}</p>
          <div className="border-t border-white/10 pt-1.5 space-y-1">
            {tarefaTooltip.responsavel && (
              <div className="flex justify-between gap-2">
                <span className="text-white/50">Responsável</span>
                <span className="text-white/90 truncate">{tarefaTooltip.responsavel}</span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-white/50">Início</span>
              <span className="text-white/90">{formatarData(tarefaTooltipPreview.inicio)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-white/50">Fim</span>
              <span className="text-white/90">{formatarData(tarefaTooltipPreview.fim)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-white/50">Duração</span>
              <span className="text-white/90">{duracaoDias} dia{duracaoDias !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-white/50">Prazo</span>
              <span className={`font-medium ${diasRestantes < 0 && tarefaTooltip.percentualConcluido < 100 ? "text-red-400" : "text-white/90"}`}>
                {statusTempo}
              </span>
            </div>
          </div>
          <div className="pt-0.5">
            <div className="flex justify-between text-[10px] text-white/50 mb-1">
              <span>Progresso</span>
              <span>{tarefaTooltip.percentualConcluido}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${tarefaTooltip.percentualConcluido}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Setas SVG de dependência
  const tarefaIndexMap = new Map(tarefas.map((t, i) => [t.id, i]))
  const svgH = HEADER_H + tarefas.length * LINHA_H
  const svgW = nomeW + larguraArea + 20

  function renderSetas() {
    if (relacoes.length === 0) return null
    const caminhos: React.ReactNode[] = []

    for (const rel of relacoes) {
      const idxAnt = tarefaIndexMap.get(rel.antecessoraId)
      const idxSuc = tarefaIndexMap.get(rel.sucessoraId)
      if (idxAnt === undefined || idxSuc === undefined) continue

      const ant = tarefaComPreview(tarefas[idxAnt])
      const suc = tarefaComPreview(tarefas[idxSuc])

      const startX = nomeW + msParaPx(isoParaMs(ant.fim))
      const startY = HEADER_H + idxAnt * LINHA_H + LINHA_H / 2
      const endX = nomeW + msParaPx(isoParaMs(suc.inicio))
      const endY = HEADER_H + idxSuc * LINHA_H + LINHA_H / 2

      let d: string
      if (endX >= startX + 10) {
        const midX = (startX + endX) / 2
        d = `M ${startX},${startY} H ${midX} V ${endY} H ${endX}`
      } else {
        // Dependência inversa: contornar pela direita
        const deslocamento = startX + 20
        d = `M ${startX},${startY} H ${deslocamento} V ${endY} H ${endX}`
      }

      caminhos.push(
        <path
          key={`${rel.antecessoraId}-${rel.sucessoraId}`}
          d={d}
          stroke="#94a3b8"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#gantt-seta)"
        />
      )
    }

    if (caminhos.length === 0) return null

    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none z-20"
        width={svgW}
        height={svgH}
        style={{ overflow: "visible" }}
      >
        <defs>
          <marker id="gantt-seta" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
          </marker>
        </defs>
        {caminhos}
      </svg>
    )
  }

  return (
    <div className={`relative select-none${telaCheia ? " bg-white p-4 overflow-auto" : ""}`} ref={containerRef}>
      {renderTooltip()}

      {/* Diálogo de propagação */}
      {pendentePropagacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[380px] max-w-[95vw] p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Propagar alteração</h3>
            <p className="text-sm text-gray-500 mb-4">Esta tarefa possui dependências. Como aplicar a mudança?</p>
            <div className="space-y-2">
              {(
                [
                  { value: false, label: "Apenas esta tarefa", desc: "Não altera datas das dependências" },
                  { value: "imediatas" as const, label: "Esta + dependências imediatas", desc: "Propaga o delta para sucessoras diretas" },
                  { value: true, label: "Cascata completa", desc: "Propaga para todas as subsequentes" },
                ] as { value: OpcaoCascade; label: string; desc: string }[]
              ).map(({ value, label, desc }) => (
                <label
                  key={String(value)}
                  className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${
                    opcaoCascade === value ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="cascade"
                    className="mt-0.5 accent-blue-600"
                    checked={opcaoCascade === value}
                    onChange={() => setOpcaoCascade(value)}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={cancelarPropagacao}
                className="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPropagacao}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar de toggles do Gantt */}
      <div className="flex items-center gap-2 mb-2 flex-wrap" style={telaCheia ? { paddingTop: "4px" } : undefined}>
        {podeEditar && (
          <button
            onClick={desfazer}
            disabled={historicoAcoes.length === 0 || desfazendo}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              historicoAcoes.length > 0 && !desfazendo
                ? "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                : "bg-white border-gray-100 text-gray-300 cursor-not-allowed"
            }`}
            title="Desfazer última ação (Ctrl+Z)"
          >
            {desfazendo ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Desfazer
            {historicoAcoes.length > 0 && !desfazendo && (
              <span className="ml-0.5 text-[9px] text-gray-400">({historicoAcoes.length})</span>
            )}
          </button>
        )}
        <button
          onClick={() => setMostrarCaminhoCritico((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            mostrarCaminhoCritico
              ? "bg-red-50 border-red-300 text-red-700"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
          title="Destaca tarefas no caminho crítico (folga ≤ 1 dia)"
        >
          <AlertTriangle className="h-3 w-3" />
          Caminho Crítico
        </button>
        <div className="flex items-center rounded-md border border-gray-200 overflow-hidden text-xs">
          <button
            onClick={() => setModoCor("status")}
            className={`px-2.5 py-1 transition-colors ${
              modoCor === "status" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setModoCor("responsavel")}
            className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
              modoCor === "responsavel" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Users className="h-3 w-3" />
            Responsável
          </button>
        </div>

        <button
          onClick={toggleTelaCheia}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          title={telaCheia ? "Sair da tela cheia (Esc)" : "Expandir para tela cheia"}
        >
          {telaCheia ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          {telaCheia ? "Sair" : "Tela cheia"}
        </button>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white">
        <div className="relative" style={{ minWidth: nomeW + larguraArea + 20 }}>
          {/* Setas SVG de dependência */}
          {renderSetas()}

          {/* Header */}
          <div className="flex border-b bg-gray-50 sticky top-0 z-10">
            <div className="shrink-0 flex items-center px-3 text-xs font-semibold text-gray-500 relative group" style={{ width: nomeW, height: HEADER_H }}>
              Tarefa
              <div
                className="absolute right-0 top-0 h-full w-2 cursor-col-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                onMouseDown={(e) => {
                  e.preventDefault()
                  resizandoNomeRef.current = { startX: e.clientX, startW: nomeW }
                }}
                title="Arrastar para redimensionar"
              >
                <GripVertical className="h-3 w-3 text-gray-400" />
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden" style={{ height: HEADER_H }}>
              {meses.map((m, i) => (
                <div
                  key={i}
                  className="absolute text-[10px] text-gray-400 font-medium top-1"
                  style={{ left: m.pct * larguraArea }}
                >
                  {m.label}
                </div>
              ))}
              {meses.map((m, i) => (
                <div
                  key={`l${i}`}
                  className="absolute top-0 bottom-0 border-l border-gray-300"
                  style={{ left: m.pct * larguraArea }}
                />
              ))}
              {hojeVisivel && (
                <>
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-rose-500 z-20"
                    style={{ left: hojePx }}
                  />
                  <div
                    className="absolute bottom-0 text-[9px] font-bold text-rose-500 z-20 -translate-x-1/2 leading-none pb-0.5"
                    style={{ left: hojePx }}
                  >
                    hoje
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Linhas de tarefa */}
          {tarefas.map((tarefa) => {
            const t = tarefaComPreview(tarefa)
            const iniPx = msParaPx(isoParaMs(t.inicio))
            const fimPx = msParaPx(isoParaMs(t.fim))
            const largBarra = Math.max(4, fimPx - iniPx)
            const cor = modoCor === "responsavel" && tarefa.responsavel
              ? hashCorResponsavel(tarefa.responsavel)
              : corPorStatus(tarefa.statusManual, t.inicio, t.fim)
            const ehCritico = idsCaminhosCriticos.has(tarefa.id)
            const estaArrastando = arrastando?.tarefaId === tarefa.id
            const estaSalvando = salvando.has(tarefa.id)
            const nome = t.nomeTraduzido ?? tarefa.nome

            return (
              <div
                key={tarefa.id}
                className={`flex border-b transition-colors ${estaArrastando ? "bg-blue-50" : "hover:bg-gray-50"}`}
                style={{ height: LINHA_H }}
              >
                {/* Nome */}
                <div
                  className="shrink-0 flex items-center gap-1.5 px-2 border-r"
                  style={{ width: nomeW, height: LINHA_H }}
                >
                  {estaSalvando && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-blue-500" />}
                  <span className="text-xs truncate text-gray-700" title={nome}>{tarefa.idExterno} — {nome}</span>
                </div>

                {/* Área da barra */}
                <div className="relative flex-1" style={{ height: LINHA_H }}>
                  {meses.map((m, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-gray-200"
                      style={{ left: m.pct * larguraArea }}
                    />
                  ))}

                  {hojeVisivel && (
                    <div
                      className="absolute top-0 bottom-0 border-l-2 border-rose-500/40 z-10 pointer-events-none"
                      style={{ left: hojePx }}
                    />
                  )}

                  {/* Barra */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 rounded flex items-center justify-between group overflow-hidden ${podeEditar && !estaSalvando ? "cursor-grab active:cursor-grabbing" : ""}`}
                    style={{
                      left: iniPx,
                      width: largBarra,
                      height: 22,
                      background: cor,
                      opacity: estaArrastando ? 0.75 : 0.85,
                      outline: ehCritico ? "2px solid #ef4444" : undefined,
                      outlineOffset: ehCritico ? "1px" : undefined,
                    }}
                    onMouseDown={(e) => iniciarArrastar(e, tarefa, "mover")}
                    onMouseEnter={(e) => setTooltip({ tarefaId: tarefa.id, x: e.clientX, y: e.clientY })}
                    onMouseMove={(e) => setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {/* Handle esquerdo */}
                    {podeEditar && largBarra > 12 && (
                      <div
                        className="h-full w-2.5 rounded-l cursor-ew-resize bg-black/20 hover:bg-black/40 shrink-0 z-10 relative"
                        onMouseDown={(e) => { e.stopPropagation(); iniciarArrastar(e, tarefa, "esquerda") }}
                      />
                    )}

                    {/* % conclusão */}
                    {tarefa.percentualConcluido > 0 && (
                      <div
                        className="absolute top-0 left-0 h-full bg-white/30 pointer-events-none"
                        style={{ width: `${Math.min(100, tarefa.percentualConcluido)}%` }}
                      />
                    )}

                    {largBarra > 40 && (
                      <span className="text-[9px] text-white font-medium truncate px-1 flex-1 text-center pointer-events-none z-10 relative">
                        {tarefa.percentualConcluido > 0 ? `${tarefa.percentualConcluido}%` : tarefa.idExterno}
                      </span>
                    )}

                    {/* Handle direito */}
                    {podeEditar && largBarra > 12 && (
                      <div
                        className="h-full w-2.5 rounded-r cursor-ew-resize bg-black/20 hover:bg-black/40 shrink-0 z-10 relative"
                        onMouseDown={(e) => { e.stopPropagation(); iniciarArrastar(e, tarefa, "direita") }}
                      />
                    )}
                  </div>

                  {/* Barra de baseline */}
                  {tarefa.inicioBaseline && tarefa.fimBaseline && (() => {
                    const baseIniPx = msParaPx(isoParaMs(tarefa.inicioBaseline))
                    const baseFimPx = msParaPx(isoParaMs(tarefa.fimBaseline))
                    const baseLarg = Math.max(2, baseFimPx - baseIniPx)
                    return (
                      <div
                        className="absolute rounded-sm pointer-events-none"
                        style={{ left: baseIniPx, width: baseLarg, height: 4, bottom: 3, background: "#9ca3af", opacity: 0.85 }}
                      />
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {modoCor === "status" ? (
          <>
            {[
              { cor: "#10b981", label: "Em andamento" },
              { cor: "#f97316", label: "Com interferência" },
              { cor: "#ef4444", label: "Atrasado / vencido" },
              { cor: "#8b5cf6", label: "Reprogramar" },
              { cor: "#6b7280", label: "Concluído" },
              { cor: "#3b82f6", label: "Previsto" },
            ].map(({ cor, label }) => (
              <span key={label} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: cor }} />
                {label}
              </span>
            ))}
          </>
        ) : (
          <>
            {responsaveisUnicos.length > 0
              ? responsaveisUnicos.map((resp) => (
                  <span key={resp} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: hashCorResponsavel(resp) }} />
                    {resp}
                  </span>
                ))
              : <span className="text-[10px] text-gray-400">Sem responsáveis definidos</span>
            }
          </>
        )}
        {mostrarCaminhoCritico && (
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="inline-block w-3 h-3 rounded-sm shrink-0 border-2 border-red-500" style={{ background: "transparent" }} />
            Caminho crítico
          </span>
        )}
        {hojeVisivel && (
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="inline-block w-0.5 h-3 bg-rose-500 shrink-0" />
            Hoje
          </span>
        )}
        {relacoes.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <svg width="16" height="8" className="shrink-0">
              <line x1="0" y1="4" x2="10" y2="4" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M7,1 L7,7 L13,4 z" fill="#94a3b8" />
            </svg>
            Dependência
          </span>
        )}
        {tarefas.some((t) => t.inicioBaseline) && (
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="inline-block w-3 h-1 bg-gray-400 rounded-sm shrink-0" />
            Baseline
          </span>
        )}
      </div>
      {podeEditar && (
        <p className="text-[10px] text-gray-400 mt-1 text-right">
          Arraste as barras para mover · Handles nas extremidades para redimensionar
        </p>
      )}
    </div>
  )
}
