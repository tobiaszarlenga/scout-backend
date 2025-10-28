// En: scout-backend/src/routes/lookup.routes.js

const express = require('express');
const router = express.Router();
const {
  getTiposLanzamiento,
  getResultadosLanzamiento,
} = require('../controllers/lookupController');

// Importamos el middleware de autenticación que ya usas
const { verificarToken } = require('../middleware/auth.js');

// --- Definimos las rutas ---

// GET /api/lookup/tipos-lanzamiento
// (Protegida, solo usuarios logueados pueden verla)
router.get('/tipos-lanzamiento', verificarToken, getTiposLanzamiento);

// GET /api/lookup/resultados-lanzamiento
// (Protegida)
router.get('/resultados-lanzamiento', verificarToken, getResultadosLanzamiento);

module.exports = router;