const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  // Defina a nova senha aqui
  const novaSenha = 'Admin@123';
  
  // Gera o hash da senha
  const hashedPassword = await bcrypt.hash(novaSenha, 12);
  
  // Atualiza o usuário admin
  const user = await prisma.user.update({
    where: { email: 'admin@avantere.com' },
    data: { password: hashedPassword }
  });
  
  console.log('✅ Senha resetada com sucesso!');
  console.log('📧 Email: admin@avantere.com');
  console.log('🔑 Nova senha: ' + novaSenha);
  
  await prisma.$disconnect();
}

resetAdmin().catch(console.error);
