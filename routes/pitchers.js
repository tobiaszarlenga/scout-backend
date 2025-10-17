// scout-backend/routes/pitchers.js

const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const authenticate = require('../middleware/authenticate');

// --- GET /api/pitchers (Obtener SOLO los pitchers de los equipos del usuario) ---
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub;

    // Buscamos pitchers DONDE el equipo al que pertenecen TENGA el autorId del usuario
    const pitchers = await prisma.pitcher.findMany({
      where: {
        equipo: {
          autorId: userId,
        },
      },
      include: {
        equipo: { // Incluimos el nombre del equipo para mostrarlo en el frontend
          select: { nombre: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json(pitchers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando pitchers' });
  }
});

// --- POST /api/pitchers (Crear un pitcher en un equipo del usuario) ---
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { nombre, apellido, edad, numero_camiseta, equipoId } = req.body;

    // 1. Validar que el equipoId fue enviado
    if (!equipoId) {
      return res.status(400).json({ error: 'El campo equipoId es requerido' });
    }

    // 2. Verificar que el equipo seleccionado le pertenece al usuario
    const equipo = await prisma.equipo.findUnique({ where: { id: equipoId } });
    if (!equipo || equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para agregar pitchers a este equipo.' });
    }

    // 3. Si todo está bien, crear el pitcher
    const nuevoPitcher = await prisma.pitcher.create({
      data: {
        nombre,
        apellido,
        edad,
        numero_camiseta,
        equipoId,
      },
    });

    res.status(201).json(nuevoPitcher);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando el pitcher' });
  }
});

// --- PUT /api/pitchers/:id (Actualizar un pitcher si pertenece al usuario) ---
router.put('/:id', authenticate, async (req, res) => {
    try {
        const pitcherId = Number(req.params.id);
        const userId = req.user.sub;
        const { nombre, apellido, edad, numero_camiseta, equipoId } = req.body;

        // Verificar que el pitcher exista y pertenezca a un equipo del usuario
        const pitcherExistente = await prisma.pitcher.findFirst({
            where: {
                id: pitcherId,
                equipo: { autorId: userId }
            }
        });

        if (!pitcherExistente) {
            return res.status(403).json({ error: 'No tienes permiso para editar este pitcher o no existe.' });
        }
        
        // Si se intenta cambiar de equipo, verificar que el nuevo equipo también sea del usuario
        if (equipoId && equipoId !== pitcherExistente.equipoId) {
            const nuevoEquipo = await prisma.equipo.findFirst({
                where: { id: equipoId, autorId: userId }
            });
            if (!nuevoEquipo) {
                return res.status(403).json({ error: 'No puedes mover este pitcher a un equipo que no te pertenece.' });
            }
        }

        const pitcherActualizado = await prisma.pitcher.update({
            where: { id: pitcherId },
            data: { nombre, apellido, edad, numero_camiseta, equipoId }
        });

        res.json(pitcherActualizado);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando el pitcher' });
    }
});


// --- DELETE /api/pitchers/:id (Eliminar un pitcher si pertenece al usuario) ---
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const pitcherId = Number(req.params.id);
        const userId = req.user.sub;

        // Verificar que el pitcher exista y pertenezca a un equipo del usuario
        const pitcherExistente = await prisma.pitcher.findFirst({
            where: {
                id: pitcherId,
                equipo: { autorId: userId } // La clave es verificar la autoría a través del equipo
            }
        });

        if (!pitcherExistente) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este pitcher o no existe.' });
        }

        await prisma.pitcher.delete({ where: { id: pitcherId } });
        res.status(204).send();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando el pitcher' });
    }
});


module.exports = router;