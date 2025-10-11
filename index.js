require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const prisma = require('./db/prisma');
const equiposRouter = require('./routes/equipos');
const authRouter = require('./routes/auth'); // <- NUEVO

const app = express();

// --- Middlewares base ---
app.use(express.json());
app.use(cookieParser());

// CORS: permitir cookies desde el frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// --- Health ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'scout-backend', ts: new Date().toISOString() });
});

// --- Rutas de negocio ---
app.use('/api/equipos', equiposRouter);

// (IMPORTANTE) Eliminamos este handler duplicado para no chocar con equiposRouter
// app.get('/api/equipos', async (_req, res) => { ... })

// --- Auth (nuevo) ---
app.use('/auth', authRouter); // /auth/register, /auth/login, /auth/me, /auth/logout

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
