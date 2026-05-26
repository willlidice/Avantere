'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  HelpCircle,
  ChevronRight,
  Save,
  Camera,
  Mail,
  Phone,
  Building2,
  Moon,
  Sun,
  Smartphone,
  Globe,
  LogOut,
  Trash2,
  Key
} from 'lucide-react'

type TabType = 'perfil' | 'notificacoes' | 'aparencia' | 'seguranca' | 'dados' | 'ajuda'

export default function ConfiguracoesPage() {
  const [tabAtiva, setTabAtiva] = useState<TabType>('perfil')
  const [salvando, setSalvando] = useState(false)
  
  // Estados do perfil
  const [perfil, setPerfil] = useState({
    nome: 'William',
    email: 'william@empresa.com',
    telefone: '(27) 99999-0000',
    empresa: 'Construtora ABC',
    cargo: 'Engenheiro de Obras'
  })

  // Estados de notificações
  const [notificacoes, setNotificacoes] = useState({
    email: true,
    push: true,
    sms: false,
    novasTarefas: true,
    atualizacoesObra: true,
    relatóriosSemanais: true,
    alertasUrgentes: true
  })

  // Estados de aparência
  const [aparencia, setAparencia] = useState({
    tema: 'escuro',
    idioma: 'pt-BR',
    formatoData: 'DD/MM/YYYY'
  })

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'aparencia', label: 'Aparência', icon: Palette },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'dados', label: 'Dados', icon: Database },
    { id: 'ajuda', label: 'Ajuda', icon: HelpCircle }
  ]

  const salvar = async () => {
    setSalvando(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSalvando(false)
    alert('Configurações salvas com sucesso!')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Configurações"
        description="Gerencie suas preferências e conta"
        icon="⚙️"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Menu Lateral */}
        <div className="lg:w-64 shrink-0">
          <nav className="bg-gray-800/50 border border-gray-700 rounded-xl p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isAtiva = tabAtiva === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabAtiva(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    isAtiva
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isAtiva ? 'rotate-90' : ''}`} />
                </button>
              )
            })}
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          {/* Tab: Perfil */}
          {tabAtiva === 'perfil' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Informações do Perfil</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                    {perfil.nome.charAt(0)}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{perfil.nome}</h3>
                  <p className="text-gray-400">{perfil.cargo}</p>
                  <p className="text-gray-500 text-sm">{perfil.empresa}</p>
                </div>
              </div>

              {/* Formulário */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={perfil.nome}
                    onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={perfil.email}
                    onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={perfil.telefone}
                    onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={perfil.empresa}
                    onChange={(e) => setPerfil({ ...perfil, empresa: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Notificações */}
          {tabAtiva === 'notificacoes' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Preferências de Notificação</h2>
              
              {/* Canais */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Canais de Notificação</h3>
                <div className="space-y-4">
                  {[
                    { key: 'email', label: 'E-mail', desc: 'Receber notificações por e-mail', icon: Mail },
                    { key: 'push', label: 'Push', desc: 'Notificações no navegador', icon: Bell },
                    { key: 'sms', label: 'SMS', desc: 'Alertas urgentes via SMS', icon: Smartphone }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-white font-medium">{item.label}</div>
                          <div className="text-sm text-gray-400">{item.desc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotificacoes({ ...notificacoes, [item.key]: !notificacoes[item.key as keyof typeof notificacoes] })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          notificacoes[item.key as keyof typeof notificacoes] ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notificacoes[item.key as keyof typeof notificacoes] ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipos */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-4">Tipos de Notificação</h3>
                <div className="space-y-3">
                  {[
                    { key: 'novasTarefas', label: 'Novas tarefas atribuídas' },
                    { key: 'atualizacoesObra', label: 'Atualizações de obras' },
                    { key: 'relatóriosSemanais', label: 'Relatórios semanais' },
                    { key: 'alertasUrgentes', label: 'Alertas urgentes' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={notificacoes[item.key as keyof typeof notificacoes] as boolean}
                        onChange={() => setNotificacoes({ ...notificacoes, [item.key]: !notificacoes[item.key as keyof typeof notificacoes] })}
                        className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                      />
                      <span className="text-white">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Aparência */}
          {tabAtiva === 'aparencia' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Aparência e Idioma</h2>
              
              {/* Tema */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Tema</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'escuro', label: 'Escuro', icon: Moon },
                    { id: 'claro', label: 'Claro', icon: Sun },
                    { id: 'sistema', label: 'Sistema', icon: Smartphone }
                  ].map((tema) => (
                    <button
                      key={tema.id}
                      onClick={() => setAparencia({ ...aparencia, tema: tema.id })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        aparencia.tema === tema.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <tema.icon className={`w-8 h-8 mx-auto mb-2 ${aparencia.tema === tema.id ? 'text-blue-400' : 'text-gray-400'}`} />
                      <div className={`text-sm font-medium ${aparencia.tema === tema.id ? 'text-blue-400' : 'text-gray-300'}`}>
                        {tema.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Idioma */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Idioma
                </label>
                <select
                  value={aparencia.idioma}
                  onChange={(e) => setAparencia({ ...aparencia, idioma: e.target.value })}
                  className="w-full sm:w-64 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>

              {/* Formato de Data */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Formato de Data
                </label>
                <select
                  value={aparencia.formatoData}
                  onChange={(e) => setAparencia({ ...aparencia, formatoData: e.target.value })}
                  className="w-full sm:w-64 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/AAAA (25/05/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/AAAA (05/25/2026)</option>
                  <option value="YYYY-MM-DD">AAAA-MM-DD (2026-05-25)</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab: Segurança */}
          {tabAtiva === 'seguranca' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Segurança da Conta</h2>
              
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">Alterar Senha</div>
                      <div className="text-sm text-gray-400">Última alteração: há 30 dias</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">Autenticação de Dois Fatores</div>
                      <div className="text-sm text-gray-400">Adicione uma camada extra de segurança</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Desativado</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">Dispositivos Conectados</div>
                      <div className="text-sm text-gray-400">3 dispositivos ativos</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-red-400 font-medium mb-4">Zona de Perigo</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sair de Todos os Dispositivos
                </button>
              </div>
            </div>
          )}

          {/* Tab: Dados */}
          {tabAtiva === 'dados' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Gerenciamento de Dados</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Exportar Dados</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Baixe uma cópia de todos os seus dados em formato JSON ou CSV.
                  </p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                      Exportar JSON
                    </button>
                    <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm">
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Armazenamento</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Uso atual de armazenamento da sua conta.
                  </p>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">2.4 GB de 10 GB</span>
                      <span className="text-white">24%</span>
                    </div>
                    <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full w-1/4 bg-blue-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <h3 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Excluir Conta
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
                  </p>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm">
                    Solicitar Exclusão
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Ajuda */}
          {tabAtiva === 'ajuda' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Central de Ajuda</h2>
              
              <div className="space-y-4">
                <a href="#" className="block p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                  <h3 className="text-white font-medium mb-1">📖 Documentação</h3>
                  <p className="text-sm text-gray-400">Aprenda a usar todas as funcionalidades do sistema.</p>
                </a>
                <a href="#" className="block p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                  <h3 className="text-white font-medium mb-1">🎥 Tutoriais em Vídeo</h3>
                  <p className="text-sm text-gray-400">Assista vídeos explicativos passo a passo.</p>
                </a>
                <a href="#" className="block p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                  <h3 className="text-white font-medium mb-1">❓ FAQ</h3>
                  <p className="text-sm text-gray-400">Perguntas frequentes e respostas rápidas.</p>
                </a>
                <a href="#" className="block p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                  <h3 className="text-white font-medium mb-1">💬 Suporte</h3>
                  <p className="text-sm text-gray-400">Entre em contato com nossa equipe de suporte.</p>
                </a>
              </div>

              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Versão do Sistema:</strong> 1.0.0-beta
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Última atualização: 25 de Maio de 2026
                </p>
              </div>
            </div>
          )}

          {/* Botão Salvar */}
          {['perfil', 'notificacoes', 'aparencia'].includes(tabAtiva) && (
            <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end">
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
              >
                {salvando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
