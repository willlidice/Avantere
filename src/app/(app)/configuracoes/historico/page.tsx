import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Tag, CheckCircle2 } from "lucide-react"

const HISTORICO = [
  {
    versao: "2.1.0",
    data: "2025-06-09",
    tipo: "feature",
    itens: [
      "Cabeçalho do cronograma com CNPJ, cliente e dados do contrato da obra",
      "Dashboard com tarefas atrasadas clicáveis e listagem detalhada",
      "Card de detalhes ao clicar no nome da obra na lista",
      "Navegação mobile melhorada: menu lateral deslizante e bottom bar com ícones",
      "Botão 'Sair' adicionado à página Configurações",
      "Toggle para visualizar senha digitada na tela de login",
      "Email de boas-vindas enviado automaticamente ao criar novo usuário com credenciais",
      "Popup de tarefa traduzida com opção de expandir para tela maior",
      "Qualidade do JPG salvo pelo editor melhorada (pixelRatio 3×, limite 25 MB)",
      "Botão 'Adicionar Foto' destacado em todas as tarefas para todos os perfis (câmera + arquivo)",
      "Exportar cronograma traduzido por e-mail diretamente do sistema",
      "Página de Sugestões e Melhorias para coleta de feedback dos usuários",
      "Histórico de versões (esta página) disponível nas Configurações do Admin",
      "Popup de novidades exibido uma vez por versão ao fazer login",
    ],
  },
  {
    versao: "2.0.0",
    data: "2025-05-15",
    tipo: "major",
    itens: [
      "Lançamento completo com todas as fases implementadas",
      "Setup + Auth + Middleware com controle de perfis (ADMIN, GESTAO, PRODUCAO)",
      "CRUD de Obras com vínculo de usuários e configurações detalhadas",
      "Upload e parse de Excel (.xlsx) com versionamento automático",
      "Tradução IA em lote via Claude Haiku — instruções simples para a equipe",
      "Editor PDF→JPG com anotações, setas, retângulos e recorte (react-konva)",
      "Galeria de imagens por tarefa com suporte a câmera mobile",
      "Comentários por tarefa com histórico de status",
      "Exportação de cronograma em PDF, XLSX e Gantt",
      "Notificações de prazo por email e push (PWA instalável)",
      "Busca global de tarefas por nome, local e ID",
      "Suporte a múltiplos idiomas (PT, EN, ES)",
    ],
  },
]

const TIPO_COR: Record<string, string> = {
  major: "bg-amber-100 text-amber-800 border-amber-300",
  feature: "bg-blue-100 text-blue-800 border-blue-300",
  fix: "bg-green-100 text-green-800 border-green-300",
}

const TIPO_LABEL: Record<string, string> = {
  major: "Major",
  feature: "Novidades",
  fix: "Correções",
}

export default async function HistoricoPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "ADMIN") redirect("/configuracoes")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar às Configurações
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Admin
        </p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <Tag className="h-6 w-6 text-amber-600" />
          Histórico de Versões
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro de todas as atualizações do sistema Avantere.
        </p>
      </div>

      <div className="space-y-6">
        {HISTORICO.map((release) => (
          <div key={release.versao} className="border rounded-xl overflow-hidden bg-card">
            <div className="flex items-center justify-between px-5 py-4 bg-muted/30 border-b">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground font-mono">v{release.versao}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TIPO_COR[release.tipo]}`}>
                  {TIPO_LABEL[release.tipo]}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(release.data).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <ul className="divide-y">
              {release.itens.map((item, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
