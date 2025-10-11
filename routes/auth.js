const { Router } = require('express');
const prisma = require('../db/prisma');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.COOKIE_NAME || 'softscout_token';
const isProd = process.env.NODE_ENV === 'production';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ✅ Registro
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email y password son requeridos' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = await argon2.hash(password);
    const user = await prisma.user.create({ data: { email, password: hash, name } });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en registro' });
  }
});

// ✅ Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email y password son requeridos' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await argon2.verify(user.password, password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en login' });
  }
});

// ✅ Obtener usuario actual
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'No autenticado' });
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// ✅ Logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

module.exports = router;
