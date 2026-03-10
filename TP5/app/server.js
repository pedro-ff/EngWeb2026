// treinos_server.js
// EW2025 : 2025-02-24
// by jcr

var http = require('http')
var axios = require('axios')
const { parse } = require('querystring');
var url = require('url');


var templates = require('./templates.js')           // Necessario criar e colocar na mesma pasta
var static = require('./static.js')                 // Colocar na mesma pasta

// Aux functions
function collectRequestBodyData(request, callback) {
    if(request.headers['content-type'] === 'application/x-www-form-urlencoded') {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            callback(parse(body));
        });
    }
    else {
        callback(null);
    }
}

// Server creation

var treinosServer = http.createServer((req, res) => {
    // Logger: what was requested and when it was requested
    var d = new Date().toISOString().substring(0, 16)
    console.log(req.method + " " + req.url + " " + d)
    var parsedUrl = url.parse(req.url, true)

    // Handling request
    if(static.staticResource(req)){
        static.serveStaticResource(req, res)
    }
    else{
        switch(req.method){
            case "GET":
                if (parsedUrl.pathname == '/' || parsedUrl.pathname == '/filmes') {
                    axios.get(`http://localhost:3000/filmes`)
                    .then(resp=> {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.filmsTablePage(resp.data, d))
                    })
                    .catch(erro=>{
                        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.errorPage(erro, d))
                    })
                }
                else if (/\/filmes\/[0-9a-zA-Z_]+$/.test(parsedUrl.pathname)) {
                    var id = parsedUrl.pathname.split('/')[2]
                    axios.get(`http://localhost:3000/filmes/`+ id)
                    .then(resp=> {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.filmPage(resp.data, d))
                    })
                    .catch(erro=>{
                        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.errorPage(erro, d))
                    })
                }
                else if (parsedUrl.pathname == '/atores') {
                    axios.get(`http://localhost:3000/actors`)
                    .then(resp=> {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.actorsTablePage(resp.data, d))
                    })
                    .catch(erro=>{
                        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.errorPage(erro, d))
                    })
                }
                else if (/\/atores\/[0-9a-zA-Z_]+$/.test(parsedUrl.pathname)) {
                    var id = parsedUrl.pathname.split('/')[2]
                    axios.get(`http://localhost:3000/actors/`+ id)
                    .then(resp=> {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.actorPage(resp.data, d))
                    })
                    .catch(erro=>{
                        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.errorPage(erro, d))
                    })
                }
                else if (parsedUrl.pathname == '/generos') {
                    axios.get(`http://localhost:3000/genres`)
                    .then(resp=> {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.genresTablePage(resp.data, d))
                    })
                    .catch(erro=>{
                        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.errorPage(erro, d))
                    })
                }
                else if (/\/generos\/[0-9a-zA-Z_]+$/.test(parsedUrl.pathname)) {
                    var id = parsedUrl.pathname.split('/')[2]
                    axios.get(`http://localhost:3000/genres/`+ id)
                    .then(resp=> {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.genrePage(resp.data, d))
                    })
                    .catch(erro=>{
                        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(templates.errorPage(erro, d))
                    })
                }

                break

            default:
                // Outros metodos nao sao suportados
        }
    }
})

treinosServer.listen(7777, ()=>{
    console.log("Servidor à escuta na porta 7777...")
})



