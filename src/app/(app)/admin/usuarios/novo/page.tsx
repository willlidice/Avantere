import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NovoUsuarioForm } from "./novo-usuario-form"

export default async function NovoUsuarioPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.perfil !== "SUPER_ADMIN") redirect("/obras")

  return <NovoUsuarioForm />
}
