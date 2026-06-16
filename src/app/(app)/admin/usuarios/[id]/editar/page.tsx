import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { EditarUsuarioForm } from "./editar-usuario-form"

export default async function EditarUsuarioPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "SUPER_ADMIN") redirect("/obras")

  const usuario = await prisma.user.findUnique({
    where: { id: parseInt(params.id) },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  })
  if (!usuario) notFound()

  return <EditarUsuarioForm usuario={usuario} />
}
