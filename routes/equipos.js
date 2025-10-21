// routes/equipos.js
const express = require('express');
const prisma = require('../db/prisma'); // Asumo que tienes un archivo que exporta el cliente de Prisma
const router = express.Router();

// --- ¡CORRECTO! Importamos nuestro middleware ---
const { verificarToken } = require('../middleware/auth');

// --- GET /api/equipos (Obtener todos los equipos) ---
// Esta ruta puede ser pública, la dejamos como está.
router.get('/', async (_req, res) => {
  try {
    const equipos = await prisma.equipo.findMany({
      orderBy: { id: 'asc' },
      include: {
        autor: {
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
// --- ¡CAMBIO 1: Aplicamos el middleware 'verificarToken'! ---
router.post('/', verificarToken, async (req, res) => {
  try {
    // --- CAMBIO 2: Ya NO esperamos 'autorId' del body ---
    const { nombre, ciudad } = req.body;

    // --- CAMBIO 3: Obtenemos el autorId de forma SEGURA desde el token ---
    // (Usamos 'sub' porque así lo guardaste en el JWT: { sub: user.id })
    const autorId = req.user.sub;

    // --- Validaciones (solo para nombre) ---
    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ error: 'nombre es requerido (mín. 2 caracteres)' });
    }

    // --- CAMBIO 4: BORRAMOS la validación insegura de 'autorId' ---
    // if (!autorId || ...etc...) { ... } <-- ESTO SE FUE

    // --- Creación en la Base de Datos ---
    const nuevoEquipo = await prisma.equipo.create({
      data: {
        nombre: nombre.trim(),
        ciudad: ciudad?.trim() || null,
        // ¡Usamos el autorId seguro!
        autorId: autorId,
      },
    });

    return res.status(201).json(nuevoEquipo);
  } catch (err) {
    // Si el nombre ya existe (@@unique)
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'El nombre ya existe' });
    }
    // El error P2003 (usuario autor no existe) ya no es necesario,
    // porque el ID siempre vendrá de un token válido.
    console.error(err);
    return res.status(500).json({ error: 'Error creando equipo' });
  }
});

// --- GET /api/equipos/:id (Obtener un equipo específico) ---
// Esta ruta también puede ser pública, la dejamos.
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id },
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
// --- ¡MEJORA DE SEGURIDAD: Aplicamos el middleware 'verificarToken'! ---
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, ciudad } = req.body;
    const userId = req.user.sub; // ID del usuario logueado

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }

    // --- MEJORA: Verificamos que el usuario sea dueño del equipo ---
    const equipo = await prisma.equipo.findUnique({ where: { id } });
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    if (equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No autorizado para modificar este equipo' });
    }
    // --- FIN DE MEJORA ---

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
// --- ¡MEJORA DE SEGURIDAD: Aplicamos el middleware 'verificarToken'! ---
router.delete('/:id', verificarToken, async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user.sub; // ID del usuario logueado

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }

  try {
    // --- MEJORA: Verificamos que el usuario sea dueño del equipo ---
    const equipo = await prisma.equipo.findUnique({ where: { id } });
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    if (equipo.autorId !== userId) {
      return res.status(403).json({ error: 'No autorizado para eliminar este equipo' });
    }
    // --- FIN DE MEJORA ---

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