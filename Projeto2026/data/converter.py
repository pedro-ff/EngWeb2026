import csv
import json
import re
import os
import sys
from datetime import datetime

# --------------------------------------------------------------------------- Caminhos --------------------------------------------------------------------------- #

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_CSV = os.path.join(SCRIPT_DIR, "PT-UM-ADB-DIO-MAB-006.CSV")

if not os.path.exists(INPUT_CSV):
    print(f"ERRO: Ficheiro CSV não encontrado: {INPUT_CSV}")
    sys.exit(1)

OUTPUT_JSON = os.path.join(SCRIPT_DIR, "inquiricoes.json")


# --------------------------------------------------------------------------- Mapeamento de colunas CSV para campos JSON --------------------------------------------------------------------------- #

KEEP_FIELDS = {
    "ID":                   "_id",
    "DescriptionLevel":     "nivel",
    "CompleteUnitId":       "cota_completa",
    "UnitId":               "cota",
    "UnitTitle":            "titulo",
    "UnitDateInitial":      "data_inicial",
    "UnitDateFinal":        "data_final",
    "Dimensions":           "dimensoes",
    "Repository":           "repositorio",
    "GeogName":             "lugar",
    "ScopeContent":         "conteudo",
    "PhysLoc":              "caixa",
    "PhysTech":             "notas_fisicas",
    "RelatedMaterial":      "material_relacionado",
    "Note":                 "nota",
    "Creator":              "criador",
    "Created":              "data_criacao",
    "ProcessInfo":          "info_processo"
}

NIVEL_MAP = {"SR": "serie", "DC": "documento"}


# --------------------------------------------------------------------------- Parsing do título: extrair nome do requerente --------------------------------------------------------------------------- #

def extrair_requerente(titulo: str) -> str:
    """
    'Inquirição de genere de António Bras' → 'António Bras'
    Também captura variantes sem acento: 'Inquiricao de genere de ...'
    """
    m = re.search(
        r"[Ii]nquiri[çc][aã]o\s+de\s+[Gg]enere\s+de\s+(.+)",
        titulo or "",
    )
    return m.group(1).strip() if m else ""

# --------------------------------------------------------------------------- Datas --------------------------------------------------------------------------- #

def separar_data_hora(valor: str) -> tuple:
    """
    Recebe string tipo '14/04/2014 14:48:04'
    Retorna ('2014-04-14', '14:48:04')
    """
    if not valor:
        return "", ""

    try:
        dt = datetime.strptime(valor, "%d/%m/%Y %H:%M:%S")
        data = dt.strftime("%Y-%m-%d")
        hora = dt.strftime("%H:%M:%S")
        return data, hora
    except ValueError:
        return valor, ""

# --------------------------------------------------------------------------- Parsing do ScopeContent --------------------------------------------------------------------------- #

def extrair_localizacao(conteudo: str) -> dict:
    out = {
        "freguesia": "",
        "concelho": "",
        "distrito": "",
    }

    if not conteudo:
        return out

    # aceita "em" ou "de"
    m = re.search(
        r"Natural\s+e/ou\s+residente\s+(?:em|de)\s+"
        r"(.+?)"
        r",\s*actual\s+concelho\s+de\s+"
        r"(.+?)"
        r"\s+e\s+distrito\s+\(ou\s+pa[ií]s\)\s+"
        r"([^\.\"]+)",
        conteudo,
        re.IGNORECASE,
    )

    if not m:
        return out

    loc_raw = m.group(1).strip()
    concelho = m.group(2).strip()
    distrito = m.group(3).strip()

    # separar LOCALIDADE,FREGUESIA se existir vírgula
    partes = [p.strip() for p in loc_raw.split(",") if p.strip()]

    if len(partes) >= 2:
        freguesia = f"{partes[0].title()}, {partes[1].title()}"
    else:
        freguesia = partes[0].title()

    out["freguesia"] = freguesia
    out["concelho"] = concelho.title()
    out["distrito"] = distrito.title()

    return out

def extrair_filiacao_e_localidade(conteudo: str) -> dict:
    """
    Extrai campos estruturados do texto livre ScopeContent.

    Formato típico encontrado no CSV:
      "Filiação: <Pai> e <Mãe>. Natural e/ou residente em <LUGAR>,<Freguesia>,
       actual concelho de <CONCELHO> e distrito (ou país) <DISTRITO>."

    Também surgem variantes como:
      "Natural e/ou residente em <LUGAR>-<SUBLOCALIDADE>,<Freguesia>, ..."
    """
    out = {
        "pai": "",
        "mae": "",
    }
    if not conteudo:
        return out

    # ---------------------------------------------------------- Filiação ---------------------------------------------------------- #
    # Captura tudo entre "Filiação:" e o próximo ponto final ou "Natural"
    m_fil = re.search(
        r"Filia[çc][aã]o:\s*(.+?)(?=\.\s*(?:Natural|$)|Natural)",
        conteudo,
        re.IGNORECASE | re.DOTALL,
    )
    if m_fil:
        raw = m_fil.group(1).strip().rstrip(".")
        # Divide em "Pai e Mãe" — divide apenas na primeira ocorrência de " e "
        partes = re.split(r"\s+e\s+", raw, maxsplit=1)
        out["pai"] = partes[0].strip()
        if len(partes) == 2:
            # Remove sufixos adicionais separados por vírgula: "Maria, Solteira" → "Maria"
            out["mae"] = partes[1].strip().split(",")[0].strip()

    return out


def extrair_relacoes(texto: str) -> list:
    """
    Extrai relações com outros processos a partir do ScopeContent e/ou
    RelatedMaterial.

    Padrões vistos:
      "Série Inquirições de genere: Nome,Relação. Proc.123."
      "Nome,Relação. Proc.123."
      (O prefixo 'Série Inquirições de genere:' é ignorado)
    """
    relacoes = []
    if not texto:
        return relacoes

    # Remove o prefixo 'Série Inquirições de genere:' se presente
    texto_limpo = re.sub(
        r"[Ss][eé]rie\s+[Ii]nquiri[çc][õo]es\s+de\s+[Gg]enere:\s*",
        "",
        texto,
    )

    # Padrão: "<Nome>,<Relacao>. Proc.<numero>."
    pattern = re.compile(
        r"([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇÑ][A-Za-záàâãéèêíìîóòôõúùûçñ\s\.]+?)"
        r",\s*"
        r"([A-Za-záàâãéèêíìîóòôõúùûçñ\s]+?)"
        r"\.\s*Proc\.(\d+)",
        re.UNICODE,
    )
    for m in pattern.finditer(texto_limpo):
        relacoes.append({
            "nome":        m.group(1).strip(),
            "relacao":     m.group(2).strip(),
            "proc_numero": int(m.group(3)),
        })

    return relacoes


# --------------------------------------------------------------------------- Conversão principal --------------------------------------------------------------------------- #

def limpar_valor(v: str) -> str:
    """Remove aspas externas e espaços desnecessários."""
    return v.strip().strip('"').strip() if v else ""


def converter():
    registos = []

    print(f"A ler: {INPUT_CSV}")

    with open(INPUT_CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")

        for row in reader:
            row_clean = {k: limpar_valor(v) for k, v in row.items()}

            # ----------------------------------------------- Campos base ----------------------------------------------- #
            doc = {}
            for csv_col, json_field in KEEP_FIELDS.items():
                val = row_clean.get(csv_col, "")
                if val:
                    doc[json_field] = val

            if "data_criacao" in doc:
                data, hora = separar_data_hora(doc["data_criacao"])
                doc["data_criacao"] = data
                if hora:
                    doc["hora_criacao"] = hora

            # _id como inteiro
            if "_id" in doc:
                try:
                    doc["_id"] = int(doc["_id"])
                except ValueError:
                    pass

            # Número do processo sem zeros à esquerda (útil para pesquisa)
            if "cota" in doc:
                try:
                    doc["proc_numero"] = int(doc["cota"])
                except ValueError:
                    doc["proc_numero"] = doc["cota"]

            # Nível legível
            if "nivel" in doc:
                doc["nivel"] = NIVEL_MAP.get(doc["nivel"], doc["nivel"])

            # ------------------------------------------ Campos derivados ------------------------------------------ #
            doc["requerente"] = extrair_requerente(doc.get("titulo", ""))

            fil = extrair_filiacao_e_localidade(doc.get("conteudo", ""))
            doc["pai"]        = fil["pai"]
            doc["mae"]        = fil["mae"]

            loc = extrair_localizacao(doc.get("conteudo", ""))
            doc["freguesia"] = loc["freguesia"]
            doc["concelho"]  = loc["concelho"]
            doc["distrito"]  = loc["distrito"]

            # Relações: combina ScopeContent + RelatedMaterial
            texto_relacoes = (
                doc.get("conteudo", "") + " " + doc.get("material_relacionado", "")
            )
            relacoes = extrair_relacoes(texto_relacoes)
            if relacoes:
                doc["relacoes"] = relacoes

            # Remove campos vazios para não poluir o documento MongoDB
            doc = {k: v for k, v in doc.items() if v != "" and v != [] and v is not None}

            registos.append(doc)

    # Escrever JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(registos, f, ensure_ascii=False, indent=2)

    # Estatísticas
    total        = len(registos)
    series       = sum(1 for r in registos if r.get("nivel") == "serie")
    docs         = sum(1 for r in registos if r.get("nivel") == "documento")
    com_pai      = sum(1 for r in registos if r.get("pai"))
    com_relacoes = sum(1 for r in registos if "relacoes" in r)

    # Só para debug, para ver se correu tudo bem
    print(f"\nConversao concluida!")
    print(f"  Total de registos  : {total}")
    print(f"  Series             : {series}")
    print(f"  Documentos         : {docs}")
    print(f"  Com filiacao (pai) : {com_pai}")
    print(f"  Com relacoes       : {com_relacoes}")
    print(f"  Output             : {OUTPUT_JSON}")
    print(f"\nPara importar no MongoDB:")
    print(f"  mongoimport --db inquiricoes --collection processos \\")
    print(f"    --file data/inquiricoes.json --jsonArray")


if __name__ == "__main__":
    converter()