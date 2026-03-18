
## TPC5

# MetaInformação

Título:  Criação de uma aplicação web para gestão de um cinema, com orquestração de containers

Data: 17/03/2026

Autor: Pedro Ferreira

UC: Engenharia Web

# Autor

ID: A107292

Nome: Pedro Francisco Ferreira

Foto: ![imagem](Photo.png)


# Resumo

Cria uma orquestração de sereviços para implementar uma App sobre cinema:

- Descarrega o dataset sobre cinema;

- Depois de analisares o que se pede a seguir faz as alterações que achares necessárias ao dataset;

- Carrega o dataset no MongoDB; deverás ter ficado com 3 coleções: filmes, atores e generos;

- Cria uma API de dados minimalista sobre as 3 coleções;

- À semelhança do que foi feito na aula, isola os teus serviços em containers docker e cria uma orquestração para a API de dados;

- Cria um servidor aplicacional que responda aos seguintes pedidos:

    - GET /filmes - responde com uma página HTML contendo uma tabela com os seguintes campos de filme: id, título, ano, número de atores no elenco e número de géneros associados ao filme; Cada linha deve ser um link para a página individual de filme;

    - GET /filmes/:id - responde com uma página HTML contendo toda a informação de filme;

    - GET /atores - responde com uma página HTML contendo uma tabela com os seguintes campos de ator: id, nome, número de filmes em que participou; Cada linha deve ser um link para a página individual de ator;

    - GET /atores/:id - responde com uma página HTML contendo toda a informação de ator;

    - GET /generos - responde com uma página HTML contendo uma tabela com os seguintes campos de género: id, designação, número de filmes associados ao género;

- Cria um docker para interface;

- Orquestra tudo num docker compose.


# Lista de Resultados

[cinema.json](./app/api_dados/cinema.json): dataset com a informação sobre os filmes, atores e géneros;

[entities](./app/api_dados/entites/): diretoria onde estão os ficheiros .json para usar no mongoDB (filmes.json, atores.json e generos.json);

[transform.py](./app/api_dados/transform.py): script que converte o dataset nos três apropriados para usar no mongoDB;

[api.js](./app/api_dados/api.js): servidor da API de dados (minimalista);

[Dockerfile](./app/api_dados/Dockerfile): Dockerfile para o container da API de dados;

[Dockerfile.mongo](./app/api_dados/Dockerfile.mongo): Dockerfile para o container do mongoDB;

[views](./app/interface/views/): Diretório com os ficheiros .pug para gerar as páginas HTML;;

[app_interface.js](./app/interface/app_interface.js): servidor da interface;

[Dockerfile.interface](./app/interface/Dockerfile.interface): Dockerfile para o container da interface;

[docker-compose.yml](./app/docker-compose.yml): ficheiro de configuração do docker-compose para orquestrar os containers;

# Para correr
Primeiro deve correr (dentro da diretoria ./appCinema/api_dados):

```console
python3 transform.py
```

para gerar as collections apropriadas.

Depois, é só executar o seguinte comando na diretoria principal (./appCinema):

```console
docker compose up --build
```

Isto irá construir os containers e correr a aplicação.

Após isso, a aplicação fica disponível no seguinte endereço:

```console
http://localhost:7790
```

Nota:

Se por algum motivo quiser parar os containers e remover as imagens, é só correr o comando (outra vez, na diretoria principal):

```console
docker compose down
```