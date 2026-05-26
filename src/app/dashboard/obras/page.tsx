'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Calendar,
  Users,
  MoreVertical,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause
} from 'lucide-react'

// Tipos
interface Obra {
  id: string
  nome: string
  endereco: string
  cliente: string
  status: 'em_andamento' | 'pausada' | 'concluida' | 'planejada'
  progresso: number
  dataInicio: string
  dataPrevisao: string
  equipe: number
  imagem?: string
}

// Dados mock
const obrasMock: Obra[] = [
  {
    id: '1',
    nome: 'Residencial Parque das Flores',
    endereco: 'Rua das Acácias, 150 - Vila Velha/ES',
    cliente: 'Construtora ABC',
    status: 'em_andamento',
    progresso: 65,
    dataInicio: '2026-01-15',
    dataPrevisao: '2026-08-30',
    equipe: 12
  },
  {
    id: '2',
    nome: 'Edifício Comercial Centro',
    endereco: 'Av. Central, 500 - Vitória/ES',
    cliente: 'Incorporadora XYZ',
    status: 'em_andamento',
    progresso: 30,
    dataInicio: '2026-03-01',
    dataPrevisao: '2027-02-28',
    equipe: 25
  },
  {
    id: '3',
    nome: 'Casa Praia Grande',
    endereco: 'Rua do Mar, 80 - Guarapari/ES',
    cliente: 'João Silva',
    status: 'pausada',
    progresso: 45,
    dataInicio: '2026-02-10',
    dataPrevisao: '2026-07-15',
    equipe: 6
  },
  {
    id: '4',
    nome: 'Galpão Industrial',
    endereco: 'Rod. ES-010, Km 5 - Serra/ES',
    cliente: 'Indústria MetalPro',
    status: 'planejada',
    progresso: 0,
    dataInicio: '2026-06-01',
    dataPrevisao: '2026-12-20',
    equipe: 0
  },
  {
    id: '5',
    nome: 'Reforma Apartamento 501',
    endereco: 'Rua Champagnat, 200 - Vila Velha/ES',
    cliente: 'Maria Santos',
    status: 'concluida',
    progresso: 100,
    dataInicio: '2026-01-05',
    dataPrevisao: '2026-03-15',
    equipe: 4
  }
]

const statusConfig = {
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-500', icon: Clock },
  pausada: { label: 'Pausada', color: 'bg-yellow-500', icon: Pause },
  concluida: { label: 'Concluída', color: 'bg-green-500', icon: CheckCircle2 },
  planejada: { label: 'Planejada', color: 'bg-purple-500', icon: AlertCircle }
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>(obrasMock)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [showNovaObra, setShowNovaObra] = useState(false)

  // Filtrar obras
  const obrasFiltradas = obras.filter(obra => {
    const matchBusca = obra.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       obra.cliente.toLowerCase().includes(busca.toLowerCase()) ||
                       obra.endereco.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || obra.status === filtroStatus
    return matchBusca && matchStatus
  })

  // Estatísticas
  const stats = {
    total: obras.length,
    emAndamento: obras.filter(o => o.status === 'em_andamento').length,
    pausadas: obras.filter(o => o.status === 'pausada').length,
    concluidas: obras.filter(o => o.status === 'concluida').length
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestão de Obras"
        description="Gerencie todos os projetos de construção"
        icon="🏗️"
        actions={
          <button
            onClick={() => setShowNovaObra(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Nova Obra
          </button>
        }
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total de Obras</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400">{stats.emAndamento}</div>
          <div className="text-sm text-gray-400">Em Andamento</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-3xl font-bold text-yellow-400">{stats.pausadas}</div>
          <div className="text-sm text-gray-400">Pausadas</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-400">{stats.concluidas}</div>
          <div className="text-sm text-gray-400">Concluídas</div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, cliente ou endereço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Status</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="pausada">Pausadas</option>
            <option value="planejada">Planejadas</option>
            <option value="concluida">Concluídas</option>
          </select>
        </div>
      </div>

      {/* Lista de Obras */}
      <div className="grid gap-4">
        {obrasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
            <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma obra encontrada</p>
          </div>
        ) : (
          obrasFiltradas.map((obra) => {
            const StatusIcon = statusConfig[obra.status].icon
            return (
              <div
                key={obra.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info Principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                        🏗️
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                          {obra.nome}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{obra.endereco}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Cliente: {obra.cliente}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status e Progresso */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                    {/* Status */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[obra.status].color}/20`}>
                      <StatusIcon className={`w-4 h-4 ${statusConfig[obra.status].color.replace('bg-', 'text-')}`} />
                      <span className={`text-sm font-medium ${statusConfig[obra.status].color.replace('bg-', 'text-')}`}>
                        {statusConfig[obra.status].label}
                      </span>
                    </div>

                    {/* Progresso */}
                    <div className="w-32">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">Progresso</span>
                        <span className="text-white font-medium">{obra.progresso}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${obra.progresso}%` }}
                        />
                      </div>
                    </div>

                    {/* Datas */}
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(obra.dataPrevisao).toLocaleDateString('pt-BR')}</span>
                    </div>

                    {/* Equipe */}
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{obra.equipe}</span>
                    </div>

                    {/* Menu */}
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Nova Obra (placeholder) */}
      {showNovaObra && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Nova Obra</h2>
            <p className="text-gray-400 mb-6">
              Funcionalidade em desenvolvimento. Em breve você poderá cadastrar novas obras aqui.
            </p>
            <button
              onClick={() => setShowNovaObra(false)}
              className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
