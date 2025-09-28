// routes/equipos.js
const express = require('express');
const prisma = require('../db/prisma');
const router = express.Router();

// GET /api/equipos
router.get('/', async (_req, res) => {
  try {
    const equipos = await prisma.equipo.findMany({ orderBy: { id: 'asc' } });
    res.json(equipos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando equipos' });
  }
});

// POST /api/equipos
router.post('/', async (req, res) => {
  try {
    const { nombre, ciudad } = req.body;

    // validación mínima
    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ error: 'nombre es requerido (mín. 2 chars)' });
    }

    const nuevo = await prisma.equipo.create({
      data: { nombre: nombre.trim(), ciudad: ciudad?.trim() || null },
    });

    return res.status(201).json(nuevo);
  } catch (err) {
    // nombre único (si pusimos @@unique en Prisma)
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El nombre ya existe' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error creando equipo' });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, ciudad } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }
    if (nombre && nombre.trim().length < 2) {
      return res.status(400).json({ error: 'nombre debe tener al menos 2 caracteres' });
    }

    const actualizado = await prisma.equipo.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
        ...(ciudad !== undefined ? { ciudad: ciudad?.trim() || null } : {}),
      },
    });

    return res.json(actualizado);
  } catch (err) {
    if (err.code === 'P2002') {    // unique constraint
      return res.status(409).json({ error: 'El nombre ya existe' });
    }
    if (err.code === 'P2025') {    // record not found
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error actualizando equipo' });
  }
});
// GET /api/equipos/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }
  try {
    const equipo = await prisma.equipo.findUnique({ where: { id } });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(equipo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo equipo' });
  }
});

// DELETE /api/equipos/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }
  try {
    await prisma.equipo.delete({ where: { id } });
    return res.status(204).send(); // sin body
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error eliminando equipo' });
  }
});


module.exports = router;
