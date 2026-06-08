"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, ToggleLeft, ToggleRight, Plus, CalendarDays } from "lucide-react"
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

interface Obra {
  id: number
  nome: string
  ativa: boolean
  criadoEm: string
}

interface ObrasListaProps {
  obras: Obra[]
  isAdmin: boolean
}

export function ObrasLista({ obras: inicial, isAdmin }: ObrasListaProps) {
  const [obras, setObras] = useState(inicial)
  const [carregando, setCarregando] = useState<number | null>(null)

  async function toggleAtiva(obra: Obra) {
    setCarregando(obra.id)
    const res = await fetch(`/api/obras/${obra.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativa: !obra.ativa }),
    })
    if (res.ok) {
      const atualizada = await res.json()
      setObras((prev) => prev.map((o) => (o.id === obra.id ? atualizada : o)))
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
      {/* Tabela desktop */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Nome
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
                <TableCell className="font-medium text-foreground">{obra.nome}</TableCell>
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
              <div>
                <p className="font-medium text-foreground">{obra.nome}</p>
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
