const axios = require('axios')

const BASE = "http://localhost:3000"

async function fetchAlunos(){
    const {data} = await axios.get(`${BASE}/alunos`)
    return data
}

async function fetchCursos(){
    const {data} = await axios.get(`${BASE}/cursos`)
    return data
}

async function fetchInstrumentos(){
    const {data} = await axios.get(`${BASE}/instrumentos`)
    return data
}

module.exports = { fetchAlunos, fetchCursos, fetchInstrumentos }