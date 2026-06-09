"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Languages,
  List,
  LayoutGrid,
  Trash2,
  Loader2,
  FileSpreadsheet,
  FileDown,
  Edit,
  Image,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { t } from "@/lib/i18n"
import * as XLSX from "xlsx"

interface Tarefa {
  id: number
  idExterno: string
  nome: string
  nomeTraduzido: string | null
  local: string
  quantidade: number
  unidade: string
  inicio: string
  fim: string
  ordem: number
  jpgEditadoUrl: string | null
}

interface Props {
  obraId: number
  nomeObra: string
  versao: number
  tarefasIniciais: Tarefa[]
  podeEditar: boolean
  idioma: string
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function TarefaCard({
  tarefa,
  obraId,
  versao,
  podeEditar,
  idioma,
  removendoId,
  onRemover,
  onEditar,
}: {
  tarefa: Tarefa
  obraId: number
  versao: number
  podeEditar: boolean
  idioma: string
  removendoId: number | null
  onRemover: (t: Tarefa) => void
  onEditar: (t: Tarefa) => void
}) {
  const [expandido, setExpandido] = useState(false)
  const traducao = tarefa.nomeTraduzido ?? ""
  const longa = traducao.length > 200

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b">
        <span className="text-xs font-mono font-semibold text-gray-500">{tarefa.idExterno}</span>
        <span className="text-xs text-gray-400">
          {formatarData(tarefa.inicio)} → {formatarData(tarefa.fim)}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Nome original */}
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wide text-gray-400 mb-0.5">
            Nome original
          </p>
          <p className="text-sm text-gray-700">{tarefa.nome}</p>
        </div>

        {/* Tradução */}
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wide text-blue-500 mb-1">
            Tradução PT-BR
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className={`text-sm text-blue-900 leading-relaxed whitespace-pre-line ${!expandido && longa ? "line-clamp-3" : ""}`}>
              {traducao}
            </p>
            {longa && (
              <button
                onClick={() => setExpandido((v) => !v)}
                className="mt-1.5 flex items-center gap-0.5 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
              >
                {expandido ? (
                  <><ChevronUp className="h-3 w-3" /> Recolher</>
                ) : (
                  <><ChevronDown className="h-3 w-3" /> Ver completo</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Local */}
        {tarefa.local && (
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-600">Local:</span> {tarefa.local}
            {" · "}
            {tarefa.quantidade.toLocaleString("pt-BR")} {tarefa.unidade}
          </p>
        )}
      </div>

      {/* Ações */}
      {podeEditar && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t bg-gray-50/50">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onEditar(tarefa)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Link href={`/obras/${obraId}/cronograma/${versao}/tarefas/${tarefa.id}/editor`}>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <Image className="h-3 w-3 mr-1" />
                Imagens
              </Button>
            </Link>
          </div>
          <button
            onClick={() => onRemover(tarefa)}
            disabled={removendoId === tarefa.id}
            className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {removendoId === tarefa.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            {t(idioma, "excluirTraducao")}
          </button>
        </div>
      )}
    </div>
  )
}

export function TraduzidasView({ obraId, nomeObra, versao, tarefasIniciais, podeEditar, idioma }: Props) {
  const [tarefas, setTarefas] = useState(tarefasIniciais)
  const [visualizacao, setVisualizacao] = useState<"lista" | "cards">("cards")
  const [confirmando, setConfirmando] = useState<Tarefa | null>(null)
  const [removendoId, setRemovendoId] = useState<number | null>(null)
  const [erroRemover, setErroRemover] = useState<string | null>(null)

  const [editando, setEditando] = useState<Tarefa | null>(null)
  const [formEdicao, setFormEdicao] = useState({ nome: "", nomeTraduzido: "", local: "" })
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)

  const [modalEmail, setModalEmail] = useState(false)
  const [destinatario, setDestinatario] = useState("")
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [mensagemEmail, setMensagemEmail] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null)

  async function enviarPorEmail() {
    setEnviandoEmail(true)
    setMensagemEmail(null)
    try {
      const res = await fetch(`/api/obras/${obraId}/cronograma/${versao}/exportar-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinatario }),
      })
      const d = await res.json()
      if (!res.ok) setMensagemEmail({ tipo: "erro", texto: d.erro ?? "Erro ao enviar" })
      else setMensagemEmail({ tipo: "sucesso", texto: `Email enviado com ${d.total} tarefa${d.total !== 1 ? "s" : ""} para ${destinatario}` })
    } finally {
      setEnviandoEmail(false)
    }
  }

  const traduzidas = tarefas.filter((t) => t.nomeTraduzido)

  function abrirEdicao(tarefa: Tarefa) {
    setEditando(tarefa)
    setFormEdicao({
      nome: tarefa.nome,
      nomeTraduzido: tarefa.nomeTraduzido ?? "",
      local: tarefa.local,
    })
    setErroEdicao(null)
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvandoEdicao(true)
    setErroEdicao(null)
    try {
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versao}/tarefas/${editando.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: formEdicao.nome.trim(),
            nomeTraduzido: formEdicao.nomeTraduzido.trim() || null,
            local: formEdicao.local.trim(),
          }),
        }
      )
      if (!res.ok) {
        const data = await res.json()
        setErroEdicao(data.erro ?? "Erro ao salvar")
      } else {
        const atualizada = await res.json()
        setTarefas((prev) =>
          prev.map((item) =>
            item.id === editando.id
              ? { ...item, nome: atualizada.nome, nomeTraduzido: atualizada.nomeTraduzido, local: atualizada.local }
              : item
          )
        )
        setEditando(null)
      }
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function removerTraducao(tarefa: Tarefa) {
    setRemovendoId(tarefa.id)
    setErroRemover(null)
    try {
      const res = await fetch(
        `/api/obras/${obraId}/cronograma/${versao}/tarefas/${tarefa.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nomeTraduzido: null }),
        }
      )
      if (!res.ok) {
        const data = await res.json()
        setErroRemover(data.erro ?? "Erro ao remover tradução")
      } else {
        setTarefas((prev) =>
          prev.map((item) => (item.id === tarefa.id ? { ...item, nomeTraduzido: null } : item))
        )
      }
    } finally {
      setRemovendoId(null)
      setConfirmando(null)
    }
  }

  function exportarXLSX() {
    const dados = traduzidas.map((tarefa) => ({
      ID: tarefa.idExterno,
      TAREFA: tarefa.nomeTraduzido ?? tarefa.nome,
      "NOME ORIGINAL": tarefa.nome,
      LOCAL: tarefa.local,
      QUANTIDADE: tarefa.quantidade,
      UNIDADE: tarefa.unidade,
      "DATA INICIO": formatarData(tarefa.inicio),
      "DATA FIM": formatarData(tarefa.fim),
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Traduzidas")
    XLSX.writeFile(wb, `cronograma-v${versao}-traduzido.xlsx`)
  }

  function exportarPDF() {
    const linhas = traduzidas
      .map(
        (tarefa) => `
        <tr>
          <td>${tarefa.idExterno}</td>
          <td>${tarefa.nomeTraduzido ?? tarefa.nome}</td>
          <td style="color:#666;font-size:11px">${tarefa.nome}</td>
          <td>${tarefa.local}</td>
          <td>${tarefa.quantidade.toLocaleString("pt-BR")} ${tarefa.unidade}</td>
          <td>${formatarData(tarefa.inicio)}</td>
          <td>${formatarData(tarefa.fim)}</td>
        </tr>`
      )
      .join("")

    const html = `<!DOCTYPE html><html><head>
      <title>Cronograma Traduzido — ${nomeObra} v${versao}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:10px;margin:20px}
        h1{font-size:14px;margin-bottom:4px}
        p{font-size:11px;color:#666;margin:0 0 12px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:4px 6px;text-align:left}
        th{background:#f5f5f5;font-weight:bold}
      </style></head><body>
      <h1>Cronograma Traduzido — ${nomeObra}</h1>
      <p>Versão ${versao} · ${traduzidas.length} tarefas</p>
      <table>
        <thead><tr>
          <th>ID</th><th>Tradução PT-BR</th><th>Nome Original</th>
          <th>Local</th><th>Quantidade</th><th>Início</th><th>Fim</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
      </table></body></html>`

    const janela = window.open("", "_blank")
    if (janela) {
      janela.document.write(html)
      janela.document.close()
      setTimeout(() => janela.print(), 400)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href={`/obras/${obraId}/cronograma`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t(idioma, "voltarAoCronograma")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Languages className="h-6 w-6 text-blue-600" />
            {t(idioma, "tarefasTraduzidas")}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {nomeObra} · v{versao}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{traduzidas.length} traduzida{traduzidas.length !== 1 ? "s" : ""}</Badge>
          <Button size="sm" variant="outline" onClick={exportarXLSX} disabled={traduzidas.length === 0}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            XLSX
          </Button>
          <Button size="sm" variant="outline" onClick={exportarPDF} disabled={traduzidas.length === 0}>
            <FileDown className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
          {podeEditar && (
            <Button size="sm" variant="outline" onClick={() => { setModalEmail(true); setMensagemEmail(null) }} disabled={traduzidas.length === 0}>
              <Mail className="h-4 w-4 mr-1.5" />
              Email
            </Button>
          )}
          <div className="flex items-center gap-1 border rounded-md p-0.5 bg-gray-50">
            <button
              onClick={() => setVisualizacao("lista")}
              className={`p-1.5 rounded transition-colors ${visualizacao === "lista" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              title="Lista"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setVisualizacao("cards")}
              className={`p-1.5 rounded transition-colors ${visualizacao === "cards" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              title="Cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {erroRemover && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{erroRemover}</p>
      )}

      {traduzidas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Languages className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t(idioma, "semTarefasTraduzidas")}</p>
        </div>
      ) : visualizacao === "lista" ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 w-20">{t(idioma, "thId")}</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">{t(idioma, "nomeOriginal")}</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-blue-600">{t(idioma, "versaoPtBr")}</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">{t(idioma, "thLocal")}</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">{t(idioma, "thInicio")}</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">{t(idioma, "thFim")}</th>
                  {podeEditar && <th className="w-36 px-3 py-2.5"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {traduzidas.map((tarefa) => (
                  <tr key={tarefa.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-xs font-mono text-gray-400">{tarefa.idExterno}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-700">{tarefa.nome}</td>
                    <td className="px-3 py-2.5 text-sm text-blue-700 font-medium max-w-xs">
                      <p className="line-clamp-2">{tarefa.nomeTraduzido}</p>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-600">{tarefa.local}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-500">{formatarData(tarefa.inicio)}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-500">{formatarData(tarefa.fim)}</td>
                    {podeEditar && (
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => abrirEdicao(tarefa)}
                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border rounded px-1.5 py-0.5 hover:bg-gray-50 transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </button>
                          <Link href={`/obras/${obraId}/cronograma/${versao}/tarefas/${tarefa.id}/editor`}>
                            <button className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border rounded px-1.5 py-0.5 hover:bg-gray-50 transition-colors">
                              <Image className="h-3 w-3" />
                              Imagens
                            </button>
                          </Link>
                          <button
                            onClick={() => setConfirmando(tarefa)}
                            disabled={removendoId === tarefa.id}
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {removendoId === tarefa.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {traduzidas.map((tarefa) => (
            <TarefaCard
              key={tarefa.id}
              tarefa={tarefa}
              obraId={obraId}
              versao={versao}
              podeEditar={podeEditar}
              idioma={idioma}
              removendoId={removendoId}
              onRemover={setConfirmando}
              onEditar={abrirEdicao}
            />
          ))}
        </div>
      )}

      {/* Modal: Editar Tarefa */}
      <Dialog open={!!editando} onOpenChange={(open) => { if (!open) setEditando(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-gray-600" />
              Editar tarefa
            </DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-4 mt-1">
              <p className="text-xs text-gray-400 font-mono">ID: {editando.idExterno}</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome original</Label>
                <Input
                  value={formEdicao.nome}
                  onChange={(e) => setFormEdicao((p) => ({ ...p, nome: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tradução PT-BR</Label>
                <textarea
                  value={formEdicao.nomeTraduzido}
                  onChange={(e) => setFormEdicao((p) => ({ ...p, nomeTraduzido: e.target.value }))}
                  className="w-full min-h-[100px] text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                  placeholder="Deixe em branco para remover a tradução"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Local</Label>
                <Input
                  value={formEdicao.local}
                  onChange={(e) => setFormEdicao((p) => ({ ...p, local: e.target.value }))}
                  className="text-sm"
                />
              </div>
              {erroEdicao && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{erroEdicao}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setEditando(null)} disabled={salvandoEdicao}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={salvarEdicao} disabled={salvandoEdicao}>
                  {salvandoEdicao && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {salvandoEdicao ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar remover tradução */}
      <Dialog open={!!confirmando} onOpenChange={(open) => { if (!open) setConfirmando(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t(idioma, "confirmarExcluirTraducaoTitulo")}</DialogTitle>
          </DialogHeader>
          {confirmando && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t(idioma, "confirmarExcluirTraducaoDesc")}</p>
              <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded px-3 py-2">
                {confirmando.idExterno} — {confirmando.nome}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmando(null)}>
                  {t(idioma, "cancelar")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={removendoId === confirmando.id}
                  onClick={() => removerTraducao(confirmando)}
                >
                  {removendoId === confirmando.id && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  {t(idioma, "confirmar")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Enviar por e-mail */}
      <Dialog open={modalEmail} onOpenChange={(open) => { if (!open) { setModalEmail(false); setMensagemEmail(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Enviar cronograma por e-mail
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <p className="text-sm text-gray-600">
              Enviar <strong>{traduzidas.length} tarefas</strong> traduzidas em formato tabela para o e-mail abaixo:
            </p>
            <Input
              type="email"
              placeholder="destinatario@email.com"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              disabled={enviandoEmail}
            />
            {mensagemEmail && (
              <p className={`text-sm ${mensagemEmail.tipo === "sucesso" ? "text-green-600" : "text-red-600"}`}>
                {mensagemEmail.texto}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalEmail(false)} disabled={enviandoEmail}>
                Cancelar
              </Button>
              <Button size="sm" onClick={enviarPorEmail} disabled={enviandoEmail || !destinatario.trim()}>
                {enviandoEmail ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                {enviandoEmail ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
