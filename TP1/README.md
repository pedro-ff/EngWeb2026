
## TPC1 - Estrutura de um website de exploração de um dataset de reparações automóveis

# MetaInformação

Título: Definir a estrutura de um website de exploração de um dataset

Data: 09/02/2026

Autor: Pedro Ferreira

UC: Engenharia Web

# Autor

ID: A107292

Nome: Pedro Francisco Ferreira

Foto: ![imagem](Photo.png)

# Resumo

Análise do dataset dataset_reparacoes.json sobre as intervenções realizadas numa oficina automóvel;

Definir a estrutura de um website de exploração do dataset:

- Página principal: lista de dados consultáveis;

- Listagem das reparações: Data, nif, nome, marca, modelo, número de intervenções realizadas;

- Listagem dos tipos de intervenção: lista alfabética de código das intervenções - código, nome e descrição;

- Listagem das marcas e modelos dos carros intervencionados: lista alfabética das marcas e modelos dos carros reparados - marca, modelo, número de carros;

- Página da Reparação: página com toda a informação de uma reparação;

- Página do tipo de intervenção: dados da intervenção (código, nome e descrição) e lista de reparações onde foi realizada;

- Página do marca/modelo: idem...

Criar uma ou várias scripts em Python para gerar o website a partir do dataset.

# Lista de Resultados

[dataset_reparacoes.json](reparacoes.json): dataset fornecido.

[json2html.py](json2html.py): programa que gera o website.

[index.html](output/index.html): página inicial.

[reparacoes/index.html](output/reparacoes/index.html): página com a lista das reparações.

[intervencoes/index.html](output/intervencoes/index.html): página com a lista das intervenções.

[carros/index.html](output/carros/index.html): página com a lista das marcas e dos modelos dos carros.

Nota: Devido ao elevado número de páginas individuais criadas, estas não foram adicionadas ao repositório.

Para gerar o website completo basta correr num terminal:

```console
python3 json2html.py
```
