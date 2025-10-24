// En: scout-backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el script de seed...');

  // 1. Datos para Tipos de Lanzamiento (¡Tu lista!)
  const tiposLanzamiento = [
    { nombre: 'Drop' },
    { nombre: 'Trepadora' },
    { nombre: 'Curva' },
    { nombre: 'Cambio' },
    // (Puedes añadir más aquí si quieres)
  ];

  // 2. Datos para Resultados (Basado en tu maqueta)
  const resultadosLanzamiento = [
    { nombre: 'STRIKE' },
    { nombre: 'BOLA' },
    { nombre: 'HIT' },
    { nombre: 'OUT' },
    { nombre: 'FOUL' },
  ];

  // 3. Insertar Tipos de Lanzamiento
  // Usamos 'upsert' para evitar duplicados si corres el script de nuevo
  console.log('Sembrando Tipos de Lanzamiento...');
  for (const tipo of tiposLanzamiento) {
    await prisma.tipoLanzamiento.upsert({
      where: { nombre: tipo.nombre },
      update: {}, // No hacemos nada si ya existe
      create: { nombre: tipo.nombre },
    });
  }

  // 4. Insertar Resultados
  console.log('Sembrando Resultados de Lanzamiento...');
  for (const res of resultadosLanzamiento) {
    await prisma.resultadoLanzamiento.upsert({
      where: { nombre: res.nombre },
      update: {},
      create: { nombre: res.nombre },
    });
  }

  console.log('¡Seed completado!');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cerramos la conexión a la base de datos
    await prisma.$disconnect();
  });