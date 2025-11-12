// scout-backend/routes/auth.js

const express = require('express');
const prisma = require('../db/prisma');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { validateRegister, validateLogin } = require('../middleware/validators');

// Helper: normalizar inputs
function normalize(str) {
  return typeof str === 'string' ? str.trim() : '';
}

// --- RUTA DE REGISTRO ---
router.post('/register', validateRegister, async (req, res) => {
  try {
    const name = normalize(req.body.name);
    const email = normalize(req.body.email).toLowerCase();
    const password = String(req.body.password || '');
    const rol = normalize(req.body.rol) || 'user';

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hashear la contraseña
    const hashedPassword = await argon2.hash(password);

    // Crear el usuario
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, rol },
      select: { id: true }, // no devolvemos datos sensibles
    });

    return res.status(201).json({
      message: 'Usuario creado exitosamente',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// --- RUTA DE LOGIN ---
router.post('/login', validateLogin, async (req, res) => {
  try {
    const email = normalize(req.body.email).toLowerCase();
    const password = String(req.body.password || '');

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
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,       // solo secure en prod
      sameSite: isProd ? 'none' : 'lax', // 'none' si usás cross-site en prod con HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 días
      path: '/',
    });

    // 5. Devolver respuesta exitosa
    return res.status(200).json({ message: 'Login exitoso' });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// --- GET /api/auth/me ---
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
  } catch (_err) {
    return res.status(401).json({ error: 'No autenticado: token inválido' });
  }
});

// --- RUTA DE LOGOUT ---
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.status(200).json({ message: 'Logout exitoso' });
});

module.exports = router;
