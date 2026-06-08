import { PrismaClient, Perfil } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@avantere.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@avantere.com",
      senha: senhaHash,
      perfil: Perfil.ADMIN,
    },
  });

  console.log("Seed concluído: admin@avantere.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
