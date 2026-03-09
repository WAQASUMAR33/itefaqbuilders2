const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@rapidtechpro.com';

  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists:', email);
    return;
  }

  const hashed = await bcrypt.hash('786ninja', 10);

  const user = await prisma.users.create({
    data: {
      full_name: 'RapidTechPro Admin',
      email,
      password: hashed,
      role: 'SUPER_ADMIN',
      is_verified: true,
      status: 'ACTIVE'
    }
  });

  console.log('✅ Created user:', user.email, '| Role:', user.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
