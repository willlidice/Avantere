"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, UserMinus, UserPlus, PlusCircle, Trash2, Upload, FileText,
  AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Usuario {
  id: number
  nome: string
  email: string
  perfil: string
}

interface Aditivo {
  id: number
  tipo: "PRAZO" | "VALOR"
  descricao: string | null
  valor: number | null
  dataFim: string | null
  criadoEm: string
}

interface Documento {
  id: number
  nome: string
  url: string
  tipo: string | null
  tamanho: number | null
  criadoEm: string
}

interface Obra {
  id: number
  nome: string
  ativa: boolean
  cliente: string | null
  cnpjCliente: string | null
  cnpjObra: string | null
  cnoObra: string | null
  dataInicio: string | null
  dataFim: string | null
  escopo: string | null
  valorContrato: number | null
  aditivos: Aditivo[]
  documentos: Documento[]
}

interface EditarObraFormProps {
  obra: Obra
  vinculados: Usuario[]
  disponiveis: Usuario[]
}

const PERFIL_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  GESTAO: "Gestão",
  PRODUCAO: "Produção",
}

function formatarData(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function formatarTamanho(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EditarObraForm({ obra, vinculados: v, disponiveis: d }: EditarObraFormProps) {
  const router = useRouter()

  // Dados básicos
  const [nome, setNome] = useState(obra.nome)
  const [ativa, setAtiva] = useState(obra.ativa)

  // Dados do projeto
  const [cliente, setCliente] = useState(obra.cliente ?? "")
  const [cnpjCliente, setCnpjCliente] = useState(obra.cnpjCliente ?? "")
  const [cnpjObra, setCnpjObra] = useState(obra.cnpjObra ?? "")
  const [cnoObra, setCnoObra] = useState(obra.cnoObra ?? "")
  const [dataInicio, setDataInicio] = useState(obra.dataInicio ? obra.dataInicio.slice(0, 10) : "")
  const [dataFim, setDataFim] = useState(obra.dataFim ? obra.dataFim.slice(0, 10) : "")
  const [escopo, setEscopo] = useState(obra.escopo ?? "")
  const [valorContrato, setValorContrato] = useState(obra.valorContrato != null ? String(obra.valorContrato) : "")

  // Usuários
  const [vinculados, setVinculados] = useState(v)
  const [disponiveis, setDisponiveis] = useState(d)
  const [userSelecionado, setUserSelecionado] = useState("")

  // Aditivos
  const [aditivos, setAditivos] = useState<Aditivo[]>(obra.aditivos)
  const [novoAditivoTipo, setNovoAditivoTipo] = useState<"PRAZO" | "VALOR">("PRAZO")
  const [novoAditivoDesc, setNovoAditivoDesc] = useState("")
  const [novoAditivoValor, setNovoAditivoValor] = useState("")
  const [novoAditivoDataFim, setNovoAditivoDataFim] = useState("")
  const [aditivosAbertos, setAditivosAbertos] = useState(true)

  // Documentos
  const [documentos, setDocumentos] = useState<Documento[]>(obra.documentos)
  const [uploadando, setUploadando] = useState(false)
  const [documentosAbertos, setDocumentosAbertos] = useState(true)
  const inputFileRef = useRef<HTMLInputElement>(null)

  // Erros e loading
  const [erroForm, setErroForm] = useState("")
  const [erroVinculo, setErroVinculo] = useState("")
  const [erroAditivo, setErroAditivo] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function salvarObra(e: React.FormEvent) {
    e.preventDefault()
    setErroForm("")
    setSalvando(true)

    const res = await fetch(`/api/obras/${obra.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome, ativa,
        cliente: cliente || null,
        cnpjCliente: cnpjCliente || null,
        cnpjObra: cnpjObra || null,
        cnoObra: cnoObra || null,
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
        escopo: escopo || null,
        valorContrato: valorContrato ? parseFloat(valorContrato) : null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setErroForm(data.erro ?? "Erro ao salvar")
    } else {
      router.push("/obras")
      router.refresh()
    }
    setSalvando(false)
  }

  async function adicionarUsuario() {
    if (!userSelecionado) return
    setErroVinculo("")
    const userId = parseInt(userSelecionado)

    const res = await fetch(`/api/obras/${obra.id}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    if (res.ok) {
      const usuario = disponiveis.find((u) => u.id === userId)!
      setVinculados((prev) => [...prev, usuario])
      setDisponiveis((prev) => prev.filter((u) => u.id !== userId))
      setUserSelecionado("")
    } else {
      const data = await res.json()
      setErroVinculo(data.erro ?? "Erro ao vincular")
    }
  }

  async function removerUsuario(userId: number) {
    const res = await fetch(`/api/obras/${obra.id}/usuarios`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    if (res.ok) {
      const usuario = vinculados.find((u) => u.id === userId)!
      setDisponiveis((prev) => [...prev, usuario].sort((a, b) => a.nome.localeCompare(b.nome)))
      setVinculados((prev) => prev.filter((u) => u.id !== userId))
    }
  }

  async function adicionarAditivo() {
    setErroAditivo("")
    if (novoAditivoTipo === "PRAZO" && !novoAditivoDataFim) {
      setErroAditivo("Informe a nova data fim.")
      return
    }
    if (novoAditivoTipo === "VALOR" && !novoAditivoValor) {
      setErroAditivo("Informe o valor do aditivo.")
      return
    }

    const res = await fetch(`/api/obras/${obra.id}/aditivos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: novoAditivoTipo,
        descricao: novoAditivoDesc || null,
        valor: novoAditivoTipo === "VALOR" ? parseFloat(novoAditivoValor) : null,
        dataFim: novoAditivoTipo === "PRAZO" ? novoAditivoDataFim : null,
      }),
    })

    if (res.ok) {
      const aditivo = await res.json()
      setAditivos((prev) => [...prev, aditivo])
      setNovoAditivoDesc("")
      setNovoAditivoValor("")
      setNovoAditivoDataFim("")
    } else {
      const data = await res.json()
      setErroAditivo(data.erro ?? "Erro ao criar aditivo")
    }
  }

  async function removerAditivo(aditivoId: number) {
    const res = await fetch(`/api/obras/${obra.id}/aditivos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aditivoId }),
    })
    if (res.ok) setAditivos((prev) => prev.filter((a) => a.id !== aditivoId))
  }

  async function uploadDocumento(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setUploadando(true)

    const formData = new FormData()
    formData.append("arquivo", arquivo)

    const res = await fetch(`/api/obras/${obra.id}/documentos`, { method: "POST", body: formData })
    if (res.ok) {
      const doc = await res.json()
      setDocumentos((prev) => [doc, ...prev])
    }
    setUploadando(false)
    if (inputFileRef.current) inputFileRef.current.value = ""
  }

  async function removerDocumento(documentoId: number) {
    const res = await fetch(`/api/obras/${obra.id}/documentos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentoId }),
    })
    if (res.ok) setDocumentos((prev) => prev.filter((d) => d.id !== documentoId))
  }

  // Data fim efetiva: último aditivo de prazo ou dataFim da obra
  const ultimoAditivoPrazo = aditivos.filter((a) => a.tipo === "PRAZO").slice(-1)[0]
  const dataFimEfetiva = ultimoAditivoPrazo?.dataFim ?? (dataFim || null)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/obras" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Voltar para Obras
      </Link>

      {/* Dados básicos + dados do projeto */}
      <Card>
        <CardHeader>
          <CardTitle>Editar Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvarObra} className="space-y-5">
            {/* Nome + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nome">Nome da Obra *</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={ativa ? "default" : "outline"} onClick={() => setAtiva(true)}>Ativa</Button>
                  <Button type="button" size="sm" variant={!ativa ? "default" : "outline"} onClick={() => setAtiva(false)}>Inativa</Button>
                </div>
              </div>
            </div>

            <Separator />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dados do Projeto</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Input id="cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Razão social do cliente" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnpjCliente">CNPJ Cliente</Label>
                <Input id="cnpjCliente" value={cnpjCliente} onChange={(e) => setCnpjCliente(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnpjObra">CNPJ Obra</Label>
                <Input id="cnpjObra" value={cnpjObra} onChange={(e) => setCnpjObra(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cnoObra">CNO Obra</Label>
                <Input id="cnoObra" value={cnoObra} onChange={(e) => setCnoObra(e.target.value)} placeholder="CNO" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorContrato">Valor do Contrato (R$)</Label>
                <Input id="valorContrato" type="number" step="0.01" min="0" value={valorContrato} onChange={(e) => setValorContrato(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
              {dataFimEfetiva && ultimoAditivoPrazo && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Data fim efetiva: <strong>{formatarData(dataFimEfetiva)}</strong> (pelo último aditivo de prazo)
                  </p>
                </div>
              )}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="escopo">Escopo</Label>
                <Textarea id="escopo" value={escopo} onChange={(e) => setEscopo(e.target.value)} rows={3} placeholder="Descrição do escopo do projeto..." />
              </div>
            </div>

            {erroForm && <p className="text-sm text-red-600">{erroForm}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
              <Link href="/obras"><Button type="button" variant="outline">Cancelar</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Aditivos */}
      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setAditivosAbertos((v) => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle>Aditivos</CardTitle>
            {aditivosAbertos ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
        </CardHeader>
        {aditivosAbertos && (
          <CardContent className="space-y-4">
            {aditivos.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum aditivo cadastrado.</p>
            ) : (
              <ul className="space-y-2">
                {aditivos.map((a) => (
                  <li key={a.id} className="flex items-start justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.tipo === "PRAZO" ? "secondary" : "outline"}>
                          {a.tipo === "PRAZO" ? "Prazo" : "Valor"}
                        </Badge>
                        {a.tipo === "PRAZO" && a.dataFim && (
                          <span className="text-sm font-medium">Nova data fim: {formatarData(a.dataFim)}</span>
                        )}
                        {a.tipo === "VALOR" && a.valor != null && (
                          <span className="text-sm font-medium">+ R$ {a.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        )}
                      </div>
                      {a.descricao && <p className="text-xs text-gray-500 mt-0.5">{a.descricao}</p>}
                      <p className="text-xs text-gray-400">Criado em {formatarData(a.criadoEm)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removerAditivo(a.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Novo Aditivo</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNovoAditivoTipo("PRAZO")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${novoAditivoTipo === "PRAZO" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                >
                  De Prazo
                </button>
                <button
                  type="button"
                  onClick={() => setNovoAditivoTipo("VALOR")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${novoAditivoTipo === "VALOR" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                >
                  De Valor
                </button>
              </div>
              {novoAditivoTipo === "PRAZO" ? (
                <div className="space-y-1.5">
                  <Label>Nova Data Fim *</Label>
                  <Input type="date" value={novoAditivoDataFim} onChange={(e) => setNovoAditivoDataFim(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" min="0" value={novoAditivoValor} onChange={(e) => setNovoAditivoValor(e.target.value)} placeholder="0,00" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input value={novoAditivoDesc} onChange={(e) => setNovoAditivoDesc(e.target.value)} placeholder="Motivo do aditivo..." />
              </div>
              {erroAditivo && <p className="text-sm text-red-600">{erroAditivo}</p>}
              <Button type="button" variant="outline" size="sm" onClick={adicionarAditivo}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Aditivo
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Documentos */}
      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setDocumentosAbertos((v) => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle>Documentos</CardTitle>
            {documentosAbertos ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
        </CardHeader>
        {documentosAbertos && (
          <CardContent className="space-y-4">
            {documentos.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum documento anexado.</p>
            ) : (
              <ul className="space-y-2">
                {documentos.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline truncate block max-w-[220px]"
                        >
                          {doc.nome}
                        </a>
                        <p className="text-xs text-gray-400">{formatarTamanho(doc.tamanho)} · {formatarData(doc.criadoEm)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removerDocumento(doc.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Separator />

            <div>
              <input
                ref={inputFileRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={uploadDocumento}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputFileRef.current?.click()}
                disabled={uploadando}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadando ? "Enviando..." : "Anexar Documento"}
              </Button>
              <p className="text-xs text-gray-400 mt-1.5">PDF, Word, Excel, JPG, PNG · máx 20 MB</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Vínculo de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Vinculados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vinculados.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum usuário vinculado.</p>
          ) : (
            <ul className="space-y-2">
              {vinculados.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{u.nome}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{PERFIL_LABEL[u.perfil]}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => removerUsuario(u.id)}>
                      <UserMinus className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Adicionar Usuário</Label>
            <div className="flex gap-2">
              <Select value={userSelecionado} onValueChange={(v) => setUserSelecionado(v ?? "")}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um usuário..." />
                </SelectTrigger>
                <SelectContent>
                  {disponiveis.length === 0 ? (
                    <SelectItem value="__none" disabled>Todos os usuários já vinculados</SelectItem>
                  ) : (
                    disponiveis.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.nome} — {PERFIL_LABEL[u.perfil]}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button type="button" onClick={adicionarUsuario} disabled={!userSelecionado}>
                <UserPlus className="h-4 w-4 mr-2" />
                Vincular
              </Button>
            </div>
            {erroVinculo && <p className="text-sm text-red-600">{erroVinculo}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
