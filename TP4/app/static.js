var fs = require('fs')

function staticResource(request){
    return /\/w3.css$/.test(request.url) ||
            /\/favicon.png$/.test(request.url) ||
            /\/person.png$/.test(request.url)
}

exports.staticResource = staticResource

function serveStaticResource(req, res){
    var partes = req.url.split('/')
    var file = partes[partes.length - 1]
    fs.readFile('public/' + file, (erro, dados) => {
        if(erro){
            res.statusCode = 204
            res.end()
        }
        else{
            if(file.endsWith('.css')){
                res.setHeader('Content-Type', 'text/css')
                res.end(dados)
            }
            else if(file.endsWith('.js')){
                res.setHeader('Content-Type', 'text/javascript')
                res.end(dados)
            }
            else if(file == 'favicon.ico'){
                res.setHeader('Content-Type', 'image/x-icon')
                res.end(dados)
            }
            else{
                res.setHeader('Content-Type', 'image/png')
                res.end(dados)
            }
        }
    })
}

exports.serveStaticResource = serveStaticResource
