const http = require('http')
const api = require('./dataLayer.js')
const view = require('./views.js')

function logRequest(req){
    const now = new Date().toISOString().slice(0,16)
    console.log(`[${now}] ${req.method} ${req.url}`)
}

const routes = {
    "/": homePage,
    "/alunos": alunosPage,
    "/cursos": cursosPage,
    "/instrumentos": instrumentosPage
}

// ---- HANDLER PRINCIPAL ----
async function requestHandler(req, res){
    logRequest(req)

    if(req.method !== "GET"){
        return send(res, 405, view.error("Método não permitido"))
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
    const path = parsedUrl.pathname

    const route = routes[path]

    if(!route){
        return send(res, 404, view.error("Rota inexistente"))
    }

    try{
        const html = await route()
        send(res, 200, html)
    }
    catch(err){
        send(res, 500, view.error("Erro ao processar pedido", err))
    }
}

// ---- PÁGINAS ----

async function homePage(){
    const content = view.card("Menu Principal", `
        <table class="w3-table w3-bordered w3-hoverable">
            <tr class="w3-light-grey">
                <th>${view.link("/alunos","Alunos")}</th>
                <th>${view.link("/cursos","Cursos")}</th>
                <th>${view.link("/instrumentos","Instrumentos")}</th>
            </tr>
        </table>
    `)

    return view.layout("Página Inicial", content)
}

async function alunosPage(){
    const alunos = await api.fetchAlunos()

    const rows = alunos.map(a => [
        a.id, a.nome, a.dataNasc, a.curso, a.anoCurso, a.instrumento
    ])

    const table = view.table(
        ["ID","Nome","Nascimento","Curso","Ano","Instrumento"],
        rows
    )

    return view.layout("Alunos",
        view.card("Lista de Alunos", table + view.backButton())
    )
}

async function cursosPage(){
    const cursos = await api.fetchCursos()

    const rows = cursos.map(c => [
        c.id, c.designacao, c.duracao, c.instrumento["#text"]
    ])

    const table = view.table(
        ["ID","Designação","Duração","Instrumento"],
        rows
    )

    return view.layout("Cursos",
        view.card("Lista de Cursos", table + view.backButton())
    )
}

async function instrumentosPage(){
    const inst = await api.fetchInstrumentos()

    const rows = inst.map(i => [i.id, i["#text"]])

    const table = view.table(
        ["ID","Designação"],
        rows
    )

    return view.layout("Instrumentos",
        view.card("Instrumentos Disponíveis", table + view.backButton())
    )
}

// ---- UTIL ----
function send(res, status, body){
    res.writeHead(status, {'Content-Type': 'text/html; charset=utf-8'})
    res.end(body)
}

// ---- SERVER ----
http.createServer(requestHandler).listen(7777, () => {
    console.log("Servidor ativo na porta 7777")
})