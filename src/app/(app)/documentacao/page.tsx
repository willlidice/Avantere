import Link from "next/link"
import { ArrowLeft, ShieldCheck, Database, Lock, Users, FileText, Trash2, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export const metadata = { title: "Documentação e LGPD — Avantere" }

function Secao({ icon: Icon, titulo, children }: { icon: React.ElementType; titulo: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-amber-500" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-700 space-y-3">{children}</CardContent>
    </Card>
  )
}

function Item({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b last:border-0">
      <span className="text-gray-600 shrink-0 w-40">{label}</span>
      <span className="flex-1 text-gray-800">{value}</span>
      {badge && <Badge variant="secondary" className="shrink-0 text-xs">{badge}</Badge>}
    </div>
  )
}

export default function DocumentacaoPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Voltar ao Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2.5 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documentação e Privacidade</h1>
            <p className="text-sm text-gray-500 mt-0.5">Conformidade com a LGPD — Lei nº 13.709/2018</p>
          </div>
        </div>
      </div>

      {/* Declaração */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-green-800">
          O Avantere está em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).
        </p>
        <p className="text-xs text-green-700 mt-1.5 leading-relaxed">
          Coletamos apenas os dados necessários para o funcionamento do sistema de gestão de obras.
          Todos os dados são armazenados em servidor seguro, com acesso controlado por perfil de usuário.
          Você pode solicitar a exclusão ou anonimização dos seus dados a qualquer momento.
        </p>
      </div>

      {/* Dados coletados */}
      <Secao icon={Database} titulo="Dados Coletados e Finalidade">
        <Item label="Nome completo" value="Identificação do usuário no sistema" badge="Pessoal" />
        <Item label="E-mail" value="Login, notificações e recuperação de acesso" badge="Pessoal" />
        <Item label="Senha" value="Autenticação — armazenada com bcrypt (hash irreversível)" badge="Criptografado" />
        <Item label="Perfil de acesso" value="Controle de permissões (ADMIN, GESTÃO, PRODUÇÃO)" badge="Operacional" />
        <Item label="Comentários em tarefas" value="Comunicação entre equipes de obra" badge="Operacional" />
        <Item label="Logs de auditoria" value="Rastreabilidade de alterações em cronogramas" badge="Auditoria" />
        <Item label="Cliente / CNPJ da obra" value="Dados contratuais da obra — pessoa jurídica" badge="Contratual" />
        <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
          Dados de pessoa jurídica (CNPJ, razão social) não são protegidos pela LGPD, mas seguimos as mesmas
          boas práticas de segurança para todos os dados armazenados.
        </p>
      </Secao>

      {/* Segurança */}
      <Secao icon={Lock} titulo="Medidas de Segurança">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span><strong>Senhas com bcrypt:</strong> nenhuma senha é armazenada em texto puro. Utilizamos hash bcrypt com salt individual, tornando a reversão computacionalmente inviável.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span><strong>Controle de acesso por perfil (RBAC):</strong> cada perfil acessa apenas as funcionalidades autorizadas. O perfil PRODUÇÃO não acessa dados de gestão; o middleware bloqueia rotas não autorizadas.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span><strong>HTTPS obrigatório:</strong> toda comunicação entre cliente e servidor é criptografada via TLS.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span><strong>Arquivos em armazenamento seguro:</strong> imagens e documentos são armazenados no Cloudflare R2, com URLs assinadas e controle de acesso.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span><strong>Sessões JWT:</strong> autenticação via tokens de curta duração gerenciados pelo NextAuth. Nenhuma senha trafega após o login.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span><strong>Auditoria de ações:</strong> todas as alterações em cronogramas e tarefas são registradas com data, hora e usuário responsável.</span>
          </div>
        </div>
      </Secao>

      {/* Direitos do titular */}
      <Secao icon={Users} titulo="Direitos do Titular (Art. 18 da LGPD)">
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 space-y-2">
            <p className="text-sm font-medium text-blue-800">Como exercer seus direitos:</p>
            <p className="text-xs text-blue-700">
              Entre em contato pelo e-mail <strong>suporte@avantere.com.br</strong> informando seu nome completo
              e a solicitação desejada. Respondemos em até <strong>15 dias úteis</strong>, conforme exigido pela LGPD.
            </p>
          </div>
          <Item label="Acesso" value="Solicitar cópia de todos os seus dados pessoais armazenados" />
          <Item label="Retificação" value="Corrigir dados incorretos ou desatualizados" />
          <Item label="Exclusão" value="Solicitar anonimização ou exclusão definitiva dos seus dados" />
          <Item label="Portabilidade" value="Receber seus dados em formato estruturado (CSV/JSON)" />
          <Item label="Revogação" value="Revogar consentimentos concedidos anteriormente" />
          <Item label="Oposição" value="Opor-se a tratamentos realizados com base em legítimo interesse" />
        </div>
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mt-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            A exclusão de dados pode impedir o acesso ao sistema e ao histórico de obras vinculadas ao usuário.
            Dados de auditoria podem ser mantidos por obrigação legal mesmo após a exclusão do usuário.
          </p>
        </div>
      </Secao>

      {/* Retenção */}
      <Secao icon={Clock} titulo="Política de Retenção de Dados">
        <Item label="Dados de usuário ativo" value="Enquanto a conta estiver ativa" />
        <Item label="Dados após inativação" value="60 dias — após anonimizados ou excluídos" />
        <Item label="Logs de auditoria" value="5 anos — obrigação de rastreabilidade contratual" />
        <Item label="Dados de obra concluída" value="10 anos — exigência fiscal e do CNO (INSS)" />
        <Item label="Comentários e imagens" value="Junto com o cronograma ao qual pertencem" />
        <Item label="Documentos anexados" value="Enquanto a obra estiver ativa no sistema" />
      </Secao>

      {/* Compartilhamento */}
      <Secao icon={FileText} titulo="Compartilhamento de Dados">
        <p>
          O Avantere <strong>não vende, não aluga e não compartilha dados pessoais</strong> com terceiros para fins
          comerciais ou publicitários.
        </p>
        <p>
          Os dados podem ser acessados apenas por:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Usuários autorizados pela organização contratante, conforme seus perfis</li>
          <li>Prestadores de infraestrutura técnica (hospedagem, armazenamento) sob contrato de sigilo</li>
          <li>Autoridades públicas, exclusivamente quando exigido por lei</li>
        </ul>
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mt-2 space-y-1">
          <p className="text-xs font-medium text-gray-700">Subprocessadores utilizados:</p>
          <p className="text-xs text-gray-600">• <strong>Cloudflare R2</strong> — armazenamento de arquivos (imagens, documentos)</p>
          <p className="text-xs text-gray-600">• <strong>PostgreSQL / VPS</strong> — banco de dados (servidor dedicado)</p>
          <p className="text-xs text-gray-600">• <strong>Vercel / Next.js</strong> — hospedagem da aplicação</p>
        </div>
      </Secao>

      {/* DPO */}
      <Secao icon={ShieldCheck} titulo="Encarregado de Dados (DPO)">
        <p>
          Responsável pelo tratamento de dados pessoais no Avantere:
        </p>
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 space-y-1">
          <p className="text-sm font-medium text-gray-800">Avantere Tecnologia</p>
          <p className="text-xs text-gray-600">E-mail: <a href="mailto:lgpd@avantere.com.br" className="text-blue-600 hover:underline">lgpd@avantere.com.br</a></p>
          <p className="text-xs text-gray-600">Para dúvidas, reclamações ou exercício de direitos</p>
        </div>
      </Secao>

      <Separator />

      <div className="flex items-center justify-between text-xs text-gray-400 pb-4">
        <span>Última atualização: Junho de 2026</span>
        <span>Avantere v2.0 — Conformidade LGPD</span>
      </div>
    </div>
  )
}
