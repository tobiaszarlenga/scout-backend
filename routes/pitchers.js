const { Router } = require('express');
const { verificarToken } = require('../middleware/auth');
const {
  listPitchers,
  getPitcher,
  getPitcherStats,
  createPitcher,
  updatePitcher,
  deletePitcher,
} = require('../controllers/pitcherController');

const router = Router();

// Solo mapeo URL → controller (+ middlewares)
router.get('/', verificarToken, listPitchers);
// estadísticas históricas por pitcher
router.get('/:id/stats', verificarToken, getPitcherStats);
router.get('/:id', verificarToken, getPitcher);
router.post('/', verificarToken, createPitcher);
router.put('/:id', verificarToken, updatePitcher);
router.delete('/:id', verificarToken, deletePitcher);

module.exports = router;
