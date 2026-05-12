# Inquirições de Génere - Projeto

Este projeto consiste numa plataforma web para a gestão e visualização de inquirições históricas presentes no Arquivo Distrital de Braga. A solução foi desenhada seguindo uma arquitetura de serviços distribuídos para garantir a separação de responsabilidades entre autenticação, lógica de negócio e a interface do utilizador.

## 1. Estrutura do Repositório

O projeto está dividido em três componentes principais localizados na pasta *src/*:

- **API**: Servidor de *backend* que gere os dados de inquirições, posts e sugestões.

- **Auth**: Serviço dedicado à gestão de utilizadores e autenticação (JWT).

- **Interface**: Aplicação *frontend* (desenvolvida com Pug), que interage com os serviços anteriores para apresentar a informação ao utilizador.

Além disso, a pasta data/ contém *scripts* para popular a base de dados MongoDB, a partir do dataset fornecido à equipa.

## 2. Tecnologias Utilizadas

- ***Runtime***: Node.js

- ***Framework Web***: Express.js

- **Base de Dados**: MongoDB

- **Motor de *Templates***: Pug

- **Contentorização**: Docker & Docker Compose

## 3. Como Executar

A forma mais simples de subir todo o ecossistema é utilizando o **Docker Compose** na raiz do projeto:

```console
docker-compose up -d --build
```

Isto irá inicializar:

1. A base de dados MongoDB.

2. O serviço de Autenticação (porta 3002)

3. A API de dados (porta 3001)

4. A Interface Web (porta 3000)


Para depois apagar os containers (Hard Reset):

```console
docker compose down -v --rmi all --remove-orphans
```

## 4. Documentação Detalhada

Para uma análise mais profunda do projeto, por favor consultar o relatório técnico:

[RELATORIO.md](RELATORIO.md)