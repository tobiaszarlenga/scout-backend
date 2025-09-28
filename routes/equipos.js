// routes/equipos.js
const express = require('express');
const prisma = require('../db/prisma');
const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const equipos = await prisma.equipo.findMany({ orderBy: { id: 'asc' } });
    res.json(equipos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando equipos' });
  }
});

module.exports = router;
