const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose').default ?? require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido']
    },
    nivel: { type: String, enum: ['administrador', 'consumidor'], default: 'consumidor', required: true },
    filiacao: { type: String, required: true }, // estudante, docente, ...
    idade: { type: Number, required: true },
    dataRegisto: { type: Date, default: Date.now, required: true },
    dataUltimoAcesso: { type: Date },
    bio: { type: String, default: '' },
    fotoPerfil: { type: String, default: '' }
});

// Password (hash + salt) é tratada aqui
// Métodos suportados: authenticate(), serializeUser(), deserializeUser(), register(), findByUsername()
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema, 'users');