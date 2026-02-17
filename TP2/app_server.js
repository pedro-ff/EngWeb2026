const axios = require('axios')
const render = require('./render.js')
const http = require('http')

// Dicionarios para serem preenchidos apenas uma vez
let intervencoes = null
let viaturas     = null



var server = http.createServer(function(req,res) {
    if (req.url == "/reparacoes") {
        axios.get('http://localhost:3000/reparacoes')
            .then(resp => {
                let data = resp.data
                let reparacoes = data.sort((a,b) => a.nome.localeCompare(b.nome))
                render.renderReparacoes(res, reparacoes)
            })
            .catch(error => {
                res.writeHead(520, {'Content-Type': 'text/html; charset=utf-8'})
                res.end("<pre>" + JSON.stringify(error) + "</pre>")
            })
    }else if (req.url == "/intervencoes") {
            if (intervencoes) {
                return render.renderIntervencoes(res,intervencoes)
            }

            axios.get('http://localhost:3000/reparacoes')
                .then(resp => {

                    let mapa = {}

                    resp.data.forEach(r => {
                        r.intervencoes.forEach(i => {

                            if (!mapa[i.codigo]) {
                                mapa[i.codigo] = {
                                    codigo: i.codigo,
                                    nome: i.nome,
                                    descricao: i.descricao,
                                    nr_vezes: 1
                                }
                            }
                            else mapa[i.codigo].nr_vezes++
                        })
                    })

                    intervencoes = Object.values(mapa)
                        .sort((a,b)=>a.codigo.localeCompare(b.codigo))

                    render.renderIntervencoes(res,intervencoes)
                })
                .catch(error => {
                    res.writeHead(520, {'Content-Type': 'text/html; charset=utf-8'})
                    res.end("<pre>" + JSON.stringify(error) + "</pre>")
                })

    }else if (req.url == "/viaturas") {
        if (viaturas) {
            return render.renderViaturas(res,viaturas)
        }
        axios.get('http://localhost:3000/reparacoes')
        .then(resp => {

            let mapa = {}

            resp.data.forEach(r => {
                let marca = r.viatura.marca
                if(!mapa[marca]){
                    mapa[marca] = {
                        marca : marca,
                        nr_intervencoes : r.nr_intervencoes
                    }
                }
                else mapa[marca].nr_intervencoes += r.nr_intervencoes
            })

            viaturas = Object.values(mapa)
                .sort((a,b)=>a.marca.localeCompare(b.marca))
            render.renderViaturas(res,viaturas)
        })
        .catch(error => {
            res.writeHead(520, {'Content-Type': 'text/html; charset=utf-8'})
            res.end("<pre>" + JSON.stringify(error) + "</pre>")
        })
    }else {
    res.writeHead(404,{'Content-Type': 'text/html; charset=utf-8'})
    res.end("<p>Pedido não suportado, por favor tente novamente.</p>")
    }
})
server.listen(7777)
console.log("Server à escuta na porta 7777...")