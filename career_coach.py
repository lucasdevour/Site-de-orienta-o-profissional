from typing import Dict, Any, Optional, List
from job_matcher import analisar_compatibilidade


def gerar_kit_candidatura(
    vaga: Dict[str, Any],
    curriculo_json: Optional[Dict[str, Any]] = None,
    termos_usuario: str = ""
) -> Dict[str, Any]:
    """
    Integra as skills Injobman (adaptação de currículo + carta de apresentação + 80/20 cards)
    e HireMe (perguntas de entrevista + estrutura STAR + scripts de negociação salarial).
    """
    titulo = vaga.get("titulo", "Profissional")
    empresa = vaga.get("empresa", "sua empresa")
    cidade = vaga.get("cidade", "Brasil")
    descricao = vaga.get("descricao", "")

    # Dados do candidato vindos do banco (curriculos.dados_json)
    curriculo = curriculo_json or {}
    nome = (
        curriculo.get("nome")
        or curriculo.get("nomeCompleto")
        or curriculo.get("name")
        or "Candidato(a)"
    )
    resumo_atual = (
        curriculo.get("resumo")
        or curriculo.get("objetivo")
        or curriculo.get("summary")
        or ""
    )

    match = analisar_compatibilidade(vaga, curriculo_json=curriculo, termos_usuario=termos_usuario)
    matched_kw = match["matched_keywords"]
    missing_kw = match["missing_keywords"]

    foco_competencias = ", ".join((matched_kw + missing_kw)[:5]) or titulo

    # 1. Injobman — Resumo Profissional Adaptado para ATS
    resumo_adaptado = (
        f"Profissional com foco em {titulo}, reunindo sólida vivência prática em "
        f"{foco_competencias}. Histórico comprovado na execução eficiente de rotinas operacionais "
        f"e estratégicas, melhoria contínua de processos e entrega de resultados alinhados às demandas "
        f"de {empresa}."
    )
    if resumo_atual:
        resumo_adaptado += f" ({resumo_atual.strip()[:180]})"

    # 2. Injobman — Bullets de Experiência de Alto Impacto (Fórmula Ação + Contexto + Resultado)
    kw_destaque_1 = matched_kw[0] if len(matched_kw) > 0 else titulo
    kw_destaque_2 = missing_kw[0] if len(missing_kw) > 0 else "processos da área"
    kw_destaque_3 = (matched_kw[1] if len(matched_kw) > 1 else (missing_kw[1] if len(missing_kw) > 1 else "qualidade e prazos"))

    bullets_otimizados = [
        f"• Conduziu rotinas e projetos de {kw_destaque_1}, padronizando fluxos de trabalho e aumentando a eficiência operacional da equipe.",
        f"• Implementou melhorias diretas em {kw_destaque_2}, reduzindo retrabalho e garantindo conformidade com os indicadores da empresa.",
        f"• Atuou de ponta a ponta no controle de {kw_destaque_3}, mantendo alto índice de qualidade no atendimento às demandas internas e externas."
    ]

    # 3. Injobman — Carta de Apresentação Personalizada
    carta_apresentacao = (
        f"Prezada equipe de Recrutamento da {empresa},\n\n"
        f"Escrevo para apresentar minha candidatura à vaga de {titulo} ({cidade}). "
        f"Acompanho a atuação da {empresa} e identifico forte alinhamento entre os desafios descritos para a posição "
        f"e minha trajetória prática em {foco_competencias}.\n\n"
        f"Ao longo da minha experiência, desenvolvi domínio direto nas rotinas essenciais para esta função, "
        f"com foco em organização, cumprimento rigoroso de metas e resolução ágil de problemas no dia a dia. "
        f"Estou preparado(a) para agregar valor imediato à equipe e contribuir ativamente para os resultados da área.\n\n"
        f"Agradeço a atenção e coloco-me à disposição para uma entrevista.\n\n"
        f"Atenciosamente,\n"
        f"{nome}"
    )

    # 4. HireMe + Injobman — Cartões 80/20 de Perguntas de Entrevista + Estrutura STAR
    perguntas_entrevista: List[Dict[str, str]] = [
        {
            "categoria": "Técnica / Rotina da Vaga (Prioridade Alta)",
            "pergunta": f"Como você lida na prática com as demandas de {kw_destaque_1} e {kw_destaque_2} no dia a dia?",
            "como_responder_star": (
                f"Situação: Cite um momento real em que precisou organizar ou resolver algo envolvendo {kw_destaque_1}. "
                f"Tarefa: Qual era a meta ou prazo. "
                f"Ação: Explique o passo a passo técnico que VOCÊ executou. "
                f"Resultado: Destaque o ganho (tempo economizado, erro evitado ou meta batida)."
            )
        },
        {
            "categoria": "Resolução de Problemas (Prioridade Alta)",
            "pergunta": f"Conte sobre um imprevisto ou urgência que você enfrentou atuando na área de {titulo} e como solucionou.",
            "como_responder_star": (
                "Foque 50% da resposta na AÇÃO (como você diagnosticou a causa raiz, comunicou os envolvidos "
                "e resolveu sem comprometer a entrega) e 25% no RESULTADO final."
            )
        },
        {
            "categoria": "Alinhamento Cultural & Empresa",
            "pergunta": f"Por que você quer trabalhar como {titulo} especificamente na {empresa}?",
            "como_responder_star": (
                f"Conecte a reputação da {empresa} em {cidade} com sua experiência em {foco_competencias}, "
                "mostrando que você já domina a base necessária para gerar resultado rápido."
            )
        }
    ]

    # 5. HireMe — Scripts Palavra por Palavra de Negociação Salarial
    scripts_negociacao = {
        "pretensao_inicial": (
            f"\"Estou bastante entusiasmado(a) com a oportunidade de atuar como {titulo} na {empresa}. "
            f"Antes de fechar um número fixo, gostaria de entender qual é a faixa salarial e o pacote de benefícios "
            f"aprovados para esta posição, pois avalio a proposta pelo conjunto total.\""
        ),
        "contraproposta": (
            f"\"Muito obrigado(a) pela proposta! Analisei todo o escopo de responsabilidades para a vaga de {titulo} "
            f"— especialmente a atuação direta com {foco_competencias}. Considerando minha experiência prática para "
            f"gerar resultado desde o primeiro mês, conseguimos ajustar o salário base em cerca de 10% a 15%? "
            f"Com esse ajuste, fecho com vocês imediatamente.\""
        )
    }

    return {
        "vaga": {
            "titulo": titulo,
            "empresa": empresa,
            "cidade": cidade
        },
        "match": match,
        "injobman": {
            "resumo_ats": resumo_adaptado,
            "bullets_curriculo": bullets_otimizados,
            "carta_apresentacao": carta_apresentacao
        },
        "hireme": {
            "perguntas_80_20": perguntas_entrevista,
            "scripts_negociacao": scripts_negociacao
        }
    }
