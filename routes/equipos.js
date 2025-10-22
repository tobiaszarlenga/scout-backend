// routes/equipos.js
const express = require('express');
const prisma = require('../db/prisma');
const router = express.Router();

const { verificarToken } = require('../middleware/auth');

// --- GET /api/equipos (Obtener SÓLO MIS equipos) ---
// --- CAMBIO 1: Añadimos 'verificarToken' para proteger la ruta ---
router.get('/', verificarToken, async (req, res) => {
  try {
    // --- CAMBIO 2: Obtenemos el ID del usuario desde el token ---
    const autorId = req.user.sub;

    const equipos = await prisma.equipo.findMany({
      // --- CAMBIO 3: Añadimos el filtro 'where' para traer solo los del usuario ---
      where: {
        autorId: autorId
      },
      orderBy: { id: 'asc' },
      include: {
        autor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { pitchers: true }
        }
      },
    });
    res.json(equipos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando equipos' });
  }
});

// --- POST /api/equipos (Crear un nuevo equipo) ---
// (Esta ruta ya estaba perfecta)
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, ciudad } = req.body;
    const autorId = req.user.sub;

    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ error: 'nombre es requerido (mín. 2 caracteres)' });
    }

    const nuevoEquipo = await prisma.equipo.create({
      data: {
        nombre: nombre.trim(),
        ciudad: ciudad?.trim() || null,
        autorId: autorId,
      },
    });

    return res.status(201).json(nuevoEquipo);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El nombre ya existe' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error creando equipo' });
  }
});

// --- GET /api/equipos/:id (Obtener un equipo específico) ---
// --- CAMBIO 4: Añadimos 'verificarToken' también aquí por seguridad ---
router.get('/:id', verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  // --- CAMBIO 5: Obtenemos el ID del usuario ---
  const userId = req.user.sub;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id },
      include: {
        autor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { pitchers: true }
        }
      },
    });

    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });

    // --- CAMBIO 6: Verificamos que el usuario sea dueño del equipo ---
    if (equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No autorizado para ver este equipo' });
    }

    res.json(equipo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo equipo' });
  }
});


// --- PUT /api/equipos/:id (Actualizar un equipo) ---
// (Esta ruta ya estaba perfecta)
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, ciudad } = req.body;
    const userId = req.user.sub;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }

    const equipo = await prisma.equipo.findUnique({ where: { id } });
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    if (equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No autorizado para modificar este equipo' });
    }

    if (nombre === undefined && ciudad === undefined) {
      return res.status(400).json({ error: 'Se requiere al menos un campo (nombre o ciudad) para actualizar.' });
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
    } // <--- Corregí un error de sintaxis que tenías aquí (una 'S' suelta)

    const actualizado = await prisma.equipo.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json(actualizado);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El nombre ya existe' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error actualizando equipo' });
  }
});


// --- DELETE /api/equipos/:id (Eliminar un equipo) ---
// (Esta ruta ya estaba perfecta)
router.delete('/:id', verificarToken, async (req, res) => {
// ... (sin cambios)
  const id = Number(req.params.id);
  const userId = req.user.sub;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }

  try {
    const equipo = await prisma.equipo.findUnique({ where: { id } });
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    if (equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No autorizado para eliminar este equipo' });
    }

    await prisma.equipo.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    if (err.code === 'P2014' || err.code === 'P2003') {
      return res.status(409).json({ error: 'No se puede eliminar el equipo porque tiene pitchers asociados.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error eliminando equipo' });
  }
});

module.exports = router;