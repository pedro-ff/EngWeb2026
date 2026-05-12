// ------------------------------------------------------------- Script de importação das Inquirições de Génere para MongoDB ------------------------------------------------------------- //
// Seleccionar (ou criar) a base de dados
use("inquiricoes_db");

print("A criar índices...");

// ------------------------------------------------------------------ ÍNDICES ------------------------------------------------------------------ //

// Índice antroponímico — pesquisa por nome do requerente, pai e mãe
db.inquiricoes.createIndex({ requerente: 1 });
db.inquiricoes.createIndex({ pai: 1 });
db.inquiricoes.createIndex({ mae: 1 });

// Índice toponímico — pesquisa por freguesia, concelho, distrito
db.inquiricoes.createIndex({ freguesia: 1 });
db.inquiricoes.createIndex({ concelho: 1 });
db.inquiricoes.createIndex({ distrito: 1 });

// Índice cronológico — pesquisa e ordenação por data (da inquirição ou do registo)
db.inquiricoes.createIndex({ data_inicial: 1 });
db.inquiricoes.createIndex({ data_final: 1 });
db.inquiricoes.createIndex({ data_criacao: 1 });

// Índice de navegação por número de processo (único)
db.inquiricoes.createIndex({ proc_numero: 1 }, { unique: true });

// Índice de texto completo para pesquisa livre
db.inquiricoes.createIndex(
  {
    titulo: "text",
    requerente: "text",
    conteudo: "text",
    pai: "text",
    mae: "text",
  },
  { name: "texto_completo" }
);

// Índice nas relações genealógicas (subdocumento)
db.inquiricoes.createIndex({ "relacoes.nome": 1 });
db.inquiricoes.createIndex({ "relacoes.relacao": 1 });
db.inquiricoes.createIndex({ "relacoes.proc_numero": 1 });

print("Índices criados com sucesso.");