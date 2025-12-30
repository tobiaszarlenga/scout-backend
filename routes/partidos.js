// scout-backend/routes/partidos.js

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const { crearPartido, listarPartidos, obtenerPartido, finalizarPartido } = require('../controllers/partidoController');

// --- POST /api/partidos (Crear un nuevo partido) ---
// 1. Verificamos el token
// 2. Si es válido, llamamos a la función crearPartido
router.post('/', verificarToken, crearPartido);

// --- GET /api/partidos (Obtener todos mis partidos) ---
// 1. Verificamos el token
// 2. Si es válido, llamamos a la función listarPartidos
router.get('/', verificarToken, listarPartidos);

// --- GET /api/partidos/:id (Obtener un partido específico) ---
// 1. Verificamos el token
// 2. Si es válido, llamamos a la función obtenerPartido
router.get('/:id', verificarToken, obtenerPartido);

// PUT /api/partidos/:id/finalizar -> marcar como FINALIZADO
router.put('/:id/finalizar', verificarToken, finalizarPartido);

// PUT /api/partidos/:id -> Editar un partido
const prisma = require('../db/prisma');
router.put('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;
  const { equipoLocalId, equipoVisitanteId, pitcherLocalId, pitcherVisitanteId, fecha, campo } = req.body;

  try {
    const partido = await prisma.partido.findUnique({ where: { id: parseInt(id) } });
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });
    if (partido.autorId !== userId) return res.status(403).json({ error: 'No autorizado' });

    const updated = await prisma.partido.update({
      where: { id: parseInt(id) },
      data: {
        equipoLocalId: equipoLocalId ? parseInt(equipoLocalId) : undefined,
        equipoVisitanteId: equipoVisitanteId ? parseInt(equipoVisitanteId) : undefined,
        pitcherLocalId: pitcherLocalId ? parseInt(pitcherLocalId) : undefined,
        pitcherVisitanteId: pitcherVisitanteId ? parseInt(pitcherVisitanteId) : undefined,
        fecha: fecha ? new Date(fecha) : undefined,
        campo: campo ?? undefined,
      },
      include: {
        equipoLocal: { select: { nombre: true } },
        equipoVisitante: { select: { nombre: true } },
        pitcherLocal: { select: { nombre: true, apellido: true } },
        pitcherVisitante: { select: { nombre: true, apellido: true } },
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Error actualizando partido:', err);
    return res.status(500).json({ error: 'Error al actualizar partido' });
  }
});

// DELETE /api/partidos/:id -> Eliminar un partido
router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    const partido = await prisma.partido.findUnique({ where: { id: parseInt(id) } });
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });
    if (partido.autorId !== userId) return res.status(403).json({ error: 'No autorizado' });

    // Eliminar lanzamientos asociados primero
    await prisma.lanzamiento.deleteMany({ where: { partidoId: parseInt(id) } });
    
    // Luego eliminar el partido
    await prisma.partido.delete({ where: { id: parseInt(id) } });

    return res.status(204).send();
  } catch (err) {
    console.error('Error eliminando partido:', err);
    return res.status(500).json({ error: 'Error al eliminar partido' });
  }
});

module.exports = router;