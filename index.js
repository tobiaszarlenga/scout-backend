// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'scout-backend', ts: new Date().toISOString() });
});

// endpoint de prueba
app.get('/api/equipos', (_req, res) => {
  res.json([{ id: 1, nombre: 'Equipo demo' }]);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));
