import json
import os
import shutil

# ========================= FUNCOES AUXILIARES ========================= #

def open_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def mk_dir(path):
    if os.path.exists(path):
        shutil.rmtree(path)
    os.makedirs(path)

def new_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ========================= DATA ========================= #

data = open_json("reparacoes.json")
rep_list = data["reparacoes"]

mk_dir("output")
mk_dir("output/reparacoes")
mk_dir("output/intervencoes")
mk_dir("output/carros")

interv_dict = {}
interv_refs = {}
car_count = {}
car_plates = {}

# ========================= INDEX PRINCIPAL ========================= #

index_html = """
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Reparações</title>
    </head>
    <body>
        <h3>Exploração do Dataset</h3>
        <ul>
            <li><a href="reparacoes/index.html">Reparações</a></li>
            <li><a href="intervencoes/index.html">Intervenções</a></li>
            <li><a href="carros/index.html">Carros</a></li>
        </ul>
    </body>
</html>
"""

new_file("output/index.html", index_html)

# ========================= PROCESSAR DATA ========================= #

for idx, rep in enumerate(rep_list):
    car = rep["viatura"]
    key = (car["marca"], car["modelo"])
    car_count[key] = car_count.get(key, 0) + 1

    for it in rep["intervencoes"]:
        code = it["codigo"]
        interv_dict[code] = it
        interv_refs.setdefault(code, []).append(idx)

# ========================= PAGINAS REPARACOES ========================= #

rows = ""
for i, rep in enumerate(rep_list):
    v = rep["viatura"]
    rows += f"""
    <tr>
        <td>{rep["data"]}</td>
        <td>{rep["nif"]}</td>
        <td><a href="rep_{i}.html">{rep["nome"]}</a></td>
        <td>{v["marca"]}</td>
        <td>{v["modelo"]}</td>
        <td>{rep["nr_intervencoes"]}</td>
    </tr>
    """

rep_index = f"""
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Reparações</title>
    </head>
    <body>
        <h3>Lista de Reparações</h3>
        <table border="1">
            <tr>
                <th>Data</th>
                <th>NIF</th>
                <th>Nome</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th># Intervenções</th>
            </tr>
            {rows}
        </table>
        <hr/>
        <a href="../index.html">Voltar</a>
    </body>
</html>
"""

new_file("output/reparacoes/index.html", rep_index)

# ========================= PAGINAS REPARACOES INDIVIDUAIS ========================= #

for i, rep in enumerate(rep_list):
    items = ""
    for it in rep["intervencoes"]:
        items += f"""
        <li>
            <a href="../intervencoes/{it["codigo"]}.html">
                {it["codigo"]} - {it["nome"]}
            </a>
        </li>
        """

    v = rep["viatura"]

    page = f"""
    <html>
        <head>
            <meta charset="utf-8"/>
            <title>Reparação</title>
        </head>
        <body>
            <h3>Reparação</h3>
            <table border="1">
                <tr><td>Nome</td><td>{rep["nome"]}</td></tr>
                <tr><td>NIF</td><td>{rep["nif"]}</td></tr>
                <tr><td>Data</td><td>{rep["data"]}</td></tr>
                <tr><td>Viatura</td><td>{v["marca"]} {v["modelo"]}</td></tr>
                <tr><td>Matrícula</td><td>{v["matricula"]}</td></tr>
            </table>

            <h4>Intervenções</h4>
            <ul>{items}</ul>
            <hr/>
            <a href="../index.html">Voltar</a>
        </body>
    </html>
    """

    new_file(f"output/reparacoes/rep_{i}.html", page)

# ========================= INTERVENCOES ========================= #

links = "".join(
    f'<li><a href="{c}.html">{c}</a></li>'
    for c in sorted(interv_dict)
)

interv_index = f"""
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Intervenções</title>
    </head>
    <body>
        <h3>Tipos de Intervenção</h3>
        <ul>{links}</ul>
        <hr/>
        <a href="../index.html">Voltar</a>
    </body>
</html>
"""

new_file("output/intervencoes/index.html", interv_index)

for code, it in interv_dict.items():
    refs = "".join(
        f'<li><a href="../reparacoes/rep_{i}.html">Reparação {i}</a></li>'
        for i in interv_refs[code]
    )

    page = f"""
    <html>
        <head>
            <meta charset="utf-8"/>
            <title>{code}</title>
        </head>
        <body>
            <h3>{it["nome"]}</h3>
            <p><b>Código:</b> {code}</p>
            <p><b>Descrição:</b> {it["descricao"]}</p>
            <h4>Reparações</h4>
            <ul>{refs}</ul>
            <hr/>
            <a href="index.html">Voltar</a>
        </body>
    </html>
    """

    new_file(f"output/intervencoes/{code}.html", page)

# ========================= CARROS ========================= #

for rep in rep_list:
    v = rep["viatura"]
    key = (v["marca"], v["modelo"])
    car_plates.setdefault(key, set()).add(v["matricula"])

car_links = ""
for (brand, model), total in sorted(car_count.items()):
    fname = f"{brand}_{model}".replace(" ", "_")
    car_links += f'<li><a href="{fname}.html">{brand} {model}</a> ({total})</li>'

cars_index = f"""
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Carros</title>
    </head>
    <body>
        <h3>Marcas e Modelos</h3>
        <ul>{car_links}</ul>
        <hr/>
        <a href="../index.html">Voltar</a>
    </body>
</html>
"""

new_file("output/carros/index.html", cars_index)

for (brand, model), total in car_count.items():
    fname = f"{brand}_{model}".replace(" ", "_")
    plates = "".join(f"<li>{p}</li>" for p in sorted(car_plates[(brand, model)]))

    page = f"""
    <html>
        <head>
            <meta charset="utf-8"/>
            <title>{brand} {model}</title>
        </head>
        <body>
            <h3>{brand} {model}</h3>
            <p>Número de carros: {total}</p>

            <h4>Matrículas intervencionadas</h4>
            <ul>{plates}</ul>

            <hr/>
            <a href="index.html">Voltar</a>
        </body>
    </html>
    """

    new_file(f"output/carros/{fname}.html", page)