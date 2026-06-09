"use client"

import { useEffect, useState } from "react"
import { X, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const VERSAO_ATUAL = "2.1.0"
const STORAGE_KEY = `avantere_novidades_${VERSAO_ATUAL}`

const NOVIDADES = [
  { texto: "Cabeçalho do cronograma exibe dados completos da obra (CNPJ, cliente, contrato)" },
  { texto: "Dashboard com tarefas atrasadas clicáveis e detalhadas" },
  { texto: "Obras: card de detalhes ao clicar no nome" },
  { texto: "Navegação mobile melhorada com menu lateral e bottom bar" },
  { texto: "Botão Sair disponível na página Configurações" },
  { texto: "Toggle para visualizar senha na tela de login" },
  { texto: "Email de boas-vindas enviado automaticamente ao criar novo usuário" },
  { texto: "Popup de tarefa traduzida com opção de expandir a tela" },
  { texto: "Qualidade do JPG salvo melhorada (3× resolução)" },
  { texto: "Botão 'Adicionar Foto' destacado em todas as tarefas (câmera e arquivo)" },
  { texto: "Exportar cronograma por e-mail diretamente do sistema" },
  { texto: "Página de Sugestões e Melhorias para envio de feedback" },
  { texto: "Histórico de versões disponível nas Configurações do Admin" },
]

export function PopupNovidades() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisivel(true)
    }
  }, [])

  function fechar() {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisivel(false)
  }

  if (!visivel) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-6 pt-6 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide uppercase">Avantere</span>
            </div>
            <button
              onClick={fechar}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">Novidades da versão {VERSAO_ATUAL}</h2>
          <p className="text-amber-100 text-sm mt-1">O Avantere foi atualizado com melhorias importantes.</p>
        </div>

        {/* Lista */}
        <div className="px-6 py-4 max-h-72 overflow-y-auto space-y-2">
          {NOVIDADES.map((n, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-snug">{n.texto}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t">
          <Button onClick={fechar} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
            Entendido!
          </Button>
        </div>
      </div>
    </div>
  )
}
