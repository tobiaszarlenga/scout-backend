// scout-backend/middleware/validators.js
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Por favor, completa todos los campos.' });
  }

  if (String(name).trim().length < 2) {
    return res.status(400).json({ error: 'El nombre es demasiado corto.' });
  }

  if (!EMAIL_REGEX.test(String(email))) {
    return res.status(400).json({ error: 'El email no es válido.' });
  }

  // Reglas de contraseña (las mismas que pusimos en Register del front)
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }
  if (!/[A-Z]/.test(String(password))) {
    return res.status(400).json({ error: 'La contraseña debe incluir al menos una letra mayúscula.' });
  }

  return next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Por favor, completa ambos campos.' });
  }
  // No revelamos políticas de password en login; dejamos mensaje genérico en el handler
  return next();
}

module.exports = {
  validateRegister,
  validateLogin,
};
