'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!session) return null

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard', active: true },
    { icon: '🏗️', label: 'Obras', href: '/dashboard/obras', active: false },
    { icon: '📅', label: 'Cronogramas', href: '/dashboard/cronogramas', active: false },
    { icon: '👷', label: 'Equipes', href: '/dashboard/equipes', active: false },
    { icon: '📁', label: 'Documentos', href: '/dashboard/documentos', active: false },
    { icon: '📈', label: 'Relatórios', href: '/dashboard/relatorios', active: false },
    { icon: '⚙️', label: 'Configurações', href: '/dashboard/configuracoes', active: false },
  ]

  const statsCards = [
    { icon: '🏗️', label: 'Obras Ativas', value: '12', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
    { icon: '📋', label: 'Tarefas Pendentes', value: '47', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
    { icon: '👷', label: 'Equipes Alocadas', value: '8', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
    { icon: '✅', label: 'Concluídas (mês)', value: '23', color: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
  ]

  const recentActivities = [
    { icon: '📸', text: 'Fotos adicionadas na obra Torre Norte', time: 'Há 15 min' },
    { icon: '✅', text: 'Tarefa "Fundação Bloco B" concluída', time: 'Há 1 hora' },
    { icon: '👷', text: 'Novo membro adicionado: Carlos Silva', time: 'Há 2 horas' },
    { icon: '📄', text: 'Documento RRT atualizado', time: 'Há 3 horas' },
    { icon: '📊', text: 'Cronograma revisado - Edifício Central', time: 'Há 5 horas' },
  ]

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <Link href="/dashboard" className="text-2xl font-bold text-white flex items-center gap-2">
            🏗️ Avantere
          </Link>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
              {session.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{session.user?.name}</p>
              <p className="text-slate-400 text-sm truncate">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-white transition-colors">
                🔔
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Olá, {session.user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-slate-400">Aqui está o resumo das suas obras e atividades.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {statsCards.map((card) => (
              <div
                key={card.label}
                className={`p-6 rounded-xl border ${card.color}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{card.icon}</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                <p className="text-slate-400 text-sm">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Atividades Recentes</h3>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-xl">{activity.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-sm">{activity.text}</p>
                      <p className="text-slate-500 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-colors">
                  <span className="text-2xl mb-2 block">➕</span>
                  <span className="text-white font-medium text-sm">Nova Obra</span>
                </button>
                <button className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-colors">
                  <span className="text-2xl mb-2 block">📋</span>
                  <span className="text-white font-medium text-sm">Nova Tarefa</span>
                </button>
                <button className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-colors">
                  <span className="text-2xl mb-2 block">📤</span>
                  <span className="text-white font-medium text-sm">Upload Arquivo</span>
                </button>
                <button className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-colors">
                  <span className="text-2xl mb-2 block">👥</span>
                  <span className="text-white font-medium text-sm">Convidar Membro</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
