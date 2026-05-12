const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/auth');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { uploadFoto, atualizarFoto } = require('../controllers/auth');

// Rotas públicas (sem autenticação)
router.post('/registo', controller.registo);
router.post('/login', controller.login);
router.post('/logout', controller.logout);

// Verificar token — usada pela API e Interface
router.get('/verificar', controller.verificar);

// Rotas protegidas (requerem token válido)
router.get('/perfil', verifyToken, controller.perfil);
router.patch('/perfil', verifyToken, controller.atualizarPerfil);
router.post('/perfil/foto', verifyToken, uploadFoto, atualizarFoto);

// Perfil público por username (sem autenticação)
router.get('/utilizadores/:username', controller.perfilPublico);

// Rotas de administração (requerem token + nível administrador)
router.get('/utilizadores', verifyToken, isAdmin, controller.listarUtilizadores);
router.delete('/utilizadores/:id', verifyToken, isAdmin, controller.apagarUtilizador);

module.exports = router;