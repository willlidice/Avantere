"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import {
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  CalendarClock,
  HardHat,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Languages,
  FileSpreadsheet,
  Image,
  Search,
  X,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useIdioma } from "@/contexts/idioma-context"
import { t } from "@/lib/i18n"
import { statusTarefa } from "@/lib/status-tarefa"

interface TarefaImagem {
  id: number
  url: string
  nome: string
  ordem: number
}

interface Tarefa {
  id: number
  idExterno: string
  nome: string
  nomeTraduzido: string | null
  local: string
  quantidade: number
  unidade: string
  inicio: string
  fim: string
  ordem: number
  jpgEditadoUrl: string | null
  imagens: TarefaImagem[]
}

interface ObraComTarefas {
  obraId: number
  obraNome: string
  versao: number
  cronogramaId: number
  tarefas: Tarefa[]
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function diasRestantes(iso: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fim = new Date(iso)
  fim.setHours(0, 0, 0, 0)
  const diff = Math.round((fim.getTime() - hoje.getTime()) / 86400000)
  if (diff === 0) return "Hoje"
  if (diff === 1) return "Amanhã"
  return `${diff} dias`
}

function StatCard({
  icon: Icon,
  label,
  valor,
  cor,
  sub,
  onClick,
}: {
  icon: React.ElementType
  label: string
  valor: number
  cor: string
  sub?: string
  onClick?: () => void
}) {
  const base = "bg-white border rounded-xl p-5 space-y-3 transition-all"
  return onClick ? (
    <button onClick={onClick} className={`${base} hover:shadow-md hover:border-gray-300 cursor-pointer text-left w-full`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`p-2 rounded-lg ${cor}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{valor.toLocaleString("pt-BR")}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </button>
  ) : (
    <div className={base}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`p-2 rounded-lg ${cor}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{valor.toLocaleString("pt-BR")}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function ObraResumo({ obra, idioma }: { obra: ObraComTarefas; idioma: string }) {
  const [aberta, setAberta] = useState(false)
  const andamento = obra.tarefas.filter((t) => statusTarefa(t) === "andamento").length
  const futuras = obra.tarefas.filter((t) => statusTarefa(t) === "futura").length
  const concluidas = obra.tarefas.filter((t) => statusTarefa(t) === "concluida").length
  const total = obra.tarefas.length

  const statusConfig = {
    andamento: "bg-green-100 text-green-700 border-green-200",
    futura: "bg-blue-100 text-blue-700 border-blue-200",
    concluida: "bg-gray-100 text-gray-500 border-gray-200",
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
        onClick={() => setAberta((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
            <Building2 className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{obra.obraNome}</p>
            <p className="text-xs text-gray-400">{total} {t(idioma, "tarefasMenu").toLowerCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-green-700">{andamento} {t(idioma, "statusAndamento").toLowerCase()}</span>
          {aberta ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {aberta && (
        <div className="border-t px-4 pb-3 bg-gray-50/50 space-y-1.5 pt-3">
          {obra.tarefas.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">{t(idioma, "nenhumaObraDisponivel")}</p>
          ) : (
            obra.tarefas.map((tarefa) => {
              const status = statusTarefa(tarefa)
              return (
                <div key={tarefa.id} className="flex items-center gap-2 py-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusConfig[status]}`}>
                    {t(idioma, status === "andamento" ? "statusAndamento" : status === "futura" ? "statusFutura" : "statusConcluida")}
                  </span>
                  <span className="text-xs text-gray-700 truncate flex-1">
                    {tarefa.nomeTraduzido ?? tarefa.nome}
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0">{tarefa.idExterno}</span>
                </div>
              )
            })
          )}
          <div className="flex gap-3 pt-1 border-t mt-2">
            <span className="text-xs text-green-600 font-medium">{andamento} {t(idioma, "statusAndamento").toLowerCase()}</span>
            <span className="text-xs text-blue-600 font-medium">{futuras} {t(idioma, "statusFutura").toLowerCase()}</span>
            <span className="text-xs text-gray-500">{concluidas} {t(idioma, "statusConcluida").toLowerCase()}</span>
          </div>
        </div>
      )}
    </div>
  )
}

const FEATURES = [
  { icon: FileSpreadsheet, titulo: "Cronograma de Obra", desc: "Importe planilhas Excel com o cronograma da obra, com versionamento automático." },
  { icon: Languages, titulo: "Tradução por IA", desc: "Tradução automática das tarefas técnicas em instruções simples e claras para a equipe de produção." },
  { icon: Image, titulo: "Editor Visual", desc: "Edite e anote imagens diretamente nas tarefas, criando registros visuais do progresso." },
  { icon: Search, titulo: "Busca Global", desc: "Pesquise tarefas por nome, local, responsável ou ID em todas as obras vinculadas." },
]

function BannerBoasVindas() {
  const [fechado, setFechado] = useState(false)

  useEffect(() => {
    if (localStorage.getItem("avantere_boas_vindas_fechado") === "1") setFechado(true)
  }, [])

  if (fechado) return null

  function fechar() {
    localStorage.setItem("avantere_boas_vindas_fechado", "1")
    setFechado(true)
  }

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border border-amber-200 rounded-2xl p-6 overflow-hidden">
      <button
        onClick={fechar}
        className="absolute top-3 right-3 text-amber-400 hover:text-amber-700 transition-colors"
        title="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 bg-amber-500 rounded-xl">
          <HardHat className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-amber-900">Bem-vindo ao Avantere</h2>
          <p className="text-xs text-amber-700">Gestão inteligente de cronogramas de obra</p>
        </div>
      </div>
      <p className="text-sm text-amber-800 mb-4 leading-relaxed">
        O Avantere conecta gestores e equipes de produção em obras civis. Importe cronogramas Excel,
        deixe a IA traduzir as tarefas técnicas em instruções simples, e acompanhe o progresso em tempo real.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map(({ icon: Icon, titulo, desc }) => (
          <div key={titulo} className="flex gap-2.5 bg-white/60 rounded-lg p-3">
            <Icon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900">{titulo}</p>
              <p className="text-[11px] text-amber-700 leading-snug mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { idioma } = useIdioma()
  const [obras, setObras] = useState<ObraComTarefas[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modalTitulo, setModalTitulo] = useState<string | null>(null)
  const [modalTarefas, setModalTarefas] = useState<Array<{ id: number; idExterno: string; nome: string; nomeTraduzido: string | null; local: string; inicio: string; fim: string; obraNome: string }>>([])

  function abrirModal(titulo: string, lista: typeof modalTarefas) {
    setModalTitulo(titulo)
    setModalTarefas(lista)
  }

  useEffect(() => {
    fetch("/api/tarefas")
      .then((r) => r.json())
      .then((d) => {
        if (d.erro) setErro(d.erro)
        else setObras(d.obras ?? [])
      })
      .catch(() => setErro(t(idioma, "erroCarregarTarefas")))
      .finally(() => setCarregando(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{t(idioma, "carregando")}</span>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-48 gap-2 text-red-500">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">{erro}</span>
      </div>
    )
  }

  const todasTarefas = obras.flatMap((o) => o.tarefas)
  const total = todasTarefas.length
  const andamento = todasTarefas.filter((ta) => statusTarefa(ta) === "andamento").length
  const futuras = todasTarefas.filter((ta) => statusTarefa(ta) === "futura").length
  const concluidas = todasTarefas.filter((ta) => statusTarefa(ta) === "concluida").length

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const em7Dias = new Date(hoje)
  em7Dias.setDate(em7Dias.getDate() + 7)

  const vencendo = obras.flatMap((o) =>
    o.tarefas
      .filter((ta) => {
        const fim = new Date(ta.fim)
        return fim >= hoje && fim <= em7Dias
      })
      .map((ta) => ({ ...ta, obraNome: o.obraNome }))
  ).sort((a, b) => new Date(a.fim).getTime() - new Date(b.fim).getTime())

  const atrasadas = obras.flatMap((o) =>
    o.tarefas
      .filter((ta) => {
        if (statusTarefa(ta) === "concluida") return false
        const fim = new Date(ta.fim)
        return fim < hoje
      })
      .map((ta) => ({ ...ta, obraNome: o.obraNome }))
  ).sort((a, b) => new Date(a.fim).getTime() - new Date(b.fim).getTime())

  const nome = session?.user?.name ?? ""

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BannerBoasVindas />

      {/* Modal detalhes tarefas */}
      <Dialog open={!!modalTitulo} onOpenChange={(open) => { if (!open) setModalTitulo(null) }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {modalTitulo}
              <Badge variant="secondary" className="ml-auto">{modalTarefas.length}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 mt-2">
            {modalTarefas.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Nenhuma tarefa nessa categoria.</p>
            ) : (
              modalTarefas.map((ta, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {ta.nomeTraduzido ?? ta.nome}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{ta.obraNome} · {ta.local}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-red-600">{formatarData(ta.fim)}</p>
                    <p className="text-[10px] text-gray-400">{ta.idExterno}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">
          {t(idioma, "dashboard")}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HardHat className="h-6 w-6 text-amber-600" />
          {nome ? `${nome}` : t(idioma, "dashboard")}
        </h1>
        {total > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {total} {t(idioma, "tarefasMenu").toLowerCase()} · {obras.length} {t(idioma, "obras").toLowerCase()}
          </p>
        )}
      </div>

      {/* Stats cards */}
      {total > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={TrendingUp}
            label={t(idioma, "totalTarefas")}
            valor={total}
            cor="bg-gray-500"
          />
          <StatCard
            icon={Clock}
            label={t(idioma, "statusAndamento")}
            valor={andamento}
            cor="bg-green-500"
            sub={andamento === 0 ? undefined : `${Math.round((andamento / total) * 100)}%`}
            onClick={() => abrirModal("Tarefas em andamento", todasTarefas.filter((ta) => statusTarefa(ta) === "andamento").map((ta) => ({ ...ta, obraNome: obras.find((o) => o.tarefas.some((t) => t.id === ta.id))?.obraNome ?? "" })))}
          />
          <StatCard
            icon={AlertTriangle}
            label="Atrasadas"
            valor={atrasadas.length}
            cor={atrasadas.length > 0 ? "bg-red-500" : "bg-gray-400"}
            sub={atrasadas.length > 0 ? "Clique para ver" : undefined}
            onClick={atrasadas.length > 0 ? () => abrirModal("Tarefas atrasadas", atrasadas) : undefined}
          />
          <StatCard
            icon={CheckCircle2}
            label={t(idioma, "statusConcluida")}
            valor={concluidas}
            cor="bg-gray-400"
            sub={concluidas === 0 ? undefined : `${Math.round((concluidas / total) * 100)}%`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vencendo em 7 dias */}
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-orange-500" />
            {t(idioma, "vencendoEm7Dias")}
            {vencendo.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{vencendo.length}</Badge>
            )}
          </h2>
          {vencendo.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-gray-400">
              <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs">{t(idioma, "nenhumaTarefaVencendo")}</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-64">
              {vencendo.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {item.nomeTraduzido ?? item.nome}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{item.obraNome}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-orange-600">{diasRestantes(item.fim)}</p>
                    <p className="text-[10px] text-gray-400">{formatarData(item.fim)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Obras */}
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-600" />
            {t(idioma, "minhasObras")}
          </h2>
          {obras.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-gray-400">
              <Building2 className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">{t(idioma, "nenhumaObraDisponivel")}</p>
              <p className="text-[11px] mt-1 text-gray-300">{t(idioma, "vinculeAUmaObra")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {obras.map((obra) => (
                <ObraResumo key={obra.obraId} obra={obra} idioma={idioma} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
