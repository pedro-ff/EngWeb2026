const express = require('express')
const router = express.Router()
const multer = require('multer');
const inquiricaoController = require('../controllers/inquiricoes')
const { postController } = require('../controllers/posts')
const { verifyToken, isAdmin } = require('../middleware/auth');


const uploadJson = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json'))
            cb(null, true);
        else
            cb(new Error('Apenas ficheiros .json são aceites'));
    }
});

// ----------------------------------------- Índices (em primeiro para evitar colisões) ----------------------------------------- //

// Lista de requerentes únicos (A-Z)
router.get('/indice/nomes', inquiricaoController.indiceNomes);

// Lista de concelhos/distritos únicos
router.get('/indice/lugares', inquiricaoController.indiceLugares);

// Lista de anos únicos
router.get('/indice/datas', inquiricaoController.indiceDatas);

// ----------------------------------------- Contribuições ----------------------------------------- //

// Contar contribuições de um utilizador
router.get('/contribuicoes/:username', inquiricaoController.contarContribuicoes);

// ----------------------------------------- CRUD sobre inquirições ----------------------------------------- //

// Exportar; deve ficar antes de /:proc_numero para evitar colisão
// Suporta ?formato=json|csv e os mesmos filtros do listar
router.get('/export', inquiricaoController.exportar);

// Importar; apenas admins
// Recebe multipart/form-data com campo "ficheiro" (.json)
router.post('/import', verifyToken, isAdmin, uploadJson.single('ficheiro'), inquiricaoController.importar);

// Estatísticas globais por século; antes de /:proc_numero para evitar colisão
router.get('/stats', inquiricaoController.stats);
router.get('/stats/seculo/:sec', inquiricaoController.statsPorSeculo);

// Listar inquirições (suporta ?requerente= &concelho= &ano= &pagina= &limite=)
router.get('/', inquiricaoController.listarTodasInquiricoes);

// Consultar uma inquirição
router.get('/:proc_numero', inquiricaoController.obterInquiricao);

// Nova inquirição (apenas para admins)
router.post('/', verifyToken, isAdmin, inquiricaoController.criarInquiricao);

// Alterar uma inquirição (apenas para admins)
router.put('/:proc_numero', verifyToken, isAdmin, inquiricaoController.atualizarInquiricao);

// Apagar uma inquirição (apenas para admins)
router.delete('/:proc_numero', verifyToken, isAdmin, inquiricaoController.apagarInquiricao);


// ----------------------------------------- Posts (de uma inquirição) ----------------------------------------- //

// Listar posts
router.get('/:proc_numero/posts', postController.listarPorInquiricao);

// Criar post (requer login)
router.post('/:proc_numero/posts', verifyToken, postController.criarPost);

// ----------------------------------------- Relações genealógicas ----------------------------------------- //

// Adicionar relação entre dois registos (requer login)
router.post('/:proc_numero/relacoes/:proc_relacionado', verifyToken, inquiricaoController.adicionarRelacao);

// Remover relação entre dois registos (requer login)
router.delete('/:proc_numero/relacoes/:proc_relacionado', verifyToken, inquiricaoController.removerRelacao);

module.exports = router;