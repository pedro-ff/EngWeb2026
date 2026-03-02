## TPC4

# MetaInformação

Título: Gestão de Exames Médicos Desportivos (EMD)

Data: 02/03/2026

Autor: Pedro Ferreira

UC: Engenharia Web


# Autor

ID: A107292

Nome: Pedro Francisco Ferreira

Foto: ![imagem](Photo.png)

# Resumo

Este trabalho prático consiste em desenvolver uma aplicação web completa em Node.js para gerir Exames Médicos Desportivos (EMD). A aplicação utiliza o módulo nativo http para criar o servidor, o axios para comunicar com uma API de dados (fornecida pelo json-server) e o motor de templates Pug para gerar páginas HTML de forma dinâmica.

## Lista de resultados
A aplicação disponibiliza as seguintes rotas:
*   `http://localhost:7777/`: Página principal com a lista de todos os EMDs.
*   `http://localhost:7777/emd/:id`: Visualização detalhada de um EMD específico.
*   `http://localhost:7777/emd/registo`: Formulário para inserção de um novo registo.
*   `http://localhost:7777/emd/editar/:id`: Formulário para edição de um registo existente.
*   `http://localhost:7777/emd/stats`: Página com estatísticas agregadas sobre os exames.
*   `http://localhost:7777/emd/apagar/:id`: Rota para eliminação de um registo.