// En: scout-backend/src/controllers/lookupController.js



const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Obtiene todos los tipos de lanzamiento (Drop, Curva, etc.)
 */
const getTiposLanzamiento = async (req, res) => {
  try {
    const tipos = await prisma.tipoLanzamiento.findMany({
      orderBy: {
        nombre: 'asc', // Ordenados alfabéticamente
      },
    });
    res.json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de lanzamiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene todos los resultados de lanzamiento (Strike, Bola, etc.)
 */
const getResultadosLanzamiento = async (req, res) => {
  try {
    const resultados = await prisma.resultadoLanzamiento.findMany({
      orderBy: {
        id: 'asc', // Ordenados por ID (Strike, Bola, Hit...)
      },
    });
    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener resultados de lanzamiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getTiposLanzamiento,
  getResultadosLanzamiento,
};