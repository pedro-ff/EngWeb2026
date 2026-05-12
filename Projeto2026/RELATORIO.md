# Relatório do Projeto - Inquirições de Génere, Engenharia Web 2025/2026

## 0. Grupo de Trabalho

- André Dinis Alves Santos, a106854
- Daniel Gonçalves Parente, a107363
- Pedro Francisco Ferreira, a107292

## 1. Introdução

O presente documento descreve detalhadamente o desenvolvimento, a arquitetura e as escolhas tecnológicas efetuadas para a implementação de uma plataforma *web* de gestão de inquirições. O projeto foi concebido no âmbito da unidade curricular de Engenharia Web, com o objetivo de criar uma solução *full-stack* robusta, escalável, e fácil de manter.

O sistema assenta sobre um conjunto de documentos históricos provenientes do Arquivo Distrital de Braga - denominadas Inquirições de Génere - processos necessários para a ordenação de párocos entre os séculos XVII e XX, que consistiam na inquirição de testemunhas para comprovar a filiação, reputação e "pureza no sangue" do requerente. A plataforma não se limita a ser um repositório passivo: permite pesquisa avançada, visualização estatística, gestão de relações genealógicas entre registos e interação ativa dos utilizadores através de posts, comentários e sugestões.

## 2. Análise de Dados e Modelo

### 2.1. Dataset

Surgiu, inicialmente, a exigência de compreensão do conjunto de dados forncecido pelo próprio ADB. Procedeu-se à análise, ao estudo e à alteração do mesmo, de modo a ser possível partir de uma base sólida para o desenvolvimento da aplicação.

### 2.2. Processo de Conversão (CSV -> JSON -> MongoDB)

A ingestão dos dados foi feita através de um *script* Python (data/converter.py) desenvolvido especificamente para este projeto, que realiza três passos principais:

1. Mapeamento seletivo de colunas: das 82 colunas do CSV original, apenas 17 foram consideradas relevantes e mapeadas para campos JSON.

2. *Parsing* e extração de campos derivados: vários campos estruturados, como o nome do requerente, filiação (pai e mãe) ou localização (freguesia, concelho, distrito), encontravam-se em formato de texto livre dentro do campo *ScopeContent*. O conversor utiliza expressões regulares específicas para extrair esses valores de forma fiável.

3. Normalização: datas foram convertidas do formato DD/MM/AAAA HH:MM:SS para ISO 8601 (AAAA-MM-DD), o campo *proc_numero* foi extraído do identificador *UnitId* como inteiro, e campos vazios foram eliminados para não poluir os documentos no MongoDB.

### 2.3. Modelo de Dados

O modelo final, implementado em MongoDB através do Mongoose, divide-se em quatro coleções:

**Inquiricao**

Coleção principal com os dados histórios. Os campos mais relevantes são:

| Campo       | Tipo            | Descrição                                        |
|-------------|-----------------|--------------------------------------------------|
| proc_numero |  Number (único) | Número do processo - chave de pesquisa principal |
| requerente  | String          |  Nome do requerente, extraído do título          |
| pai / mae   | String | Filiação, extraída do campo conteudo por regex |
| freguesia / concelho / distrio | String | Localização, extraída do campo conteudo por regex |
| data_inicial / data_final | String (ISO) | Intervalo temporal do documento |
| relacoes | [RelacaoSchema] | Lista de relações genealógicas com outros processos (nome, relacao, proc_numero) |
| cota_completa / cota | String | Identificadores arquivísticos originais |
| conteudo | String | Texto descritivo original |
| criador | String | Username do utilizador que criou/importou o registo na plataforma |

**User**

Gerida pelo serviço da Auth. Usa o plugin *passport-local-mongoose* para gerir *hash* e *salt* da *password* de forma segura. Os campos são: username (único), email (único, validado por regex), nível (administrador ou consumidor), filiação, idade, dataRegisto, dataUltimoAcesso, bio (abreviatura de biografia) e fotoPerfil (*path* da imagem no sistema de ficheiros).

**Post e Comentario**

Os posts ficam associados a uma inquirição via *proc_numero* e ao autor via *autor_id* e *autor_username*. Os comentários são subdocumentos embutidos no documento do post, o que foi uma escolha deliberada da equipa para facilitar as consultas (um único *find* devolve o post com todos os seus comentários) e tirar partido do modelo de documento do MongoDB.

**Sugestao**

Estrutura simples: autor_id, autor_username, texto e data. Visível apenas para administradores da plataforma, serve como canal de *feedback* dos utilizadores para a equipa de gestão.

## 3. Arquitetura do Sistema (explicar o funcionamento da API, Auth e Interface.)

A solução foi desenhada seguindo uma arquitetura de microserviços com três componentes independentes, cada um com a sua própria responsabilidade, base de código e contentor Docker.

### 3.1. Visão Geral

Os três serviços comunicam exclusivamente via HTTP, nunca partilhando base de dados diretamente nem estado em memória. A Interface atua como orquestrador: recebe pedidos do browser, delega para a API ou a Auth conforme necessário, e compõe a resposta final em HTML através do motor de templates Pug.

| Serviço | Porta | Tecnologia | Responsabilidade |
| :-: | :-: | - | - |
| API | 3001 | Express.js + Mongoose | CRUD de inquirições, posts, comentários e sugestões; estatísticas; import/export |
| Auth | 3002 | Express.js + Passport.js | Registo e autenticação de utilizadores; emissão e verificação de JWT; gestão de perfis e fotos |
| Interface | 3000 | Express.js + Pug | Renderização server-side de todas as páginas; proxy de pedidos para a API e Auth |
| MongoDB | 27017 | MongoDB 7 | Base de dados partilhada internamente pela API e Auth (redes Docker separadas por coleção) |

### 3.2. Serviço Auth

O serviço Auth é responsável por tudo o que diz respeito à identidade dos utilizadores. A autenticação é feita com JWT (*JSON Web Tokens*): após o *login* bem-sucedido, é emitido um *token* assinado com uma chave secreta configurável via variável de ambiente (JWT_SECRET). O *token* tem uma validade de 8 horas e é armazenado na sessão *server-side* da Interface.

A gestão de *passwords* segue boas práticas de segurança através do *plugin* *passport-local-mongoose*, que gere automaticamente o *hash* (PBKDF2) e o *salt* de cada *password* (nunca são guardadas *passwords* em texto limpo). Estas *passwords* seguem também regras estabelecidas pela equipa, para aumentar ainda mais a sua segurança.

O *upload* de fotos de perfil usa um mecanismo de *content-addressable storage*: o ficheiro é recebido em memória (multer.memoryStorage), é calculado o seu *hash* SHA-256, e o ficheiro é guardado numa estrutura de diretórios derivada desse *hash* (os dois primeiros caracteres formam o primeiro nível, os dois seguintes o segundo, e o resto do *hash* compõe o nome do ficheiro). Esta abordagem garante unicidade de nomes, deduplicação automática de conteúdo idêntico e ausência de conflitos entre *uploads* simultâneos.

### 3.3. Serviço API

A API expõe os dados de inquirições, posts e sugestões. Toda a lógicade autorização é feita localmente através de um *middleware* que verifica o JWT junto do serviço Auth (GET /auth/verificar) antes de permitir acesso a rotas protegidas.

As inquirições suportam filtragem multi-parâmetro (requerente, pai, mãe, freguesia, concelho, distrito, ano, texto livre) com paginação configurável. A pesquisa de texto livre usa o índice $text do MongoDB para uma pesquisa eficiente sobre o campo conteudo.

O sistema de *import/export* implementa os conceitos do modelo OAIS (Open Archival Information System): o *import* valida o pacote SIP (Submission Information Package), converte-o para AIP (Archival Information Package) e devolve sempre um relatório detalhado com registos inseridos, duplicados e erros, nunca inserindo parcialmente um lote corrompido. O export gera um DIP (Dissemination Information Package) em JSON ou CSV, com metadados de proveniência incluídos no envelope.

As relações genealógicas entre processos são guardadas como subdocumentos embutidos em cada inquirição. Devido a dificuldades técnicas de implementação, ao adicionar uma relação entre o processo A e o processo B, apenas o documento A é atualizado, de forma a que o utilizador tenha de atualizar manualmente o documento B.

### 3.4. Serviço Interface

A Interface é uma aplicação Express.js com renderização *server-side* via motor de templates Pug. Não acede diretamente à base de dado: todos os dados são obtidos via chamadas HTTP à API e à Auth, usando a biblioteca *axios*. Esta separação garante que a Interface nunca contorne as regras de autorização nos serviços especializados.

A autenticação do utilizador é mantida em sessão *server-side* (*express-session*). O token JWT é guardado na sessão e injetado como cabeçalho *Authorization* em cada pedido à API/Auth que requeira autenticação. As *views* recebem os dados já formatados e prontos a renderizar, sem lógica de negócio no template.

O *upload* de fotos de perfil passa pela Interface como intermediário: o ficheiro é recebido em memória pela Interface e reencaminhado para a Auth via multipart/form-data, evitando que a Interface precise de acesso direto ao sistema de ficheiros da Auth.

### 3.5. Contentorização com Docker

Todo o ecossistema é gerido pelo *Docker Compose*, tendo cada serviço o seu próprio Dockerfile. A ordem de arranque é controlada por condições de healthcheck: o MongoDB tem de estar a responder antes de a API ou da Auth arrancarem, e estes dois têm de estar saudáveis antes de a Interface iniciar.

O diretório de uploads de fotos de perfil é montado como volume do *host* no contentor da Auth, garantindo persistência entre reinicializações e a possibilidade de inspecionar os ficheiros diretamente no sistema de ficheiros do *host*.

## 4. Guia da API

A API REST escuta na porta 3001. Todas as rotas que requerem autenticação esperam o cabeçalho Authorization: Bearer <token>. As rotas marcadas como [admin] requerem adicionalmente que o *token* pertença a um utilizador com nivel = administrador.

### 4.1. Inquirições -- /inquiricoes

| Método | Rota | Auth | Descrição |
| :-: | - | :-: | - |
| GET | /inquiricoes | -- | Listar com filtros e paginação (?requerente, ?concelho, ?distrito, ?ano, ?texto, ?pagina, ?limite) |
| GET | /inquiricoes/:proc_numero | -- | Consultar uma inquirição pelo número de processo |
| POST | /inquiricoes | [admin] | Criar novo registo
| PUT | /inquiricoes/:proc_numero | [admin] | Atualizar registo (as relações não sáo sobrecritas por esta rota) |
| DELETE | /inquiricoes/:proc_numero | [admin] | Apagar registo |
| GET | /inquiricoes/export | -- | Exportar dataset filtrado em JSON ou CSV (?formato=json|csv, mesmos filtros do listar) |
| POST | /inquiricoes/import | [admin] | Importar lote de registos a partir de ficheiro JSON (multipart; devolve relatório SIP -> AIP) |
| GET | /inquiricoes/stats | -- | Estatísticas globais: total, por distrito, por século, top concelhos, top requerentes, top apelidos |
| GET | /inquiricoes/stats/seculo/:sec | -- | Distribuição por década para um século específico |
| GET | /inquiricoes/indice/nomes | -- | Lista ordenada de todos os requerentes únicos (índice antroponímico) |
| GET | /inquiricoes/indice/lugares | -- | Lista de concelhos e distritos únicos (índice toponímico) |
| GET | /inquiricoes/indice/datas | -- | Lista de anos com registos e contagem por ano (índice cronológico) |
| GET | /inquiricoes/contribuicoes/:username | -- | Contagem de registos criados por um utilizador
| POST | /inquiricoes/:proc_numero/relacoes/:proc_rel | token | Adicionar uma relação genealógica entre dois processos |
| DELETE | /inquiricoes/:proc_numero/relacoes/:proc_rel | token | Remover uma relação genealógica |

### 4.2. Posts e Comentários -- /posts e /inquiricoes/:id/posts

| Método | Rota | Auth | Descrição |
| :-: | - | :-: | - |
| GET | /inquiricoes/:proc_numero/posts | -- | Listar os posts de uma inquirição |
| POST | /inquiricoes/:proc_numero/posts | token | Criar um post numa inquirição |
| GET | /posts | -- | Listar todos os posts da plataforma |
| GET | /posts/:id | -- | Consultar um post |
| DELETE | /posts/:id | [admin] | Apagar um post |
| POST | /posts/:id/comentarios | token | Adicionar um comentário a um post |
| DELETE | /posts/:id/comentarios/:cld | [admin] | Apagar comentário |

### 4.3. Sugestões -- /sugestoes

| Método | Rota | Auth | Descrição |
| - | - | - | - |
| GET | /sugestoes | [admin] | Listar todas as sugestões |
| POST | /sugestoes | token | Submeter sugestão |
| DELETE | /sugestoes/:id | [admin] | Apagar sugestão |

### 4.4. Autenticação e Utilizadores -- /auth

| Método | Rota | Auth | Descrição |
| :-: | - | :-: | - |
| POST | /auth/registo | -- | Registar novo utilizador |
| POST | /auth/login | -- | Autenticar e receber JWT |
| POST | /auth/logout | -- | Logout |
| GET | /auth/verificar | -- | Verificar validade de um JWT |
| GET | /auth/perfil | token | Consultar perfil completo do utilizador autenticado |
| PATCH | /auth/perfil | token | Atulizar biografia ou foto de perfil |
| POST | /auth/perfil/foto | token | Upload de foto de perfil |
| GET | /auth/utilizadores/:username | -- | Perfil público de um utilizador | // Quase de certeza que está é a que me esqueci de apagar |
| GET | /auth/utilizadores | [admin] | Listar todos os utilizadores |
| DELETE | /auth/utilizadores/:id | [admin] | Apagar utilizador

## 5. Conclusão

O projeto cumpriu os objetivos definidos: foi implementada uma plataforma web funcional que permite pesquisar, consultar, criar, editar e exportar registos históricos de Inquirições de Génere, com autenticação segura, controlo de acesso por níveis e funcionalidades de interação social. A opção por uma arquitetura de microserviços mostrou-se adequada, promovendo a separação de responsabilidades e facilitando o desenvolvimento paralelo de cada componente.
