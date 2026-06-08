"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Loader2, GripVertical } from "lucide-react"

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
}

interface Props {
  tarefas: TarefaGantt[]
  podeEditar: boolean
  obraId: number
  versao: number
  idioma?: string
  onAtualizar: (tarefaId: number, inicio: string, fim: string) => void
}

const LINHA_H = 34
const HEADER_H = 32
const MIN_DIAS = 1
const nomeW_MIN = 80
const nomeW_MAX = 500
const CORES = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6",
]

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

export function GanttInterativo({ tarefas, podeEditar, obraId, versao, onAtualizar }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [larguraArea, setLarguraArea] = useState(600)
  const [arrastando, setArrastando] = useState<Arrastando | null>(null)
  const [preview, setPreview] = useState<Map<number, { inicio: string; fim: string }>>(new Map())
  const [salvando, setSalvando] = useState<Set<number>>(new Set())
  const [tooltip, setTooltip] = useState<{ tarefaId: number; texto: string; x: number; y: number } | null>(null)
  const [nomeW, setNomeW] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gantt_nome_w")
      return saved ? Math.max(nomeW_MIN, Math.min(nomeW_MAX, parseInt(saved))) : 220
    }
    return 220
  })
  const resizandoNomeRef = useRef<{ startX: number; startW: number } | null>(null)

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
  // Adicionar 5% de margem
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

  // Meses no header
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
        onAtualizar(arrastando.tarefaId, pv.inicio, pv.fim)
      } else {
        // Reverter preview em caso de erro
        setPreview((prev) => { const next = new Map(prev); next.delete(arrastando.tarefaId); return next })
      }
    } finally {
      setSalvando((prev) => { const next = new Set(prev); next.delete(arrastando.tarefaId); return next })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastando, preview, obraId, versao])

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

  return (
    <div className="relative select-none" ref={containerRef}>
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.texto}
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg bg-white">
        <div style={{ minWidth: nomeW + larguraArea + 20 }}>
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
              {/* Linha vertical por mês */}
              {meses.map((m, i) => (
                <div
                  key={`l${i}`}
                  className="absolute top-0 bottom-0 border-l border-gray-200"
                  style={{ left: m.pct * larguraArea }}
                />
              ))}
            </div>
          </div>

          {/* Linhas de tarefa */}
          {tarefas.map((tarefa, idx) => {
            const t = tarefaComPreview(tarefa)
            const iniPx = msParaPx(isoParaMs(t.inicio))
            const fimPx = msParaPx(isoParaMs(t.fim))
            const largBarra = Math.max(4, fimPx - iniPx)
            const cor = CORES[idx % CORES.length]
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
                  {/* Linhas de mês */}
                  {meses.map((m, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-gray-100"
                      style={{ left: m.pct * larguraArea }}
                    />
                  ))}

                  {/* Barra */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 rounded flex items-center justify-between group ${podeEditar && !estaSalvando ? "cursor-grab active:cursor-grabbing" : ""}`}
                    style={{
                      left: iniPx,
                      width: largBarra,
                      height: 22,
                      background: cor,
                      opacity: estaArrastando ? 0.75 : 0.85,
                    }}
                    onMouseDown={(e) => iniciarArrastar(e, tarefa, "mover")}
                    onMouseEnter={(e) => setTooltip({ tarefaId: tarefa.id, texto: `${formatarData(t.inicio)} → ${formatarData(t.fim)}`, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {/* Handle esquerdo */}
                    {podeEditar && largBarra > 12 && (
                      <div
                        className="h-full w-2.5 rounded-l cursor-ew-resize bg-black/20 hover:bg-black/40 shrink-0"
                        onMouseDown={(e) => { e.stopPropagation(); iniciarArrastar(e, tarefa, "esquerda") }}
                      />
                    )}
                    {largBarra > 40 && (
                      <span className="text-[9px] text-white font-medium truncate px-1 flex-1 text-center pointer-events-none">
                        {tarefa.idExterno}
                      </span>
                    )}
                    {/* Handle direito */}
                    {podeEditar && largBarra > 12 && (
                      <div
                        className="h-full w-2.5 rounded-r cursor-ew-resize bg-black/20 hover:bg-black/40 shrink-0"
                        onMouseDown={(e) => { e.stopPropagation(); iniciarArrastar(e, tarefa, "direita") }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {podeEditar && (
        <p className="text-[10px] text-gray-400 mt-1.5 text-right">
          Arraste as barras para mover · Handles nas extremidades para redimensionar
        </p>
      )}
    </div>
  )
}
