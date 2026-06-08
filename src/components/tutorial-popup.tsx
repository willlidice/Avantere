"use client"

import { useEffect, useState } from "react"
import {
  X,
  ChevronLeft,
  ChevronRight,
  HardHat,
  FileSpreadsheet,
  Languages,
  Image,
  Search,
  ClipboardList,
  Bell,
  Settings,
  Users,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "avantere_tutorial_visto"

interface Passo {
  icon: React.ElementType
  iconCor: string
  titulo: string
  descricao: string
  detalhes: string[]
  perfis?: string[]
}

const PASSOS: Passo[] = [
  {
    icon: HardHat,
    iconCor: "bg-amber-500",
    titulo: "Bem-vindo ao Avantere!",
    descricao: "Plataforma de gestão de cronogramas de obra com tradução inteligente por IA.",
    detalhes: [
      "Conecta gestores e equipes de produção em obras civis",
      "Importação de cronogramas via planilha Excel",
      "Tradução automática de tarefas técnicas",
      "Acompanhamento em tempo real do progresso",
    ],
  },
  {
    icon: FileSpreadsheet,
    iconCor: "bg-blue-500",
    titulo: "Cronograma de Obra",
    descricao: "Importe e gerencie cronogramas diretamente de planilhas Excel.",
    detalhes: [
      "Faça upload de arquivos .xlsx com colunas: ID, TAREFA, LOCAL, QUANTIDADE, UNIDADE, DATA INÍCIO, DATA FIM",
      "Cada importação gera uma nova versão do cronograma",
      "Compare versões e visualize o histórico de mudanças",
      "Exporte o cronograma em PDF ou Excel (original ou traduzido)",
    ],
    perfis: ["ADMIN", "GESTAO"],
  },
  {
    icon: Languages,
    iconCor: "bg-indigo-500",
    titulo: "Tradução por IA",
    descricao: "Traduza tarefas técnicas para instruções simples que a equipe entende.",
    detalhes: [
      "Tradução em lote de todas as tarefas de uma vez",
      "Gera instruções passo a passo, lista de materiais e alertas de segurança",
      "A equipe de produção vê as instruções formatadas ao abrir a tarefa",
      "Apenas tarefas sem tradução são processadas (sem repetição)",
    ],
  },
  {
    icon: ClipboardList,
    iconCor: "bg-green-500",
    titulo: "Acompanhamento de Tarefas",
    descricao: "Veja e atualize o status de cada tarefa em tempo real.",
    detalhes: [
      "Filtre tarefas por período: hoje, esta semana ou todas",
      "Filtre por local e responsável",
      "Atualize o status: Em andamento, Com interferência, Atrasado ou Concluído",
      "Adicione comentários e veja o histórico de alterações de status",
    ],
  },
  {
    icon: Image,
    iconCor: "bg-orange-500",
    titulo: "Editor Visual de Tarefas",
    descricao: "Anexe e edite imagens diretamente nas tarefas do cronograma.",
    detalhes: [
      "Faça upload de fotos da obra diretamente nas tarefas",
      "Editor de anotações em imagens (disponível no desktop/tablet)",
      "No mobile, visualize as imagens sem edição",
      "As imagens ficam vinculadas à versão do cronograma",
    ],
    perfis: ["ADMIN", "GESTAO"],
  },
  {
    icon: Search,
    iconCor: "bg-purple-500",
    titulo: "Busca Global",
    descricao: "Encontre qualquer tarefa rapidamente em todas as obras.",
    detalhes: [
      "Pesquise por nome da tarefa, ID externo, local ou responsável",
      "Resultados agrupados por obra e versão",
      "Clique no resultado para ir direto ao cronograma",
    ],
  },
  {
    icon: Bell,
    iconCor: "bg-red-500",
    titulo: "Notificações Push",
    descricao: "Receba alertas sobre suas tarefas mesmo com o app fechado.",
    detalhes: [
      "Ative as notificações push na página de Tarefas",
      "Receba avisos sobre tarefas atrasadas e atualizações de status",
      "Disponível apenas em navegadores compatíveis (Chrome, Edge, Firefox)",
      "Pode ser desativado a qualquer momento",
    ],
  },
  {
    icon: Users,
    iconCor: "bg-gray-600",
    titulo: "Perfis de Acesso",
    descricao: "Três níveis de acesso para diferentes funções na obra.",
    detalhes: [
      "ADMIN: acesso total, gerencia usuários e obras",
      "GESTÃO: cria cronogramas, faz upload, traduz e edita tarefas",
      "PRODUÇÃO: visualiza tarefas, atualiza status e adiciona comentários",
      "O administrador vincula cada usuário às suas obras",
    ],
  },
  {
    icon: Settings,
    iconCor: "bg-slate-500",
    titulo: "Configurações",
    descricao: "Personalize sua experiência no Avantere.",
    detalhes: [
      "Altere seu idioma: Português, Inglês ou Espanhol",
      "Redefina sua senha a qualquer momento",
      "As preferências ficam salvas por usuário",
    ],
  },
]

export function TutorialPopup() {
  const [visivel, setVisivel] = useState(false)
  const [passo, setPasso] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisivel(true)
    }
  }, [])

  function fechar() {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisivel(false)
  }

  function proximo() {
    if (passo < PASSOS.length - 1) setPasso((p) => p + 1)
    else fechar()
  }

  function anterior() {
    if (passo > 0) setPasso((p) => p - 1)
  }

  if (!visivel) return null

  const atual = PASSOS[passo]
  const Icon = atual.icon
  const progresso = ((passo + 1) / PASSOS.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Barra de progresso */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-xs text-gray-400 font-medium">
            {passo + 1} de {PASSOS.length}
          </span>
          <button
            onClick={fechar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Fechar tutorial"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`${atual.iconCor} p-3 rounded-xl shrink-0`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{atual.titulo}</h2>
              <p className="text-sm text-gray-500 mt-0.5 leading-snug">{atual.descricao}</p>
            </div>
          </div>

          <ul className="space-y-2">
            {atual.detalhes.map((d, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{d}</span>
              </li>
            ))}
          </ul>

          {atual.perfis && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
              Disponível para: <span className="font-semibold">{atual.perfis.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={fechar}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Pular tutorial
          </button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={anterior}
              disabled={passo === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              size="sm"
              onClick={proximo}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {passo === PASSOS.length - 1 ? "Concluir" : "Próximo"}
              {passo < PASSOS.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Dots de navegação */}
        <div className="flex justify-center gap-1.5 pb-4">
          {PASSOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setPasso(i)}
              className={`rounded-full transition-all ${
                i === passo
                  ? "w-4 h-1.5 bg-amber-500"
                  : "w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
