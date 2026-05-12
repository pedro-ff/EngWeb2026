const express = require('express');
const router = express.Router();
const sugestaoController = require('../controllers/sugestoes');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Listar todas (apenas admin)
router.get('/', verifyToken, isAdmin, sugestaoController.listar);

// Criar sugestão (qualquer utilizador autenticado -- mesmo admins)
router.post('/', verifyToken, sugestaoController.criar);

// Apagar sugestão (apenas admin)
router.delete('/:id', verifyToken, isAdmin, sugestaoController.apagar);

module.exports = router;