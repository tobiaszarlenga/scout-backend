// En /scout-backend/middleware/auth.js
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  // 1. Obtenemos el token de la cookie
  const token = req.cookies.token;

  // 2. Si no hay token, no está autenticado
  if (!token) {
    return res.status(401).json({ error: 'No autenticado: no hay token' });
  }

  try {
    // 3. Verificamos el token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 4. ¡ÉXITO! Inyectamos el payload del usuario en el objeto 'req'
    // Ahora todas las rutas que usen este middleware tendrán acceso a 'req.user'
    req.user = payload; 

    // 5. Continuamos con la siguiente función (la ruta de 'equipos')
    next();

  } catch (err) {
    // Si el token es inválido o expiró
    return res.status(401).json({ error: 'No autenticado: token inválido' });
  }
}

module.exports = { verificarToken };