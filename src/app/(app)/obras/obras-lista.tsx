"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, ToggleLeft, ToggleRight, Plus, CalendarDays, Building2, X, MapPin, User, FileText, DollarSign, Calendar } from "lucide-react"
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

function CardDetalheObra({ obra, onFechar }: { obra: Obra; onFechar: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onFechar() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="truncate">{obra.nome}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <div className="flex items-center gap-2">
            <Badge variant={obra.ativa ? "default" : "secondary"}>
              {obra.ativa ? "Ativa" : "Inativa"}
            </Badge>
          </div>

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

          <div className="flex gap-2 pt-1">
            <Link href={`/obras/${obra.id}/cronograma`} className="flex-1">
              <Button className="w-full" size="sm">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                Ver Cronograma
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={onFechar}>
              Fechar
            </Button>
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
