const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_segredo_dev';

/*
  Verifica se o token JWT é válido
  Usado para proteger rotas que requerem autenticação
*/
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ erro: 'Token inválido ou expirado' });
    req.utilizador = payload;
    next();
  });
};

/*
  Verifica se o utilizador é administrador
  Usar SEMPRE depois de verifyToken
*/
exports.isAdmin = (req, res, next) => {
  if (req.utilizador?.nivel !== 'administrador')
    return res.status(403).json({ erro: 'Acesso reservado a administradores' });
  next();
};