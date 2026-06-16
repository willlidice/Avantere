import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UsuariosLista } from "./usuarios-lista"

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "SUPER_ADMIN") redirect("/obras")

  const usuarios = await prisma.user.findMany({
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true },
    orderBy: { criadoEm: "desc" },
  })

  const usuariosSerializados = usuarios.map((u) => ({ ...u, criadoEm: u.criadoEm.toISOString() }))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">
            Administração
          </p>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>
        <Link href="/admin/usuarios/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </Link>
      </div>

      <UsuariosLista usuarios={usuariosSerializados} />
    </div>
  )
}
