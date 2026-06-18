"use client"
import { useState, useEffect } from "react"

export function useTema() {
  const [tema, setTema] = useState<"light" | "dark">("light")

  useEffect(() => {
    const salvo = localStorage.getItem("avantere-tema")
    if (salvo === "dark" || (!salvo && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTema("dark")
    }
  }, [])

  function toggleTema() {
    const novo = tema === "dark" ? "light" : "dark"
    setTema(novo)
    localStorage.setItem("avantere-tema", novo)
    document.documentElement.classList.toggle("dark", novo === "dark")
  }

  return { tema, toggleTema }
}
