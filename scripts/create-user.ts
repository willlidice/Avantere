import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456789', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'keyuser@avantere.com' },
    update: { password: hashedPassword },
    create: {
      email: 'keyuser@avantere.com',
      name: 'Key User',
      password: hashedPassword,
    },
  })
  
  console.log('✅ Usuário criado/atualizado:', user)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
