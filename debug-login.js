const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugLogin() {
  const email = 'admin@avantere.com';
  const senhaDigitada = 'Admin@123'; // A senha que você está tentando
  
  console.log('🔍 Buscando usuário...');
  
  // Busca o usuário
  const user = await prisma.user.findUnique({
    where: { email: email }
  });
  
  if (!user) {
    console.log('❌ Usuário NÃO encontrado no banco!');
    console.log('   Email buscado:', email);
    
    // Lista todos os usuários
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    console.log('\n📋 Usuários existentes:', allUsers);
    return;
  }
  
  console.log('✅ Usuário encontrado!');
  console.log('   ID:', user.id);
  console.log('   Email:', user.email);
  console.log('   Nome:', user.name);
  console.log('   Hash da senha:', user.password?.substring(0, 30) + '...');
  
  // Testa a comparação de senha
  console.log('\n🔐 Testando senha...');
  
  if (!user.password) {
    console.log('❌ Campo password está VAZIO ou NULL!');
    return;
  }
  
  const senhaCorreta = await bcrypt.compare(senhaDigitada, user.password);
  
  if (senhaCorreta) {
    console.log('✅ SENHA CORRETA! O problema está na lógica de login do app.');
  } else {
    console.log('❌ SENHA INCORRETA! O hash não bate.');
    console.log('   Vamos criar um novo hash...');
    
    const novoHash = await bcrypt.hash(senhaDigitada, 12);
    console.log('\n   Novo hash gerado:', novoHash.substring(0, 30) + '...');
  }
  
  await prisma.$disconnect();
}

debugLogin().catch(console.error);
