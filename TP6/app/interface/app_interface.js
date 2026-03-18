const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Configurações do Express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public'));

// URL da API
const API_URL = process.env.API_URL || "http://localhost:7789";

// Home Page
app.get('/', function(req, res, next) {
  var d = new Date().toISOString().substring(0, 16)
  res.render('index', {date: d})
});

// Página de filmes
app.get('/filmes', (req, res) => {
    const d = new Date().toISOString().substring(0, 16);

    axios.get(API_URL + '/filmes?_sort=id')
        .then(response => {
            res.render('filmes', {
                filmes: response.data,
                date: d
            });
        })
        .catch(err => {
            res.render('error', {
                error: err,
                message: "Erro ao obter dados da API"
            });
        });
});

// Página de filme especifico
app.get('/filmes/:id', (req, res) => {
    const d = new Date().toISOString().substring(0, 16);
    axios.get(`${API_URL}/filmes/${req.params.id}`)
        .then(response => {
            res.render('filme', {
                f: response.data,
                date: d
            });
        })
        .catch(err => {
            res.render('error', {
                error: err,
                message: "Filme não encontrado"
            });
        });
});

// Página de atores
app.get('/atores', (req, res) => {
    const d = new Date().toISOString().substring(0, 16);

    axios.get(API_URL + '/atores?_sort=_id')
        .then(response => {
            res.render('atores', {
                atores: response.data,
                date: d
            });
        })
        .catch(err => {
            res.render('error', {
                error: err,
                message: "Erro ao obter dados da API"
            });
        });
});

// Página de ator especifico
app.get('/atores/:id', (req, res) => {
    const d = new Date().toISOString().substring(0, 16);
    axios.get(`${API_URL}/atores/${req.params.id}`)
        .then(response => {
            res.render('ator', {
                a: response.data,
                date: d
            });
        })
        .catch(err => {
            res.render('error', {
                error: err,
                message: "Ator não encontrado"
            });
        });
});

// Página de géneros
app.get('/generos', (req, res) => {
    const d = new Date().toISOString().substring(0, 16);

    axios.get(API_URL + '/generos?_sort=name')
        .then(response => {
            res.render('generos', {
                generos: response.data,
                date: d
            });
        })
        .catch(err => {
            res.render('error', {
                error: err,
                message: "Erro ao obter dados da API"
            });
        });
});

// Página de género específico
app.get('/generos/:id', (req, res) => {
    const d = new Date().toISOString().substring(0, 16);
    axios.get(`${API_URL}/generos/${req.params.id}`)
        .then(response => {
            res.render('genero', {
                g: response.data,
                date: d
            });
        })
        .catch(err => {
            res.render('error', {
                error: err,
                message: "Género não encontrado"
            });
        });
});

const PORT = 7790;
app.listen(PORT, () => {
    console.log(`Servidor da interface em http://localhost:${PORT}`);
});