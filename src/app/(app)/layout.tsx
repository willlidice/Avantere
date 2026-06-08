import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar, MobileHeader } from "@/components/sidebar"
import { IdiomaProvider } from "@/contexts/idioma-context"
import { TutorialPopup } from "@/components/tutorial-popup"
import { BoasVindasBanner } from "@/components/boas-vindas-banner"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <IdiomaProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          perfil={session.user.perfil}
          nome={session.user.name ?? ""}
          email={session.user.email ?? ""}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <MobileHeader perfil={session.user.perfil} nome={session.user.name ?? ""} />
          <div className="flex-1 overflow-auto">
            <BoasVindasBanner />
            <main className="p-4 md:p-6">{children}</main>
          </div>
        </div>
        <TutorialPopup />
      </div>
    </IdiomaProvider>
  )
}
