// scout-backend/controllers/lanzamientoController.js

const prisma = require('../db/prisma');

// Helper: convertir zona (0..24) a coordenadas x,y en grilla 5x5
function zonaToXY(zona) {
  // Aseguramos rango 0..24
  const z = Math.max(0, Math.min(24, Number(zona) || 0));
  const row = Math.floor(z / 5); // 0..4
  const col = z % 5;            // 0..4
  return { x: col, y: row };
}

// GET /api/partidos/:partidoId/lanzamientos
async function listarPorPartido(req, res) {
  try {
    const partidoId = Number(req.params.partidoId);
    const autorId = req.user.sub;

    if (isNaN(partidoId)) return res.status(400).json({ error: 'partidoId inválido' });

    // Aseguramos que el partido pertenece al usuario
    const partido = await prisma.partido.findFirst({ where: { id: partidoId, autorId } });
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });

    const lanzamientos = await prisma.lanzamiento.findMany({
      where: { partidoId },
      orderBy: [{ inning: 'asc' }, { ladoInning: 'asc' }, { id: 'asc' }],
      include: {
        tipo: { select: { id: true, nombre: true } },
        resultado: { select: { id: true, nombre: true } },
        pitcher: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    res.json(lanzamientos);
  } catch (err) {
    console.error('Error listarPorPartido:', err);
    res.status(500).json({ error: 'Error al listar lanzamientos' });
  }
}

// POST /api/partidos/:partidoId/lanzamientos
async function crear(req, res) {
  try {
    const partidoId = Number(req.params.partidoId);
    const autorId = req.user.sub;
    if (isNaN(partidoId)) return res.status(400).json({ error: 'partidoId inválido' });

    const partido = await prisma.partido.findFirst({ where: { id: partidoId, autorId } });
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });

    const {
      tipoId,
      resultadoId,
      velocidad,
      comentario,
      zona, // opcional si enviamos x/y directos
      x,
      y,
      inning,
      ladoInning, // 'abre' | 'cierra'
      pitcherId,
    } = req.body;

    if (!tipoId || !resultadoId || !pitcherId || !inning || !ladoInning) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    let coords = { x: Number(x), y: Number(y) };
    if (Number.isNaN(coords.x) || Number.isNaN(coords.y)) {
      coords = zonaToXY(zona);
    }

    const nuevo = await prisma.lanzamiento.create({
      data: {
        tipoId: Number(tipoId),
        resultadoId: Number(resultadoId),
        velocidad: velocidad != null ? Number(velocidad) : null,
        comentario: comentario?.trim() || null,
        x: coords.x,
        y: coords.y,
        inning: Number(inning),
        ladoInning: String(ladoInning),
        pitcherId: Number(pitcherId),
        partidoId,
      },
    });

    res.status(201).json(nuevo);
  } catch (err) {
    console.error('Error crear lanzamiento:', err);
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Tipo/Resultado/Pitcher inválido' });
    }
    res.status(500).json({ error: 'Error al crear lanzamiento' });
  }
}

// PUT /api/lanzamientos/:id
async function actualizar(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    // Asegurar pertenencia del partido al usuario
    const existing = await prisma.lanzamiento.findUnique({
      where: { id },
      include: { partido: { select: { autorId: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Lanzamiento no encontrado' });
    if (existing.partido.autorId !== req.user.sub) return res.status(403).json({ error: 'No autorizado' });

    const { tipoId, resultadoId, velocidad, comentario, zona, x, y, inning, ladoInning, pitcherId } = req.body;
    let coords;
    if (x != null && y != null) {
      coords = { x: Number(x), y: Number(y) };
    } else if (zona != null) {
      coords = zonaToXY(zona);
    }

    const actualizado = await prisma.lanzamiento.update({
      where: { id },
      data: {
        ...(tipoId != null ? { tipoId: Number(tipoId) } : {}),
        ...(resultadoId != null ? { resultadoId: Number(resultadoId) } : {}),
        ...(velocidad != null ? { velocidad: Number(velocidad) } : { velocidad: null }),
        ...(comentario !== undefined ? { comentario: comentario?.trim() || null } : {}),
        ...(coords ? { x: coords.x, y: coords.y } : {}),
        ...(inning != null ? { inning: Number(inning) } : {}),
        ...(ladoInning != null ? { ladoInning: String(ladoInning) } : {}),
        ...(pitcherId != null ? { pitcherId: Number(pitcherId) } : {}),
      },
    });

    res.json(actualizado);
  } catch (err) {
    console.error('Error actualizar lanzamiento:', err);
    res.status(500).json({ error: 'Error al actualizar lanzamiento' });
  }
}

// DELETE /api/lanzamientos/:id
async function eliminar(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const existing = await prisma.lanzamiento.findUnique({
      where: { id },
      include: { partido: { select: { autorId: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Lanzamiento no encontrado' });
    if (existing.partido.autorId !== req.user.sub) return res.status(403).json({ error: 'No autorizado' });

    await prisma.lanzamiento.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error('Error eliminar lanzamiento:', err);
    res.status(500).json({ error: 'Error al eliminar lanzamiento' });
  }
}

module.exports = {
  listarPorPartido,
  crear,
  actualizar,
  eliminar,
};
