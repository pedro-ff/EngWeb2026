#!/bin/bash
# Executado automaticamente pelo MongoDB na primeira inicialização do container.
# Importa o ficheiro JSON para a colecção 'inquiricoes'.

set -e

echo "============================================="
echo " A importar Inquirições de Génere..."
echo "============================================="

mongoimport \
  --host localhost \
  --db  inquiricoes_db \
  --collection inquiricoes \
  --file /docker-entrypoint-initdb.d/inquiricoes.json \
  --jsonArray \
  --drop

echo "Importação concluída."