import re
import unicodedata
from typing import Dict, Any, List, Optional

# Stopwords em português e inglês para filtragem de palavras-chave relevantes
STOPWORDS = {
    "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
    "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "sob", "sobre",
    "e", "ou", "mas", "se", "como", "que", "qual", "quais", "quem", "onde", "quando",
    "ser", "estar", "ter", "haver", "fazer", "ir", "vir", "ver", "dar", "saber",
    "ao", "aos", "pelo", "pela", "pelos", "pelas", "este", "esta", "esse", "essa",
    "isso", "isto", "aquele", "aquela", "seu", "sua", "seus", "suas", "meu", "minha",
    "nosso", "nossa", "mais", "menos", "muito", "pouco", "todo", "toda", "todos", "todas",
    "outro", "outra", "mesmo", "mesma", "tambem", "ja", "ainda", "so", "apenas",
    "vaga", "vagas", "empresa", "trabalho", "trabalhar", "area", "atuar", "atuacao",
    "experiencia", "conhecimento", "conhecimentos", "requisitos", "atividades", "ensino",
    "completo", "cursando", "desejavel", "diferencial", "necessario", "horario", "salario",
    "beneficios", "local", "regiao", " vaga ", "the", "and", "or", "in", "of", "to", "for",
    "with", "on", "at", "from", "by", "an", "be", "is", "are", "was", "were", "will"
}

# Catálogo de competências técnicas e profissionais de alto valor (ATS)
ATS_SKILLS_CATALOG = [
    # Administração, RH e Finanças
    "recursos humanos", "rh", "recrutamento", "selecao", "dp", "departamento pessoal",
    "folha de pagamento", "admissao", "demissao", "beneficios", "treinamento", "onboarding",
    "financeiro", "contas a pagar", "contas a receber", "fluxo de caixa", "conciliacao",
    "faturamento", "nota fiscal", "contabilidade", "fiscal", "controladoria", "fp&a",
    "orcamento", "dre", "auditoria", "compras", "suprimentos", "logistica", "estoque",
    # Tecnologia e Dados
    "excel", "power bi", "sql", "python", "javascript", "react", "node", "java", "c#",
    "php", "html", "css", "git", "aws", "docker", "linux", "sap", "totvs", "protheus",
    "sankhya", "senior", "solides", "gupy", "erp", "crm", "salesforce", "tableau",
    "machine learning", " ciencia de dados", "analise de dados", "etl", "automacao",
    # Operacional, Engenharia e Manutenção
    "eletricista", "manutencao eletrica", "instalacao", "nr10", "nr35", "mecanico",
    "automacao industrial", "clp", "comandos eletricos", "preventiva", "corretiva",
    "seguranca do trabalho", "tst", "qualidade", "iso 9001", "5s", "lean", "kaizen",
    "engenharia", "autocad", "solidworks", "projetos", "producao", "pcp",
    # Comercial, Atendimento e Marketing
    "vendas", "comercial", "atendimento", "negociacao", "prospeccao", "pos-venda",
    "licitacao", "marketing", "redes sociais", "trafego pago", "copywriting", "design"
]


def normalizar(texto: str) -> str:
    if not texto:
        return ""
    texto = unicodedata.normalize("NFKD", str(texto))
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return texto.lower().strip()


def extrair_texto_curriculo(curriculo_json: Optional[Dict[str, Any]], termos_usuario: str = "") -> str:
    """Converte o JSON flexível do currículo salvo no banco + termos do bot em um texto único normalizado."""
    partes = []
    if termos_usuario:
        partes.append(termos_usuario)

    if curriculo_json and isinstance(curriculo_json, dict):
        for chave, valor in curriculo_json.items():
            if chave in ("senha", "email", "telegram_token"):
                continue
            if isinstance(valor, str):
                partes.append(valor)
            elif isinstance(valor, list):
                for item in valor:
                    if isinstance(item, dict):
                        partes.extend(str(v) for v in item.values() if v)
                    elif item:
                        partes.append(str(item))
            elif isinstance(valor, dict):
                partes.extend(str(v) for v in valor.values() if v)

    return normalizar(" ".join(partes))


def extrair_keywords_relevantes(texto_vaga: str) -> List[str]:
    """Extrai competências do catálogo ATS e tokens relevantes da descrição/título da vaga."""
    texto_norm = normalizar(texto_vaga)
    encontradas = []

    # 1. Verifica expressões compostas e skills do catálogo ATS
    for skill in ATS_SKILLS_CATALOG:
        skill_norm = normalizar(skill)
        padrao = r"\b" + re.escape(skill_norm) + r"\b"
        if re.search(padrao, texto_norm):
            encontradas.append(skill_norm)

    # 2. Extrai palavras substantivas do título/descrição (mínimo 4 letras, sem stopwords)
    tokens = re.findall(r"[a-z0-9+#]{4,}", texto_norm)
    for tok in tokens:
        if tok not in STOPWORDS and tok not in encontradas and not tok.isdigit():
            encontradas.append(tok)

    return encontradas[:18]


def analisar_compatibilidade(
    vaga: Dict[str, Any],
    curriculo_json: Optional[Dict[str, Any]] = None,
    termos_usuario: str = ""
) -> Dict[str, Any]:
    """
    Executa a análise Job Matcher (ATS Score, Keywords Presentes, Gaps e Ação Recomendada).
    """
    titulo = vaga.get("titulo", "")
    descricao = vaga.get("descricao", "")
    nivel = vaga.get("nivel", "")
    termo_busca = vaga.get("termo", "")

    texto_vaga = f"{titulo} {descricao} {nivel} {termo_busca}"
    texto_candidato = extrair_texto_curriculo(curriculo_json, termos_usuario)

    keywords_vaga = extrair_keywords_relevantes(texto_vaga)
    if not keywords_vaga:
        keywords_vaga = [normalizar(termo_busca)] if termo_busca else ["geral"]

    matched = []
    missing = []

    for kw in keywords_vaga:
        if kw and kw in texto_candidato:
            matched.append(kw)
        else:
            missing.append(kw)

    # Bônus se o termo principal buscado está no título da vaga
    termo_no_titulo = normalizar(termo_busca) in normalizar(titulo) if termo_busca else False

    total_kw = len(keywords_vaga)
    proporcao = len(matched) / max(total_kw, 1)

    # Cálculo ponderado estilo ATS (base 45% se o cargo bate com a busca + até 53% pelas keywords)
    base_score = 52 if termo_no_titulo else 38
    raw_score = int(round(base_score + (proporcao * 46)))
    score = max(35, min(98, raw_score))

    if score >= 82:
        tier = "Excelente"
        emoji_tier = "🟢"
    elif score >= 68:
        tier = "Forte"
        emoji_tier = "🔵"
    elif score >= 52:
        tier = "Moderado"
        emoji_tier = "🟡"
    else:
        tier = "Baixo"
        emoji_tier = "🔴"

    # Dica prática de adaptação (Tailoring Action)
    if missing:
        top_missing = ", ".join(missing[:3])
        acao = f"Inclua no currículo experiências ou termos como: {top_missing}."
    else:
        acao = "Seu perfil cobre os termos principais! Destaque resultados numéricos na candidatura."

    return {
        "match_score": score,
        "match_tier": tier,
        "emoji_tier": emoji_tier,
        "matched_keywords": matched[:6],
        "missing_keywords": missing[:5],
        "tailoring_action": acao,
        "tem_curriculo_completo": bool(curriculo_json)
    }
