'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Upload, 
  FileText, 
  Image, 
  File, 
  Filter,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  FolderOpen,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building2
} from 'lucide-react'

// Tipos
interface Documento {
  id: string
  name: string
  url: string
  size: number
  type: string
  category: string
  description?: string
  projectId?: string
  project?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

// Categorias disponíveis
const CATEGORIAS = [
  { value: 'geral', label: 'Geral' },
  { value: 'contrato', label: 'Contratos' },
  { value: 'projeto', label: 'Projetos' },
  { value: 'orcamento', label: 'Orçamentos' },
  { value: 'nota_fiscal', label: 'Notas Fiscais' },
  { value: 'relatorio', label: 'Relatórios' },
  { value: 'planta', label: 'Plantas' },
  { value: 'foto', label: 'Fotos' },
  { value: 'documento_pessoal', label: 'Documentos Pessoais' },
  { value: 'alvara', label: 'Alvarás e Licenças' },
  { value: 'outro', label: 'Outros' },
]

// Componente de Menu com posicionamento inteligente
function ActionMenu({ 
  documento, 
  onView, 
  onDownload, 
  onDelete 
}: { 
  documento: Documento
  onView: () => void
  onDownload: () => void
  onDelete: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Calcular posição do menu ao abrir
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const spaceBelow = windowHeight - buttonRect.bottom
      const menuHeight = 160

      setMenuPosition(spaceBelow < menuHeight ? 'top' : 'bottom')
    }
    setIsOpen(!isOpen)
  }

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        title="Ações"
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div 
          className={`absolute right-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-1 ${
            menuPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{ zIndex: 9999 }}
        >
          <button
            onClick={() => {
              onView()
              setIsOpen(false)
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
          >
            <Eye className="w-4 h-4" />
            Visualizar
          </button>
          <button
            onClick={() => {
              onDownload()
              setIsOpen(false)
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-3"
          >
            <Download className="w-4 h-4" />
            Baixar
          </button>
          <hr className="my-1 border-gray-700" />
          <button
            onClick={() => {
              onDelete()
              setIsOpen(false)
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-3"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      )}
    </div>
  )
}

export default function DocumentosPage() {
  const router = useRouter()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  
  // Modal de upload
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCategory, setUploadCategory] = useState('geral')
  const [uploadProjectId, setUploadProjectId] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Notificações
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Buscar documentos
  const fetchDocumentos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (categoryFilter) params.append('category', categoryFilter)
      if (projectFilter) params.append('projectId', projectFilter)

      const response = await fetch(`/api/documentos?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        const docs = Array.isArray(data) ? data : (data.documentos || data.files || [])
        setDocumentos(docs)
      } else {
        console.warn('API de documentos retornou:', response.status)
        setDocumentos([])
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error)
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  // Buscar projetos para filtro
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || data || [])
      } else {
        console.warn('API de projetos retornou:', response.status)
        setProjects([])
      }
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
      setProjects([])
    }
  }

  useEffect(() => {
    fetchDocumentos()
    fetchProjects()
  }, [searchTerm, categoryFilter, projectFilter])

  // Mostrar notificação
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Upload de arquivo
  const handleUpload = async () => {
    if (!uploadFile) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('category', uploadCategory)
      if (uploadProjectId) formData.append('projectId', uploadProjectId)
      if (uploadDescription) formData.append('description', uploadDescription)

      const response = await fetch('/api/documentos/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        showNotification('success', 'Arquivo enviado com sucesso!')
        setShowUploadModal(false)
        setUploadFile(null)
        setUploadCategory('geral')
        setUploadProjectId('')
        setUploadDescription('')
        fetchDocumentos()
      } else {
        showNotification('error', data.error || 'Erro ao enviar arquivo')
      }
    } catch (error) {
      showNotification('error', 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  // Excluir documento
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      const response = await fetch(`/api/documentos/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showNotification('success', 'Documento excluído com sucesso!')
        fetchDocumentos()
      } else {
        showNotification('error', 'Erro ao excluir documento')
      }
    } catch (error) {
      showNotification('error', 'Erro ao excluir documento')
    }
  }

  // Baixar documento
  const handleDownload = (documento: Documento) => {
    const link = document.createElement('a')
    link.href = documento.url
    link.download = documento.name
    link.click()
  }

  // Visualizar documento
  const handleView = (documento: Documento) => {
    window.open(documento.url, '_blank')
  }

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Ícone por tipo de arquivo
  const getFileIcon = (type: string | null | undefined) => {
    if (!type) return <File className="w-8 h-8 text-blue-400" />
    if (type.startsWith('image/')) return <Image className="w-8 h-8 text-purple-400" />
    if (type === 'application/pdf') return <FileText className="w-8 h-8 text-red-400" />
    return <File className="w-8 h-8 text-blue-400" />
  }

  // Label da categoria
  const getCategoryLabel = (value: string | null | undefined) => {
    if (!value) return 'Geral'
    return CATEGORIAS.find(c => c.value === value)?.label || value
  }

  // Formatar data
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return '-'
    }
  }

  return (
    <div className="p-6">
      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500/20 border border-green-500 text-green-400' 
            : 'bg-red-500/20 border border-red-500 text-red-400'
        }`}>
          {notification.type === 'success' 
            ? <CheckCircle className="w-5 h-5" /> 
            : <AlertCircle className="w-5 h-5" />
          }
          {notification.message}
          <button onClick={() => setNotification(null)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header com botão Voltar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Voltar para Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Documentos</h1>
            <p className="text-gray-400 text-sm">Gerencie os arquivos e documentos das suas obras</p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Enviar Arquivo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="">Todas Categorias</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="">Todas as Obras</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Documentos */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-visible">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Carregando documentos...</p>
          </div>
        ) : documentos.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Nenhum documento encontrado</h3>
            <p className="text-gray-500 mb-4">Comece enviando seu primeiro arquivo</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Enviar Arquivo
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Arquivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Obra
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {documentos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <div>
                          <p className="text-white font-medium truncate max-w-[200px]" title={doc.name || 'Sem nome'}>
                            {doc.name || 'Sem nome'}
                          </p>
                          {doc.description && (
                            <p className="text-gray-500 text-sm truncate max-w-[200px]" title={doc.description}>
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                        {getCategoryLabel(doc.category)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-sm">
                      {doc.project?.name || '-'}
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-sm">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-sm">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <ActionMenu
                        documento={doc}
                        onView={() => handleView(doc)}
                        onDownload={() => handleDownload(doc)}
                        onDelete={() => handleDelete(doc.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Enviar Documento</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFile(null)
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Área de drop/seleção de arquivo */}
              <div
                onClick={() => document.getElementById('file-input')?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  uploadFile 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-600 hover:border-blue-500 hover:bg-blue-500/10'
                }`}
              >
                {uploadFile ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                    <p className="text-white font-medium">{uploadFile.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(uploadFile.size)}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setUploadFile(null)
                      }}
                      className="text-red-400 text-sm mt-2 hover:text-red-300"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-gray-300">Clique para selecionar um arquivo</p>
                    <p className="text-gray-500 text-sm">ou arraste e solte aqui</p>
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.zip,.rar"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Vincular à Obra */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Vincular à Obra (opcional)
                </label>
                <select
                  value={uploadProjectId}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Nenhuma obra</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Adicione uma descrição..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFile(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
