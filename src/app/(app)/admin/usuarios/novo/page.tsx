"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nome: "", email: "", senha: "", perfil: "" })
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!form.perfil) { setErro("Selecione um perfil"); return }
    setSalvando(true)

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push("/admin/usuarios")
      router.refresh()
    } else {
      const data = await res.json()
      setErro(data.erro ?? "Erro ao criar usuário")
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
          <CardTitle>Novo Usuário</CardTitle>
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
                autoFocus
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
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={form.senha}
                onChange={(e) => set("senha", e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={form.perfil} onValueChange={(v) => set("perfil", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin — acesso total</SelectItem>
                  <SelectItem value="GESTAO">Gestão — cria e edita cronogramas</SelectItem>
                  <SelectItem value="PRODUCAO">Produção — somente visualização</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Criar Usuário"}
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
