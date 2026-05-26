import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await hash("Admin@123", 12);
  
  const admin = await prisma.user.create({
    data: {
      email: "admin@avantere.com",
      name: "Administrador",
      password: hashedPassword,
      role: "ADMIN"
    }
  });
  
  console.log("Admin criado:", admin);
  await prisma.$disconnect();
}

createAdmin();
