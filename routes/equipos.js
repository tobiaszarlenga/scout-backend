const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

const {
  listEquipos,
  getEquipo,
  getEquipoStats,
  createEquipo,
  updateEquipo,
  deleteEquipo,
} = require('../controllers/equipoController');

// El router solo mapea URL → controller (y aplica middlewares)
router.get('/', verificarToken, listEquipos);
// estadísticas históricas por equipo
router.get('/:id/stats', verificarToken, getEquipoStats);
router.get('/:id', verificarToken, getEquipo);
router.post('/', verificarToken, createEquipo);
router.put('/:id', verificarToken, updateEquipo);
router.delete('/:id', verificarToken, deleteEquipo);

module.exports = router;
