// routes/equipos.js
const express = require('express');
const prisma = require('../db/prisma'); // Asumo que tienes un archivo que exporta el cliente de Prisma
const router = express.Router();

// --- GET /api/equipos (Obtener todos los equipos) ---
// Esta ruta ahora incluye los datos del autor de cada equipo.
router.get('/', async (_req, res) => {
  try {
    const equipos = await prisma.equipo.findMany({
      orderBy: { id: 'asc' },
      // ¡NUEVO! Le pedimos a Prisma que "incluya" la información del autor relacionado.
      include: {
        autor: {
          // Solo seleccionamos los campos que nos interesan del autor, nunca la contraseña.
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    res.json(equipos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando equipos' });
  }
});

// --- POST /api/equipos (Crear un nuevo equipo) ---
// Esta es la ruta que hemos modificado principalmente.
router.post('/', async (req, res) => {
  try {
    // ¡MODIFICADO! Ahora también esperamos recibir 'autorId' del frontend.
    const { nombre, ciudad, autorId } = req.body;

    // --- Validaciones ---
    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ error: 'nombre es requerido (mín. 2 caracteres)' });
    }
    // ¡NUEVO! Validamos que el autorId sea un número entero positivo.
    if (!autorId || !Number.isInteger(autorId) || autorId <= 0) {
      return res.status(400).json({ error: 'autorId es inválido' });
    }

    // --- Creación en la Base de Datos ---
    const nuevoEquipo = await prisma.equipo.create({
      data: {
        nombre: nombre.trim(),
        ciudad: ciudad?.trim() || null,
        // ¡MODIFICADO! Conectamos el equipo con el autor usando su ID.
        autorId: autorId,
      },
    });

    return res.status(201).json(nuevoEquipo);
  } catch (err) {
    // Si el nombre ya existe (@@unique)
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El nombre ya existe' });
    }
    // ¡NUEVO! Si el autorId que nos pasaron no existe en la tabla User.
    if (err.code === 'P2003') {
        return res.status(400).json({ error: 'El usuario autor no existe' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error creando equipo' });
  }
});

// --- GET /api/equipos/:id (Obtener un equipo específico) ---
// También le agregamos que incluya la info del autor.
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id },
      // ¡NUEVO! Incluimos los datos del autor.
      include: {
        autor: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(equipo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo equipo' });
  }
});


// --- PUT /api/equipos/:id (Actualizar un equipo) ---
// Esta ruta no necesita grandes cambios, ya que no permitiremos cambiar el autor.
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, ciudad } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }
    // Validar que al menos uno de los campos a actualizar esté presente
    if (nombre === undefined && ciudad === undefined) {
      return res.status(400).json({ error: 'Se requiere al menos un campo (nombre o ciudad) para actualizar.' });
    }

    const dataToUpdate = {};
    if (nombre !== undefined) {
      if (nombre.trim().length < 2) {
        return res.status(400).json({ error: 'nombre debe tener al menos 2 caracteres' });
      }
      dataToUpdate.nombre = nombre.trim();
    }
    if (ciudad !== undefined) {
      dataToUpdate.ciudad = ciudad?.trim() || null;
    }

    const actualizado = await prisma.equipo.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json(actualizado);
  } catch (err) {
    if (err.code === 'P2002') { // unique constraint
      return res.status(409).json({ error: 'El nombre ya existe' });
    }
    if (err.code === 'P2025') { // record not found
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error actualizando equipo' });
  }
});


// --- DELETE /api/equipos/:id (Eliminar un equipo) ---
// No requiere cambios. La lógica sigue siendo la misma.
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }
  try {
    await prisma.equipo.delete({ where: { id } });
    return res.status(204).send(); // 204 No Content
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Error eliminando equipo' });
  }
});

module.exports = router;