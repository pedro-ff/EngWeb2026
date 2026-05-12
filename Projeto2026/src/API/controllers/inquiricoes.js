const Inquiricao = require('../models/inquiricao');

// Converter números em romanos
function romanizar(n) {
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
    let result = '';
    for (let i = 0; i < vals.length; i++) {
        while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
    }
    return result;
}

const inquiricaoController = {

    // Listar todos com filtros opcionais - com paginação
    listarTodasInquiricoes: async function (req, res) {
        try {
            const pagina = parseInt(req.query.pagina) || 1;
            const limite = parseInt(req.query.limite) || 20;
            const skip = (pagina - 1) * limite;

            const filtro = {};

            // Índice antroponímico -- nome
            if (req.query.requerente)
                filtro.requerente = { $regex: req.query.requerente, $options: 'i' };
            if (req.query.pai)
                filtro.pai = { $regex: req.query.pai, $options: 'i' };
            if (req.query.mae)
                filtro.mae = { $regex: req.query.mae, $options: 'i' };

            // Índice toponímico -- lugar
            if (req.query.freguesia)
                filtro.freguesia = { $regex: req.query.freguesia, $options: 'i' };
            if (req.query.concelho)
                filtro.concelho = { $regex: req.query.concelho, $options: 'i' };
            if (req.query.distrito)
                filtro.distrito = { $regex: req.query.distrito, $options: 'i' };

            // Índice cronológico -- ano
            if (req.query.ano)
                filtro.data_inicial = { $regex: `^${req.query.ano}` };

            // Pesquisa de texto livre
            if (req.query.texto)
                filtro.$text = { $search: req.query.texto };

            const [dados, total] = await Promise.all([
                Inquiricao.find(filtro).skip(skip).limit(limite).sort({ data_inicial: 1 }),
                Inquiricao.countDocuments(filtro)
            ]);

            res.json({ total, pagina, limite, dados });
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    obterInquiricao: async function (req, res) {
        try {
            const doc = await Inquiricao.findOne({ proc_numero: req.params.proc_numero });
            if (!doc) return res.status(404).json({ erro: 'Registo não encontrado...' });
            res.json(doc);
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    criarInquiricao: async function (req, res) {
        try {
            const dados = { ...req.body, criador: req.utilizador?.username || req.body.criador };
            const doc = new Inquiricao(dados);
            const resultado = await doc.save();
            res.status(201).json(resultado);
        }
        catch (err) {
            res.status(400).json({ erro: err.message });
        }
    },

    atualizarInquiricao: async function (req, res) {
        try {
            // Não se deixa o form principal sobrescrever as relações
            const { relacoes, ...campos } = req.body;

            const doc = await Inquiricao.findOneAndUpdate(
                { proc_numero: req.params.proc_numero },
                { $set: campos },
                { new: true }
            );
            if (!doc) return res.status(404).json({ erro: 'Registo não encontrado...' });
            res.json(doc);
        }
        catch (err) {
            res.status(400).json({ erro: err.message });
        }
    },

    apagarInquiricao: async function (req, res) {
        try {
            const doc = await Inquiricao.findOneAndDelete({ proc_numero: req.params.proc_numero });
            if (!doc) return res.status(404).json({ erro: 'Registo não encontrado...' });
            res.status(204).send();
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

   // GET /inquiricoes/indice/nomes -- Lista de requerentes ordenados por ordem alfabética
    indiceNomes: async function (req, res) {
        try {
            const nomes = await Inquiricao.aggregate([
                { $match: { requerente: { $exists: true, $ne: null } } },
                { $group: { _id: '$requerente' } },
                { $sort: { _id: 1 } },
                { $project: { _id: 0, nome: '$_id' } }
            ]);
            res.json(nomes.map(n => n.nome));
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

   // GET /inquiricoes/indice/lugares -- Lista de concelhos/distritos únicos
    indiceLugares: async function (req, res) {
        try {
            const [concelhos, distritos] = await Promise.all([
                Inquiricao.aggregate([
                    { $match: { concelho: { $exists: true, $ne: null } } },
                    { $group: { _id: '$concelho' } },
                    { $sort: { _id: 1 } },
                    { $project: { _id: 0, lugar: '$_id' } }
                ]),
                Inquiricao.aggregate([
                    { $match: { distrito: { $exists: true, $ne: null } } },
                    { $group: { _id: '$distrito' } },
                    { $sort: { _id: 1 } },
                    { $project: { _id: 0, lugar: '$_id' } }
                ])
            ]);

            res.json({
                concelhos: concelhos.map(c => c.lugar),
                distritos: distritos.map(d => d.lugar)
            });
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

   // GET /inquiricoes/indice/datas -- Lista de anos que têm registos (e quantos são)
    indiceDatas: async function (req, res) {
        try {
            const anos = await Inquiricao.aggregate([
                { $match: { data_inicial: { $exists: true, $ne: null } } },
                { $project: { ano: { $substr: ['$data_inicial', 0, 4] } } },
                { $group: { _id: '$ano', total: { $sum: 1 } } },
                { $sort: { _id: 1 } },
                { $project: { _id: 0, ano: '$_id', total: 1 } }
            ]);
            res.json(anos);
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    // GET /inquiricoes/stats
    // Agrega todas as estatísticas num único pedido
    stats: async function (req, res) {
        try {
            const [
                total,
                porDistrito,
                porSeculo,
                topConcelhos,
                topRequerentes,
                topApelidos
            ] = await Promise.all([

                // Total de registos
                Inquiricao.countDocuments(),

                // Distribuição por distrito
                Inquiricao.aggregate([
                    { $match: { distrito: { $exists: true, $ne: null, $ne: '' } } },
                    { $group: { _id: '$distrito', total: { $sum: 1 } } },
                    { $sort: { total: -1 } }
                ]),

                // Distribuição por século (extrai-se dos 2 primeiros dígios de data_inicial)
                Inquiricao.aggregate([
                    { $match: { data_inicial: { $regex: /^\d{4}/ } } },
                    { $project: { seculo: { $toInt: { $substr: ['$data_inicial', 0, 2] } } } },
                    { $match: { seculo: { $gte: 10 } } }, // descarta anos mal formados
                    { $group: { _id: '$seculo', total: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ]),

                // Top 10 concelhos com mais registos
                Inquiricao.aggregate([
                    { $match: { concelho: { $exists: true, $ne: null, $ne: '' } } },
                    { $group: { _id: '$concelho', total: { $sum: 1 } } },
                    { $sort: { total: -1 } },
                    { $limit: 10 }
                ]),

                // Top 10 requerentes mais frequentes
                Inquiricao.aggregate([
                    { $match: { requerente: { $exists: true, $ne: null, $ne: '' } } },
                    { $group: { _id: '$requerente', total: { $sum: 1 } } },
                    { $sort: { total: -1 } },
                    { $limit: 10 }
                ]),

                // Top 20 apelidos (último token de requerente)
                Inquiricao.aggregate([
                    { $match: { requerente: { $exists: true, $ne: null, $ne: '' } } },
                    {
                        $project: {
                            apelido: {
                                $trim: {
                                    input: {
                                        $arrayElemAt: [
                                            { $split: ['$requerente', ' '] }, -1
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    { $match: { apelido: { $ne: '' } } },
                    { $group: { _id: '$apelido', total: { $sum: 1 } } },
                    { $sort: { total: -1 } },
                    { $limit: 20 }
                ])
            ]);

            res.json({
                total,
                porDistrito: porDistrito.map(d => ({ distrito: d._id, total: d.total })),
                porSeculo: porSeculo.map(s => ({ seculo: s._id, label: `Séc. ${romanizar(s._id)}`, total: s.total })),
                topConcelhos: topConcelhos.map(c => ({ concelho: c._id, total: c.total })),
                topRequerentes: topRequerentes.map(r => ({ nome: r._id, total: r.total })),
                topApelidos: topApelidos.map(a => ({ apelido: a._id, total: a.total }))
            });
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    // GET /inquiricoes/stats/seculo/:sec
    // Distribuição por década para um século
    statsPorSeculo: async function (req, res) {
        try {
            const sec = parseInt(req.params.sec);
            if (isNaN(sec) || sec < 10 || sec > 21)
                return res.status(400).json({ erro: 'Século inválido' });

            const anoMin = sec * 100;
            const anoMax = anoMin + 99;

            const decadas = await Inquiricao.aggregate([
                { $match: { data_inicial: { $regex: /^\d{4}/ } } },
                { $project: { ano: { $toInt: { $substr: ['$data_inicial', 0, 4] } } } },
                { $match: { ano: { $gte: anoMin, $lte: anoMax } } },
                { $project: { decada: { $multiply: [{ $floor: { $divide: ['$ano', 10] } }, 10] } } },
                { $group: { _id: '$decada', total: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]);

            res.json({
                seculo: sec,
                label: `Séc. ${romanizar(sec)}`,
                decadas: decadas.map(d => ({ decada: d._id, label: `${d._id}s`, total: d.total }))
            });
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    // POST /inquiricoes/import (multipart: campo "ficheiro", JSON)
    // Processo de ingestão: valida o pacote SIP e converte para AIP
    // Devolve sempre um relatório com inseridos, duplicados e erros - nunca insere parcialmente um registo corrompido
    importar: async function (req, res) {
        // Campos obrigatórios mínimos para o registo ser aceite
        const campos_obrig = ['proc_numero', 'requerente'];

        const relatorio = {
            ficheiro: req.file?.originalname || 'desconhecido',
            data_importacao: new Date().toISOString(),
            total_recebidos: 0,
            inseridos: [],
            duplicados: [],
            erros: []
        };

        try {
            // 1. Verificar se há ficheiro
            if (!req.file) {
                return res.status(400).json({ erro: 'Nenhum ficheiro recebido. Envia um ficheiro JSON no campo "ficheiro".' });
            }

            // 2. Fazer parse
            let registos;
            try {
                const conteudo = req.file.buffer.toString('utf-8');
                const parsed = JSON.parse(conteudo);

                // Aceita-se tanto arrays diretos como o formato de exportação { meta, dados }
                registos = Array.isArray(parsed) ? parsed : parsed.dados;

                if (!Array.isArray(registos)) {
                    return res.status(400).json({ erro: 'O ficheiro JSON deve conter um array de registos ou o formato de exportação { meta, dados }.' });
                }
            } catch (e) {
                return res.status(400).json({ erro: `Ficheiro JSON inválido: ${e.message}` });
            }

            relatorio.total_recebidos = registos.length;

            if (registos.length === 0) {
                return res.status(400).json({ erro: 'O ficheiro não contém registos.' });
            }

            // 3. Validar e inserir registo a registo
            for (let i = 0; i < registos.length; i++) {
                const r = registos[i];
                const ref = r.proc_numero != null ? `proc_numero ${r.proc_numero}` : `ìndice ${i}`;

                // Campos obrigatórios
                const faltam = campos_obrig.filter(c => r[c] == null || r[c] === '');
                if (faltam.length > 0) {
                    relatorio.erros.push({ ref, motivo: `Campo(s) obrigatório(s) em falta: ${faltam.join(', ')}` });
                    continue;
                }

                // proc_numero tem de ser número inteiro positivo
                const proc = parseInt(r.proc_numero);
                if (isNaN(proc) || proc <= 0) {
                    relatorio.erros.push({ ref, motivo: 'proc_numero deve ser um inteiro positivo' });
                    continue;
                }

                // Verificar duplicados
                const existente = await Inquiricao.findOne({ proc_numero: proc });
                if (existente) {
                    relatorio.duplicados.push(proc);
                    continue;
                }

                // Inserir
                try {
                    const doc = new Inquiricao({
                        ...r,
                        proc_numero: proc,
                        criador: req.utilizador?.username || 'import'
                    });
                    await doc.save();
                    relatorio.inseridos.push(proc);
                } catch (e) {
                    relatorio.erros.push({ ref, motivo: e.message });
                }
            }

            // 4. Devolver relatório completo
            const temProblemas = relatorio.erros.length > 0 || relatorio.duplicados.length > 0
            res.status(temProblemas ? 207 : 201).json(relatorio);
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    // GET /inquiricoes/export?formato=json|csv (+ mesmos filtros do listar)
    // Devolve a totalidade dos registos que correspondam aos filtros, sem paginação
    // Implementa o processo de disseminação (AIP -> DIP) do modelo OAIS
    exportar: async function (req, res) {
        try {
            const formato = (req.query.formato || 'json').toLowerCase();

            const filtro = {};

            if (req.query.requerente)
                filtro.requerente = { $regex: req.query.requerente, $options: 'i' };
            if (req.query.pai)
                filtro.pai = { $regex: req.query.pai, $options: 'i' };
            if (req.query.mae)
                filtro.mae = { $regex: req.query.mae, $options: 'i' };
            if (req.query.freguesia)
                filtro.freguesia = { $regex: req.query.freguesia, $options: 'i' };
            if (req.query.concelho)
                filtro.concelho = { $regex: req.query.concelho, $options: 'i' };
            if (req.query.distrito)
                filtro.distrito = { $regex: req.query.distrito, $options: 'i' };
            if (req.query.ano)
                filtro.data_inicial = { $regex: `^${req.query.ano}` };
            if (req.query.texto)
                filtro.$text = { $search: req.query.texto };

            // Excluir campos internos do Mongoose
            const dados = await Inquiricao
                .find(filtro)
                .select('-id -__v')
                .sort({ proc_numero: 1 })
                .lean();

            const agora = new Date();
            const timestamp = agora.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const nomeFicheiro = `inquiricoes_${timestamp}`;

            if (formato === 'csv') {
                const campos = [
                    'proc_numero', 'nivel', 'cota_completa', 'cota', 'titulo',
                    'data_inicial', 'data_final', 'repositorio', 'conteudo', 'caixa',
                    'notas_fisicas', 'material_relacionado', 'nota', 'info_processo',
                    'dimensoes', 'criador', 'data_criacao', 'hora_criacao',
                    'requerente', 'pai', 'mae', 'freguesia', 'concelho', 'distrito'
                ];

                const escaparCsv = (val) => {
                    if (val === null || val === undefined) return '';
                    const str = String(val);
                    if (str.includes(',') || str.includes('"') || str.includes('\n'))
                        return `"${str.replace(/"/g, '""')}"`;
                    return str;
                };

                const linhas = [
                    campos.join(','),
                    ...dados.map(d => campos.map(c => escaparCsv(d[c])).join(','))
                ];

                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${nomeFicheiro}.csv"`);
                return res.send('\uFEFF' + linhas.join('\r\n'));
            }

            // JSON (default)
            const pacote = {
                meta: {
                    fonte: 'Arquivo Distrital de Braga / Universidade do Minho',
                    descricao: 'Inquirições de Génere - exportação de dados',
                    data_exportacao: agora.toISOString(),
                    total_registos: dados.length,
                    filtros_aplicados: Object.keys(req.query)
                        .filter(k => k !== 'formato')
                        .reduce((acc, k) => ({ ...acc, [k]: req.query[k] }), {})
                },
                dados
            };

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${nomeFicheiro}.json"`);
            return res.json(pacote);
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    contarContribuicoes: async function (req, res) {
        try {
            const total = await Inquiricao.countDocuments({ criador: req.params.username });
            res.json({ username: req.params.username, total });
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    // POST /inquiricoes/:proc_numero/relacoes
    // Body: { proc_relacionado, nome_relacionado, relacao_requerente, relacao_relacionado }
    // Atualiza apenas um dos registos, o outro terá de ser feito manualmente
    adicionarRelacao: async function (req, res) {
        try {
            const proc_a = parseInt(req.params.proc_numero);
            const proc_b = parseInt(req.params.proc_relacionado);
            const { relacao } = req.body;

            if (!proc_b || !relacao)
                return res.status(400).json({ erro: 'Faltam campos obrigatórios (proc_relacionado, relacao)' });

            const [docA, docB] = await Promise.all([
                Inquiricao.findOne({ proc_numero: proc_a }),
                Inquiricao.findOne({ proc_numero: proc_b })
            ]);
            if (!docA) return res.status(404).json({ erro: `Registo ${proc_a} não encontrado` });
            if (!docB) return res.status(404).json({ erro: `Registo ${proc_b} não encontrado` });

            // Evitar duplicado
            docA.relacoes = (docA.relacoes || []).filter(r => r.proc_numero !== proc_b);

            docA.relacoes.push({ nome: docB.requerente, relacao, proc_numero: proc_b });
            docA.markModified('relacoes');
            await docA.save();

            res.json(docA);
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    // DELETE /inquiricoes/:proc_numero/relacoes/:proc_relacionado
    // Remove a relação de ambos os registos
    removerRelacao: async function (req, res) {
        try {
            const proc_a = parseInt(req.params.proc_numero);
            const proc_b = parseInt(req.params.proc_relacionado);

            const [docA, docB] = await Promise.all([
                Inquiricao.findOne({ proc_numero: proc_a }),
                Inquiricao.findOne({ proc_numero: proc_b })
            ]);

            if (docA) {
                docA.relacoes = (docA.relacoes || []).filter(r => r.proc_numero !== proc_b);
                docA.markModified('relacoes');
                await docA.save();
            }

            if (docB) {
                docB.relacoes = (docB.relacoes || []).filter(r => r.proc_numero !== proc_a);
                docB.markModified('relacoes');
                await docB.save();
            }

            res.status(204).send();
        }
        catch (err) {
            res.status(500).json({ erro: err.message });
        }
    }
}

module.exports = inquiricaoController