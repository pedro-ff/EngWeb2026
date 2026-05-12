const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

const API_URL  = process.env.API_URL  || 'http://localhost:3001';
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3002';

// Multer para upload temporário de foto de perfil
const uploadTemp = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Tipo de ficheiro não permitido. Use JPG, PNG, GIF ou WebP.'));
  }
});

// Middleware local — injeta o utilizador autenticado em todas as views
router.use((req, res, next) => {
  res.locals.utilizador = req.session.utilizador || null;
  res.locals.token      = req.session.token      || null;
  next();
});

// Helper — cabeçalho Authorization para pedidos à API
function authHeader(req) {
  return req.session.token ? { Authorization: `Bearer ${req.session.token}` } : {};
}


// ------------------------------------------------- Página inicial ------------------------------------------------- //

router.get('/', async (req, res, next) => {
  try {
    const date = new Date().toLocaleString('pt-PT', { hour12: false });
    const r = await axios.get(`${API_URL}/inquiricoes?limite=10`);
    res.render('index', {
      title: 'Inquirições de Génere',
      date,
      inquiricoes: r.data.dados,
      total: r.data.total
    });
  }
  catch (err) {
    next(err);
  }
});

// ---- Relações genealógicas ----
router.post('/inquiricoes/:proc_numero/relacoes/:proc_relacionado', async (req, res) => {
  try {
    const { proc_numero, proc_relacionado } = req.params;
    const r = await axios.post(
      `${API_URL}/inquiricoes/${proc_numero}/relacoes/${proc_relacionado}`,
      req.body,
      { headers: authHeader(req) }
    );
    res.json(r.data);
  }
  catch (err) {
    res.status(err.response?.status || 500).json({ erro: err.response?.data?.erro || err.message });
  }
});

router.delete('/inquiricoes/:proc_numero/relacoes/:proc_relacionado', async (req, res) => {
  try {
    const { proc_numero, proc_relacionado } = req.params;
    await axios.delete(
      `${API_URL}/inquiricoes/${proc_numero}/relacoes/${proc_relacionado}`,
      { headers: authHeader(req) }
    );
    res.status(204).send();
  }
  catch (err) {
    res.status(err.response?.status || 500).json({ erro: err.response?.data?.erro || err.message });
  }
});


// ------------------------------------------------- Listagem e detalhe ------------------------------------------------- //

router.get('/inquiricoes', async (req, res, next) => {
  try {
    const date   = new Date().toLocaleString('pt-PT', { hour12: false });

    // Redirecionar logo para o registo se se pesquisar pelo nº de processo
    if (req.query.proc_numero) {
      const proc = parseInt(req.query.proc_numero);
      if (!isNaN(proc) && proc > 0)
        return res.redirect(`/inquiricoes/${proc}`);
    }

    const params = new URLSearchParams();
    if (req.query.requerente) params.append('requerente', req.query.requerente);
    if (req.query.concelho)   params.append('concelho',   req.query.concelho);
    if (req.query.distrito)   params.append('distrito',   req.query.distrito);
    if (req.query.ano)        params.append('ano',        req.query.ano);
    if (req.query.texto)      params.append('texto',      req.query.texto);
    params.append('pagina', req.query.pagina || 1);
    params.append('limite', 20);

    const r = await axios.get(`${API_URL}/inquiricoes?${params}`);
    res.render('inquiricoes/lista', {
      title: 'Inquirições',
      date,
      inquiricoes: r.data.dados,
      total: r.data.total,
      pagina: r.data.pagina,
      limite: r.data.limite,
      query: req.query
    });
  }
  catch (err) {
    next(err);
  }
});

// Criar novo registo — antes de /:proc_numero para evitar colisão de rotas (admin only)
router.get('/inquiricoes/novo', (req, res) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador') return res.redirect('/login');
  const date = new Date().toLocaleString('pt-PT', { hour12: false });
  res.render('inquiricoes/form', { title: 'Novo Registo', date, inquiricao: null, erro: null });
});

router.post('/inquiricoes/novo', async (req, res) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador') return res.redirect('/login');
  const date = new Date().toLocaleString('pt-PT', { hour12: false });
  try {
    const r = await axios.post(`${API_URL}/inquiricoes`, req.body, { headers: authHeader(req) });
    res.redirect(`/inquiricoes/${r.data.proc_numero}`);
  }
  catch (err) {
    res.render('inquiricoes/form', {
      title: 'Novo Registo', date, inquiricao: req.body,
      erro: err.response?.data?.erro || 'Erro ao criar registo'
    });
  }
});

router.get('/inquiricoes/:proc_numero', async (req, res, next) => {
  try {
    const date = new Date().toLocaleString('pt-PT', { hour12: false });
    const erro = req.session.erro || null;
    delete req.session.erro;
    const [rInq, rPosts] = await Promise.all([
      axios.get(`${API_URL}/inquiricoes/${req.params.proc_numero}`),
      axios.get(`${API_URL}/inquiricoes/${req.params.proc_numero}/posts`)
    ]);
    const inquiricao = rInq.data;

    // Buscar dados públicos do criador do registo (se existir)
    let criadorInfo = null;
    if (inquiricao.criador) {
      try {
        const rCriador = await axios.get(`${AUTH_URL}/auth/utilizadores/${encodeURIComponent(inquiricao.criador)}`);
        criadorInfo = rCriador.data;
      } catch (_) {}
    }

    res.render('inquiricoes/detalhe', {
      title: rInq.data.titulo,
      date,
      inquiricao,
      posts: rPosts.data.dados,
      criadorInfo,
      erro
    });
  }
  catch (err) {
    next(err);
  }
});


// ------------------------------------------------- Estatísticas ------------------------------------------------- //


router.get('/stats', async (req, res, next) => {
  try {
    const date = new Date().toLocaleString('pt-PT', { hour12: false });
    const r = await axios.get(`${API_URL}/inquiricoes/stats`);
    res.render('stats', { title: 'Estatísticas', date, stats: r.data });
  }
  catch (err) { next(err); }
});

// Proxy do drill-down de séculos (stats.js cliente chama via fetch)
router.get('/stats/seculo/:sec', async (req, res, next) => {
  try {
    const r = await axios.get(`${API_URL}/inquiricoes/stats/seculo/${req.params.sec}`);
    res.json(r.data);
  }
  catch (err) { next(err); }
});


// ------------------------------------------------- Import ------------------------------------------------- //


const multerJson = require('multer')({
  storage: require('multer').memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json'))
      cb(null, true);
    else
      cb(new Error('Apenas ficheiros .json são aceites'));
  }
});

router.get('/import', (req, res) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador')
    return res.redirect('/login');
  const date = new Date().toLocaleString('pt-PT', { hour12: false });
  res.render('import', { title: 'Importar Registos', date, relatorio: null, erro: null });
});

router.post('/import', multerJson.single('ficheiro'), async (req, res, next) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador')
    return res.redirect('/login');
  const date = new Date().toLocaleString('pt-PT', { hour12: false });

  try {
    if (!req.file) {
      return res.render('import', { title: 'Importar Registos', date, relatorio: null, erro: 'Nenhum ficheiro selecionado.' });
    }

    const form = new FormData();
    form.append('ficheiro', req.file.buffer, {
      filename: req.file.originalname,
      contentType: 'application/json'
    });

    const r = await axios.post(`${API_URL}/inquiricoes/import`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${req.session.token}`
      }
    });

    res.render('import', { title: 'Importar Registos', date, relatorio: r.data, erro: null });
  }
  catch (err) {
    const erro = err.response?.data?.erro || err.message;
    res.render('import', { title: 'Importar Registos', date, relatorio: null, erro });
  }
});


// ------------------------------------------------- Export ------------------------------------------------- //


// Faz proxy ao endpoint de export da API e força o download no browser do user
// Os filtros ativos na página de lista são passados como query string,
// para que o export só tenha o que estava a ser visualizado
router.get('/export', async (req, res, next) => {
  try {
    const formato = req.query.formato || 'json';

    const params = new URLSearchParams(req.query).toString();
    const r = await axios.get(`${API_URL}/inquiricoes/export?${params}`, { responseType: 'arraybuffer' }); // preserver encoding correto

    res.setHeader('Content-Type', r.headers['content-type']);
    res.setHeader('Content-Disposition', r.headers['content-disposition']);
    res.send(r.data);
  }
  catch (err) {
    next(err);
  }
});


// ------------------------------------------------- Índices ------------------------------------------------- //


router.get('/indice/nomes', async (req, res, next) => {
  try {
    const date = new Date().toLocaleString('pt-PT', { hour12: false });
    const r = await axios.get(`${API_URL}/inquiricoes/indice/nomes`);
    res.render('indices/nomes', { title: 'Índice Antroponímico', date, nomes: r.data });
  }
  catch (err) {
    next(err);
  }
});

router.get('/indice/lugares', async (req, res, next) => {
  try {
    const date = new Date().toLocaleString('pt-PT', { hour12: false });
    const r = await axios.get(`${API_URL}/inquiricoes/indice/lugares`);
    res.render('indices/lugares', { title: 'Índice Toponímico', date, lugares: r.data });
  }
  catch (err) {
    next(err);
  }
});

router.get('/indice/datas', async (req, res, next) => {
  try {
    const date = new Date().toLocaleString('pt-PT', { hour12: false });
    const r = await axios.get(`${API_URL}/inquiricoes/indice/datas`);
    res.render('indices/datas', { title: 'Índice Cronológico', date, anos: r.data });
  }
  catch (err) {
    next(err);
  }
});


// ------------------------------------------------- Edições ------------------------------------------------- //


// Editar registo (admin only)
router.get('/inquiricoes/:proc_numero/editar', async (req, res, next) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador') return res.redirect('/login');
  try {
    const date = new Date().toLocaleString('pt-PT', { hour12: false });
    const r = await axios.get(`${API_URL}/inquiricoes/${req.params.proc_numero}`);
    res.render('inquiricoes/form', { title: 'Editar Registo', date, inquiricao: r.data, erro: null });
  }
  catch (err) {
    next(err);
  }
});

router.post('/inquiricoes/:proc_numero/editar', async (req, res, next) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador') return res.redirect('/login');
  const proc_numero = req.params.proc_numero;
  const date = new Date().toLocaleString('pt-PT', { hour12: false });
  try {
    await axios.put(`${API_URL}/inquiricoes/${proc_numero}`, req.body, { headers: authHeader(req) });
    res.redirect(`/inquiricoes/${proc_numero}`);
  }
  catch (err) {
    res.render('inquiricoes/form', {
      title: 'Editar Registo', date, inquiricao: { ...req.body, proc_numero },
      erro: err.response?.data?.erro || 'Erro ao atualizar registo'
    });
  }
});

// Apagar registo (admin only)
router.post('/inquiricoes/:proc_numero/apagar', async (req, res) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador') return res.redirect('/login');
  try {
    await axios.delete(`${API_URL}/inquiricoes/${req.params.proc_numero}`, { headers: authHeader(req) });
    res.redirect('/inquiricoes');
  }
  catch (err) {
    req.session.erro = err.response?.data?.erro || 'Erro ao apagar registo';
    req.session.save(() => res.redirect(`/inquiricoes/${req.params.proc_numero}`));
  }
})

// Apagar post (admin only)
router.post('/posts/:id/apagar', async (req, res) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador') return res.redirect('/login');
  const proc_numero = req.body.proc_numero;
  try {
    await axios.delete(`${API_URL}/posts/${req.params.id}`, { headers: authHeader(req) });
    delete req.session.erro;
  }
  catch (err) {
    req.session.erro = err.response?.data?.erro || 'Erro ao apagar post';
  }
  req.session.save(() => res.redirect(`/inquiricoes/${proc_numero}`));
});

// Apagar comentário (admin only)
router.post('/posts/:id/comentarios/:comentarioId/apagar', async (req, res) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador') return res.redirect('/login');
  const proc_numero = req.body.proc_numero;
  try {
    await axios.delete(`${API_URL}/posts/${req.params.id}/comentarios/${req.params.comentarioId}`, { headers: authHeader(req) });
    delete req.session.erro;
  }
  catch (err) {
    req.session.erro = err.response?.data?.erro || 'Erro ao apagar comentário';
  }
  req.session.save(() => res.redirect(`/inquiricoes/${proc_numero}`));
});


// ------------------------------------------------- Posts ------------------------------------------------- //


router.post('/inquiricoes/:proc_numero/posts', async (req, res, next) => {
  const proc_numero = req.params.proc_numero;
  try {
    await axios.post(
      `${API_URL}/inquiricoes/${proc_numero}/posts`,
      req.body,
      { headers: authHeader(req) }
    );
    delete req.session.erro;
  }
  catch (err) {
    req.session.erro = err.response?.data?.erro || 'Erro ao publicar post';
  }
  req.session.save(() => res.redirect(`/inquiricoes/${proc_numero}`));
});

router.post('/posts/:id/comentarios', async (req, res, next) => {
  const proc_numero = req.body.proc_numero;
  try {
    await axios.post(
      `${API_URL}/posts/${req.params.id}/comentarios`,
      { texto: req.body.texto },
      { headers: authHeader(req) }
    );
    delete req.session.erro;
  }
  catch (err) {
    req.session.erro = err.response?.data?.erro || 'Erro ao adicionar comentário';
  }
  req.session.save(() => {
    if (proc_numero) res.redirect(`/inquiricoes/${proc_numero}`);
    else res.redirect('/inquiricoes');
  });
});


// ------------------------------------------------- Sugestões ------------------------------------------------- //


router.get('/sugestoes', async (req, res, next) => {
  if (!req.session.utilizador) return res.redirect('/login');
  const date = new Date().toLocaleString('pt-PT', { hour12: false });
  const erro = req.session.erro || null;
  delete req.session.erro;

  let sugestoes = [];
  if (req.session.utilizador.nivel === 'administrador') {
    try {
      const r = await axios.get(`${API_URL}/sugestoes`, { headers: authHeader(req) });
      sugestoes = r.data.dados;
    }
    catch (err) { /* ignora erros de listagem */ }
  }
  req.session.save(() => {
    res.render('sugestoes', { title: 'Caixa de Sugestoes', date, sugestoes, erro });
  });
});

router.post('/sugestoes', async (req, res) => {
  if (!req.session.utilizador) return res.redirect('/login');
  try {
    await axios.post(`${API_URL}/sugestoes`, req.body, { headers: authHeader(req) });
    delete req.session.erro;
  }
  catch (err) {
    req.session.erro = err.response?.data?.erro || 'Erro ao enviar sugestão';
  }
  req.session.save(() => res.redirect('/sugestoes'));
});

router.post('/sugestoes/:id/apagar', async (req, res) => {
  if (!req.session.utilizador || req.session.utilizador.nivel !== 'administrador') return res.redirect('/login');
  try {
    await axios.delete(`${API_URL}/sugestoes/${req.params.id}`, { headers: authHeader(req) });
    delete req.session.erro;
  }
  catch (err) {
    req.session.erro = err.response?.data?.erro || 'Erro ao apagar sugestão';
  }
  req.session.save(() => res.redirect('/sugestoes'));
});


// ------------------------------------------------- Perfil ------------------------------------------------- //


router.get('/perfil', (req, res) => {
  if (!req.session.utilizador) return res.redirect('/login');
  res.redirect('/utilizadores/' + req.session.utilizador.username);
});

router.post('/perfil', async (req, res, next) => {
  if (!req.session.utilizador) return res.redirect('/login');
  try {
    await axios.patch(`${AUTH_URL}/auth/perfil`, { bio: req.body.bio }, {
      headers: { Authorization: `Bearer ${req.session.token}` }
    });
    req.session.perfilSucesso = 'Biografia atualizada com sucesso!';
    req.session.perfilErro = null;
  }
  catch (err) {
    req.session.perfilSucesso = null;
    req.session.perfilErro = err.response?.data?.erro || `Erro ao guardar a biografia (${err.message})`;
  }
  req.session.save(() => res.redirect('/perfil'));
});

router.post('/perfil/foto', uploadTemp.single('foto'), async (req, res, next) => {
  if (!req.session.utilizador) return res.redirect('/login');
  try {
    if (!req.file) {
      req.session.perfilErro = 'Nenhum ficheiro selecionado.';
      return req.session.save(() => res.redirect('/utilizadores/' + req.session.utilizador.username));
    }

    // Enviar o ficheiro para a Auth como multipart
    const form = new FormData();
    form.append('foto', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const patchResp = await axios.post(`${AUTH_URL}/auth/perfil/foto`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${req.session.token}`,
      },
    });

    const urlFoto = patchResp.data.fotoPerfil;
    req.session.utilizador = { ...req.session.utilizador, fotoPerfil: urlFoto };
    req.session.perfilSucesso = 'Foto de perfil atualizada com sucesso!';
    req.session.perfilErro = null;
  }
  catch (err) {
    req.session.perfilSucesso = null;
    req.session.perfilErro = err.response?.data?.erro || `Erro ao atualizar a foto (${err.message})`;
  }
  req.session.save(() => res.redirect('/utilizadores/' + req.session.utilizador.username));
});

// Perfil público de outro utilizador -- se for o próprio, mostra edição
router.get('/utilizadores/:username', async (req, res, next) => {
  try {
    const date = new Date().toLocaleString('pt-PT', { hour12: false });
    const rUser = await axios.get(`${AUTH_URL}/auth/utilizadores/${encodeURIComponent(req.params.username)}`);
    const user = rUser.data;

    const isDono = req.session.utilizador?.username === user.username;

    // Se for o dono, buscar dados privados (email, último acesso)
    if (isDono) {
      try {
        const perfilCompleto = await axios.get(`${AUTH_URL}/auth/perfil`, {
          headers: { Authorization: `Bearer ${req.session.token}` }
        });
        Object.assign(user, perfilCompleto.data);
        // Corrigir path antigo se necessário
        // Isto foi meio necessário devido ter-mos mudado a implementação a meio, estava a dar alguns problemas
        if (user.fotoPerfil && user.fotoPerfil.includes('/uploads/perfil/')) {
          user.fotoPerfil = user.fotoPerfil.replace('/uploads/perfil/', '/uploads/perfis/');
          axios.patch(`${AUTH_URL}/auth/perfil`, { fotoPerfil: user.fotoPerfil }, {
            headers: { Authorization: `Bearer ${req.session.token}` }
          }).catch(() => {});
        }
      } catch (_) {}
    }

    let contribuicoes = null;
    try {
      const rContrib = await axios.get(`${API_URL}/inquiricoes/utilizador/${encodeURIComponent(user.username)}/total`);
      contribuicoes = rContrib.data.total;
    } catch (_) {}

    const sucesso = isDono ? (req.session.perfilSucesso || null) : null;
    const erro    = isDono ? (req.session.perfilErro    || null) : null;
    if (isDono) {
      delete req.session.perfilSucesso;
      delete req.session.perfilErro;
    }

    req.session.save(() => {
      res.render('perfil', {
        title: isDono ? 'O Meu Perfil' : `Perfil de @${user.username}`,
        date, user, contribuicoes, sucesso, erro, isDono
      });
    });
  }
  catch (err) {
    if (err.response?.status === 404) {
      const date = new Date().toLocaleString('pt-PT', { hour12: false });
      return res.status(404).render('error', { title: 'Utilizador não encontrado', date, message: 'Utilizador não encontrado', error: {} });
    }
    next(err);
  }
});


// ------------------------------------------------- Autenticação ------------------------------------------------- //


router.get('/login', (req, res) => {
  const date = new Date().toLocaleString('pt-PT', { hour12: false });
  res.render('auth/login', { title: 'Login', date, erro: null });
});

router.post('/login', async (req, res) => {
  const date = new Date().toLocaleString('pt-PT', { hour12: false });
  try {
    const r = await axios.post(`${AUTH_URL}/auth/login`, req.body);
    req.session.token = r.data.token;

    // Buscar dados do utilizador
    const perfil = await axios.get(`${AUTH_URL}/auth/perfil`, {
      headers: { Authorization: `Bearer ${r.data.token}` }
    });
    const u = perfil.data;
    req.session.utilizador = {
      id: String(u._id),
      username: u.username,
      email: u.email,
      nivel: u.nivel,
      filiacao: u.filiacao
    }
    res.redirect('/');
  }
  catch (err) {
    res.render('auth/login', {
      title: 'Login', date,
      erro: err.response?.data?.erro || 'Erro ao fazer login'
    });
  }
});

router.get('/registo', (req, res) => {
  const date = new Date().toLocaleString('pt-PT', { hour12: false });
  res.render('auth/registo', { title: 'Registo', date, erro: null });
});

router.post('/registo', async (req, res) => {
  const date = new Date().toLocaleString('pt-PT', { hour12: false });

  if (req.body.password !== req.body.confirmar_password) {
    return res.render('auth/registo', {
      title: 'Registo', date,
      erro: 'As palavras-passe não coincidem.',
      valores: req.body
    });
  }

  try {
    await axios.post(`${AUTH_URL}/auth/registo`, req.body);
    res.redirect('/login');
  }
  catch (err) {
    res.render('auth/registo', {
      title: 'Registo', date,
      erro: err.response?.data?.erro || 'Erro ao registar',
      valores: req.body
    });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;