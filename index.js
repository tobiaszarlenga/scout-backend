require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'scout-backend', ts: new Date().toISOString() });
});

// GET /api/equipos  -> lista todos
app.get('/api/equipos', async (_req, res) => {
  try {
    const equipos = await prisma.equipo.findMany();
    res.json(equipos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo equipos' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
