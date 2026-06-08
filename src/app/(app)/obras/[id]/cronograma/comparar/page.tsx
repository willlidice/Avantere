"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, GitCompare, Plus, Minus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CronogramaResumo {
  id: number
  versao: number
  criadoEm: string
  _count: { tarefas: number }
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
}

type DiffStatus = "igual" | "modificado" | "somente-a" | "somente-b"

interface DiffRow {
  idExterno: string
  status: DiffStatus
  a: Tarefa | null
  b: Tarefa | null
  diferencas: string[]
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function calcularDiff(tarefasA: Tarefa[], tarefasB: Tarefa[]): DiffRow[] {
  const mapA = new Map(tarefasA.map((t) => [t.idExterno, t]))
  const mapB = new Map(tarefasB.map((t) => [t.idExterno, t]))
  const todos = Array.from(new Set([...Array.from(mapA.keys()), ...Array.from(mapB.keys())]))

  return todos.map((id) => {
    const a = mapA.get(id) ?? null
    const b = mapB.get(id) ?? null

    if (!b) return { idExterno: id, status: "somente-a", a, b, diferencas: [] }
    if (!a) return { idExterno: id, status: "somente-b", a, b, diferencas: [] }

    const diffs: string[] = []
    if (a.nome !== b.nome) diffs.push("nome")
    if (a.local !== b.local) diffs.push("local")
    if (a.quantidade !== b.quantidade) diffs.push("quantidade")
    if (a.unidade !== b.unidade) diffs.push("unidade")
    if (a.inicio.slice(0, 10) !== b.inicio.slice(0, 10)) diffs.push("início")
    if (a.fim.slice(0, 10) !== b.fim.slice(0, 10)) diffs.push("fim")

    return {
      idExterno: id,
      status: diffs.length > 0 ? "modificado" : "igual",
      a,
      b,
      diferencas: diffs,
    }
  })
}

const STATUS_ESTILO: Record<DiffStatus, string> = {
  igual: "",
  modificado: "bg-amber-50",
  "somente-a": "bg-red-50",
  "somente-b": "bg-green-50",
}

export default function CompararPage() {
  const params = useParams<{ id: string }>()
  const obraId = params.id
  const [cronogramas, setCronogramas] = useState<CronogramaResumo[]>([])
  const [versaoA, setVersaoA] = useState<string>("")
  const [versaoB, setVersaoB] = useState<string>("")
  const [tarefasA, setTarefasA] = useState<Tarefa[]>([])
  const [tarefasB, setTarefasB] = useState<Tarefa[]>([])
  const [carregando, setCarregando] = useState(false)
  const [comparando, setComparando] = useState(false)
  const [diff, setDiff] = useState<DiffRow[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [apenasModificados, setApenasModificados] = useState(false)

  useEffect(() => {
    fetch(`/api/obras/${obraId}/cronograma`)
      .then((r) => r.json())
      .then((d: CronogramaResumo[]) => {
        if (Array.isArray(d)) {
          setCronogramas(d)
          if (d.length >= 2) {
            setVersaoA(String(d[1].versao))
            setVersaoB(String(d[0].versao))
          } else if (d.length === 1) {
            setVersaoA(String(d[0].versao))
          }
        }
      })
      .catch(() => setErro("Erro ao carregar versões"))
  }, [obraId])

  async function comparar() {
    if (!versaoA || !versaoB || versaoA === versaoB) return
    setComparando(true)
    setErro(null)
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/obras/${obraId}/cronograma/${versaoA}`),
        fetch(`/api/obras/${obraId}/cronograma/${versaoB}`),
      ])
      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()])
      if (!resA.ok || !resB.ok) {
        setErro("Erro ao carregar tarefas das versões")
        return
      }
      const tA: Tarefa[] = dataA.tarefas ?? []
      const tB: Tarefa[] = dataB.tarefas ?? []
      setTarefasA(tA)
      setTarefasB(tB)
      setDiff(calcularDiff(tA, tB))
    } finally {
      setComparando(false)
    }
  }

  const diffExibido = diff
    ? apenasModificados
      ? diff.filter((r) => r.status !== "igual")
      : diff
    : null

  const resumo = diff
    ? {
        iguais: diff.filter((r) => r.status === "igual").length,
        modificados: diff.filter((r) => r.status === "modificado").length,
        soA: diff.filter((r) => r.status === "somente-a").length,
        soB: diff.filter((r) => r.status === "somente-b").length,
      }
    : null

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-6">
      <div>
        <Link
          href={`/obras/${obraId}/cronograma`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cronograma
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GitCompare className="h-6 w-6 text-gray-400" />
          Comparar versões
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Diferenças entre duas versões do cronograma</p>
      </div>

      {/* Seletores */}
      <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-gray-50">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-600">Versão A (base)</p>
          <Select value={versaoA} onValueChange={(v) => v && setVersaoA(v)}>
            <SelectTrigger className="w-52 bg-white">
              <SelectValue placeholder="Selecionar versão A" />
            </SelectTrigger>
            <SelectContent>
              {cronogramas.map((c) => (
                <SelectItem key={c.id} value={String(c.versao)}>
                  v{c.versao} — {c._count.tarefas} tarefas
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-600">Versão B (nova)</p>
          <Select value={versaoB} onValueChange={(v) => v && setVersaoB(v)}>
            <SelectTrigger className="w-52 bg-white">
              <SelectValue placeholder="Selecionar versão B" />
            </SelectTrigger>
            <SelectContent>
              {cronogramas.map((c) => (
                <SelectItem key={c.id} value={String(c.versao)}>
                  v{c.versao} — {c._count.tarefas} tarefas
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={comparar}
          disabled={!versaoA || !versaoB || versaoA === versaoB || comparando}
        >
          {comparando ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Comparando...</>
          ) : (
            <><GitCompare className="h-4 w-4 mr-2" />Comparar</>
          )}
        </Button>
      </div>

      {erro && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">{erro}</div>
      )}

      {/* Resumo */}
      {resumo && (
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-gray-50 text-gray-600">
            {resumo.iguais} iguais
          </span>
          {resumo.modificados > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              {resumo.modificados} modificada{resumo.modificados !== 1 ? "s" : ""}
            </span>
          )}
          {resumo.soA > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-red-50 text-red-700 border-red-200">
              <Minus className="h-3.5 w-3.5" />
              {resumo.soA} removida{resumo.soA !== 1 ? "s" : ""} em B
            </span>
          )}
          {resumo.soB > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-green-50 text-green-700 border-green-200">
              <Plus className="h-3.5 w-3.5" />
              {resumo.soB} nova{resumo.soB !== 1 ? "s" : ""} em B
            </span>
          )}
          {(resumo.modificados + resumo.soA + resumo.soB) > 0 && (
            <button
              onClick={() => setApenasModificados((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                apenasModificados
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {apenasModificados ? "Mostrar todas" : "Apenas diferenças"}
            </button>
          )}
        </div>
      )}

      {/* Tabela diff */}
      {diffExibido && (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="text-left px-3 py-2 border-b font-semibold text-gray-600 w-24">ID</th>
                <th className="text-left px-3 py-2 border-b font-semibold text-gray-600 w-12">Status</th>
                <th className="text-left px-3 py-2 border-b font-semibold text-blue-600 bg-blue-50">
                  v{versaoA} (base)
                </th>
                <th className="text-left px-3 py-2 border-b font-semibold text-green-700 bg-green-50">
                  v{versaoB} (nova)
                </th>
              </tr>
            </thead>
            <tbody>
              {diffExibido.map((row) => (
                <tr key={row.idExterno} className={STATUS_ESTILO[row.status]}>
                  <td className="px-3 py-2 border-b font-mono text-gray-500">{row.idExterno}</td>
                  <td className="px-3 py-2 border-b text-center">
                    {row.status === "igual" && <span className="text-gray-300">—</span>}
                    {row.status === "modificado" && (
                      <span className="inline-flex items-center gap-0.5 text-amber-600" title={`Campos: ${row.diferencas.join(", ")}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {row.status === "somente-a" && (
                      <span className="inline-flex items-center gap-0.5 text-red-500" title="Removida em B">
                        <Minus className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {row.status === "somente-b" && (
                      <span className="inline-flex items-center gap-0.5 text-green-600" title="Nova em B">
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b align-top">
                    {row.a ? (
                      <TarefaCell tarefa={row.a} diferencas={row.status === "modificado" ? row.diferencas : []} lado="a" />
                    ) : (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b align-top">
                    {row.b ? (
                      <TarefaCell tarefa={row.b} diferencas={row.status === "modificado" ? row.diferencas : []} lado="b" />
                    ) : (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TarefaCell({ tarefa, diferencas, lado }: { tarefa: Tarefa; diferencas: string[]; lado: "a" | "b" }) {
  function destaque(campo: string, valor: string) {
    const mudou = diferencas.includes(campo)
    const cls = mudou
      ? lado === "a"
        ? "bg-red-100 text-red-900 rounded px-0.5"
        : "bg-green-100 text-green-900 rounded px-0.5"
      : ""
    return <span className={cls}>{valor}</span>
  }

  return (
    <div className="space-y-0.5">
      <p className="font-medium text-gray-800">{destaque("nome", tarefa.nome)}</p>
      <div className="flex flex-wrap gap-x-3 text-gray-500">
        <span>{destaque("local", tarefa.local)}</span>
        <span>{destaque("quantidade", `${tarefa.quantidade} ${tarefa.unidade}`)}</span>
      </div>
      <div className="flex gap-3 text-gray-500">
        <span>{destaque("início", new Date(tarefa.inicio).toLocaleDateString("pt-BR", { timeZone: "UTC" }))}</span>
        <span>→</span>
        <span>{destaque("fim", new Date(tarefa.fim).toLocaleDateString("pt-BR", { timeZone: "UTC" }))}</span>
      </div>
    </div>
  )
}
