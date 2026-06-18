"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Building2, Users, LogOut, HardHat, Settings, LayoutDashboard,
  Search, Menu, X, Lightbulb, PanelLeftClose, PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIdioma } from "@/contexts/idioma-context"
import { t } from "@/lib/i18n"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  perfil: string
  nome: string
  email: string
}

export function Sidebar({ perfil, nome, email }: SidebarProps) {
  const pathname = usePathname()
  const { idioma } = useIdioma()
  const [colapsado, setColapsado] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("sidebar_colapsado") === "1"
  })

  function toggleColapso() {
    const novo = !colapsado
    setColapsado(novo)
    localStorage.setItem("sidebar_colapsado", novo ? "1" : "0")
  }

  const navLinks = [
    ...(perfil === "PRODUCAO"
      ? [{ href: "/dashboard", label: t(idioma, "dashboard"), icon: LayoutDashboard }]
      : [{ href: "/visao-geral", label: t(idioma, "visaoGeral"), icon: LayoutDashboard }]),
    ...(perfil !== "PRODUCAO"
      ? [{ href: "/obras", label: t(idioma, "obras"), icon: Building2 }]
      : [{ href: "/tarefas", label: t(idioma, "tarefasMenu"), icon: HardHat }]),
    ...(perfil === "SUPER_ADMIN"
      ? [{ href: "/admin/usuarios", label: t(idioma, "usuarios"), icon: Users }]
      : []),
    { href: "/busca", label: "Busca", icon: Search },
    { href: "/sugestoes", label: "Sugestões", icon: Lightbulb },
    { href: "/configuracoes", label: t(idioma, "configuracoes"), icon: Settings },
  ]

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 bg-[#0D0D0D] transition-all duration-200",
        colapsado ? "w-14" : "w-56"
      )}
    >
      {/* Header logo + toggle */}
      <div
        className={cn(
          "flex items-center border-b border-[#1e1e1e] h-[60px]",
          colapsado ? "justify-center px-0" : "justify-between px-4"
        )}
      >
        {!colapsado && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 bg-amber-600 dark:bg-blue-700 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs leading-none">A</span>
            </div>
            <div className="min-w-0">
              <span className="font-display text-white/90 tracking-[0.15em] uppercase text-xs block">
                Avantere
              </span>
              <span className="text-[10px] text-[#444] block">{t(idioma, "gestaoDeObras")}</span>
            </div>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={toggleColapso}
                className={cn(
                  "text-white/30 hover:text-white/70 transition-colors p-1.5 rounded",
                  colapsado && "mx-auto"
                )}
              />
            }
          >
            {colapsado
              ? <PanelLeftOpen className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />}
          </TooltipTrigger>
          <TooltipContent side="right">
            {colapsado ? "Expandir sidebar" : "Recolher sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Nav links */}
      <nav className={cn("flex-1 py-3 space-y-px", colapsado ? "px-1" : "px-2")}>
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")

          if (colapsado) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center justify-center h-10 w-full transition-all duration-150 border-l-2",
                        active
                          ? "bg-white/5 text-amber-400 dark:text-blue-400 border-amber-500 dark:border-blue-500"
                          : "text-white/50 hover:text-white hover:bg-white/[0.04] border-transparent"
                      )}
                    />
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all duration-150 border-l-2",
                active
                  ? "bg-white/5 text-amber-400 dark:text-blue-400 border-amber-500 dark:border-blue-500"
                  : "text-white/50 hover:text-white hover:bg-white/[0.04] border-transparent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer usuário */}
      <div
        className={cn(
          "border-t border-[#1e1e1e]",
          colapsado ? "px-1 py-3" : "px-5 py-4"
        )}
      >
        {!colapsado && (
          <>
            <p className="text-xs font-medium text-white/80 truncate">{nome}</p>
            <p className="text-[11px] text-[#444] mt-0.5 truncate mb-3">{email}</p>
          </>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className={cn(
                  "flex items-center gap-1.5 text-xs text-white/40 hover:text-amber-400 dark:hover:text-blue-400 transition-colors",
                  colapsado && "justify-center w-full"
                )}
              />
            }
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!colapsado && <span>{t(idioma, "sair")}</span>}
          </TooltipTrigger>
          {colapsado && <TooltipContent side="right">Sair</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  )
}

export function MobileHeader({ perfil, nome }: { perfil: string; nome: string }) {
  const { idioma } = useIdioma()
  const pathname = usePathname()
  const [menuAberto, setMenuAberto] = useState(false)

  const navLinks = [
    ...(perfil === "PRODUCAO"
      ? [{ href: "/dashboard", label: t(idioma, "dashboard"), icon: LayoutDashboard }]
      : [{ href: "/visao-geral", label: t(idioma, "visaoGeral"), icon: LayoutDashboard }]),
    ...(perfil !== "PRODUCAO"
      ? [{ href: "/obras", label: t(idioma, "obras"), icon: Building2 }]
      : [{ href: "/tarefas", label: t(idioma, "tarefasMenu"), icon: HardHat }]),
    ...(perfil === "SUPER_ADMIN" ? [{ href: "/admin/usuarios", label: t(idioma, "usuarios"), icon: Users }] : []),
    { href: "/busca", label: "Busca", icon: Search },
    { href: "/sugestoes", label: "Sugestões", icon: Lightbulb },
    { href: "/configuracoes", label: t(idioma, "configuracoes"), icon: Settings },
  ]

  return (
    <>
      <header className="md:hidden bg-[#0D0D0D] border-b border-[#1e1e1e] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-600 dark:bg-blue-700 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs leading-none">A</span>
          </div>
          <span className="font-display text-white/90 tracking-[0.15em] uppercase text-xs">
            Avantere
          </span>
        </div>
        <button
          onClick={() => setMenuAberto((v) => !v)}
          className="text-white/40 hover:text-white/90 transition-colors p-1"
        >
          {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {menuAberto && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMenuAberto(false)}
          />
          <div className="md:hidden fixed top-0 right-0 h-full w-64 bg-[#0D0D0D] z-50 flex flex-col shadow-2xl border-l border-[#1e1e1e]">
            <div className="px-5 pt-6 pb-5 border-b border-[#1e1e1e] flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white/90">{nome}</p>
                <p className="text-xs text-[#444] mt-0.5 capitalize">{perfil.toLowerCase()}</p>
              </div>
              <button onClick={() => setMenuAberto(false)} className="text-white/30 hover:text-white/70">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-px overflow-y-auto">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/")
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuAberto(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all border-l-2",
                      active
                        ? "bg-white/5 text-amber-400 dark:text-blue-400 border-amber-500 dark:border-blue-500"
                        : "text-white/50 hover:text-white hover:bg-white/[0.04] border-transparent"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="px-3 py-4 border-t border-[#1e1e1e]">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/40 hover:text-amber-400 dark:hover:text-blue-400 hover:bg-white/[0.04] transition-all w-full"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {t(idioma, "sair")}
              </button>
            </div>
          </div>
        </>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#1e1e1e] z-30 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {navLinks.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-all min-w-[52px]",
                  active ? "text-amber-400 dark:text-blue-400" : "text-white/40 hover:text-white/70"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-medium leading-none">{label.split(" ")[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
