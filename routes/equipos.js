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

module.exports = router;
