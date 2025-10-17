// routes/equipos.js
const express = require('express');
const prisma = require('../db/prisma');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

// --- GET /api/equipos (Obtener SOLO los equipos del usuario logueado) ---
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub;

    const equipos = await prisma.equipo.findMany({
      where: {
        autorId: userId,
      },
      orderBy: { id: 'asc' },
      // 👇 ¡ESTE ES EL CAMBIO! 👇
      // Pedimos que cuente los pitchers relacionados en lugar de incluir al autor.
      include: {
        _count: {
          select: { pitchers: true },
        },
      },
    });
    res.json(equipos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando equipos' });
  }
});

// --- POST /api/equipos (Crear un nuevo equipo para el usuario logueado) ---
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { nombre, ciudad } = req.body;

    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ error: 'nombre es requerido (mín. 2 caracteres)' });
    }

    const nuevoEquipo = await prisma.equipo.create({
      data: {
        nombre: nombre.trim(),
        ciudad: ciudad?.trim() || null,
        autorId: userId,
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

// --- GET /api/equipos/:id (Obtener un equipo específico si le pertenece al usuario) ---
router.get('/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id);
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
      },
    });

    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });

    if (equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este equipo' });
    }

    res.json(equipo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo equipo' });
  }
});

// --- PUT /api/equipos/:id (Actualizar un equipo si le pertenece al usuario) ---
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.sub;
    const { nombre, ciudad } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }

    const equipoExistente = await prisma.equipo.findUnique({ where: { id } });
    if (!equipoExistente) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    if (equipoExistente.autorId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar este equipo' });
    }

    const dataToUpdate = {};
    if (nombre !== undefined) {
      if (nombre.trim().length < 2) return res.status(400).json({ error: 'nombre debe tener al menos 2 caracteres' });
      dataToUpdate.nombre = nombre.trim();
    }
    if (ciudad !== undefined) {
      dataToUpdate.ciudad = ciudad?.trim() || null;
    }

    const actualizado = await prisma.equipo.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json(actualizado);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'El nombre ya existe' });
    console.error(err);
    return res.status(500).json({ error: 'Error actualizando equipo' });
  }
});

// --- DELETE /api/equipos/:id (Eliminar un equipo si le pertenece al usuario) ---
router.delete('/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user.sub;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }
  try {
    const equipoExistente = await prisma.equipo.findUnique({ where: { id } });
    if (!equipoExistente) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    if (equipoExistente.autorId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este equipo' });
    }

    await prisma.equipo.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error eliminando equipo' });
  }
});

module.exports = router;