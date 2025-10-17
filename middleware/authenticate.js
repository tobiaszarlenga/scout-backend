// middleware/authenticate.js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  // 1. Obtenemos el token de la cookie
  const token = req.cookies.token;

  // 2. Si no hay token, el usuario no está autenticado
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: se requiere token.' });
  }

  try {
    // 3. Verificamos que el token sea válido
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. ¡Clave! Añadimos la información del usuario (el payload del token) al objeto 'req'
    // para que las siguientes funciones puedan usarla.
    req.user = payload;
    
    // 5. Si todo está bien, pasamos al siguiente paso (la lógica de la ruta)
    next();
  } catch (error) {
    // Si el token es inválido o expiró
    return res.status(401).json({ error: 'Token inválido.' });
  }
}

module.exports = authenticate;