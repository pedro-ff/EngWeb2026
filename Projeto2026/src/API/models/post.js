const mongoose = require('mongoose');

const comentarioSchema = new mongoose.Schema({
    autor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    autor_username: { type: String, required: true },
    texto: { type: String, required: true },
    data: { type: Date, default: Date.now }
}, { _id: true });

const postSchema = new mongoose.Schema({
    proc_numero: { type: Number, required: true, index: true },
    autor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    autor_username: { type: String, required: true },
    titulo: { type: String, required: true },
    corpo: { type: String, required: true },
    data: { type: Date, default: Date.now },
    comentarios: [comentarioSchema]
});

module.exports = mongoose.model('Post', postSchema, 'posts');