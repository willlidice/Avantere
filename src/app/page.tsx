import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">
            Avantere
          </div>
          <div className="flex gap-4">
            <Link 
              href="/login"
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link 
              href="/registro"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
            >
              Criar Conta
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-white mb-6">
            Gestao Inteligente para 
            <span className="text-emerald-400"> Construcao Civil</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Controle cronogramas, equipes e documentos em um unico lugar. 
            Acesse do escritorio ou do canteiro de obras.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/registro"
              className="px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-lg hover:bg-emerald-500 transition-colors"
            >
              Comecar Agora
            </Link>
            <Link 
              href="/login"
              className="px-8 py-4 border border-slate-600 text-white text-lg font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Ja tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Cronogramas
            </h3>
            <p className="text-slate-400">
              Importe do MS Project, Primavera ou Excel. Acompanhe em tempo real.
            </p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">👷</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Equipes
            </h3>
            <p className="text-slate-400">
              Gerencie tarefas, registre progresso e fotos direto do canteiro.
            </p>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Documentos
            </h3>
            <p className="text-slate-400">
              PDF, DWG, BIM/IFC organizados e acessiveis para toda a equipe.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-slate-800">
        <p className="text-center text-slate-500">
          2026 Avantere. Todos os direitos reservados.
        </p>
      </footer>
    </main>
  )
}
