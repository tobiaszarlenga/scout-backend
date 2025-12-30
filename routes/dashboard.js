const express = require('express');
const prisma = require('../db/prisma');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// --- GET /api/dashboard ---
// Esta es la única ruta en este archivo. Está protegida.
router.get('/', verificarToken, async (req, res) => {
  try {
    // 1. Obtenemos el ID del usuario desde el token
    const userId = req.user.sub; 

    // 2. Hacemos todas las consultas a la vez (más eficiente)
    const [
      totalEquipos,
      totalPitchers,
      totalPartidos,
      partidosPorEstado,
      pitchersPorEquipo,
      proximosPartidos,
    ] = await prisma.$transaction([
      
      // Conteo de "Mis Equipos"
      prisma.equipo.count({ 
        where: { autorId: userId } 
      }),

      // Conteo de "Mis Pitchers" (pitchers que pertenecen a mis equipos)
      prisma.pitcher.count({ 
        where: { equipo: { autorId: userId } } 
      }),

      // Conteo de "Mis Partidos"
      prisma.partido.count({ 
        where: { autorId: userId } 
      }),

      // Datos para el Gráfico de Torta (Estado de tus Partidos)
      prisma.partido.groupBy({
        by: ['estado'],
        _count: { id: true },
        where: { autorId: userId },
      }),

      // Datos para el Gráfico de Barras (Pitchers en tus Equipos)
      prisma.equipo.findMany({
        where: { autorId: userId },
        select: {
          nombre: true,
          _count: {
            select: { pitchers: true },
          },
        },
      }),

      // Datos para la Lista "Próximos Partidos"
      prisma.partido.findMany({
        where: {
          autorId: userId,
          estado: 'PROGRAMADO',
          fecha: { gte: new Date() }, // gte = 'greater than or equal' (mayor o igual que hoy)
        },
        orderBy: { fecha: 'asc' },
        take: 3, // Traemos solo los 3 más próximos
        include: {
          equipoLocal: { select: { nombre: true } },
          equipoVisitante: { select: { nombre: true } },
        },
      }),

      // (Dejamos la "Actividad Reciente" para después, es más compleja)
    ]);

    // 3. Formateamos los datos para el frontend
    const dashboardData = {
      kpis: {
        equipos: totalEquipos,
        pitchers: totalPitchers,
        partidos: totalPartidos,
      },
      graficoTorta: partidosPorEstado.map(item => ({
        name: item.estado, // "PROGRAMADO" o "FINALIZADO"
        value: item._count.id,
      })),
      graficoBarras: pitchersPorEquipo.map(equipo => ({
        name: equipo.nombre,
        pitchers: equipo._count.pitchers,
      })),
      proximosPartidos: proximosPartidos.map(partido => ({
        id: partido.id,
        fecha: partido.fecha,
        equipoLocal: partido.equipoLocal.nombre,
        equipoVisitante: partido.equipoVisitante.nombre,
      })),
    };

    // 4. Enviamos la respuesta
    res.json(dashboardData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo datos del dashboard' });
  }
});

module.exports = router;