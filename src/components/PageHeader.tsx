'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  showBackButton?: boolean
  showHomeButton?: boolean
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  icon,
  showBackButton = true,
  showHomeButton = true,
  actions
}: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-8">
      {/* Navegação */}
      <div className="flex items-center gap-2 mb-4">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        )}
        
        {showHomeButton && (
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            title="Ir para Dashboard"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        )}
      </div>

      {/* Título e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-2xl shadow-lg">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
            {description && (
              <p className="text-gray-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
