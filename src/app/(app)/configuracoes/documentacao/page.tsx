import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Ferramenta {
  nome: string
  categoria: "Plataforma" | "Banco de Dados" | "Interface" | "Segurança" | "IA" | "Armazenamento" | "Utilitário"
  descricao: string
  explicacao: string
  url: string
  urlLabel: string
}

const ferramentas: Ferramenta[] = [
  {
    nome: "Next.js",
    categoria: "Plataforma",
    descricao: "O motor que faz tudo funcionar",
    explicacao:
      "É o framework principal do Avantere. Pense nele como o motor de um carro: tudo passa por ele — as páginas que você vê, as rotas de navegação, as APIs que buscam dados no banco. Quando você abre o sistema no navegador, é o Next.js que decide o que mostrar.",
    url: "https://nextjs.org",
    urlLabel: "nextjs.org",
  },
  {
    nome: "PostgreSQL",
    categoria: "Banco de Dados",
    descricao: "O cofre de todos os dados do sistema",
    explicacao:
      "É o banco de dados relacional onde ficam armazenados: usuários, obras, cronogramas, tarefas e imagens. Funciona como uma planilha muito robusta que nunca perde dados, aceita muitos acessos simultâneos e garante que as informações fiquem organizadas e seguras.",
    url: "https://www.postgresql.org",
    urlLabel: "postgresql.org",
  },
  {
    nome: "Prisma",
    categoria: "Banco de Dados",
    descricao: "O tradutor entre o código e o banco de dados",
    explicacao:
      "Atua como intermediário entre o código JavaScript e o PostgreSQL. Em vez de escrever comandos SQL complexos, o Prisma permite que os programadores acessem os dados de forma simples e segura. Ele também mapeia a estrutura do banco (tabelas, colunas, relacionamentos).",
    url: "https://www.prisma.io",
    urlLabel: "prisma.io",
  },
  {
    nome: "Tailwind CSS",
    categoria: "Interface",
    descricao: "O sistema de visual e estilo da tela",
    explicacao:
      "É a biblioteca responsável por toda a aparência do Avantere: cores, espaçamentos, tamanhos de texto, bordas e layout. Em vez de criar arquivos de estilo separados, o Tailwind aplica estilos diretamente no HTML com classes utilitárias. É o que garante que o sistema fique bonito e responsivo no celular e no desktop.",
    url: "https://tailwindcss.com",
    urlLabel: "tailwindcss.com",
  },
  {
    nome: "shadcn/ui",
    categoria: "Interface",
    descricao: "Os componentes visuais prontos (botões, tabelas, modais)",
    explicacao:
      "Uma biblioteca de componentes de interface prontos para usar: botões, formulários, tabelas, menus suspensos, diálogos de confirmação e muito mais. Pense como uma caixa de peças LEGO de alta qualidade — o programador monta a tela usando esses blocos ao invés de criar tudo do zero.",
    url: "https://ui.shadcn.com",
    urlLabel: "ui.shadcn.com",
  },
  {
    nome: "NextAuth.js",
    categoria: "Segurança",
    descricao: "O porteiro do sistema (login e controle de acesso)",
    explicacao:
      "Gerencia toda a autenticação do Avantere: tela de login, sessões dos usuários, controle de quem pode acessar o quê. É ele que impede que um usuário do perfil Produção acesse telas de gestão, e que mantém o usuário logado entre sessões sem precisar digitar a senha a cada vez.",
    url: "https://next-auth.js.org",
    urlLabel: "next-auth.js.org",
  },
  {
    nome: "Cloudflare R2",
    categoria: "Armazenamento",
    descricao: "O álbum de fotos na nuvem",
    explicacao:
      "Serviço de armazenamento de objetos (arquivos) na nuvem da Cloudflare. Quando você faz upload de uma imagem de tarefa no editor ou inclui uma foto de registro, ela vai para o R2 e recebe um endereço permanente (URL). É parecido com o Google Drive, mas acessado automaticamente pelo sistema.",
    url: "https://developers.cloudflare.com/r2",
    urlLabel: "cloudflare.com/r2",
  },
  {
    nome: "Claude (Anthropic)",
    categoria: "IA",
    descricao: "A inteligência artificial que traduz os nomes das tarefas",
    explicacao:
      "É o modelo de linguagem da Anthropic usado para traduzir automaticamente os nomes técnicos das tarefas do cronograma para um português claro e objetivo, adequado para operários e gestores de obra. O Avantere usa o modelo Claude Haiku, que é rápido e eficiente para processar lotes de tarefas de uma vez.",
    url: "https://www.anthropic.com",
    urlLabel: "anthropic.com",
  },
  {
    nome: "XLSX (SheetJS)",
    categoria: "Utilitário",
    descricao: "O leitor e gerador de planilhas Excel",
    explicacao:
      "Biblioteca que permite ao Avantere ler arquivos .xlsx (Excel) ao importar um cronograma, e também gerar planilhas para exportação. É ela que interpreta as colunas do arquivo enviado (ID, TAREFA, LOCAL, DATAS etc.) e transforma os dados em registros no banco.",
    url: "https://sheetjs.com",
    urlLabel: "sheetjs.com",
  },
  {
    nome: "React Konva",
    categoria: "Utilitário",
    descricao: "O editor de imagens e anotações das tarefas",
    explicacao:
      "Biblioteca usada no editor de imagens do Avantere (tela de edição de foto de tarefa). Permite desenhar sobre imagens: adicionar setas, textos, marcações e anotações visuais. Funciona como um Canva simplificado, diretamente no navegador, sem precisar instalar nada.",
    url: "https://konvajs.org",
    urlLabel: "konvajs.org",
  },
]

const CATEGORIA_COR: Record<Ferramenta["categoria"], string> = {
  Plataforma: "bg-blue-100 text-blue-700",
  "Banco de Dados": "bg-purple-100 text-purple-700",
  Interface: "bg-pink-100 text-pink-700",
  Segurança: "bg-red-100 text-red-700",
  IA: "bg-indigo-100 text-indigo-700",
  Armazenamento: "bg-orange-100 text-orange-700",
  Utilitário: "bg-green-100 text-green-700",
}

export default function DocumentacaoPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/configuracoes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Configurações
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Configurações
        </p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Documentação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ferramentas e tecnologias que compõem o Avantere, explicadas para todos os perfis.
        </p>
      </div>

      <div className="grid gap-4">
        {ferramentas.map((f) => (
          <Card key={f.nome} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{f.nome}</CardTitle>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORIA_COR[f.categoria]}`}>
                      {f.categoria}
                    </span>
                  </div>
                  <CardDescription className="text-sm font-medium text-gray-600">
                    {f.descricao}
                  </CardDescription>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5"
                >
                  {f.urlLabel}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 leading-relaxed">{f.explicacao}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
