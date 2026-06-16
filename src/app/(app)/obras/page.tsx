import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { filtroObrasVisiveis } from "@/lib/acesso-obra"
import { ObrasLista } from "./obras-lista"

export default async function ObrasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.perfil)

  // ADMIN/SUPER_ADMIN também administram obras inativas; GESTAO/PRODUCAO só veem ativas (comportamento já existente).
  const obras = await prisma.obra.findMany({
    where: filtroObrasVisiveis(session, { apenasAtivas: !isAdmin }),
    orderBy: { criadoEm: "desc" },
  })

  const obrasSerializadas = obras.map((o) => ({
    ...o,
    criadoEm: o.criadoEm.toISOString(),
    dataInicio: o.dataInicio?.toISOString() ?? null,
    dataFim: o.dataFim?.toISOString() ?? null,
    valorContrato: o.valorContrato ? Number(o.valorContrato) : null,
  }))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
            {session.user.perfil === "SUPER_ADMIN"
              ? "Todas as obras (todas as organizações)"
              : isAdmin
              ? "Obras da sua organização"
              : "Obras vinculadas"}
          </p>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Obras</h1>
        </div>
        {isAdmin && (
          <Link href="/admin/obras/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Obra
            </Button>
          </Link>
        )}
      </div>

      <ObrasLista obras={obrasSerializadas} isAdmin={isAdmin} />
    </div>
  )
}
