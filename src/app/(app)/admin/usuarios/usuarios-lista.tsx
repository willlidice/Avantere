"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, ToggleLeft, ToggleRight, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Usuario {
  id: number
  nome: string
  email: string
  perfil: string
  ativo: boolean
  criadoEm: string
}

const PERFIL_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  GESTAO: "Gestão",
  PRODUCAO: "Produção",
}

const PERFIL_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  GESTAO: "secondary",
  PRODUCAO: "outline",
}

export function UsuariosLista({ usuarios: inicial }: { usuarios: Usuario[] }) {
  const [usuarios, setUsuarios] = useState(inicial)
  const [carregando, setCarregando] = useState<number | null>(null)
  const [modalSenha, setModalSenha] = useState<Usuario | null>(null)
  const [novaSenha, setNovaSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  async function toggleAtivo(usuario: Usuario) {
    setCarregando(usuario.id)
    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !usuario.ativo }),
    })
    if (res.ok) {
      const atualizado = await res.json()
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, ativo: atualizado.ativo } : u)))
    }
    setCarregando(null)
  }

  function abrirModalSenha(usuario: Usuario) {
    setModalSenha(usuario)
    setNovaSenha("")
    setMostrarSenha(false)
    setErroSenha(null)
    setSucesso(null)
  }

  async function salvarSenha() {
    if (!modalSenha) return
    if (novaSenha.length < 6) {
      setErroSenha("Senha deve ter pelo menos 6 caracteres")
      return
    }
    setSalvandoSenha(true)
    setErroSenha(null)
    try {
      const res = await fetch(`/api/usuarios/${modalSenha.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: novaSenha }),
      })
      if (res.ok) {
        setSucesso(`Senha de ${modalSenha.nome} redefinida com sucesso.`)
        setNovaSenha("")
      } else {
        const data = await res.json()
        setErroSenha(data.erro ?? "Erro ao salvar")
      }
    } finally {
      setSalvandoSenha(false)
    }
  }

  if (usuarios.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">Nenhum usuário cadastrado.</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Nome</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Email</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Perfil</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id} className="hover:bg-accent/40 transition-colors">
                <TableCell className="font-medium text-foreground">{u.nome}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={PERFIL_VARIANT[u.perfil]}>{PERFIL_LABEL[u.perfil]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.ativo ? "default" : "secondary"}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/admin/usuarios/${u.id}/editar`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalSenha(u)}
                      title="Redefinir senha"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAtivo(u)}
                      disabled={carregando === u.id}
                    >
                      {carregando === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : u.ativo ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {usuarios.map((u) => (
          <div key={u.id} className="border rounded-lg p-4 bg-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{u.nome}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{u.email}</p>
                <div className="flex gap-1.5 mt-2">
                  <Badge variant={PERFIL_VARIANT[u.perfil]}>{PERFIL_LABEL[u.perfil]}</Badge>
                  <Badge variant={u.ativo ? "default" : "secondary"}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Link href={`/admin/usuarios/${u.id}/editar`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirModalSenha(u)}
                  title="Redefinir senha"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAtivo(u)}
                  disabled={carregando === u.id}
                >
                  {carregando === u.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : u.ativo ? (
                    <ToggleRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Redefinir Senha */}
      <Dialog open={!!modalSenha} onOpenChange={(open) => { if (!open) setModalSenha(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Redefinir senha
            </DialogTitle>
          </DialogHeader>
          {modalSenha && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Usuário</p>
                <p className="font-medium text-gray-900">{modalSenha.nome}</p>
                <p className="text-xs text-gray-500">{modalSenha.email}</p>
              </div>

              {sucesso ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-green-700">{sucesso}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Nova senha</Label>
                    <div className="relative">
                      <Input
                        type={mostrarSenha ? "text" : "password"}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pr-10"
                        onKeyDown={(e) => e.key === "Enter" && salvarSenha()}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Clique no olho para ver a senha antes de salvar.
                    </p>
                  </div>

                  {erroSenha && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                      {erroSenha}
                    </p>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setModalSenha(null)}>
                  {sucesso ? "Fechar" : "Cancelar"}
                </Button>
                {!sucesso && (
                  <Button size="sm" onClick={salvarSenha} disabled={salvandoSenha || !novaSenha}>
                    {salvandoSenha && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    {salvandoSenha ? "Salvando..." : "Salvar senha"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
