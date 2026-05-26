'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  MapPin,
  AlertCircle
} from 'lucide-react'

interface Evento {
  id: string
  titulo: string
  data: string
  hora?: string
  tipo: 'tarefa' | 'entrega' | 'reuniao' | 'marco'
  obra?: string
  descricao?: string
}

const eventosMock: Evento[] = [
  { id: '1', titulo: 'Concretagem Laje 3º Pavimento', data: '2026-05-25', hora: '08:00', tipo: 'tarefa', obra: 'Residencial Parque das Flores' },
  { id: '2', titulo: 'Entrega de Material Elétrico', data: '2026-05-25', hora: '14:00', tipo: 'entrega', obra: 'Edifício Comercial Centro' },
  { id: '3', titulo: 'Reunião com Cliente', data: '2026-05-26', hora: '10:00', tipo: 'reuniao', obra: 'Casa Praia Grande' },
  { id: '4', titulo: 'Conclusão Fase Estrutural', data: '2026-05-28', tipo: 'marco', obra: 'Residencial Parque das Flores' },
  { id: '5', titulo: 'Instalação Hidráulica', data: '2026-05-27', hora: '07:00', tipo: 'tarefa', obra: 'Edifício Comercial Centro' },
  { id: '6', titulo: 'Vistoria Prefeitura', data: '2026-05-30', hora: '09:00', tipo: 'reuniao', obra: 'Galpão Industrial' },
]

const tipoConfig = {
  tarefa: { label: 'Tarefa', color: 'bg-blue-500', dot: 'bg-blue-400' },
  entrega: { label: 'Entrega', color: 'bg-green-500', dot: 'bg-green-400' },
  reuniao: { label: 'Reunião', color: 'bg-purple-500', dot: 'bg-purple-400' },
  marco: { label: 'Marco', color: 'bg-yellow-500', dot: 'bg-yellow-400' }
}

export default function CronogramasPage() {
  const [dataAtual, setDataAtual] = useState(new Date())
  const [eventos] = useState<Evento[]>(eventosMock)

  // Helpers de data
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1)
  const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0)
  const diasNoMes = ultimoDiaMes.getDate()
  const primeiroDiaSemana = primeiroDiaMes.getDay()

  const mesAnterior = () => setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 1))
  const proximoMes = () => setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1))
  const hoje = () => setDataAtual(new Date())

  // Gerar dias do calendário
  const diasCalendario = []
  for (let i = 0; i < primeiroDiaSemana; i++) {
    diasCalendario.push(null)
  }
  for (let i = 1; i <= diasNoMes; i++) {
    diasCalendario.push(i)
  }

  // Buscar eventos do dia
  const getEventosDia = (dia: number) => {
    const dataStr = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return eventos.filter(e => e.data === dataStr)
  }

  // Verificar se é hoje
  const isHoje = (dia: number) => {
    const hoje = new Date()
    return dia === hoje.getDate() &&
           dataAtual.getMonth() === hoje.getMonth() &&
           dataAtual.getFullYear() === hoje.getFullYear()
  }

  // Eventos do mês atual
  const eventosDoMes = eventos.filter(e => {
    const dataEvento = new Date(e.data)
    return dataEvento.getMonth() === dataAtual.getMonth() &&
           dataEvento.getFullYear() === dataAtual.getFullYear()
  }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Cronogramas"
        description="Visualize tarefas e prazos dos projetos"
        icon="📅"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
            <Plus className="w-5 h-5" />
            Novo Evento
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          {/* Header do Calendário */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {meses[dataAtual.getMonth()]} {dataAtual.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={hoje}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={mesAnterior}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={proximoMes}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {diasSemana.map(dia => (
              <div key={dia} className="text-center text-sm font-medium text-gray-400 py-2">
                {dia}
              </div>
            ))}
          </div>

          {/* Dias do Mês */}
          <div className="grid grid-cols-7 gap-1">
            {diasCalendario.map((dia, index) => {
              if (dia === null) {
                return <div key={index} className="h-24" />
              }

              const eventosDoDia = getEventosDia(dia)
              const ehHoje = isHoje(dia)

              return (
                <div
                  key={index}
                  className={`h-24 p-1 rounded-lg border transition-all cursor-pointer hover:border-blue-500 ${
                    ehHoje
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${ehHoje ? 'text-blue-400' : 'text-gray-300'}`}>
                    {dia}
                  </div>
                  <div className="space-y-0.5">
                    {eventosDoDia.slice(0, 2).map(evento => (
                      <div
                        key={evento.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${tipoConfig[evento.tipo].color}/30 text-white`}
                      >
                        {evento.titulo}
                      </div>
                    ))}
                    {eventosDoDia.length > 2 && (
                      <div className="text-xs text-gray-400 px-1">
                        +{eventosDoDia.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-700">
            {Object.entries(tipoConfig).map(([tipo, config]) => (
              <div key={tipo} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config.dot}`} />
                <span className="text-sm text-gray-400">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Eventos do Mês */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Eventos em {meses[dataAtual.getMonth()]}
          </h3>

          {eventosDoMes.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Nenhum evento neste mês</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {eventosDoMes.map(evento => (
                <div
                  key={evento.id}
                  className="p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${tipoConfig[evento.tipo].dot}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{evento.titulo}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(evento.data).toLocaleDateString('pt-BR')}
                        </div>
                        {evento.hora && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {evento.hora}
                          </div>
                        )}
                      </div>
                      {evento.obra && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {evento.obra}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
