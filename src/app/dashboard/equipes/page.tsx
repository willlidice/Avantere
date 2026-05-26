'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  UserCheck,
  UserX,
  Clock,
  Building2,
  MessageCircle
} from 'lucide-react'

interface Colaborador {
  id: string
  nome: string
  cargo: string
  telefone: string
  email: string
  obraAtual?: string
  status: 'presente' | 'ausente' | 'ferias' | 'afastado'
  avatar?: string
  ultimaPresenca?: string
}

const colaboradoresMock: Colaborador[] = [
  {
    id: '1',
    nome: 'Carlos Eduardo Silva',
    cargo: 'Mestre de Obras',
    telefone: '(27) 99999-1111',
    email: 'carlos@email.com',
    obraAtual: 'Residencial Parque das Flores',
    status: 'presente',
    ultimaPresenca: '2026-05-25T07:30:00'
  },
  {
    id: '2',
    nome: 'José Antonio Pereira',
    cargo: 'Pedreiro',
    telefone: '(27) 99999-2222',
    email: 'jose@email.com',
    obraAtual: 'Residencial Parque das Flores',
    status: 'presente',
    ultimaPresenca: '2026-05-25T07:45:00'
  },
  {
    id: '3',
    nome: 'Maria Clara Santos',
    cargo: 'Engenheira Civil',
    telefone: '(27) 99999-3333',
    email: 'maria@email.com',
    obraAtual: 'Edifício Comercial Centro',
    status: 'presente',
    ultimaPresenca: '2026-05-25T08:00:00'
  },
  {
    id: '4',
    nome: 'Roberto Oliveira',
    cargo: 'Eletricista',
    telefone: '(27) 99999-4444',
    email: 'roberto@email.com',
    obraAtual: 'Casa Praia Grande',
    status: 'ausente'
  },
  {
    id: '5',
    nome: 'Ana Paula Costa',
    cargo: 'Arquiteta',
    telefone: '(27) 99999-5555',
    email: 'ana@email.com',
    status: 'ferias'
  },
  {
    id: '6',
    nome: 'Fernando Souza',
    cargo: 'Encanador',
    telefone: '(27) 99999-6666',
    email: 'fernando@email.com',
    obraAtual: 'Edifício Comercial Centro',
    status: 'presente',
    ultimaPresenca: '2026-05-25T07:15:00'
  }
]

const statusConfig = {
  presente: { label: 'Presente', color: 'bg-green-500', textColor: 'text-green-400' },
  ausente: { label: 'Ausente', color: 'bg-red-500', textColor: 'text-red-400' },
  ferias: { label: 'Férias', color: 'bg-blue-500', textColor: 'text-blue-400' },
  afastado: { label: 'Afastado', color: 'bg-yellow-500', textColor: 'text-yellow-400' }
}

export default function EquipesPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(colaboradoresMock)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  // Filtrar colaboradores
  const colaboradoresFiltrados = colaboradores.filter(col => {
    const matchBusca = col.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       col.cargo.toLowerCase().includes(busca.toLowerCase()) ||
                       (col.obraAtual?.toLowerCase().includes(busca.toLowerCase()) ?? false)
    const matchStatus = filtroStatus === 'todos' || col.status === filtroStatus
    return matchBusca && matchStatus
  })

  // Estatísticas
  const stats = {
    total: colaboradores.length,
    presentes: colaboradores.filter(c => c.status === 'presente').length,
    ausentes: colaboradores.filter(c => c.status === 'ausente').length,
    ferias: colaboradores.filter(c => c.status === 'ferias').length
  }

  // Registrar presença
  const togglePresenca = (id: string) => {
    setColaboradores(prev => prev.map(col => {
      if (col.id === id) {
        const novoStatus = col.status === 'presente' ? 'ausente' : 'presente'
        return {
          ...col,
          status: novoStatus,
          ultimaPresenca: novoStatus === 'presente' ? new Date().toISOString() : col.ultimaPresenca
        }
      }
      return col
    }))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestão de Equipes"
        description="Gerencie colaboradores e controle de presença"
        icon="👥"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
            <Plus className="w-5 h-5" />
            Novo Colaborador
          </button>
        }
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-green-400" />
            <span className="text-3xl font-bold text-green-400">{stats.presentes}</span>
          </div>
          <div className="text-sm text-gray-400">Presentes Hoje</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <UserX className="w-6 h-6 text-red-400" />
            <span className="text-3xl font-bold text-red-400">{stats.ausentes}</span>
          </div>
          <div className="text-sm text-gray-400">Ausentes</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400">{stats.ferias}</div>
          <div className="text-sm text-gray-400">De Férias</div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo ou obra..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="presente">Presentes</option>
            <option value="ausente">Ausentes</option>
            <option value="ferias">De Férias</option>
            <option value="afastado">Afastados</option>
          </select>
        </div>
      </div>

      {/* Lista de Colaboradores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colaboradoresFiltrados.map((colaborador) => (
          <div
            key={colaborador.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {colaborador.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{colaborador.nome}</h3>
                  <p className="text-sm text-gray-400">{colaborador.cargo}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[colaborador.status].color}/20 ${statusConfig[colaborador.status].textColor}`}>
                {statusConfig[colaborador.status].label}
              </span>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
              {colaborador.obraAtual && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{colaborador.obraAtual}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4" />
                <span>{colaborador.telefone}</span>
              </div>
              {colaborador.ultimaPresenca && colaborador.status === 'presente' && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    Entrada: {new Date(colaborador.ultimaPresenca).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
              <button
                onClick={() => togglePresenca(colaborador.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  colaborador.status === 'presente'
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {colaborador.status === 'presente' ? (
                  <>
                    <UserX className="w-4 h-4" />
                    Registrar Saída
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Registrar Entrada
                  </>
                )}
              </button>
              <button
                className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                title="Enviar WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
