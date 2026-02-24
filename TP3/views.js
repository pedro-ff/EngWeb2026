function layout(title, content){
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8"/>
        <title>${title}</title>
        <link rel="stylesheet"
              href="https://www.w3schools.com/w3css/4/w3.css">
    </head>

    <body class="w3-light-grey">
        <header class="w3-container w3-teal">
            <h1>${title}</h1>
        </header>

        <main class="w3-container w3-margin-top">
            ${content}
        </main>
    </body>
    </html>
    `
}

function card(title, body){
    return `
    <section class="w3-card w3-white w3-margin-bottom">
        <div class="w3-container w3-teal">
            <h3>${title}</h3>
        </div>
        <div class="w3-container w3-padding">
            ${body}
        </div>
    </section>
    `
}

function link(url, label){
    return `<a href="${url}">${label}</a>`
}

// 🔹 tabela genérica (antes repetias código!)
function table(headers, rows){
    return `
    <table class="w3-table w3-striped w3-bordered w3-hoverable">
        <tr class="w3-light-grey">
            ${headers.map(h => `<th>${h}</th>`).join("")}
        </tr>

        ${rows.map(r => `
            <tr>
                ${r.map(col => `<td>${col}</td>`).join("")}
            </tr>
        `).join("")}
    </table>
    `
}

function backButton(){
    return `<a class="w3-button w3-teal w3-margin-top" href="/">Voltar</a>`
}

function error(msg, err=""){
    return layout("Erro", `
        <div class="w3-panel w3-red">
            <h3>${msg}</h3>
            <pre>${err}</pre>
        </div>
        ${backButton()}
    `)
}

module.exports = { layout, card, link, table, backButton, error }