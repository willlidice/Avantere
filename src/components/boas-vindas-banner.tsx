"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { X, HardHat, ShieldCheck } from "lucide-react"
import Link from "next/link"

const SESSION_KEY = "avantere_bv_dispensado"

export function BoasVindasBanner() {
  const { data: session } = useSession()
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setVisivel(true)
    }
  }, [])

  function dispensar() {
    sessionStorage.setItem(SESSION_KEY, "1")
    setVisivel(false)
  }

  if (!visivel || !session?.user) return null

  const nome = session.user.name?.split(" ")[0] ?? "usuário"
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"

  return (
    <div className="mx-4 md:mx-6 mt-4 md:mt-5 mb-0">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="bg-amber-500 p-2 rounded-lg shrink-0 mt-0.5">
              <HardHat className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {saudacao}, {nome}! Bem-vindo(a) ao Avantere.
              </p>
              <p className="text-xs text-amber-700 mt-0.5 leading-snug">
                Acompanhe o andamento das suas obras e tarefas em tempo real.
              </p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                <span className="text-xs text-gray-600">
                  Este sistema está em conformidade com a{" "}
                  <strong className="text-gray-700">LGPD</strong> — seus dados são protegidos,
                  anonimizáveis e armazenados com acesso controlado por perfil.
                </span>
                <Link
                  href="/documentacao"
                  className="text-xs text-amber-700 font-semibold underline underline-offset-2 hover:text-amber-900 whitespace-nowrap"
                >
                  Saiba mais →
                </Link>
              </div>
            </div>
          </div>
          <button
            onClick={dispensar}
            className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
