'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw
} from 'lucide-react'

interface Relatorio {
  id: string
  nome: string
  tipo: 'financeiro' | 'progresso' | 'equipe' | 'material'
  periodo: string
  geradoEm: string
  status: 'pronto' | 'processando' | 'erro'
}

const relatoriosMock: Relatorio[] = [
  { id: '1', nome: 'Relatório Financeiro - Maio 2026', tipo: 'financeiro', periodo: '2026-05', geradoEm: '2026-05-25T10:00:00', status: 'pronto' },
  { id: '2', nome: 'Progresso das Obras - Semana 21', tipo: 'progresso', periodo: '2026-W21', geradoEm: '2026-05-24T08:00:00', status: 'pronto' },
  { id: '3', nome: 'Controle de Equipe - Maio 2026', tipo: 'equipe', periodo: '2026-05', geradoEm: '2026-05-23T14:30:00', status: 'pronto' },
  { id: '4', nome: 'Consumo de Materiais - Maio 2026', tipo: 'material', periodo: '2026-05', geradoEm: '2026-05-25T12:00:00', status: 'processando' },
]

const tipoConfig = {
  financeiro: { label: 'Financeiro', color: 'bg-green-500', icon: DollarSign },
  progresso: { label: 'Progresso', color: 'bg-blue-500', icon: TrendingUp },
  equipe: { label: 'Equipe', color: 'bg-purple-500', icon: Users },
  material: { label: 'Materiais', color: 'bg-orange-500', icon: Building2 }
}

export default function RelatoriosPage() {
  const [relatorios] = useState<Relatorio[]>(relatoriosMock)
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes')
  const [gerandoRelatorio, setGerandoRelatorio] = useState<string | null>(null)

  // Dados mock para métricas
  const metricas = {
    obrasAtivas: 4,
    progressoMedio: 47,
    colaboradores: 45,
    custoMensal: 285000,
    variacaoCusto: -3.2,
    horasTrabalhadas: 7840,
    tarefasConcluidas: 128,
    tarefasPendentes: 34
  }

  // Simular geração de relatório
  const gerarRelatorio = async (tipo: string) => {
    setGerandoRelatorio(tipo)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setGerandoRelatorio(null)
    alert(`Relatório de ${tipoConfig[tipo as keyof typeof tipoConfig].label} gerado com sucesso!`)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Relatórios"
        description="Visualize métricas e exporte relatórios"
        icon="📊"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês</option>
              <option value="trimestre">Este Trimestre</option>
              <option value="ano">Este Ano</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        }
      />

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Building2 className="w-8 h-8 text-blue-200" />
            <span className="text-blue-200 text-sm">Obras Ativas</span>
          </div>
          <div className="text-3xl font-bold text-white">{metricas.obrasAtivas}</div>
          <div className="text-blue-200 text-sm mt-1">
            {metricas.progressoMedio}% progresso médio
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-green-200" />
            <span className="text-green-200 text-sm">Custo Mensal</span>
          </div>
          <div className="text-3xl font-bold text-white">
            R$ {(metricas.custoMensal / 1000).toFixed(0)}k
          </div>
          <div className={`flex items-center gap-1 text-sm mt-1 ${metricas.variacaoCusto < 0 ? 'text-green-200' : 'text-red-200'}`}>
            {metricas.variacaoCusto < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            {Math.abs(metricas.variacaoCusto)}% vs mês anterior
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-purple-200" />
            <span className="text-purple-200 text-sm">Colaboradores</span>
          </div>
          <div className="text-3xl font-bold text-white">{metricas.colaboradores}</div>
          <div className="text-purple-200 text-sm mt-1">
            {metricas.horasTrabalhadas.toLocaleString()} horas no mês
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 className="w-8 h-8 text-orange-200" />
            <span className="text-orange-200 text-sm">Tarefas</span>
          </div>
          <div className="text-3xl font-bold text-white">{metricas.tarefasConcluidas}</div>
          <div className="text-orange-200 text-sm mt-1">
            {metricas.tarefasPendentes} pendentes
          </div>
        </div>
      </div>

      {/* Seção de Gráficos (Mock) */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Progresso por Obra */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Progresso por Obra</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              { nome: 'Residencial Parque das Flores', progresso: 65 },
              { nome: 'Edifício Comercial Centro', progresso: 30 },
              { nome: 'Casa Praia Grande', progresso: 45 },
              { nome: 'Galpão Industrial', progresso: 0 }
            ].map((obra, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-300 truncate max-w-[200px]">{obra.nome}</span>
                  <span className="text-white font-medium">{obra.progresso}%</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${obra.progresso}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição de Custos */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Distribuição de Custos</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center justify-center mb-6">
            {/* Círculo representando gráfico de pizza */}
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#374151" strokeWidth="20" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#3B82F6" strokeWidth="20"
                  strokeDasharray="125.6 251.2"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#10B981" strokeWidth="20"
                  strokeDasharray="75.4 251.2"
                  strokeDashoffset="-125.6"
                />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#F59E0B" strokeWidth="20"
                  strokeDasharray="50.2 251.2"
                  strokeDashoffset="-201"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">100%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { nome: 'Mão de obra', valor: 50, cor: 'bg-blue-500' },
              { nome: 'Materiais', valor: 30, cor: 'bg-green-500' },
              { nome: 'Equipamentos', valor: 12, cor: 'bg-yellow-500' },
              { nome: 'Outros', valor: 8, cor: 'bg-gray-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.cor}`} />
                <span className="text-sm text-gray-400">{item.nome}</span>
                <span className="text-sm text-white ml-auto">{item.valor}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gerar Novos Relatórios */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Gerar Relatórios</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(tipoConfig).map(([tipo, config]) => {
            const Icon = config.icon
            const isGerando = gerandoRelatorio === tipo
            return (
              <button
                key={tipo}
                onClick={() => gerarRelatorio(tipo)}
                disabled={isGerando}
                className={`p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-all text-left group ${isGerando ? 'opacity-50 cursor-wait' : ''}`}
              >
                <div className={`w-12 h-12 ${config.color}/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  {isGerando ? (
                    <RefreshCw className={`w-6 h-6 ${config.color.replace('bg-', 'text-')} animate-spin`} />
                  ) : (
                    <Icon className={`w-6 h-6 ${config.color.replace('bg-', 'text-')}`} />
                  )}
                </div>
                <h4 className="font-medium text-white">{config.label}</h4>
                <p className="text-sm text-gray-400 mt-1">
                  {isGerando ? 'Gerando...' : 'Clique para gerar'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Relatórios Recentes */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Relatórios Recentes</h3>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Relatório</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400 hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400 hidden md:table-cell">Período</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400 hidden lg:table-cell">Gerado em</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {relatorios.map((relatorio) => {
                const Icon = tipoConfig[relatorio.tipo].icon
                return (
                  <tr key={relatorio.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${tipoConfig[relatorio.tipo].color}/20 rounded-lg flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${tipoConfig[relatorio.tipo].color.replace('bg-', 'text-')}`} />
                        </div>
                        <span className="text-white">{relatorio.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs ${tipoConfig[relatorio.tipo].color}/20 ${tipoConfig[relatorio.tipo].color.replace('bg-', 'text-')}`}>
                        {tipoConfig[relatorio.tipo].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">
                      {relatorio.periodo}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {new Date(relatorio.geradoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      {relatorio.status === 'pronto' ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Pronto
                        </span>
                      ) : relatorio.status === 'processando' ? (
                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Clock className="w-4 h-4 animate-pulse" />
                          Processando
                        </span>
                      ) : (
                        <span className="text-red-400 text-sm">Erro</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={relatorio.status !== 'pronto'}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
