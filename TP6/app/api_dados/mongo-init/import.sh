#!/bin/bash

echo ">>> A iniciar importação dos dados..."

# Importa os JSONs para a base de dados cinema e as suas respetivas coleções
# Sem --host: o mongoimport liga-se via socket unix ao processo local
mongoimport --db cinema --collection filmes --type json --file /docker-entrypoint-initdb.d/filmes.json --jsonArray
echo ">>> filmes importados"
mongoimport --db cinema --collection atores --type json --file /docker-entrypoint-initdb.d/atores.json --jsonArray
echo ">>> atores importados"
mongoimport --db cinema --collection generos --type json --file /docker-entrypoint-initdb.d/generos.json --jsonArray
echo ">>> generos importados"

# Cria os índices de texto necessários para o parâmetro ?q= funcionar
mongosh cinema --eval '
  db.filmes.createIndex({ title: "text", cast: "text", genres: "text" });
  db.atores.createIndex({ name: "text" });
  db.generos.createIndex({ name: "text" });
  print(">>> indices criados");
'

echo ">>> Importação concluída."