"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight, BookOpen, Bell, BellOff, Mail, Loader2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useIdioma } from "@/contexts/idioma-context"
import { t, type Idioma } from "@/lib/i18n"

const PERFIL_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  GESTAO: "Gestão",
  PRODUCAO: "Produção",
}

const IDIOMAS: { valor: Idioma; label: string }[] = [
  { valor: "pt", label: "Português (PT-BR)" },
  { valor: "en", label: "English" },
  { valor: "es", label: "Español" },
]

interface TarefaAviso {
  id: number
  idExterno: string
  nome: string
  nomeTraduzido: string | null
  local: string
  fim: string
  obraNome: string
  obraId: number | null
}

interface DadosUsuario {
  id: number
  nome: string
  email: string
  perfil: string
  idioma: string
  notifEmail: boolean
  notifDias: number
}

export default function ConfiguracoesPage() {
  const { idioma: idiomaCtx, setIdioma: setIdiomaCtx } = useIdioma()
  const [dados, setDados] = useState<DadosUsuario | null>(null)
  const [erroCarregar, setErroCarregar] = useState<string | null>(null)

  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [erroSenha, setErroSenha] = useState("")
  const [sucessoSenha, setSucessoSenha] = useState(false)
  const [carregandoSenha, setCarregandoSenha] = useState(false)

  const [idioma, setIdioma] = useState<Idioma>("pt")
  const [salvandoIdioma, setSalvandoIdioma] = useState(false)
  const [sucessoIdioma, setSucessoIdioma] = useState(false)

  const [notifEmail, setNotifEmail] = useState(false)
  const [notifDias, setNotifDias] = useState(7)
  const [salvandoNotif, setSalvandoNotif] = useState(false)
  const [sucessoNotif, setSucessoNotif] = useState(false)
  const [erroNotif, setErroNotif] = useState("")

  const [tarefasAviso, setTarefasAviso] = useState<TarefaAviso[] | null>(null)
  const [verificandoPrazos, setVerificandoPrazos] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [mensagemEmail, setMensagemEmail] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null)

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((d) => {
        if (d?.erro) { setErroCarregar(d.erro); return }
        setDados(d)
        const lang = d.idioma ?? "pt"
        setIdioma(lang as Idioma)
        setNotifEmail(d.notifEmail ?? false)
        setNotifDias(d.notifDias ?? 7)
      })
      .catch(() => setErroCarregar("Erro ao carregar configurações. Tente recarregar a página."))
  }, [])

  async function salvarNotificacoes() {
    setSucessoNotif(false)
    setErroNotif("")
    setSalvandoNotif(true)
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "notificacoes", notifEmail, notifDias }),
      })
      const d = await res.json()
      if (!res.ok) setErroNotif(d.erro ?? "Erro ao salvar")
      else setSucessoNotif(true)
    } finally {
      setSalvandoNotif(false)
    }
  }

  async function verificarPrazos() {
    setVerificandoPrazos(true)
    setTarefasAviso(null)
    try {
      const res = await fetch("/api/notificacoes")
      const d = await res.json()
      setTarefasAviso(d.tarefas ?? [])
    } finally {
      setVerificandoPrazos(false)
    }
  }

  async function enviarEmailNotificacao() {
    setEnviandoEmail(true)
    setMensagemEmail(null)
    try {
      const res = await fetch("/api/notificacoes", { method: "POST" })
      const d = await res.json()
      if (!res.ok) setMensagemEmail({ tipo: "erro", texto: d.erro ?? "Erro ao enviar" })
      else if (!d.enviado) setMensagemEmail({ tipo: "sucesso", texto: d.mensagem ?? "Nenhuma tarefa vencendo" })
      else setMensagemEmail({ tipo: "sucesso", texto: `Email enviado com ${d.total} tarefa${d.total !== 1 ? "s" : ""}` })
    } finally {
      setEnviandoEmail(false)
    }
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault()
    setErroSenha("")
    setSucessoSenha(false)

    if (novaSenha !== confirmarSenha) {
      setErroSenha(t(idiomaCtx, "senhasNaoCoincidem"))
      return
    }
    if (novaSenha.length < 8) {
      setErroSenha(t(idiomaCtx, "senhaMinimoChars"))
      return
    }

    setCarregandoSenha(true)
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "senha", senhaAtual, novaSenha }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErroSenha(data.erro ?? t(idiomaCtx, "erroAlterarSenha"))
      } else {
        setSucessoSenha(true)
        setSenhaAtual("")
        setNovaSenha("")
        setConfirmarSenha("")
      }
    } finally {
      setCarregandoSenha(false)
    }
  }

  async function salvarIdioma() {
    setSucessoIdioma(false)
    setSalvandoIdioma(true)
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "idioma", idioma }),
      })
      if (res.ok) {
        setSucessoIdioma(true)
        setIdiomaCtx(idioma)
      }
    } finally {
      setSalvandoIdioma(false)
    }
  }

  if (erroCarregar) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-red-500">
        <p className="text-sm font-medium">{erroCarregar}</p>
        <Button variant="outline" size="sm" onClick={() => { setErroCarregar(null); fetch("/api/configuracoes").then(r => r.json()).then(d => { if (d?.erro) { setErroCarregar(d.erro); return } setDados(d); setIdioma((d.idioma ?? "pt") as Idioma); setNotifEmail(d.notifEmail ?? false); setNotifDias(d.notifDias ?? 7) }).catch(() => setErroCarregar("Erro ao carregar configurações.")) }}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        {t(idiomaCtx, "carregando")}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
          {t(idiomaCtx, "conta")}
        </p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {t(idiomaCtx, "configuracoes")}
        </h1>
      </div>

      {/* Perfil */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t(idiomaCtx, "perfilLabel")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t(idiomaCtx, "nome")}</span>
            <span className="text-sm font-medium text-foreground">{dados.nome}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t(idiomaCtx, "emailLabel")}</span>
            <span className="text-sm font-medium text-foreground">{dados.email}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t(idiomaCtx, "perfilLabel")}</span>
            <Badge variant="outline">{PERFIL_LABEL[dados.perfil] ?? dados.perfil}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alterar senha */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t(idiomaCtx, "alterarSenha")}</CardTitle>
          <CardDescription>{t(idiomaCtx, "senhaMinimo")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={alterarSenha} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="senhaAtual">{t(idiomaCtx, "senhaAtualLabel")}</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="novaSenha">{t(idiomaCtx, "novaSenhaLabel")}</Label>
              <Input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenha">{t(idiomaCtx, "confirmarNovaSenhaLabel")}</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {erroSenha && <p className="text-sm text-red-600">{erroSenha}</p>}
            {sucessoSenha && <p className="text-sm text-green-600">{t(idiomaCtx, "senhaAlteradaSucesso")}</p>}

            <Button type="submit" disabled={carregandoSenha} className="w-full">
              {carregandoSenha ? t(idiomaCtx, "salvando") : t(idiomaCtx, "alterarSenhaBtn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Documentação */}
      <Link href="/configuracoes/documentacao">
        <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Documentação</p>
                <p className="text-xs text-muted-foreground">Ferramentas e tecnologias do Avantere</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </CardContent>
        </Card>
      </Link>

      {/* Notificações de prazo */}
      {dados.perfil !== "PRODUCAO" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              Notificações de prazo
            </CardTitle>
            <CardDescription>Receba alertas sobre tarefas com prazo se aproximando</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="notif-email"
                checked={notifEmail}
                onCheckedChange={(v) => setNotifEmail(!!v)}
              />
              <Label htmlFor="notif-email" className="flex items-center gap-1.5 cursor-pointer">
                <Mail className="h-3.5 w-3.5 text-gray-500" />
                Receber email de aviso de prazo
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="notif-dias" className="shrink-0 text-sm text-gray-600">Dias de antecedência:</Label>
              <Input
                id="notif-dias"
                type="number"
                min={1}
                max={90}
                value={notifDias}
                onChange={(e) => setNotifDias(Math.max(1, Math.min(90, parseInt(e.target.value) || 7)))}
                className="w-24"
              />
            </div>
            {erroNotif && <p className="text-sm text-red-600">{erroNotif}</p>}
            {sucessoNotif && <p className="text-sm text-green-600">Preferências salvas.</p>}
            <Button onClick={salvarNotificacoes} disabled={salvandoNotif} size="sm">
              {salvandoNotif ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar preferências
            </Button>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs text-gray-500">Verificar quais tarefas vencem nos próximos {notifDias} dias:</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={verificarPrazos} disabled={verificandoPrazos}>
                  {verificandoPrazos ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarDays className="h-4 w-4 mr-2" />}
                  Verificar prazos
                </Button>
                <Button variant="outline" size="sm" onClick={enviarEmailNotificacao} disabled={enviandoEmail}>
                  {enviandoEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Enviar email agora
                </Button>
              </div>
              {mensagemEmail && (
                <p className={`text-sm ${mensagemEmail.tipo === "sucesso" ? "text-green-600" : "text-red-600"}`}>
                  {mensagemEmail.texto}
                </p>
              )}
              {tarefasAviso !== null && tarefasAviso.length === 0 && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                  <BellOff className="h-4 w-4 text-gray-400" />
                  Nenhuma tarefa vencendo nos próximos {notifDias} dias.
                </p>
              )}
              {tarefasAviso && tarefasAviso.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  {tarefasAviso.map((tarefa) => (
                    <div key={tarefa.id} className="flex items-start gap-3 px-3 py-2.5 border-b last:border-0 bg-amber-50">
                      <CalendarDays className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{tarefa.nomeTraduzido ?? tarefa.nome}</p>
                        <p className="text-xs text-gray-500">{tarefa.obraNome} · {tarefa.local}</p>
                      </div>
                      <span className="text-xs font-semibold text-amber-700 shrink-0">
                        {new Date(tarefa.fim).toLocaleDateString("pt-BR", { timeZone: "UTC", dateStyle: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Idioma */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t(idiomaCtx, "idiomaLabel")}</CardTitle>
          <CardDescription>{t(idiomaCtx, "idiomaDescricaoConfig")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={idioma} onValueChange={(v) => v && setIdioma(v as Idioma)}>
            <SelectTrigger>
              <SelectValue placeholder={t(idiomaCtx, "selecionarIdiomaPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {IDIOMAS.map((i) => (
                <SelectItem key={i.valor} value={i.valor}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {sucessoIdioma && (
            <p className="text-sm text-green-600">{t(idiomaCtx, "idiomaAlteradoSucesso")}</p>
          )}

          <Button onClick={salvarIdioma} disabled={salvandoIdioma} className="w-full">
            {salvandoIdioma ? t(idiomaCtx, "salvando") : t(idiomaCtx, "salvarIdiomaBtn")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
