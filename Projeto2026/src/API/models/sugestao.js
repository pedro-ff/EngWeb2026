const mongoose = require('mongoose');

const sugestaoSchema = new mongoose.Schema({
    autor_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    autor_username: { type: String, required: true },
    texto: { type: String, required: true },
    data: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sugestao', sugestaoSchema);