
## TPC5

# MetaInformação

Título: Criação de uma aplicação web para gestão de um cinema, com filmes, atores e géneros

Data: 08/03/2026

Autor: Pedro Ferreira

UC: Engenharia Web

# Autor

ID: A107292

Nome: Pedro Francisco Ferreira

Foto: ![imagem](Photo.png)


# Resumo

- Colocar no json-server o dataset de cinema;

- Usar o express p/ criar uma aplicação web:

    - GET / ou /filmes => tabela com [ id (acrescentar ao dataset) | titulo | ano | #generos | #cast ]

    - GET /filmes/:id => toda a informação do filme

    - GET /atores => tabela com [ id | ator | #filmes ]

    - GET /atores/:id => toda a informação do ator

    - GET /generos => tabela com [ id | genero | #filmes ]

    - GET /generos/:id => toda a informação do género


# Lista de Resultados

[views](./app/views): Diretório com os ficheiros .pug para gerar as páginas HTML;

[server](./app/server.js): Servidor aplicacional

[cinema.json](cinema.json): Dataset não trabalhado, e não apropriado para usar em servidores;

[db.json](db.json): Dataset convertido;

[transform.py](app/transform.py): Ficheiro para converter o dataset cinema.json, num dataset correto para o servidor

# Para correr

Precisa de ter instalado:

- json-server:

```console
npm install -g json-server@0.17.4
```

Outras dependências podem ser instaladas recorrendo aos comandos:

```console
cd app/
npm install
```

Depois é só correr:

```console
json-server --watch db.json
cd app/
npm start
```

e abrir o browser em http://localhost:7777/ para navegar!

Nota:

Se por algum motivo não tiver acesso ao dataset apropriado (db.json), primeiro deve correr:

```console
python3 app/transform.py
```
