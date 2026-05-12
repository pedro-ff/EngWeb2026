const express = require('express');
const router = express.Router();
const { postController, comentarioController } = require('../controllers/posts');
const { verifyToken, isAdmin } = require('../middleware/auth');


// ----------------------------------------- Posts ----------------------------------------- //

// Listar posts
router.get('/', postController.listarTodosPosts);

// Consultar um post
router.get('/:id', postController.obterPost);

// Apagar um post -- apenas para admins
router.delete('/:id', verifyToken, isAdmin, postController.apagarPost);


// ----------------------------------------- Comentários ----------------------------------------- //

// Adicionar comentário (requer login)
router.post('/:id/comentarios', verifyToken, comentarioController.adicionarComentario);

// Apagar comentário -- apenas para admins
router.delete('/:id/comentarios/:comentarioId', verifyToken, isAdmin, comentarioController.apagarComentario);

module.exports = router;