import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log("Usuarios no banco:");
  console.table(users);
  await prisma.$disconnect();
}

check();
