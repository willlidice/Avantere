"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, ToggleLeft, ToggleRight, Plus, CalendarDays, Building2, X, MapPin, User, FileText, DollarSign, Calendar, ClipboardList, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Obra {
  id: number
  nome: string
  ativa: boolean
  criadoEm: string
  cliente?: string | null
  cnpjCliente?: string | null
  cnpjObra?: string | null
  cnoObra?: string | null
  dataInicio?: string | null
  dataFim?: string | null
  escopo?: string | null
  valorContrato?: number | null
}

interface ObrasListaProps {
  obras: Obra[]
  isAdmin: boolean
}

function formatarData(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function formatarMoeda(valor: number | null | undefined) {
  if (valor == null) return "—"
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const FERRAMENTAS_OBRA = [
  {
    href: (id: number) => `/obras/${id}/cronograma`,
    icone: CalendarDays,
    label: "Cronograma",
    descricao: "Planejamento e tarefas",
    cor: "text-amber-600",
    fundo: "bg-amber-50 hover:bg-amber-100 border-amber-200",
  },
  {
    href: (id: number) => `/obras/${id}/levantamento`,
    icone: ClipboardList,
    label: "Levantamento",
    descricao: "Materiais e quantitativos",
    cor: "text-blue-600",
    fundo: "bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
]

function CardDetalheObra({ obra, onFechar }: { obra: Obra; onFechar: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onFechar() }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Cabeçalho */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="truncate">{obra.nome}</span>
            <Badge variant={obra.ativa ? "default" : "secondary"} className="ml-auto shrink-0 text-[10px]">
              {obra.ativa ? "Ativa" : "Inativa"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Barra de ferramentas */}
        <div className="px-5 py-3 border-b bg-gray-50">
          <p className="text-[10px] text-gray-400 uppercase mb-2 font-medium tracking-wide">Ferramentas</p>
          <div className="grid grid-cols-2 gap-2">
            {FERRAMENTAS_OBRA.map(({ href, icone: Icone, label, descricao, cor, fundo }) => (
              <Link key={label} href={href(obra.id)} onClick={onFechar}>
                <div className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${fundo}`}>
                  <Icone className={`h-5 w-5 shrink-0 ${cor}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${cor}`}>{label}</p>
                    <p className="text-[10px] text-gray-500 truncate">{descricao}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400 ml-auto shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Detalhes da obra */}
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {obra.cnpjObra && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase mb-0.5 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> CNPJ da Obra
                </p>
                <p className="text-sm font-medium text-gray-800">{obra.cnpjObra}</p>
              </div>
            )}
            {obra.cnoObra && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase mb-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> CNO
                </p>
                <p className="text-sm font-medium text-gray-800">{obra.cnoObra}</p>
              </div>
            )}
            {obra.cliente && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase mb-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" /> Cliente
                </p>
                <p className="text-sm font-medium text-gray-800">{obra.cliente}</p>
              </div>
            )}
            {obra.cnpjCliente && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase mb-0.5 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> CNPJ Cliente
                </p>
                <p className="text-sm font-medium text-gray-800">{obra.cnpjCliente}</p>
              </div>
            )}
            {(obra.dataInicio || obra.dataFim) && (
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-[10px] text-gray-400 uppercase mb-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Período
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {formatarData(obra.dataInicio)} → {formatarData(obra.dataFim)}
                </p>
              </div>
            )}
            {obra.valorContrato != null && (
              <div className="bg-amber-50 rounded-lg p-3 col-span-2">
                <p className="text-[10px] text-amber-600 uppercase mb-0.5 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Valor do Contrato
                </p>
                <p className="text-sm font-semibold text-amber-800">{formatarMoeda(obra.valorContrato)}</p>
              </div>
            )}
            {obra.escopo && (
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-[10px] text-gray-400 uppercase mb-0.5">Escopo</p>
                <p className="text-sm text-gray-700 leading-relaxed">{obra.escopo}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ObrasLista({ obras: inicial, isAdmin }: ObrasListaProps) {
  const [obras, setObras] = useState(inicial)
  const [carregando, setCarregando] = useState<number | null>(null)
  const [obraDetalhe, setObraDetalhe] = useState<Obra | null>(null)

  async function toggleAtiva(obra: Obra) {
    setCarregando(obra.id)
    const res = await fetch(`/api/obras/${obra.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativa: !obra.ativa }),
    })
    if (res.ok) {
      const atualizada = await res.json()
      setObras((prev) => prev.map((o) => (o.id === obra.id ? { ...o, ativa: atualizada.ativa } : o)))
    }
    setCarregando(null)
  }

  if (obras.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">Nenhuma obra encontrada.</p>
        {isAdmin && (
          <Link href="/admin/obras/nova">
            <Button size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Criar Obra
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      {obraDetalhe && (
        <CardDetalheObra obra={obraDetalhe} onFechar={() => setObraDetalhe(null)} />
      )}

      {/* Tabela desktop */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Nome
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Cliente
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obras.map((obra) => (
              <TableRow key={obra.id} className="hover:bg-accent/40 transition-colors">
                <TableCell>
                  <button
                    onClick={() => setObraDetalhe(obra)}
                    className="font-medium text-foreground hover:text-amber-600 hover:underline transition-colors text-left"
                  >
                    {obra.nome}
                  </button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {obra.cliente ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={obra.ativa ? "default" : "secondary"}>
                    {obra.ativa ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/obras/${obra.id}/cronograma`}>
                      <Button variant="outline" size="sm">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                        Cronograma
                      </Button>
                    </Link>
                    {isAdmin && (
                      <>
                        <Link href={`/admin/obras/${obra.id}/editar`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAtiva(obra)}
                          disabled={carregando === obra.id}
                        >
                          {obra.ativa ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {obras.map((obra) => (
          <div key={obra.id} className="border rounded-lg p-4 bg-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setObraDetalhe(obra)}
                  className="font-medium text-foreground hover:text-amber-600 text-left"
                >
                  {obra.nome}
                </button>
                {obra.cliente && (
                  <p className="text-xs text-muted-foreground mt-0.5">{obra.cliente}</p>
                )}
                <Badge
                  variant={obra.ativa ? "default" : "secondary"}
                  className="mt-1.5"
                >
                  {obra.ativa ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Link href={`/obras/${obra.id}/cronograma`}>
                  <Button variant="outline" size="sm">
                    <CalendarDays className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                {isAdmin && (
                  <>
                    <Link href={`/admin/obras/${obra.id}/editar`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAtiva(obra)}
                      disabled={carregando === obra.id}
                    >
                      {obra.ativa ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
