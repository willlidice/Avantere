"use client"

import { useState } from "react"
import { Lightbulb, Send, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TIPOS = [
  { valor: "melhoria", label: "Melhoria em funcionalidade existente" },
  { valor: "novo-recurso", label: "Novo recurso ou funcionalidade" },
  { valor: "bug", label: "Correção de problema/bug" },
  { valor: "outro", label: "Outro" },
]

export default function SugestoesPage() {
  const [tipo, setTipo] = useState("")
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!tipo) { setErro("Selecione o tipo de sugestão"); return }
    if (descricao.trim().length < 20) { setErro("Descreva melhor sua sugestão (mínimo 20 caracteres)"); return }

    setEnviando(true)
    try {
      const res = await fetch("/api/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, titulo, descricao }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.erro ?? "Erro ao enviar")
      } else {
        setSucesso(true)
        setTipo("")
        setTitulo("")
        setDescricao("")
      }
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Sugestão enviada!</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Obrigado pelo seu feedback. Nossa equipe irá analisar e entrar em contato se necessário.
          </p>
          <Button variant="outline" onClick={() => setSucesso(false)}>
            Enviar outra sugestão
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Feedback
        </p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-amber-500" />
          Sugestões e Melhorias
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compartilhe suas ideias para melhorar o Avantere.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nova sugestão</CardTitle>
          <CardDescription>
            Sua opinião é fundamental para evoluirmos o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de sugestão *</Label>
              <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.valor} value={t.valor}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="titulo">Título (opcional)</Label>
              <Input
                id="titulo"
                placeholder="Resumo em uma frase..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva com detalhes o que você gostaria de ver melhorado ou implementado..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="min-h-[120px] resize-y"
                required
              />
              <p className="text-xs text-muted-foreground text-right">{descricao.length} caracteres</p>
            </div>

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{erro}</p>
            )}

            <Button type="submit" disabled={enviando} className="w-full">
              {enviando ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Enviar sugestão</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Sugestões são enviadas para <strong>suporte@avantere.com.br</strong> e analisadas pela equipe Avantere.
      </p>
    </div>
  )
}
