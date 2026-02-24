## TPC2

# MetaInformação

Título: Tratamento de dados a partir de pedidos para um json-server

Data: 24/02/2026

Autor: Pedro Ferreira

UC: Engenharia Web


# Autor

ID: A107292

Nome: Pedro Francisco Ferreira

Foto: ![imagem](Photo.png)

# Resumo

Criar um json-server com o dataset da escola de música;

Criar um servidor aplicacional para responder aos seguintes serviços:

./alunos - Tabela HTML com os dados de todos os alunos;

./cursos - Tabela HTML com os a informação de todos os cursos;

./instrumentos - Tabela HTML com os dados dos vários instrumentos.

# Lista de Resultados

[db.json](db.json): dataset fornecido.

[server.js](server.js): servidor aplicacional desenvolvido.

[dataLayer.js](dataLayer.js) : Código auxiliar para fetch dos dados

[views.js](views.js) : Código auxiliar com html

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
json-server --watch db.json
```

e noutro terminal:

```console
node server.js
```

Com isso feito, é só abrir o seu browser e procurar pela rota principal:

- http://localhost:7777/

ou, pelas rotas secundárias (igualmente acessíveis pela rota principal):

- http://localhost:7777/alunos

- http://localhost:7777/cursos

- http://localhost:7777/instrumentos