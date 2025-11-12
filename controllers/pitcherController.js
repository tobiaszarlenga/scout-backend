// controllers/pitcherController.js
const prisma = require('../db/prisma');

// Helpers
const num = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));
const isValidId = (id) => Number.isInteger(id) && id > 0;
const getUserId = (req) => req.user?.sub;

// GET /api/pitchers  (solo pitchers de equipos del usuario)
async function listPitchers(req, res) {
  try {
    const userId = getUserId(req);
    const pitchers = await prisma.pitcher.findMany({
      where: { equipo: { autorId: userId } },
      include: { equipo: { select: { nombre: true } } },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
    res.json(pitchers);
  } catch (error) {
    console.error('listPitchers', error);
    res.status(500).json({ error: 'Error al obtener los pitchers.' });
  }
}

// GET /api/pitchers/:id  (detalle, con control de propiedad)
async function getPitcher(req, res) {
  const id = num(req.params.id);
  const userId = getUserId(req);
  if (!isValidId(id)) return res.status(400).json({ error: 'id inválido' });

  try {
    const pitcher = await prisma.pitcher.findFirst({
      where: { id, equipo: { autorId: userId } },
      include: { equipo: { select: { id: true, nombre: true } } },
    });
    if (!pitcher) return res.status(404).json({ error: 'Pitcher no encontrado' });
    res.json(pitcher);
  } catch (error) {
    console.error('getPitcher', error);
    res.status(500).json({ error: 'Error al obtener el pitcher.' });
  }
}

// POST /api/pitchers  (crear, validando equipo del usuario)
async function createPitcher(req, res) {
  try {
    const userId = getUserId(req);
    const { nombre, apellido, edad, numero_camiseta, equipoId } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({ error: 'nombre y apellido son requeridos' });
    }

    const teamId = num(equipoId);
    if (!isValidId(teamId)) {
      return res.status(400).json({ error: 'equipoId inválido' });
    }

    // validar que el equipo es del usuario
    const equipoDelUsuario = await prisma.equipo.findFirst({
      where: { id: teamId, autorId: userId },
      select: { id: true },
    });
    if (!equipoDelUsuario) {
      return res.status(403).json({ error: 'No autorizado para añadir pitchers a este equipo.' });
    }

    const nuevo = await prisma.pitcher.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        edad: num(edad),
        numero_camiseta: num(numero_camiseta),
        equipoId: teamId,
      },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('createPitcher', error);
    res.status(500).json({ error: 'Error al crear el pitcher.' });
  }
}

// PUT /api/pitchers/:id  (actualizar, validando propiedad y posible cambio de equipo)
async function updatePitcher(req, res) {
  try {
    const id = num(req.params.id);
    const userId = getUserId(req);
    if (!isValidId(id)) return res.status(400).json({ error: 'id inválido' });

    const { nombre, apellido, edad, numero_camiseta, equipoId } = req.body;

    // 1) verificar que el pitcher actual pertenece al usuario
    const pitcherActual = await prisma.pitcher.findFirst({
      where: { id, equipo: { autorId: userId } },
      select: { id: true, equipoId: true },
    });
    if (!pitcherActual) {
      return res.status(403).json({ error: 'No autorizado para modificar este pitcher.' });
    }

    // 2) si cambia de equipo, validar ownership del nuevo equipo
    const nuevoEquipoId = num(equipoId);
    if (nuevoEquipoId && nuevoEquipoId !== pitcherActual.equipoId) {
      const nuevoEquipo = await prisma.equipo.findFirst({
        where: { id: nuevoEquipoId, autorId: userId },
        select: { id: true },
      });
      if (!nuevoEquipo) {
        return res.status(403).json({ error: 'No autorizado para mover el pitcher a ese equipo.' });
      }
    }

    const data = {};
    if (nombre !== undefined) data.nombre = nombre?.trim();
    if (apellido !== undefined) data.apellido = apellido?.trim();
    if (edad !== undefined) data.edad = num(edad);
    if (numero_camiseta !== undefined) data.numero_camiseta = num(numero_camiseta);
    if (nuevoEquipoId !== undefined) data.equipoId = nuevoEquipoId;

    const actualizado = await prisma.pitcher.update({ where: { id }, data });
    res.json(actualizado);
  } catch (error) {
    console.error('updatePitcher', error);
    res.status(500).json({ error: 'Error al actualizar el pitcher.' });
  }
}

// GET /api/pitchers/:id/stats  (estadísticas agregadas del pitcher)
async function getPitcherStats(req, res) {
  const id = num(req.params.id);
  const userId = getUserId(req);
  if (!isValidId(id)) return res.status(400).json({ error: 'id inválido' });

  try {
    // verificar que el pitcher pertenece al usuario
    const pitcher = await prisma.pitcher.findFirst({ where: { id, equipo: { autorId: userId } }, select: { id: true } });
    if (!pitcher) return res.status(404).json({ error: 'Pitcher no encontrado o no autorizado' });

    // total lanzamientos
    const total = await prisma.lanzamiento.count({ where: { pitcherId: id } });

    // promedio de velocidad
    const avgRes = await prisma.lanzamiento.aggregate({ _avg: { velocidad: true }, where: { pitcherId: id } });
    const avgVel = avgRes._avg && typeof avgRes._avg.velocidad === 'number' ? avgRes._avg.velocidad : null;

    // conteo por zona (agrupando por x,y)
    const byZone = await prisma.lanzamiento.groupBy({
      by: ['x', 'y'],
      where: { pitcherId: id },
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

    // conteo por resultadoId
    const byResId = await prisma.lanzamiento.groupBy({
      by: ['resultadoId'],
      where: { pitcherId: id },
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

    res.json({ total, avgVel, zoneCounts, byResultado });
  } catch (error) {
    console.error('getPitcherStats', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del pitcher.' });
  }
}

// DELETE /api/pitchers/:id  (eliminar, validando propiedad)
async function deletePitcher(req, res) {
  const id = num(req.params.id);
  const userId = getUserId(req);
  if (!isValidId(id)) return res.status(400).json({ error: 'id inválido' });

  try {
    // verificar ownership
    const pitcher = await prisma.pitcher.findFirst({
      where: { id, equipo: { autorId: userId } },
      select: { id: true },
    });
    if (!pitcher) {
      return res.status(403).json({ error: 'No autorizado para eliminar este pitcher.' });
    }

    await prisma.pitcher.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res.status(409).json({ error: 'No se puede eliminar el pitcher, está asignado a un partido.' });
    }
    console.error('deletePitcher', error);
    res.status(500).json({ error: 'Error al eliminar el pitcher.' });
  }
}

module.exports = {
  listPitchers,
  getPitcher,
  createPitcher,
  updatePitcher,
  deletePitcher,
  // nuevo: estadísticas agregadas por pitcher
  getPitcherStats,
};
