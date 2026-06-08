"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Idioma } from "@/lib/i18n"

interface IdiomaContextType {
  idioma: Idioma
  setIdioma: (idioma: Idioma) => void
}

const IdiomaContext = createContext<IdiomaContextType>({
  idioma: "pt",
  setIdioma: () => {},
})

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>("pt")

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((d) => {
        if (d.idioma && ["pt", "en", "es"].includes(d.idioma)) {
          setIdioma(d.idioma as Idioma)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <IdiomaContext.Provider value={{ idioma, setIdioma }}>
      {children}
    </IdiomaContext.Provider>
  )
}

export function useIdioma() {
  return useContext(IdiomaContext)
}
