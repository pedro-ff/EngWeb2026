## TPC2

# MetaInformação

Título: Tratamento de dados a partir de pedidos para um json-server

Data: 11/02/2026

Autor: Pedro Ferreira

UC: Engenharia Web


# Autor

ID: A107292

Nome: Pedro Francisco Ferreira

Foto: ![imagem](Photo.png)

# Resumo

Criar um json-server com o dataset das reparações;

Criar um servidor aplicacional para responder aos seguintes serviços:

. /reparacoes - Tabela HTML com os dados das reparações;

. /intervencoes - Tabela HTML com os diferentes tipos de intervenção, sem repetições e com o número de vezes que foram feitas;

. /viaturas - Tabela HTML com os dados dos tipos de viatura intervencionados e o número de vezes que cada modelo foi reparado.

# Lista de Resultados

[dataset_reparacoes.json](dataset_reparacoes.json): dataset fornecido.

[app_server.js](app_server.js): servidor aplicacional desenvolvido.

[render.js](render.js) : Código auxiliar.

# Para correr

Precisa de ter instalado:

- json-server:

```console
npm install -g json-server@0.17.4
```

e

- axios:
```console
npm install axios
```

Depois, abrir um terminal e escrever:

```console
json-server --watch dataset_reparacoes.json
```

e noutro terminal:

```console
node app_server.js
```

Com isso feito, é só abrir o seu browser e procurar pelas rotas:

- http://localhost:7777/reparacoes

- http://localhost:7777/intervencoes

- http://localhost:7777/viaturas