"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  ativo: boolean
}

export function EditarUsuarioForm({ usuario }: { usuario: Usuario }) {
  const router = useRouter()
  const [form, setForm] = useState({
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    ativo: usuario.ativo,
  })
  const [novaSenha, setNovaSenha] = useState("")
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSalvando(true)

    const body: Record<string, unknown> = { ...form }
    if (novaSenha) body.senha = novaSenha

    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push("/admin/usuarios")
      router.refresh()
    } else {
      const data = await res.json()
      setErro(data.erro ?? "Erro ao salvar")
    }
    setSalvando(false)
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Voltar para Usuários
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editar Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={form.perfil} onValueChange={(v) => set("perfil", v ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="GESTAO">Gestão</SelectItem>
                  <SelectItem value="PRODUCAO">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={form.ativo ? "default" : "outline"}
                  onClick={() => set("ativo", true)}
                >
                  Ativo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!form.ativo ? "default" : "outline"}
                  onClick={() => set("ativo", false)}
                >
                  Inativo
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="novaSenha">Nova Senha <span className="text-gray-400 font-normal">(deixe em branco para manter)</span></Label>
              <Input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
              <Link href="/admin/usuarios">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
