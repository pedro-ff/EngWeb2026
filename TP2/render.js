const header = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TPC2</title>
</head>
`

function renderReparacoes(res, reparacoes) {

    let html = header +  `

    <body>
        <h1>Reparações</h1>
        <table border="1">
            <tr>
                <th>nome</th>
                <th>nif</th>
                <th>data</th>
                <th>marca</th>
                <th>modelo</th>
                <th>matricula</th>
                <th>nr_intervencoes</th>
            </tr>
    `

    reparacoes.forEach(r => {
        html += `
        <tr>
            <td>${r.nome}</td>
            <td>${r.nif}</td>
            <td>${r.data}</td>
            <td>${r.viatura.marca}</td>
            <td>${r.viatura.modelo}</td>
            <td>${r.viatura.matricula}</td>
            <td>${r.nr_intervencoes}</td>
        </tr>`
    })

    html += "</table></body></html>"

    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
    res.end(html)
}

function renderIntervencoes(res,intervencoes) {

    let html = header + `
    <body>
        <h1>Intervenções</h1>
        <table border="1">
            <tr>
                <th>codigo</th>
                <th>nome</th>
                <th>descricao</th>
                <th>nr_vezes</th>
            </tr>
    `

    intervencoes.forEach(i => {
        html += `
        <tr>
            <td>${i.codigo}</td>
            <td>${i.nome}</td>
            <td>${i.descricao}</td>
            <td>${i.nr_vezes}</td>
        </tr>
        `
    })

    html += "</table></body></html>"

    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
    res.end(html)
}

function renderViaturas(res,viaturas) {

    let html = header + `
                <body>
                    <h1>Viaturas</h1>
                    <table border="1">
                        <tr>
                            <th>marca</th>
                            <th>nr_intervencoes</th>
                        </tr>
                `

    viaturas.forEach(m => {
        html += `
        <tr>
            <td>${m.marca}</td>
            <td>${m.nr_intervencoes}</td>
        </tr>
    `
    })

    html += "</table></body></html>"

    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
    res.end(html)
}

module.exports = {
    renderReparacoes,
    renderIntervencoes,
    renderViaturas
}
