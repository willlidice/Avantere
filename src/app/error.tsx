'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center p-8">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-4">Algo deu errado!</h2>
        <p className="text-slate-400 mb-8 max-w-md">
          Ocorreu um erro inesperado. Tente novamente ou volte para a pagina inicial.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  )
}
