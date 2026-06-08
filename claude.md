# Avantere

App web de gestão de cronogramas de obra com tradução de tarefas por IA.

## Stack
Next.js 14 (App Router, TS) · Prisma + PostgreSQL · Tailwind + shadcn/ui · NextAuth (Credentials/JWT) · Cloudflare R2 · Anthropic SDK (Haiku)

## Perfis (fixos, enum)
- ADMIN: tudo + gerencia usuários/obras
- GESTAO: cria/edita/traduz cronograma e tarefas
- PRODUCAO: só visualiza /tarefas

## Regras
- Upload SÓ .xlsx com colunas: ID, TAREFA, LOCAL, QUANTIDADE, UNIDADE, DATA INICIO, DATA FIM (validar e rejeitar se faltar)
- Oferecer modelo .xlsx em branco p/ download
- Cronograma versionado (campo `versao Int`)
- Tradução em LOTE (1 chamada p/ N tarefas, modelo Haiku, só traduz nomeTraduzido=null)
- PRODUCAO bloqueado no middleware (não só no menu)
- Salvar APENAS: cronograma versionado + JPGs editados (sem outros arquivos)
- PWA instalável (sem Electron)

## Convenções
- Código e comentários em português
- shadcn/ui sempre que possível
- Responsivo: tabela no desktop, cards no mobile (`hidden md:`)
- Editor PDF→JPG só desktop/tablet; mobile só visualiza

## Models (Prisma)
User(nome,email,senha,perfil) · Obra(nome,ativa) · ObraUser(join) · Cronograma(obraId,versao) · Tarefa(idExterno,nome,nomeTraduzido,local,quantidade,unidade,inicio,fim,ordem,jpgEditadoUrl)

## Fases (ordem)
1. Setup + Auth + middleware
2. CRUD obras + vínculo usuários + configurações/perfis
3. Upload Excel + parse + versionamento
4. Tradução IA (lote/Haiku) ⭐
5. Editor PDF→JPG (react-konva)
6. Configurações finais (senha, idioma)

{
  "role": "Engenheiro de Software Sênior",
  "task": "Security & Production Audit completo (pré go-live): analisar e corrigir",
  "checklist": {
    "https": "Forçar HTTPS + HSTS em todas as camadas (anti MITM)",
    "senhas": "Substituir hash obsoleto (MD5/SHA-1) por Argon2 ou Bcrypt + salt individual",
    "apis": "Achar chaves/chamadas expostas no frontend (DevTools); mover segredos p/ backend + proteger endpoints",
    "baas": "Se Supabase/Firebase: configurar e validar RLS (usuário só acessa próprios dados)",
    "erros": "Eliminar telas em branco; mensagens de erro claras e amigáveis",
    "testes": "Criar testes automatizados das funcionalidades principais",
    "backups": "Sugerir backups automatizados e redundantes do banco",
    "estado": "Organizar gerenciamento de estado (evitar inconsistência na UI)",
    "performance": "Revisar gargalos de performance ignorados pela IA"
  },
  "output": "Para cada item: código corrigido OU instruções exatas de configuração"
}
