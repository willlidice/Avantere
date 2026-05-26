// src/components/ComingSoon.tsx
'use client'

import { useRouter } from 'next/navigation'

interface ComingSoonProps {
  title: string
  description: string
  icon: string
  features?: string[]
}

export function ComingSoon({ title, description, icon, features }: ComingSoonProps) {
  const router = useRouter()

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Ícone */}
        <div className="text-6xl mb-6">{icon}</div>
        
        {/* Título */}
        <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
        
        {/* Descrição */}
        <p className="text-zinc-400 mb-6">{description}</p>
        
        {/* Features planejadas */}
        {features && features.length > 0 && (
          <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-zinc-500 mb-3">Funcionalidades planejadas:</p>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="text-blue-500">◆</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm">
          <span className="animate-pulse">●</span>
          Em desenvolvimento
        </div>
        
        {/* Botão voltar */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 block w-full text-center text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          ← Voltar ao Dashboard
        </button>
      </div>
    </div>
  )
}
