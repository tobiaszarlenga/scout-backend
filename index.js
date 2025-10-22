require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// --- ¡CONFIGURACIÓN DE CORS DEFINITIVA! ---
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

// --- Middlewares ---
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// --- RUTAS ---
const authRoutes = require('./routes/auth');
const equiposRoutes = require('./routes/equipos');
const pitcherRoutes = require('./routes/pitchers'); 
const partidosRoutes = require('./routes/partidos');
const dashboardRoutes = require('./routes/dashboard.js');

app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/pitchers', pitcherRoutes);
app.use('/api/partidos', partidosRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- Iniciar el servidor ---
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});