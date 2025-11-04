const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

const {
  listEquipos,
  getEquipo,
  createEquipo,
  updateEquipo,
  deleteEquipo,
} = require('../controllers/equipoController');

// El router solo mapea URL → controller (y aplica middlewares)
router.get('/', verificarToken, listEquipos);
router.get('/:id', verificarToken, getEquipo);
router.post('/', verificarToken, createEquipo);
router.put('/:id', verificarToken, updateEquipo);
router.delete('/:id', verificarToken, deleteEquipo);

module.exports = router;
