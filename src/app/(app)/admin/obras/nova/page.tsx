"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NovaObraPage() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSalvando(true)

    const res = await fetch("/api/obras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    })

    if (res.ok) {
      router.push("/obras")
      router.refresh()
    } else {
      const data = await res.json()
      setErro(data.erro ?? "Erro ao criar obra")
    }
    setSalvando(false)
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/obras"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Voltar para Obras
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nova Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome da Obra</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Edifício Central Torre A"
                required
                autoFocus
              />
            </div>

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Criar Obra"}
              </Button>
              <Link href="/obras">
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
