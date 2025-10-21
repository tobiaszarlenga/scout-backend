// scout-backend/controllers/partidoController.js

const prisma = require('../db/prisma');

/**
 * @route   POST /api/partidos
 * @desc    Crear un nuevo partido
 * @access  Private
 */
const crearPartido = async (req, res) => {
  try {
    // 1. Obtenemos los datos del formulario (body)
    const {
      equipoLocalId,
      equipoVisitanteId,
      pitcherLocalId,
      pitcherVisitanteId,
      fecha, // "dd/mm/yyyy"
      horario, // "HH:mm"
      campo,
    } = req.body;

    // 2. Obtenemos el ID del scout (usuario) desde el token
    const autorId = req.user.sub;

    // 3. Validación básica de campos requeridos
    if (
      !equipoLocalId ||
      !equipoVisitanteId ||
      !pitcherLocalId ||
      !pitcherVisitanteId ||
      !fecha ||
      !horario
    ) {
      return res.status(400).json({ error: 'Todos los campos marcados con * son requeridos' });
    }

    // 4. Convertir fecha y hora a un objeto Date de JavaScript
    // JS espera (año, mes_cero_indexado, dia, hora, minuto)
    const [day, month, year] = fecha.split('/');
    const [hour, minute] = horario.split(':');
    
    // new Date(año, mes - 1, dia, hora, minuto)
    const fechaHora = new Date(year, month - 1, day, hour, minute);

    // Verificamos si la fecha creada es válida
    if (isNaN(fechaHora.getTime())) {
      return res.status(400).json({ error: 'Formato de fecha u horario inválido' });
    }

    // 5. Creamos el partido en la base de datos
    const nuevoPartido = await prisma.partido.create({
      data: {
        fecha: fechaHora, // Guardamos el objeto Date combinado
        campo: campo?.trim() || null,
        estado: 'PROGRAMADO', // Estado por defecto
        horario: horario,
        
        // Conexiones (IDs)
        autorId: autorId,
        equipoLocalId: Number(equipoLocalId),
        equipoVisitanteId: Number(equipoVisitanteId),
        pitcherLocalId: Number(pitcherLocalId),
        pitcherVisitanteId: Number(pitcherVisitanteId),
      },
    });

    return res.status(201).json(nuevoPartido);

  } catch (err) {
    console.error(err);
    // Error si un ID de equipo/pitcher no existe
    if (err.code === 'P2003') { 
      return res.status(404).json({ error: 'El equipo o pitcher seleccionado no existe' });
    }
    return res.status(500).json({ error: 'Error al crear el partido' });
  }
};


/**
 * @route   GET /api/partidos
 * @desc    Obtener todos los partidos del usuario logueado
 * @access  Private
 */
const listarPartidos = async (req, res) => {
  try {
    // Obtenemos el ID del scout (usuario) desde el token
    const autorId = req.user.sub;

    const partidos = await prisma.partido.findMany({
      where: {
        autorId: autorId,
      },
      // Incluimos los nombres para mostrarlos en la lista
      include: {
        equipoLocal: { select: { nombre: true } },
        equipoVisitante: { select: { nombre: true } },
        pitcherLocal: { select: { nombre: true, apellido: true } },
        pitcherVisitante: { select: { nombre: true, apellido: true } },
      },
      orderBy: {
        fecha: 'desc', // Los más nuevos primero
      },
    });

    return res.json(partidos);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al listar los partidos' });
  }
};


module.exports = {
  crearPartido,
  listarPartidos,
};