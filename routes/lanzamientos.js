// scout-backend/routes/lanzamientos.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const ctrl = require('../controllers/lanzamientoController');

// Nested under partido
router.get('/partidos/:partidoId/lanzamientos', verificarToken, ctrl.listarPorPartido);
router.post('/partidos/:partidoId/lanzamientos', verificarToken, ctrl.crear);

// Single by id
router.put('/lanzamientos/:id', verificarToken, ctrl.actualizar);
router.delete('/lanzamientos/:id', verificarToken, ctrl.eliminar);

module.exports = router;
