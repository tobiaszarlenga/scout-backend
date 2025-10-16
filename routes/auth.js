// scout-backend/routes/auth.js

const express = require('express');
const prisma = require('../db/prisma');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const router = express.Router();

// --- RUTA DE REGISTRO ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, rol } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear la contraseña
    const hashedPassword = await argon2.hash(password);

    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        rol: rol || 'user',
      },
    });

    return res.status(201).json({ message: 'Usuario creado exitosamente', userId: newUser.id });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// --- RUTA DE LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar el usuario por email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 2. Verificar la contraseña
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Crear el token JWT
    const token = jwt.sign(
      { sub: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Guardar el token en una cookie httpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Permitir en HTTP para desarrollo local
      sameSite: 'lax', // Lax es suficiente para same-site en localhost
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/', // Asegurar que la cookie esté disponible en toda la app
    });

    console.log('=== Login exitoso ===');
    console.log('Usuario:', user.email);
    console.log('Token generado y cookie establecida');

    // 5. Devolver respuesta exitosa
    return res.status(200).json({ message: 'Login exitoso' });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});


// --- ¡LA RUTA CLAVE! GET /api/auth/me ---
// Su misión es verificar el token de la cookie y devolver el usuario.
router.get('/me', async (req, res) => {
  // 1. Obtenemos el token de la cookie que nos envía el navegador
  const token = req.cookies.token;
  
  console.log('=== /me endpoint ===');
  console.log('Cookies recibidas:', req.cookies);
  console.log('Token:', token);

  // 2. Si no hay token, no hay sesión.
  if (!token) {
    return res.status(401).json({ error: 'No autenticado: no hay token' });
  }

  try {
    // 3. Verificamos que el token sea válido usando nuestro secreto.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Si es válido, usamos el ID del payload para buscar al usuario en la BD.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, rol: true }, // Nunca devolver la contraseña
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // 5. Si todo sale bien, devolvemos los datos del usuario.
    return res.json(user);

  } catch (err) {
    // Si el token es inválido o expiró, jwt.verify lanzará un error.
    return res.status(401).json({ error: 'No autenticado: token inválido' });
  }
});


// --- RUTA DE LOGOUT ---
router.post('/logout', (_req, res) => {
  // Limpiamos la cookie del token para cerrar la sesión
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logout exitoso' });
});


module.exports = router;