// Cria o vínculo ObraUser para todo usuário ADMIN em toda obra da própria
// organização, preservando o acesso que eles já tinham implicitamente
// (via organizacaoId) antes da restrição de vínculo entrar em vigor.
//
// Idempotente: usa skipDuplicates, respeita o índice único @@unique([userId, obraId]).
//
// Uso: npx tsx scripts/backfill-obrauser-admin.ts
//      npx tsx scripts/backfill-obrauser-admin.ts --dry-run

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const dryRun = process.argv.includes("--dry-run")

async function main() {
  // organizacaoId pode ser null (dado legado pré multi-tenant) — tratado como
  // sua própria "organização", igual à comparação null === null em temAcessoObra().
  const admins = await prisma.user.findMany({
    where: { perfil: "ADMIN" },
    select: { id: true, email: true, organizacaoId: true },
  })

  console.log(`Encontrados ${admins.length} usuários ADMIN.`)

  let totalVinculosCriados = 0

  for (const admin of admins) {
    const obrasDaOrg = await prisma.obra.findMany({
      where: { organizacaoId: admin.organizacaoId },
      select: { id: true },
    })

    const vinculosExistentes = await prisma.obraUser.findMany({
      where: { userId: admin.id, obraId: { in: obrasDaOrg.map((o) => o.id) } },
      select: { obraId: true },
    })
    const obraIdsJaVinculados = new Set(vinculosExistentes.map((v) => v.obraId))
    const faltantes = obrasDaOrg.filter((o) => !obraIdsJaVinculados.has(o.id))

    if (faltantes.length === 0) {
      console.log(`  [OK] ${admin.email} (org ${admin.organizacaoId ?? "sem org"}) já vinculado a todas as ${obrasDaOrg.length} obras.`)
      continue
    }

    console.log(
      `  [PENDENTE] ${admin.email} (org ${admin.organizacaoId ?? "sem org"}): ${faltantes.length} de ${obrasDaOrg.length} obras sem vínculo.`
    )

    if (!dryRun) {
      const resultado = await prisma.obraUser.createMany({
        data: faltantes.map((o) => ({ userId: admin.id, obraId: o.id })),
        skipDuplicates: true,
      })
      totalVinculosCriados += resultado.count
      console.log(`    -> ${resultado.count} vínculo(s) criado(s).`)
    }
  }

  console.log(
    dryRun
      ? `\nDRY RUN concluído. Nenhum vínculo foi criado. Rode sem --dry-run para aplicar.`
      : `\nBackfill concluído. Total de vínculos ObraUser criados: ${totalVinculosCriados}.`
  )
}

main()
  .catch((e) => {
    console.error("Erro no backfill:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
