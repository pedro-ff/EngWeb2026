const Post = require('../models/post');
const Inquiricao = require('../models/inquiricao');


// -------------------------------------- Posts -------------------------------------- //
const postController = {

    // Todos os posts - com paginação
    listarTodosPosts: async function (req, res) {
        try {
            const pagina = parseInt(req.query.pagina) || 1;
            const limite = parseInt(req.query.limite) || 20;
            const skip = (pagina - 1) * limite;

            const [dados, total] = await Promise.all([
                Post.find().sort({ data: -1 }).skip(skip).limit(limite),
                Post.countDocuments()
            ]);

            res.json({ total, pagina, limite, dados });
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    obterPost: async function (req, res) {
        try {
            const post = await Post.findById(req.params.id);

            if (!post) return res.status(404).json({ erro: 'Post não encontrado...' });
            res.json(post);
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    // Posts de uma inquirição
    listarPorInquiricao: async function (req, res) {
        try {
            const proc_numero = parseInt(req.params.proc_numero);

            const [dados, total] = await Promise.all([
                Post.find({ proc_numero }).sort({ data: -1 }),
                Post.countDocuments({ proc_numero })
            ]);

            res.json({ total, proc_numero, dados });
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    // Criar post numa inquirição
    criarPost: async function (req, res) {
        try {
            const proc_numero = parseInt(req.params.proc_numero);

            // Verificar se o post existe
            const inquiricao = await Inquiricao.findOne({ proc_numero });
            if (!inquiricao) return res.status(404).json({ erro: 'Inquirição não encontrada...' });

            const { titulo, corpo } = req.body;
            const autor_id = req.utilizador.id;
            const autor_username = req.utilizador.username;

            if (!titulo || !corpo)
                return res.status(400).json({ erro: 'Os campos título e corpo são obrigatórios' });

            const post = new Post({ proc_numero, titulo, corpo, autor_id, autor_username });
            const resultado = await post.save();
            res.status(201).json(resultado);
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    // Apenas disponível para admins
    apagarPost: async function (req, res) {
        try {
            const post = await Post.findByIdAndDelete(req.params.id);
            if (!post) return res.status(404).json({ erro: 'Post não encontrado...' });
            res.status(204).send();
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    }
}

// -------------------------------------- Comentários -------------------------------------- //
const comentarioController = {

    adicionarComentario: async function (req, res) {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ erro: 'Post não encontrado...' });

            const { texto } = req.body;
            const autor_id = req.utilizador.id;
            const autor_username = req.utilizador.username;

            if (!texto)
                return res.status(400).json({ erro: 'O campo texto é obrigatório' });

            post.comentarios.push({ autor_id, autor_username, texto });
            await post.save();

            res.status(201).json(post);
        }
        catch (err) {
            res.status(400).json({ erro: err.message });
        }
    },

    // Apenas para admins
    apagarComentario: async function (req, res) {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ erro: 'Post não encontrado...' });

            const comentario = post.comentarios.id(req.params.comentarioId);
            if (!comentario) return res.status(404).json({ erro: 'Comentário não encontrado...' });

            comentario.deleteOne();
            await post.save();
            res.status(204).send();
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    }
}

module.exports = {
    postController,
    comentarioController
};