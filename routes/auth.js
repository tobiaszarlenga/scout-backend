// scout-backend/routes/auth.js

const express = require('express');
const prisma = require('../db/prisma');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const router = express.Router();

// --- RUTA DE REGISTRO (MODIFICADA) ---
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

    // --- ¡NUEVO! INICIO DE SESIÓN AUTOMÁTICO ---
    // 1. Crear el token JWT para el nuevo usuario
    const token = jwt.sign(
      { sub: newUser.id, email: newUser.email, rol: newUser.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 2. Guardar el token en la cookie (igual que en el login)
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Permitir en HTTP para desarrollo local
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/',
    });
    
    // 3. Devolver respuesta exitosa
    return res.status(201).json({ message: 'Usuario creado e sesión iniciada', userId: newUser.id });

  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// --- RUTA DE LOGIN (Sin cambios) ---
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

    // 5. Devolver respuesta exitosa
    return res.status(200).json({ message: 'Login exitoso' });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});


// --- RUTA GET /api/auth/me (Sin cambios) ---
router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'No autenticado: no hay token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, rol: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    return res.json(user);

  } catch (err) {
    return res.status(401).json({ error: 'No autenticado: token inválido' });
  }
});


// --- RUTA DE LOGOUT (Sin cambios) ---
router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logout exitoso' });
});


module.exports = router;