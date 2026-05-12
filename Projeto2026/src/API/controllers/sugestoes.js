const Sugestao = require('../models/sugestao');

const sugestaoController = {

    listar: async function (req, res) {
        try {
            const dados = await Sugestao.find().sort({ data: -1 });
            res.json({ total: dados.length, dados });
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    criar: async function (req, res) {
        try {
            const { texto } = req.body;
            if (!texto || !texto.trim())
                return res.status(400).json({ erro: 'O campo texto é obrigatório' });

            const sugestao = new Sugestao({
                autor_id:       req.utilizador.id,
                autor_username: req.utilizador.username,
                texto:          texto.trim()
            });
            const resultado = await sugestao.save();
            res.status(201).json(resultado);
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    apagar: async function (req, res) {
        try {
            const doc = await Sugestao.findByIdAndDelete(req.params.id);
            if (!doc) return res.status(404).json({ erro: 'Sugestão não encontrada...' });
            res.status(204).send();
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    }
};

module.exports = sugestaoController;