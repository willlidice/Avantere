"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Building2, Users, LogOut, HardHat, Settings, LayoutDashboard, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIdioma } from "@/contexts/idioma-context"
import { t } from "@/lib/i18n"

interface SidebarProps {
  perfil: string
  nome: string
  email: string
}

export function Sidebar({ perfil, nome, email }: SidebarProps) {
  const pathname = usePathname()
  const { idioma } = useIdioma()

  const navLinks = [
    ...(perfil === "PRODUCAO"
      ? [{ href: "/dashboard", label: t(idioma, "dashboard"), icon: LayoutDashboard }]
      : [{ href: "/visao-geral", label: t(idioma, "visaoGeral"), icon: LayoutDashboard }]),
    ...(perfil !== "PRODUCAO"
      ? [{ href: "/obras", label: t(idioma, "obras"), icon: Building2 }]
      : [{ href: "/tarefas", label: t(idioma, "tarefasMenu"), icon: HardHat }]),
    ...(perfil === "ADMIN"
      ? [{ href: "/admin/usuarios", label: t(idioma, "usuarios"), icon: Users }]
      : []),
    { href: "/busca", label: "Busca", icon: Search },
    { href: "/configuracoes", label: t(idioma, "configuracoes"), icon: Settings },
  ]

  return (
    <aside className="hidden md:flex w-56 flex-col shrink-0 bg-stone-900">
      <div className="px-5 pt-6 pb-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-amber-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs leading-none">A</span>
          </div>
          <span className="text-stone-100 font-semibold tracking-[0.09em] uppercase text-xs">
            Avantere
          </span>
        </div>
        <p className="text-[11px] text-stone-600 mt-2 pl-[34px]">{t(idioma, "gestaoDeObras")}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-px">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all duration-150 border-l-2",
                active
                  ? "bg-stone-800 text-amber-400 border-amber-500"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 border-transparent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-stone-800">
        <p className="text-xs font-medium text-stone-300 truncate">{nome}</p>
        <p className="text-[11px] text-stone-600 mt-0.5 truncate mb-3">{email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-400 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t(idioma, "sair")}
        </button>
      </div>
    </aside>
  )
}

export function MobileHeader({ perfil }: { perfil: string; nome: string }) {
  const { idioma } = useIdioma()

  const navLinks = [
    ...(perfil === "PRODUCAO"
      ? [{ href: "/dashboard", label: t(idioma, "dashboard") }]
      : [{ href: "/visao-geral", label: t(idioma, "visaoGeral") }]),
    ...(perfil !== "PRODUCAO"
      ? [{ href: "/obras", label: t(idioma, "obras") }]
      : [{ href: "/tarefas", label: t(idioma, "tarefasMenu") }]),
    ...(perfil === "ADMIN" ? [{ href: "/admin/usuarios", label: t(idioma, "usuarios") }] : []),
    { href: "/busca", label: "Busca" },
    { href: "/configuracoes", label: t(idioma, "configuracoes") },
  ]

  return (
    <header className="md:hidden bg-stone-900 border-b border-stone-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-amber-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-[10px] leading-none">A</span>
        </div>
        <span className="text-stone-100 font-semibold tracking-[0.09em] uppercase text-xs">
          Avantere
        </span>
      </div>
      <div className="flex items-center gap-4">
        {navLinks.map(({ href, label }) => (
          <Link key={href} href={href} className="text-xs text-stone-400 hover:text-stone-200 transition-colors">
            {label}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-stone-600 hover:text-amber-400 transition-colors"
        >
          {t(idioma, "sair")}
        </button>
      </div>
    </header>
  )
}
