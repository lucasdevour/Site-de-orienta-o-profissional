import re
import urllib.parse
from typing import Dict, Any, List
from job_matcher import normalizar

# Plataformas e domínios de recrutamento verificados e confiáveis
TRUSTED_DOMAINS = (
    "vagas.com.br",
    "linkedin.com",
    "indeed.com",
    "solides.com.br",
    "gupy.io",
    "catho.com.br",
    "infojobs.com.br",
    "trampos.co",
    "greenhouse.io",
    "lever.co",
    "workday.com"
)

SUSPICIOUS_TLDS = (".xyz", ".top", ".click", ".loan", ".work", ".gq", ".tk", ".ml")

# Padrões de cobrança indevida ao candidato (Fase 4 RecruitXray: Business Model Risk)
FEE_RED_FLAGS = [
    r"taxa de (cadastro|inscricao|adesao|material|certificado|exame)",
    r"pagar (curso|treinamento|material|exame|certificado)",
    r"pagamento antecipado",
    r"investimento inicial",
    r"compre o (kit|material|acesso)",
    r"upfront fee",
    r"training fee"
]

# Padrões clássicos de golpe / phishing / vaga falsa (Fase 5 RecruitXray: Scam Signals)
SCAM_RED_FLAGS = [
    r"ganhos? (rapidos?|faceis|garantidos?|diarios?)",
    r"renda extra imediata",
    r"trabalhe apenas \d+ minutos",
    r"envie (foto do cartao|senha|codigo|pix)",
    r"deposito caucao",
    r"sem experiencia ganhando acim?a de",
    r"whatsapp urgente",
    r"garantia de emprego"
]


def auditar_vaga_recruitxray(vaga: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executa a auditoria forense RecruitXray (Fases 1 a 9 condensadas em tempo real)
    para calcular o Risk Score (0-100) e detectar vagas fantasmas, golpes ou cobranças indevidas.
    """
    titulo = str(vaga.get("titulo", "")).strip()
    empresa = str(vaga.get("empresa", "")).strip()
    descricao = str(vaga.get("descricao", "")).strip()
    link = str(vaga.get("link", "")).strip()
    plataforma = str(vaga.get("plataforma", "")).strip()

    texto_completo = normalizar(f"{titulo} {empresa} {descricao}")
    empresa_norm = normalizar(empresa)

    risk_score = 10  # Risco base mínimo
    red_flags: List[str] = []
    positive_signals: List[str] = []

    # 1. Fase 1 & 2: Auditoria de Domínio / Plataforma
    dominio = ""
    if link:
        try:
            parsed = urllib.parse.urlparse(link)
            dominio = parsed.netloc.lower()
        except Exception:
            dominio = ""

    if any(td in dominio for td in TRUSTED_DOMAINS):
        positive_signals.append(f"Hospedada em plataforma verificada ({dominio}).")
        risk_score -= 5
    elif any(dominio.endswith(tld) for tld in SUSPICIOUS_TLDS):
        red_flags.append(f"Domínio com extensão de alto risco de phishing ({dominio}).")
        risk_score += 35
    elif not dominio:
        red_flags.append("Link direto da vaga não informado ou não auditável.")
        risk_score += 12

    # 2. Fase 4: Transparência da Empresa Contratante
    if not empresa or "confidencial" in empresa_norm or "parceira" in empresa_norm or "oculto" in empresa_norm:
        red_flags.append("Empresa contratante oculta ('Confidencial') — dificulta verificação prévia de reputação.")
        risk_score += 18
    else:
        positive_signals.append(f"Empresa contratante identificada explicitamente ({empresa}).")

    # 3. Fase 4 & 5: Detecção de Cobrança de Taxas (Red Flag Crítico)
    for padrao in FEE_RED_FLAGS:
        if re.search(padrao, texto_completo):
            red_flags.append("ALERTA CRÍTICO: Menção a cobrança de taxa, curso ou material pago para participar do processo.")
            risk_score += 50
            break

    # 4. Fase 5: Detecção de Sinais de Golpe / Promessas Irreais
    for padrao in SCAM_RED_FLAGS:
        if re.search(padrao, texto_completo):
            red_flags.append("Sinal de golpe detectado: promessa de ganhos fáceis/imediatos ou solicitação suspeita.")
            risk_score += 45
            break

    # 5. Fase 6: Consistência e Detalhamento da Descrição
    if len(descricao) < 30:
        red_flags.append("Descrição da vaga muito curta ou genérica — possível vaga fantasma ou anúncio incompleto.")
        risk_score += 15
    else:
        positive_signals.append("Escopo e resumo das atividades descritos de forma clara.")

    if "simulacao" in normalizar(plataforma):
        red_flags.append("Vaga de demonstração/simulação (fallback de busca).")
        risk_score += 15

    # Limita o score entre 5 e 100
    risk_score = max(5, min(100, risk_score))

    # Classificação final (Fase 8: Riskometer)
    if risk_score <= 30:
        risk_category = "LOW"
        badge_label = "🟢 Baixo Risco"
        brutal_truth = f"Vaga legítima em canal confiável ({empresa or plataforma}). Seguro prosseguir com a candidatura."
    elif risk_score <= 60:
        risk_category = "MEDIUM"
        badge_label = "🟡 Risco Moderado"
        brutal_truth = "A vaga parece real, mas omite dados da empresa ou detalhes técnicos. Confirme a identidade do recrutador."
    else:
        risk_category = "HIGH"
        badge_label = "🔴 Alto Risco"
        brutal_truth = "Foram detectados sinais graves de alerta (possível cobrança indevida, vaga fantasma ou link suspeito)."

    # Fase 9: Próximos passos recomendados ao candidato
    next_steps = [
        "Nunca pague qualquer taxa por exames preliminares, cursos, certificados ou cadastro.",
        "Não envie documentos sensíveis (fotos de RG/CNH, dados bancários) antes da entrevista formal e aprovação.",
        f"Pesquise '{empresa}' no LinkedIn e Glassdoor para validar avaliações de funcionários reais."
        if empresa and "confidencial" not in empresa_norm
        else "Durante o primeiro contato, pergunte o CNPJ e razão social da empresa contratante."
    ]

    return {
        "risk_score": risk_score,
        "risk_category": risk_category,
        "badge_label": badge_label,
        "brutal_truth": brutal_truth,
        "red_flags": red_flags,
        "positive_signals": positive_signals,
        "next_steps": next_steps
    }
