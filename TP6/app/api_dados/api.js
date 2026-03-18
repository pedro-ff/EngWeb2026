const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// O meu logger
app.use(function(req, res, next){
    var d = new Date().toISOString().substring(0, 16)
    console.log(req.method + " " + req.url + " " + d)
    next()
})

// 1. Conexão ao MongoDB
const nomeBD = "cinema"
const mongoHost = process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`

async function connectWithRetry(retries = 10, delay = 3000) {
    for (let i = 1; i <= retries; i++) {
        try {
            await mongoose.connect(mongoHost);
            console.log(`MongoDB: liguei-me à base de dados ${nomeBD}.`);
            return;
        } catch (err) {
            console.error(`Tentativa ${i}/${retries} falhou: ${err.message}`);
            if (i < retries) await new Promise(r => setTimeout(r, delay));
        }
    }
    console.error('Não foi possível ligar ao MongoDB. A sair.');
    process.exit(1);
}
connectWithRetry();

// 2. Esquemas flexíveis para as 3 coleções
const filmesSchema = new mongoose.Schema({ _id: String }, { strict: false, collection: 'filmes', versionKey: false });
const Filme = mongoose.model('Filme', filmesSchema);

const atoresSchema = new mongoose.Schema({ _id: String }, { strict: false, collection: 'atores', versionKey: false });
const Ator = mongoose.model('Ator', atoresSchema);

const generosSchema = new mongoose.Schema({ _id: String }, { strict: false, collection: 'generos', versionKey: false });
const Genero = mongoose.model('Genero', generosSchema);

// 3. Rotas CRUD
const router = express.Router();

// GET /filmes
router.get('/filmes', async (req, res) => {
	try {
		let queryObj = { ...req.query };

       		// Extração de parâmetros especiais
        	const searchTerm = queryObj.q;
        	const fields = queryObj._select;
        	const sortField = queryObj._sort;
        	const order = queryObj._order === 'desc' ? -1 : 1;

        	// Limpeza do objeto de query para não filtrar por parâmetros de controlo
        	delete queryObj.q;
        	delete queryObj._select;
        	delete queryObj._sort;
        	delete queryObj._order;

        	let mongoQuery = {};
        	let projection = {};
        	let mongoSort = {};

        	// Configuração da Pesquisa de Texto
        	if (searchTerm) {
            		mongoQuery = { $text: { $search: searchTerm } };
            		projection.score = { $meta: "textScore" };
            		mongoSort = { score: { $meta: "textScore" } };
        	} else {
            		mongoQuery = queryObj;
        	}

        	// Configuração da Projeção (_select)
        	if (fields) {
            		// Converte "title,year" em { title: 1, year: 1 }
            		fields.split(',').forEach(f => {
                	projection[f.trim()] = 1;
            		});
        	}

        	// Execução da Query
        	let execQuery = Filme.find(mongoQuery, projection);

        	// Prioridade de ordenação: _sort manual ou textScore se houver pesquisa
        	if (sortField) {
            		execQuery = execQuery.sort({ [sortField]: order });
        	} else if (searchTerm) {
            		execQuery = execQuery.sort(mongoSort);
        	}

        	const filmes = await execQuery.exec();
        	res.json(filmes);
	}
	catch (erro) {
		res.status(500).json({ error: erro.message });
	}
});

// GET /filmes/:id
router.get('/filmes/:id', async (req, res) => {
	try {
		const filme = await Filme.findOne({ _id: req.params.id });
		if (!filme) return res.status(404).json({ error: "Filme não encontrado" });
		res.json(filme);
	}
	catch (erro) {
		res.status(400).json({ error: "ID de filme inválido" });
	}
});

// GET /atores
router.get('/atores', async (req, res) => {
	try {
		let queryObj = { ...req.query };
		const fields = queryObj._select;
		const sortField = queryObj._sort;
		const order = queryObj._order === 'desc' ? -1 : 1;

		delete queryObj._select;
		delete queryObj._sort;
		delete queryObj._order;

		let projection = {};
		if (fields) {
			fields.split(',').forEach(f => projection[f.trim()] = 1);
		}

		let execQuery = Ator.find(queryObj, projection);

		if (sortField) {
			execQuery = execQuery.sort({ [sortField]: order });
		} else {
			execQuery = execQuery.sort({ _id: 1 });
		}

		const atores = await execQuery.exec();
		res.json(atores);
	}
	catch (erro) {
		res.status(500).json({ error: erro.message });
	}
});

// GET /atores/:id
router.get('/atores/:id', async (req, res) => {
	try {
		const ator = await Ator.findOne({ _id: req.params.id });
		if (!ator) return res.status(404).json({ error: "Ator não encontrado" });
		res.json(ator);
	}
	catch (erro) {
		res.status(400).json({ error: "ID de ator inválido" });
	}
});

// GET /generos
router.get('/generos', async (req, res) => {
	try {
		let queryObj = { ...req.query };
		const fields = queryObj._select;
		const sortField = queryObj._sort;
		const order = queryObj._order === 'desc' ? -1 : 1;

		delete queryObj._select;
		delete queryObj._sort;
		delete queryObj._order;

		let projection = {};
		if (fields) {
			fields.split(',').forEach(f => projection[f.trim()] = 1);
		}

		let execQuery = Genero.find(queryObj, projection);

		if (sortField) {
			execQuery = execQuery.sort({ [sortField]: order });
		} else {
			execQuery = execQuery.sort({ name: 1 });
		}

		const generos = await execQuery.exec();
		res.json(generos);
	}
	catch (erro) {
		res.status(500).json({ error: erro.message });
	}
});

// GET /generos/:id
router.get('/generos/:id', async (req, res) => {
	try {
		const genero = await Genero.findOne({ _id: req.params.id });
		if (!genero) return res.status(404).json({ error: "Género não encontrado" });
		res.json(genero);
	}
	catch (erro) {
		res.status(400).json({ error: "ID de género inválido" });
	}
});

app.use('/', router)
app.listen(7789, () => console.log("API minimalista disponível em http://localhost:7789..."));