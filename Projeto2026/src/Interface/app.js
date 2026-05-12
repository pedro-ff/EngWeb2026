var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');

var indexRouter = require('./routes/index');

var app = express();

const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3002';

// Proxy de /uploads/ → Auth server (as fotos de perfil são servidas pela Auth)
app.use('/uploads', async (req, res) => {
  try {
    const axios = require('axios');
    const targetUrl = `${AUTH_URL}/uploads${req.path}`;
    const response = await axios.get(targetUrl, { responseType: 'stream' });
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    if (err.response?.status === 404) return res.status(404).send('Not found');
    res.status(502).send('Bad gateway');
  }
}); 

app.use(session({
  secret: 'EngWeb2026',
  resave: false,
  saveUninitialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  var date = new Date().toLocaleString('pt-PT', { hour12: false });
  res.render('error',{title: "Erro", date: date, error: err});
});

module.exports = app;