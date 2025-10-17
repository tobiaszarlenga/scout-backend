// scout-backend/routes/pitchers.js

// 1. Cambiamos los 'import' por 'require'
const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const router = Router();
const prisma = new PrismaClient();

// OBTENER TODOS LOS PITCHERS
router.get('/', async (req, res) => {
  try {
    const pitchers = await prisma.pitcher.findMany({
      include: {
        equipo: true,
      },
    });
    res.json(pitchers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los pitchers.' });
  }
});

// CREAR UN NUEVO PITCHER
router.post('/', async (req, res) => {
  const { nombre, apellido, edad, numero_camiseta, equipoId } = req.body;
  try {
    const nuevoPitcher = await prisma.pitcher.create({
      data: {
        nombre,
        apellido,
        edad: parseInt(edad),
        numero_camiseta: parseInt(numero_camiseta),
        equipoId: parseInt(equipoId),
      },
    });
    res.status(201).json(nuevoPitcher);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al crear el pitcher.' });
  }
});

// ACTUALIZAR UN PITCHER
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, edad, numero_camiseta, equipoId } = req.body;
    try {
        const pitcherActualizado = await prisma.pitcher.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                apellido,
                edad: parseInt(edad),
                numero_camiseta: parseInt(numero_camiseta),
                equipoId: parseInt(equipoId),
            },
        });
        res.json(pitcherActualizado);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el pitcher.' });
    }
});


// ELIMINAR UN PITCHER
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.pitcher.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el pitcher.' });
  }
});

// 2. Cambiamos 'export default' por 'module.exports'
module.exports = router;