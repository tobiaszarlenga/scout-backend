// controllers/equipoController.js
const prisma = require('../db/prisma');

function getUserId(req) {
  return req.user?.sub;
}

function isValidId(id) {
  return Number.isInteger(id) && id > 0;
}

// GET /api/equipos  (solo del usuario)
async function listEquipos(req, res) {
  try {
    const autorId = getUserId(req);

    const equipos = await prisma.equipo.findMany({
      where: { autorId },
      orderBy: { id: 'asc' },
      include: {
        autor: { select: { id: true, name: true, email: true } },
        _count: { select: { pitchers: true } },
      },
    });

    res.json(equipos);
  } catch (err) {
    console.error('listEquipos', err);
    res.status(500).json({ error: 'Error listando equipos' });
  }
}

// GET /api/equipos/:id
async function getEquipo(req, res) {
  const id = Number(req.params.id);
  const userId = getUserId(req);

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }

  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id },
      include: {
        autor: { select: { id: true, name: true, email: true } },
        _count: { select: { pitchers: true } },
      },
    });

    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    if (equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No autorizado para ver este equipo' });
    }

    res.json(equipo);
  } catch (err) {
    console.error('getEquipo', err);
    res.status(500).json({ error: 'Error obteniendo equipo' });
  }
}

// POST /api/equipos
async function createEquipo(req, res) {
  try {
    const { nombre, ciudad } = req.body;
    const autorId = getUserId(req);

    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ error: 'nombre es requerido (mín. 2 caracteres)' });
    }

    const nuevo = await prisma.equipo.create({
      data: {
        nombre: nombre.trim(),
        ciudad: ciudad?.trim() || null,
        autorId,
      },
    });

    res.status(201).json(nuevo);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El nombre ya existe' });
    }
    console.error('createEquipo', err);
    res.status(500).json({ error: 'Error creando equipo' });
  }
}

// PUT /api/equipos/:id
async function updateEquipo(req, res) {
  try {
    const id = Number(req.params.id);
    const { nombre, ciudad } = req.body;
    const userId = getUserId(req);

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'id inválido' });
    }

    const equipo = await prisma.equipo.findUnique({ where: { id } });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    if (equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No autorizado para modificar este equipo' });
    }

    if (nombre === undefined && ciudad === undefined) {
      return res.status(400).json({ error: 'Se requiere nombre o ciudad para actualizar.' });
    }

    const dataToUpdate = {};
    if (nombre !== undefined) {
      if (nombre.trim().length < 2) {
        return res.status(400).json({ error: 'nombre debe tener al menos 2 caracteres' });
      }
      dataToUpdate.nombre = nombre.trim();
    }
    if (ciudad !== undefined) {
      dataToUpdate.ciudad = ciudad?.trim() || null;
    }

    const actualizado = await prisma.equipo.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json(actualizado);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El nombre ya existe' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    console.error('updateEquipo', err);
    res.status(500).json({ error: 'Error actualizando equipo' });
  }
}

// DELETE /api/equipos/:id
async function deleteEquipo(req, res) {
  const id = Number(req.params.id);
  const userId = getUserId(req);

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'id inválido' });
  }

  try {
    const equipo = await prisma.equipo.findUnique({ where: { id } });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    if (equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No autorizado para eliminar este equipo' });
    }

    await prisma.equipo.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    if (err.code === 'P2014' || err.code === 'P2003') {
      return res.status(409).json({ error: 'No se puede eliminar el equipo porque tiene pitchers asociados.' });
    }
    console.error('deleteEquipo', err);
    res.status(500).json({ error: 'Error eliminando equipo' });
  }
}

// GET /api/equipos/:id/stats  (estadísticas agregadas del equipo)
async function getEquipoStats(req, res) {
  const id = Number(req.params.id);
  const userId = getUserId(req);
  if (!isValidId(id)) return res.status(400).json({ error: 'id inválido' });

  try {
    const equipo = await prisma.equipo.findUnique({ where: { id } });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    if (equipo.autorId !== userId) return res.status(403).json({ error: 'No autorizado' });

    // Total lanzamientos para pitchers del equipo
    const total = await prisma.lanzamiento.count({ where: { pitcher: { equipoId: id } } });

    // Promedio de velocidad para el equipo
    const avgRes = await prisma.lanzamiento.aggregate({ _avg: { velocidad: true }, where: { pitcher: { equipoId: id } } });
    const avgVel = avgRes._avg && typeof avgRes._avg.velocidad === 'number' ? avgRes._avg.velocidad : null;

    // Conteo por zona (x,y) para el equipo
    const byZone = await prisma.lanzamiento.groupBy({
      by: ['x', 'y'],
      where: { pitcher: { equipoId: id } },
      _count: { _all: true },
    });
    const zoneCounts = new Array(25).fill(0);
    byZone.forEach((row) => {
      const x = Number(row.x);
      const y = Number(row.y);
      if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < 5 && y >= 0 && y < 5) {
        const idx = y * 5 + x;
        zoneCounts[idx] = row._count._all || 0;
      }
    });

    // Conteo por resultadoId para el equipo
    const byResId = await prisma.lanzamiento.groupBy({
      by: ['resultadoId'],
      where: { pitcher: { equipoId: id } },
      _count: { _all: true },
    });
    const resultadoIds = byResId.map((r) => r.resultadoId).filter((v) => v != null);
    const resultados = await prisma.resultadoLanzamiento.findMany({ where: { id: { in: resultadoIds } } });
    const resultadosMap = resultados.reduce((acc, r) => ({ ...acc, [r.id]: r.nombre }), {});
    const byResultado = {};
    byResId.forEach((r) => {
      const key = resultadosMap[r.resultadoId] || String(r.resultadoId);
      byResultado[key] = r._count._all || 0;
    });

    // Resumen por pitcher del equipo (total y avgVel)
    const perPitcher = await prisma.lanzamiento.groupBy({
      by: ['pitcherId'],
      where: { pitcher: { equipoId: id } },
      _count: { _all: true },
      _avg: { velocidad: true },
    });
    const pitcherIds = perPitcher.map((p) => p.pitcherId).filter((v) => v != null);
    const pitchers = await prisma.pitcher.findMany({ where: { id: { in: pitcherIds } }, select: { id: true, nombre: true, apellido: true } });
    const pitcherMap = pitchers.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    const pitchersSummary = perPitcher.map((p) => ({
      id: p.pitcherId,
      nombre: pitcherMap[p.pitcherId]?.nombre || null,
      apellido: pitcherMap[p.pitcherId]?.apellido || null,
      total: p._count._all || 0,
      avgVel: p._avg?.velocidad ?? null,
    }));

    res.json({ total, avgVel, zoneCounts, byResultado, pitchers: pitchersSummary });
  } catch (err) {
    console.error('getEquipoStats', err);
    res.status(500).json({ error: 'Error obteniendo estadísticas del equipo' });
  }
}


module.exports = {
  listEquipos,
  getEquipo,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  // nuevo: estadísticas por equipo
  getEquipoStats,
};
