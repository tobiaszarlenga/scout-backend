// scout-backend/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// --- ¡CONFIGURACIÓN DE CORS DEFINITIVA! ---
// Creamos un objeto con las opciones explícitas.
const corsOptions = {
  // 1. Origen permitido: Solo tu frontend puede hacer peticiones.
  origin: ['http://localhost:3000', 'http://localhost:3002'],

  // 2. Credenciales: ¡Esta es la clave! Permite que el navegador envíe cookies.
  credentials: true,

  // 3. Métodos permitidos (buena práctica incluirlos)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

// --- Middlewares ---
app.use(cors(corsOptions)); // 👈 Usamos la nueva configuración aquí
app.use(express.json());
app.use(cookieParser());

// --- RUTAS ---
const authRoutes = require('./routes/auth');
const equiposRoutes = require('./routes/equipos');

app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);

// --- Iniciar el servidor ---
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});