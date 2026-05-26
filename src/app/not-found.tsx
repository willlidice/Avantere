import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center p-8">
        <h1 className="text-8xl font-bold text-emerald-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Pagina nao encontrada
        </h2>
        <p className="text-slate-400 mb-8 max-w-md">
          A pagina que voce esta procurando nao existe ou foi movida.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors inline-block"
        >
          Voltar ao inicio
        </Link>
      </div>
    </div>
  )
}
