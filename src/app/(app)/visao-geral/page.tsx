import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { VisaoGeralClient } from "./visao-geral-client"

export default async function VisaoGeralPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return <VisaoGeralClient perfil={session.user.perfil} />
}
