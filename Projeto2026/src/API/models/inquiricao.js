var mongoose = require('mongoose')

const relacaoSchema = new mongoose.Schema({
    nome: String,
    relacao: String,
    proc_numero: Number
} , { _id: false });

const inquiricaoSchema = new mongoose.Schema({
    nivel: String,
    cota_completa: String,
    cota: String,
    titulo: String,
    data_inicial: String,
    data_final: String,
    repositorio: String,
    conteudo: String,
    caixa: String,
    notas_fisicas: String,
    material_relacionado: String,
    nota: String,
    info_processo: String,
    dimensoes: String,
    criador: String,
    data_criacao: String,
    hora_criacao: String,
    proc_numero: { type: Number, unique: true },
    requerente: String,
    pai: String,
    mae: String,
    freguesia: String,
    concelho: String,
    distrito: String,
    relacoes: [relacaoSchema]
});

module.exports = mongoose.model('Inquiricao', inquiricaoSchema, 'inquiricoes')