var createError = require('http-errors');
var express = require('express');
const mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const inquiricoesRouter = require('./routes/inquiricoes');
const postsRouter = require('./routes/posts');
const sugestoesRouter = require('./routes/sugestoes');

var app = express();
app.use(express.json());

// ------------------------------ Ligação ao mongoDB ------------------------------ //

var mongoDB = process.env.MONGO_URI || 'mongodb://localhost:27017/inquiricoes_db';
mongoose.connect(mongoDB)
    .then(() => console.log(`MongoDB: liguei-me à base de dados ${mongoDB}.`))
    .catch(err => console.error('Erro:', err));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ estado: 'ok' }));

app.use('/inquiricoes', inquiricoesRouter);
app.use('/posts', postsRouter);
app.use('/sugestoes', sugestoesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    erro: err.message,
    detalhe: req.app.get('env') === 'development' ? err.stack : undefined
  });
});

module.exports = app;