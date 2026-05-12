const passport = require('passport');
const jwt      = require('jsonwebtoken');
const path     = require('path');
const fs       = require('fs');
const multer = require('multer');
const crypto   = require('crypto');
const User     = require('../models/user');

const JWT_SECRET  = process.env.JWT_SECRET  || 'jwt_segredo_dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// ------------------------------------------------- Multer ------------------------------------------------- //

// Diretoria base para fotos de perfil
const UPLOADS_BASE = path.join(__dirname, '..', 'public', 'uploads', 'perfis');
fs.mkdirSync(UPLOADS_BASE, { recursive: true }); // Garantir que existe

// Guardar temporariamente em memória para calcular o hash antes de decidir o caminho final
const storage = multer.memoryStorage();

exports.uploadFoto = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }).single('foto');

// ------------------------------------------------- JWT ------------------------------------------------- //

// Gerar token JWT com a informação relevante do utilizador
function gerarToken(user) {
  return jwt.sign(
    {
      id:       user._id,
      username: user.username,
      email:    user.email,
      nivel:    user.nivel
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ------------------------------------------------- Auth ------------------------------------------------- //

/*
  POST /auth/registo
  Cria um novo utilizador
  Body: { username, password, email, filiacao, idade, nivel }
*/
function validarPassword(password) {
  if (!password || password.length < 8)   return 'A palavra-passe deve ter pelo menos 8 caracteres.';
  if (password.length > 64)               return 'A palavra-passe não pode ter mais de 64 caracteres.';
  if (!/[A-Z]/.test(password))            return 'A palavra-passe deve conter pelo menos uma letra maiúscula.';
  if (!/[a-z]/.test(password))            return 'A palavra-passe deve conter pelo menos uma letra minúscula.';
  if (!/[0-9]/.test(password))            return 'A palavra-passe deve conter pelo menos um dígito (0–9).';
  const especiais = (password.match(/[!#$%&/()=?]/g) || []).length;
  if (especiais < 2)                      return 'A palavra-passe deve conter pelo menos dois símbolos especiais ( ! # $ % & / ( ) = ? ).';
  return null;
}

exports.registo = async (req, res) => {
  try {
    const { username, password, email, filiacao, idade, nivel } = req.body;

    if (!username || !password || !email || !filiacao || !idade)
      return res.status(400).json({ erro: 'Campos obrigatórios: username, password, email, filiacao, idade' });

    const erroPassword = validarPassword(password);
    if (erroPassword) return res.status(400).json({ erro: erroPassword });

    // passport-local-mongoose trata do hash — usa User.register()
    const user = new User({ username, email, filiacao, idade: Number(idade), nivel: nivel || 'consumidor' });
    const registado = await User.register(user, password);

    const token = gerarToken(registado);
    res.status(201).json({ mensagem: 'Utilizador registado com sucesso', token });
  }
  catch (err) {
    // username duplicado, email duplicado, etc.
    res.status(400).json({ erro: err.message });
  }
};

/*
  POST /auth/login
  Autentica o utilizador e devolve um JWT
  Body: { username, password }
*/
exports.login = (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ erro: info?.message || 'Credenciais inválidas' });

    // Atualiza data do último acesso
    await User.findByIdAndUpdate(user._id, { dataUltimoAcesso: new Date() });

    const token = gerarToken(user);
    res.json({ mensagem: 'Login com sucesso', token });
  })(req, res, next);
};

/*
  POST /auth/logout
  Com JWT stateless o logout é feito no cliente (apagar o token)
  Este endpoint serve apenas para confirmação
*/
exports.logout = (req, res) => {
  res.json({ mensagem: 'Logout efectuado. Apagar o token no cliente.' });
};

/*
  GET /auth/verificar
  Verifica se um token JWT é válido
  Header: Authorization: Bearer <token>
  Usado pela API e pela Interface para validar pedidos
*/
exports.verificar = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ erro: 'Token inválido ou expirado' });
    res.json({ valido: true, utilizador: payload });
  });
};

// ------------------------------------------------- Perfil ------------------------------------------------- //

/*
  GET /auth/perfil
  Devolve os dados do utilizador autenticado
  Header: Authorization: Bearer <token>
*/
exports.perfil = async (req, res) => {
  try {
    // req.utilizador é preenchido pelo middleware verifyToken (routes/auth.js)
    const user = await User.findById(req.utilizador.id).select('-hash -salt');
    if (!user) return res.status(404).json({ erro: 'Utilizador não encontrado' });
    res.json(user);
  }
  catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

/*
  PATCH /auth/perfil
  Atualiza os campos editáveis do utilizador autenticado (bio e fotoPerfil)
  Header: Authorization: Bearer <token>
*/
exports.atualizarPerfil = async (req, res) => {
  try {
    const camposPermitidos = ['bio', 'fotoPerfil'];
    const atualizacao = {};
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) atualizacao[campo] = req.body[campo];
    }

    const user = await User.findByIdAndUpdate(
      req.utilizador.id,
      atualizacao,
      { new: true }
    ).select('-hash -salt');

    if (!user) return res.status(404).json({ erro: 'Utilizador não encontrado' });
    res.json(user);
  }
  catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

/*
  POST /auth/perfil/foto
  Faz upload da foto de perfil do utilizador autenticado
  Header: Authorization: Bearer <token>
  Body: multipart/form-data com campo 'foto'
*/
exports.atualizarFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ erro: 'Nenhum ficheiro.' });

    // Calcular SHA-256 do ficheiro
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Construir o caminho para a foto: <base>/<aa>/<bb>/<resto><ext>
    const dir1 = hash.slice(0, 2);
    const dir2 = hash.slice(2, 4);
    const filename = hash.slice(4) + ext;
    const dirPath = path.join(UPLOADS_BASE, dir1, dir2);
    const filePath = path.join(dirPath, filename);

    // Criar as subdiretorias e guardar o ficheiro
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, req.file.buffer);

    const urlFoto = `/uploads/perfis/${dir1}/${dir2}/${filename}`;

    const user = await User.findByIdAndUpdate(
      req.utilizador.id,
      { fotoPerfil: urlFoto },
      { new: true }
    );

    res.json({ fotoPerfil: user.fotoPerfil });
  }
  catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// ------------------------------------------------- Perfil Público ------------------------------------------------- //

/*
  GET /auth/utilizadores/:username — perfil público de um utilizador
*/
exports.perfilPublico = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-hash -salt -email -dataUltimoAcesso');
    if (!user) return res.status(404).json({ erro: 'Utilizador não encontrado' });
    res.json(user);
  }
  catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// ------------------------------------------------- Admin ------------------------------------------------- //

/*
  GET /auth/utilizadores — listar todos (só admin)
*/
exports.listarUtilizadores = async (req, res) => {
  try {
    const users = await User.find().select('-hash -salt');
    res.json(users);
  }
  catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

/*
  DELETE /auth/utilizadores/:id — apagar utilizador (só admin)
*/
exports.apagarUtilizador = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ erro: 'Utilizador não encontrado' });
    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ erro: err.message });
  }
};