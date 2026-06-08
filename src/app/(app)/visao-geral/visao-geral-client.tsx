"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2,
  CheckCircle2,
  Clock,
  CalendarClock,
  Languages,
  TrendingUp,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useIdioma } from "@/contexts/idioma-context"
import { t } from "@/lib/i18n"

interface ObraStat {
  obraId: number
  obraNome: string
  ativa: boolean
  totalTarefas: number
  traduzidas: number
  versoes: number
}

interface VencendoItem {
  tarefaNome: string
  obraNome: string
  fim: string
}

interface DashboardData {
  totalObras: number
  totalObrasAtivas: number
  totalTarefas: number
  totalTraduzidas: number
  porStatus: {
    emAndamento: number
    concluidas: number
    futuras: number
  }
  obraStats: ObraStat[]
  vencendoEm7Dias: VencendoItem[]
}

interface UsoIAData {
  totalTraduzidas: number
  totalTarefas: number
  saldoCredito: string | null
  gastoMes: string | null
  erroAnthropic: string | null
  linkDashboard: string
}

function BarraProgresso({ valor, total, cor }: { valor: number; total: number; cor: string }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${cor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-9 text-right">{pct}%</span>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  valor,
  sub,
  cor,
}: {
  icon: React.ElementType
  label: string
  valor: number
  sub?: string
  cor: string
}) {
  return (
    <div className="bg-white border rounded-xl p-5 space-y-3">
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

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function CreditosIA({ perfil }: { perfil: string }) {
  const [dados, setDados] = useState<UsoIAData | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch("/api/uso-ia")
      .then((r) => r.json())
      .then((d) => setDados(d))
      .catch(() => setDados(null))
      .finally(() => setCarregando(false))
  }, [])

  if (perfil !== "ADMIN") return null

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          IA — Uso de créditos Claude
        </h2>
        <a
          href="https://console.anthropic.com/settings/billing"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          Ver painel Anthropic
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
        <p className="text-xs text-amber-700">
          Saldo e gasto não estão disponíveis via API da Anthropic.{" "}
          <a
            href="https://console.anthropic.com/settings/billing"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline hover:text-amber-900"
          >
            Acesse o painel para conferir.
          </a>
        </p>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando uso...
        </div>
      ) : dados ? (
        <div className="space-y-2.5">
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
            Uso registrado no sistema
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tarefas traduzidas via IA</span>
            <span className="font-semibold text-indigo-700">{dados.totalTraduzidas.toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total de tarefas cadastradas</span>
            <span className="font-semibold text-gray-700">{dados.totalTarefas.toLocaleString("pt-BR")}</span>
          </div>
          {dados.totalTarefas > 0 && (
            <div className="flex flex-1 rounded-full overflow-hidden bg-gray-100 h-1.5">
              <div
                className="bg-indigo-400 h-full transition-all duration-500"
                style={{ width: `${Math.round((dados.totalTraduzidas / dados.totalTarefas) * 100)}%` }}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
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

export function VisaoGeralClient({ perfil }: { perfil: string }) {
  const { idioma } = useIdioma()
  const [dados, setDados] = useState<DashboardData | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/visao-geral")
      .then((r) => r.json())
      .then((d) => {
        if (d.erro) setErro(d.erro)
        else setDados(d)
      })
      .catch(() => setErro("Erro ao carregar dados"))
  }, [])

  if (erro) {
    return (
      <div className="flex items-center justify-center h-40 gap-2 text-red-500">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">{erro}</span>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    )
  }

  const { totalObras, totalObrasAtivas, totalTarefas, totalTraduzidas, porStatus, obraStats, vencendoEm7Dias } = dados
  const pctTraduzidas = totalTarefas > 0 ? Math.round((totalTraduzidas / totalTarefas) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">{t(idioma, "dashboard")}</p>
        <h1 className="text-2xl font-bold text-gray-900">{t(idioma, "visaoGeralTitulo")}</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label={t(idioma, "totalObras")} valor={totalObras} sub={`${totalObrasAtivas} ${t(idioma, "obrasAtivas").toLowerCase()}`} cor="bg-amber-500" />
        <StatCard icon={TrendingUp} label={t(idioma, "totalTarefas")} valor={totalTarefas} sub="" cor="bg-blue-500" />
        <StatCard icon={Languages} label={t(idioma, "totalTraduzidas")} valor={totalTraduzidas} sub={`${pctTraduzidas}%`} cor="bg-indigo-500" />
        <StatCard icon={Clock} label={t(idioma, "emAndamento")} valor={porStatus.emAndamento} sub={`${porStatus.futuras} ${t(idioma, "futuras").toLowerCase()} · ${porStatus.concluidas} ${t(idioma, "concluidas").toLowerCase()}`} cor="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status das tarefas */}
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">{t(idioma, "emAndamento")}</h2>
          {totalTarefas === 0 ? (
            <p className="text-xs text-gray-400">{t(idioma, "semObras")}</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    {t(idioma, "emAndamento")}
                  </span>
                  <span className="font-medium">{porStatus.emAndamento}</span>
                </div>
                <BarraProgresso valor={porStatus.emAndamento} total={totalTarefas} cor="bg-green-500" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    {t(idioma, "futuras")}
                  </span>
                  <span className="font-medium">{porStatus.futuras}</span>
                </div>
                <BarraProgresso valor={porStatus.futuras} total={totalTarefas} cor="bg-blue-400" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                    {t(idioma, "concluidas")}
                  </span>
                  <span className="font-medium">{porStatus.concluidas}</span>
                </div>
                <BarraProgresso valor={porStatus.concluidas} total={totalTarefas} cor="bg-gray-300" />
              </div>
            </div>
          )}
        </div>

        {/* Tradução global */}
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">{t(idioma, "progressoTraducao")}</h2>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="12"
                  strokeDasharray={`${pctTraduzidas * 2.513} 251.3`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{pctTraduzidas}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {totalTraduzidas} de {totalTarefas} tarefas
            </p>
          </div>
        </div>

        {/* Vencendo em 7 dias */}
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-orange-500" />
            {t(idioma, "vencendoEm7Dias")}
            {vencendoEm7Dias.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{vencendoEm7Dias.length}</Badge>
            )}
          </h2>
          {vencendoEm7Dias.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-gray-400">
              <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs">{t(idioma, "nenhumaTarefaVencendo")}</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-52">
              {vencendoEm7Dias.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.tarefaNome}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.obraNome}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-orange-600">{diasRestantes(item.fim)}</p>
                    <p className="text-[10px] text-gray-400">{formatarData(item.fim)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Obras */}
      {obraStats.length > 0 && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">{t(idioma, "totalObras")}</h2>
          <div className="space-y-3">
            {obraStats.map((obra) => {
              const pctTrad = obra.totalTarefas > 0
                ? Math.round((obra.traduzidas / obra.totalTarefas) * 100)
                : 0
              return (
                <div key={obra.obraId} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/obras/${obra.obraId}/cronograma`}
                      className="text-sm font-medium text-gray-800 hover:text-amber-600 hover:underline flex-1 truncate"
                    >
                      {obra.obraNome}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {!obra.ativa && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">inativa</Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {obra.totalTarefas} tarefa{obra.totalTarefas !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-indigo-600 font-medium">{pctTrad}% trad.</span>
                      <span className="text-[10px] text-gray-300">v{obra.versoes}</span>
                    </div>
                  </div>
                  {obra.totalTarefas > 0 && (
                    <div className="flex flex-1 rounded-full overflow-hidden bg-gray-100 h-1.5">
                      <div
                        className="bg-indigo-400 h-full transition-all duration-500"
                        style={{ width: `${pctTrad}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {totalObras === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t(idioma, "semObras")}</p>
        </div>
      )}

      {/* Créditos Claude — só para ADMIN */}
      <CreditosIA perfil={perfil} />
    </div>
  )
}
