// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient(); // 👈 La inicialización correcta va aquí.

async function main() {
  // --- DEFINE TU USUARIO ADMIN AQUÍ ---
  const adminEmail = 'admin@softscout.com';
  const adminPassword = 'password123';

  console.log(`Verificando si el usuario ${adminEmail} ya existe...`);

  // El error ocurría porque 'prisma.user' no estaba definido.
  // Ahora sí lo estará.
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`El usuario ${adminEmail} ya existe.`);
  } else {
    console.log('Creando usuario admin...');
    const hashedPassword = await argon2.hash(adminPassword);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
      },
    });
    console.log('Usuario admin creado:', admin);
  }
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });