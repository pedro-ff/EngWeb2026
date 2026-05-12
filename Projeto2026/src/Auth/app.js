const express       = require('express');
const mongoose      = require('mongoose');
const passport      = require('passport');
const session       = require('express-session');
const cookieParser  = require('cookie-parser');
const morgan        = require('morgan');
const createError   = require('http-errors');

var app = express();

// ------------------------------ Ligação ao mongoDB ------------------------------ //

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inquiricoes_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Auth: MongoDB ligado com sucesso'))
  .catch(err => {
    console.error('Auth: Erro ao ligar ao MongoDB:', err.message);
    process.exit(1);
  });

// ------------------------------ Middleware ------------------------------ //

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Garantir que a pasta de uploads existe
const fs   = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'perfis');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Servir uploads de perfil sem cache — garante que o browser recarrega sempre a foto atual
// Também tava a dar chatices, foi assim que se resolveu (づ ◕‿◕ )づ
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo_dev',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ------------------------------ Passport ------------------------------ //

const User = require('./models/user');
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(passport.session());

// ------------------------------ Rotas ------------------------------ //

const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// Rota de saúde
app.get('/', (req, res) => {
  res.json({ servico: 'Auth Inquirições de Génere', status: 'ok' });
});

// ------------------------------ Erros ------------------------------ //

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