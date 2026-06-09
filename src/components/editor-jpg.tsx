"use client"

import { useEffect, useRef, useState } from "react"
import { Stage, Layer, Image as KonvaImage, Line, Rect, Arrow, Text } from "react-konva"
import Konva from "konva"
import { Button } from "@/components/ui/button"
import {
  Pencil,
  Square,
  ArrowRight,
  Type,
  Undo2,
  Save,
  Upload,
  Trash2,
  Loader2,
  Check,
  Hand,
  Crop,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from "lucide-react"
import type { KonvaEventObject } from "konva/lib/Node"

type Ferramenta = "mover" | "lapis" | "retangulo" | "seta" | "texto" | "recortar"

interface LinhaLivre {
  tipo: "lapis"
  pontos: number[]
  cor: string
  espessura: number
}
interface RetanguloShape {
  tipo: "retangulo"
  x: number; y: number; largura: number; altura: number; cor: string; espessura: number
}
interface SetaShape {
  tipo: "seta"
  pontos: number[]
  cor: string
  espessura: number
}
interface TextoShape {
  tipo: "texto"
  x: number; y: number; texto: string; cor: string; tamanhoFonte: number
}
type Forma = LinhaLivre | RetanguloShape | SetaShape | TextoShape

interface RecorteArea { x: number; y: number; largura: number; altura: number }

interface Props {
  obraId: number
  versao: number
  tarefaId: number
  nomeTarefa: string
  jpgEditadoUrl?: string | null
  onSalvo?: (url: string) => void
  onCancelar?: () => void
}

const LARGURA_CANVAS = 900
const ALTURA_CANVAS = 600
const COR_PADRAO = "#e11d48"
const ESPESSURA_PADRAO = 3
const ZOOM_MIN = 0.25
const ZOOM_MAX = 8
const ZOOM_STEP = 1.3

export function EditorJpg({ obraId, versao, tarefaId, nomeTarefa, jpgEditadoUrl, onSalvo, onCancelar }: Props) {
  const [imagem, setImagem] = useState<HTMLImageElement | null>(null)
  const [formas, setFormas] = useState<Forma[]>([])
  const [historico, setHistorico] = useState<Forma[][]>([[]])
  const [indicePasso, setIndicePasso] = useState(0)
  const [ferramenta, setFerramenta] = useState<Ferramenta>("lapis")
  const [cor, setCor] = useState(COR_PADRAO)
  const [desenhando, setDesenhando] = useState(false)
  const [formaAtual, setFormaAtual] = useState<Forma | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null)
  const [carregandoPdf, setCarregandoPdf] = useState(false)

  // Zoom e pan
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  // Recorte
  const [recorte, setRecorte] = useState<RecorteArea | null>(null)
  const [recorteTemp, setRecorteTemp] = useState<RecorteArea | null>(null)

  const stageRef = useRef<Konva.Stage>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panStartRef = useRef<{ pos: { x: number; y: number }; px: number; py: number } | null>(null)

  useEffect(() => {
    if (!jpgEditadoUrl) return
    // Fetch como blob evita CORS taint no canvas
    fetch(jpgEditadoUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const img = new window.Image()
        img.src = url
        img.onload = () => setImagem(img)
      })
      .catch(() => {
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.src = jpgEditadoUrl
        img.onload = () => setImagem(img)
      })
  }, [jpgEditadoUrl])

  function registrarPasso(novasFormas: Forma[]) {
    const novo = historico.slice(0, indicePasso + 1)
    novo.push(novasFormas)
    setHistorico(novo)
    setIndicePasso(novo.length - 1)
    setFormas(novasFormas)
  }

  function desfazer() {
    if (indicePasso <= 0) return
    setIndicePasso(indicePasso - 1)
    setFormas(historico[indicePasso - 1])
  }

  function resetarVista() {
    setZoom(1); setPanX(0); setPanY(0)
    setRecorte(null); setRecorteTemp(null)
  }

  function alterarZoom(novoZoom: number, cx = LARGURA_CANVAS / 2, cy = ALTURA_CANVAS / 2) {
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, novoZoom))
    const contentX = (cx - panX) / zoom
    const contentY = (cy - panY) / zoom
    setPanX(cx - contentX * z)
    setPanY(cy - contentY * z)
    setZoom(z)
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const novoZoom = e.deltaY < 0 ? zoom * ZOOM_STEP : zoom / ZOOM_STEP
    alterarZoom(novoZoom, mx, my)
  }

  function contentPos(stage: Konva.Stage) {
    const pos = stage.getPointerPosition()
    if (!pos) return null
    return { x: (pos.x - panX) / zoom, y: (pos.y - panY) / zoom }
  }

  async function carregarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type === "application/pdf") {
      setCarregandoPdf(true)
      try {
        const pdfjs = await import("pdfjs-dist")
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
        const pagina = await pdf.getPage(1)
        const viewport = pagina.getViewport({ scale: 1.5 })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")!
        await pagina.render({ canvasContext: ctx, viewport, canvas }).promise
        const img = new window.Image()
        img.src = canvas.toDataURL("image/jpeg", 0.95)
        img.onload = () => { setImagem(img); setFormas([]); registrarPasso([]); resetarVista() }
      } catch {
        setMensagem({ tipo: "erro", texto: "Erro ao converter PDF. Tente um arquivo JPG/PNG." })
      } finally {
        setCarregandoPdf(false)
      }
    } else {
      const url = URL.createObjectURL(file)
      const img = new window.Image()
      img.src = url
      img.onload = () => { setImagem(img); setFormas([]); registrarPasso([]); resetarVista() }
    }
    e.target.value = ""
  }

  function handleMouseDown(e: KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = e.target.getStage()
    if (!stage) return

    if (ferramenta === "mover") {
      const pos = stage.getPointerPosition()
      if (pos) panStartRef.current = { pos, px: panX, py: panY }
      return
    }

    if (ferramenta === "recortar") {
      const pos = contentPos(stage)
      if (!pos) return
      setRecorteTemp({ x: pos.x, y: pos.y, largura: 0, altura: 0 })
      return
    }

    const pos = contentPos(stage)
    if (!pos) return
    setDesenhando(true)

    if (ferramenta === "lapis") {
      setFormaAtual({ tipo: "lapis", pontos: [pos.x, pos.y], cor, espessura: ESPESSURA_PADRAO })
    } else if (ferramenta === "retangulo") {
      setFormaAtual({ tipo: "retangulo", x: pos.x, y: pos.y, largura: 0, altura: 0, cor, espessura: ESPESSURA_PADRAO })
    } else if (ferramenta === "seta") {
      setFormaAtual({ tipo: "seta", pontos: [pos.x, pos.y, pos.x, pos.y], cor, espessura: ESPESSURA_PADRAO })
    } else if (ferramenta === "texto") {
      const texto = window.prompt("Digite o texto:")
      if (texto) registrarPasso([...formas, { tipo: "texto", x: pos.x, y: pos.y, texto, cor, tamanhoFonte: 18 }])
      setDesenhando(false)
    }
  }

  function handleMouseMove(e: KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = e.target.getStage()
    if (!stage) return

    if (ferramenta === "mover" && panStartRef.current) {
      const pos = stage.getPointerPosition()
      if (!pos) return
      setPanX(panStartRef.current.px + pos.x - panStartRef.current.pos.x)
      setPanY(panStartRef.current.py + pos.y - panStartRef.current.pos.y)
      return
    }

    if (ferramenta === "recortar" && recorteTemp) {
      const pos = contentPos(stage)
      if (!pos) return
      setRecorteTemp((prev) => prev ? { ...prev, largura: pos.x - prev.x, altura: pos.y - prev.y } : null)
      return
    }

    if (!desenhando || !formaAtual) return
    const pos = contentPos(stage)
    if (!pos) return

    if (formaAtual.tipo === "lapis") {
      setFormaAtual({ ...formaAtual, pontos: [...formaAtual.pontos, pos.x, pos.y] })
    } else if (formaAtual.tipo === "retangulo") {
      setFormaAtual({ ...formaAtual, largura: pos.x - formaAtual.x, altura: pos.y - formaAtual.y })
    } else if (formaAtual.tipo === "seta") {
      setFormaAtual({ ...formaAtual, pontos: [formaAtual.pontos[0], formaAtual.pontos[1], pos.x, pos.y] })
    }
  }

  function handleMouseUp() {
    if (ferramenta === "mover") {
      panStartRef.current = null
      return
    }
    if (ferramenta === "recortar") {
      if (recorteTemp && Math.abs(recorteTemp.largura) > 5 && Math.abs(recorteTemp.altura) > 5) {
        setRecorte(recorteTemp)
      }
      setRecorteTemp(null)
      return
    }
    if (!desenhando || !formaAtual) return
    setDesenhando(false)
    registrarPasso([...formas, formaAtual])
    setFormaAtual(null)
  }

  async function salvar() {
    const stage = stageRef.current
    if (!stage || !imagem) return
    setSalvando(true)
    setMensagem(null)

    try {
      // Resetar transforms para exportar em resolução nativa (sem flash — Konva usa RAF para redraw)
      const prevScale = stage.scale()
      const prevPos = stage.position()
      stage.scale({ x: 1, y: 1 })
      stage.position({ x: 0, y: 0 })

      const exportParams: Parameters<typeof stage.toDataURL>[0] = { mimeType: "image/jpeg", quality: 0.95, pixelRatio: 3 }

      if (recorte) {
        exportParams.x = recorte.largura < 0 ? recorte.x + recorte.largura : recorte.x
        exportParams.y = recorte.altura < 0 ? recorte.y + recorte.altura : recorte.y
        exportParams.width = Math.abs(recorte.largura)
        exportParams.height = Math.abs(recorte.altura)
      }

      const dataUrl = stage.toDataURL(exportParams)

      // Restaurar
      stage.scale(prevScale)
      stage.position(prevPos)

      // Converter base64 → blob (evita fetch(dataUrl) que pode falhar em alguns ambientes)
      const parts = dataUrl.split(",")
      const binary = atob(parts[1])
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: "image/jpeg" })

      const form = new FormData()
      form.append("jpg", blob, "editado.jpg")

      const resp = await fetch(`/api/obras/${obraId}/cronograma/${versao}/tarefas/${tarefaId}/jpg`, {
        method: "POST",
        body: form,
      })
      const data = await resp.json()

      if (!resp.ok) {
        setMensagem({ tipo: "erro", texto: data.erro ?? "Erro ao salvar" })
      } else {
        setMensagem({ tipo: "sucesso", texto: "JPG salvo com sucesso!" })
        onSalvo?.(data.jpgEditadoUrl)
      }
    } catch (err) {
      console.error("Erro ao salvar JPG:", err)
      setMensagem({ tipo: "erro", texto: "Erro ao exportar imagem. Tente recarregar o arquivo." })
    } finally {
      setSalvando(false)
    }
  }

  const todasFormas = formaAtual ? [...formas, formaAtual] : formas

  // Posição do overlay de recorte em coordenadas de tela
  const cropDisplay = recorteTemp ?? recorte
  const cropOverlay = cropDisplay && Math.abs(cropDisplay.largura) > 0 && Math.abs(cropDisplay.altura) > 0
    ? {
        left: ((cropDisplay.largura < 0 ? cropDisplay.x + cropDisplay.largura : cropDisplay.x) * zoom) + panX,
        top: ((cropDisplay.altura < 0 ? cropDisplay.y + cropDisplay.altura : cropDisplay.y) * zoom) + panY,
        width: Math.abs(cropDisplay.largura) * zoom,
        height: Math.abs(cropDisplay.altura) * zoom,
      }
    : null

  const cursorMap: Record<Ferramenta, string> = {
    mover: "grab", lapis: "crosshair", retangulo: "crosshair",
    seta: "crosshair", texto: "text", recortar: "crosshair",
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border rounded-lg">
        {/* Upload */}
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={carregarArquivo} />
        <Button size="sm" variant="outline" disabled={carregandoPdf} onClick={() => inputRef.current?.click()}>
          {carregandoPdf ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
          {carregandoPdf ? "Convertendo..." : "Abrir PDF/Imagem"}
        </Button>

        <div className="w-px h-6 bg-gray-200" />

        {/* Ferramentas */}
        {(
          [
            { id: "mover", Icon: Hand, label: "Mover / Pan" },
            { id: "lapis", Icon: Pencil, label: "Lápis livre" },
            { id: "retangulo", Icon: Square, label: "Retângulo" },
            { id: "seta", Icon: ArrowRight, label: "Seta" },
            { id: "texto", Icon: Type, label: "Texto" },
            { id: "recortar", Icon: Crop, label: "Definir área de recorte para exportação" },
          ] as { id: Ferramenta; Icon: React.ComponentType<{ className?: string }>; label: string }[]
        ).map(({ id, Icon, label }) => (
          <Button key={id} size="sm" variant={ferramenta === id ? "default" : "outline"} title={label} onClick={() => setFerramenta(id)}>
            <Icon className="h-4 w-4" />
          </Button>
        ))}

        {/* Cor */}
        <div className="flex items-center gap-1.5 ml-1">
          <label className="text-xs text-gray-600 font-medium">Cor:</label>
          <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-7 w-8 rounded cursor-pointer border" />
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" title="Zoom -" disabled={!imagem || zoom <= ZOOM_MIN} onClick={() => alterarZoom(zoom / ZOOM_STEP)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-600 w-14 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="outline" title="Zoom +" disabled={!imagem || zoom >= ZOOM_MAX} onClick={() => alterarZoom(zoom * ZOOM_STEP)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" title="Resetar visualização" disabled={!imagem || (zoom === 1 && panX === 0 && panY === 0)} onClick={resetarVista}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Undo + Limpar */}
        <Button size="sm" variant="outline" title="Desfazer" disabled={indicePasso <= 0} onClick={desfazer}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" title="Limpar anotações" disabled={formas.length === 0} onClick={() => registrarPasso([])}>
          <Trash2 className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {onCancelar && <Button size="sm" variant="ghost" onClick={onCancelar}>Cancelar</Button>}
        <Button size="sm" disabled={salvando || !imagem} onClick={salvar}>
          {salvando ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          {salvando ? "Salvando..." : recorte ? "Salvar Recorte" : "Salvar JPG"}
        </Button>
      </div>

      {/* Banner recorte ativo */}
      {recorte && !recorteTemp && (
        <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Crop className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            Recorte: <strong>{Math.abs(Math.round(recorte.largura))} × {Math.abs(Math.round(recorte.altura))} px</strong> — o JPG será salvo com essa área
          </span>
          <button onClick={() => setRecorte(null)} className="hover:text-blue-900 flex items-center gap-1 font-medium">
            <X className="h-3.5 w-3.5" /> Limpar
          </button>
        </div>
      )}

      {/* Feedback */}
      {mensagem && (
        <p className={`text-sm rounded px-3 py-2 border flex items-center gap-2 ${
          mensagem.tipo === "sucesso" ? "text-green-700 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"
        }`}>
          {mensagem.tipo === "sucesso" && <Check className="h-4 w-4 shrink-0" />}
          {mensagem.texto}
        </p>
      )}

      {/* Canvas */}
      <div className="border rounded-lg overflow-x-auto bg-gray-100">
        {!imagem ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
            <Upload className="h-12 w-12 opacity-30" />
            <p className="text-sm">Abra um arquivo PDF ou imagem para começar</p>
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Selecionar arquivo</Button>
          </div>
        ) : (
          <div
            className="relative overflow-hidden select-none mx-auto"
            style={{ width: LARGURA_CANVAS, height: ALTURA_CANVAS }}
            onWheel={handleWheel}
          >
            <Stage
              ref={stageRef}
              width={LARGURA_CANVAS}
              height={ALTURA_CANVAS}
              scaleX={zoom}
              scaleY={zoom}
              x={panX}
              y={panY}
              style={{ cursor: cursorMap[ferramenta] }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              <Layer>
                <KonvaImage image={imagem} x={0} y={0} width={LARGURA_CANVAS} height={ALTURA_CANVAS} listening={false} />
                {todasFormas.map((forma, i) => {
                  if (forma.tipo === "lapis") return (
                    <Line key={i} points={forma.pontos} stroke={forma.cor} strokeWidth={forma.espessura}
                      tension={0.5} lineCap="round" lineJoin="round" listening={false} />
                  )
                  if (forma.tipo === "retangulo") return (
                    <Rect key={i}
                      x={forma.largura < 0 ? forma.x + forma.largura : forma.x}
                      y={forma.altura < 0 ? forma.y + forma.altura : forma.y}
                      width={Math.abs(forma.largura)} height={Math.abs(forma.altura)}
                      stroke={forma.cor} strokeWidth={forma.espessura} fill="transparent" listening={false} />
                  )
                  if (forma.tipo === "seta") return (
                    <Arrow key={i} points={forma.pontos} stroke={forma.cor} fill={forma.cor}
                      strokeWidth={forma.espessura} pointerLength={12} pointerWidth={10} listening={false} />
                  )
                  if (forma.tipo === "texto") return (
                    <Text key={i} x={forma.x} y={forma.y} text={forma.texto}
                      fontSize={forma.tamanhoFonte} fill={forma.cor} fontStyle="bold" listening={false} />
                  )
                  return null
                })}
              </Layer>
            </Stage>

            {/* Overlay CSS do recorte — não é parte do canvas exportado */}
            {cropOverlay && (
              <div
                className="absolute pointer-events-none box-border"
                style={{
                  left: cropOverlay.left, top: cropOverlay.top,
                  width: cropOverlay.width, height: cropOverlay.height,
                  border: "2px dashed #3b82f6",
                  background: "rgba(59,130,246,0.07)",
                }}
              >
                <span className="absolute -top-5 left-0 text-[10px] font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                  {Math.abs(Math.round(cropDisplay!.largura))} × {Math.abs(Math.round(cropDisplay!.altura))}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {imagem && (
        <p className="text-xs text-gray-400 text-center">
          Scroll → zoom · <strong>Mover</strong> → arrastar · <strong>Recortar</strong> → define área exportada no JPG
        </p>
      )}
    </div>
  )
}
