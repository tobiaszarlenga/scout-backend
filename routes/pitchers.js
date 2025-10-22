// 1. Cambiamos los 'import' por 'require'
const { Router } = require('express');
// --- CAMBIO 1: Importamos el middleware y el cliente de prisma correcto ---
const prisma = require('../db/prisma');
const { verificarToken } = require('../middleware/auth');

const router = Router();
// const prisma = new PrismaClient(); // <-- Eliminamos esto, usamos el importado

// --- OBTENER TODOS MIS PITCHERS ---
// --- CAMBIO 2: Protegemos la ruta y filtramos por usuario ---
router.get('/', verificarToken, async (req, res) => {
  try {
    // Obtenemos el ID del usuario logueado
    const userId = req.user.sub;

    const pitchers = await prisma.pitcher.findMany({
      // Filtramos pitchers que pertenezcan a un equipo cuyo autor sea el usuario logueado
      where: {
        equipo: {
          autorId: userId
        }
      },
      include: {
        equipo: { // Solo traemos el nombre del equipo
          select: { nombre: true }
        },
      },
    });
    res.json(pitchers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los pitchers.' });
  }
});

// --- CREAR UN NUEVO PITCHER ---
// --- CAMBIO 3: Protegemos la ruta y validamos el equipo ---
router.post('/', verificarToken, async (req, res) => {
  const { nombre, apellido, edad, numero_camiseta, equipoId } = req.body;
  const userId = req.user.sub;

  // --- Validación de seguridad:
  // Verificamos que el equipo (equipoId) al que se asigna el pitcher
  // realmente le pertenece al usuario.
  try {
    const equipoDelUsuario = await prisma.equipo.findFirst({
      where: {
        id: parseInt(equipoId),
        autorId: userId,
      }
    });

    if (!equipoDelUsuario) {
      return res.status(403).json({ error: 'No autorizado para añadir pitchers a este equipo.' });
    }
    // --- Fin de validación ---

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

// --- ACTUALIZAR UN PITCHER ---
// --- CAMBIO 4: Protegemos la ruta y validamos propiedad ---
router.put('/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.sub;
    const { nombre, apellido, edad, numero_camiseta, equipoId } = req.body;
    
    try {
      // 1. Verificamos que el pitcher que se intenta editar le pertenece al usuario
      const pitcherActual = await prisma.pitcher.findFirst({
        where: {
          id: parseInt(id),
          equipo: { autorId: userId } // El pitcher debe estar en un equipo del usuario
        }
      });

      if (!pitcherActual) {
        return res.status(403).json({ error: 'No autorizado para modificar este pitcher.' });
      }

      // 2. (Opcional pero recomendado) Si está cambiando de equipo (nuevo equipoId),
      // verificamos que el NUEVO equipo también le pertenezca.
      if (equipoId && equipoId !== pitcherActual.equipoId) {
        const nuevoEquipo = await prisma.equipo.findFirst({
          where: { id: parseInt(equipoId), autorId: userId }
        });
        if (!nuevoEquipo) {
          return res.status(403).json({ error: 'No autorizado para mover el pitcher a ese equipo.' });
        }
      }
      
      // 3. Si todo está bien, actualizamos
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


// --- ELIMINAR UN PITCHER ---
// --- CAMBIO 5: Protegemos la ruta y validamos propiedad ---
router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    // 1. Verificamos que el pitcher le pertenece al usuario
    const pitcher = await prisma.pitcher.findFirst({
      where: {
        id: parseInt(id),
        equipo: { autorId: userId }
      }
    });

    if (!pitcher) {
      return res.status(403).json({ error: 'No autorizado para eliminar este pitcher.' });
    }

    // 2. Si le pertenece, lo borramos
    await prisma.pitcher.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.status(204).send();
  } catch (error) {
    // --- CAMBIO 6: Manejamos error si el pitcher está en un partido ---
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res.status(409).json({ error: 'No se puede eliminar el pitcher, está asignado a un partido.' });
    }
    res.status(500).json({ error: 'Error al eliminar el pitcher.' });
  }
});

module.exports = router;