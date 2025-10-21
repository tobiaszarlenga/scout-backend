// scout-backend/routes/partidos.js

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const { crearPartido, listarPartidos } = require('../controllers/partidoController');

// --- POST /api/partidos (Crear un nuevo partido) ---
// 1. Verificamos el token
// 2. Si es válido, llamamos a la función crearPartido
router.post('/', verificarToken, crearPartido);

// --- GET /api/partidos (Obtener todos mis partidos) ---
// 1. Verificamos el token
// 2. Si es válido, llamamos a la función listarPartidos
router.get('/', verificarToken, listarPartidos);

// Aquí añadiremos más rutas después (GET /:id, PUT /:id, etc.)

module.exports = router;