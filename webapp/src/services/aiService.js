const API_KEY = 'sk-bff7148ba8d946af91a330def7da651a';
const API_URL = 'https://api.deepseek.com/chat/completions';
const BACKEND_URL = 'https://site-de-orienta-o-profissional-1.onrender.com/api';

export async function otimizarCurriculo(dadosCurriculo, descricaoVaga) {
  const prompt = `
Você é um especialista brasileiro em recrutamento e sistemas ATS (Gupy, Sólides, Vagas.com.br, Kenoby).
Abaixo estão os dados do currículo do candidato e a descrição da vaga que ele quer aplicar.

Dados do Candidato:
Momento: ${dadosCurriculo.situacao || dadosCurriculo.momento || ''}
Objetivo: ${dadosCurriculo.objetivo || dadosCurriculo.resumo || ''}
Experiências: ${dadosCurriculo.experiencias || `${dadosCurriculo.cargo1 || ''}: ${dadosCurriculo.funcoes1 || ''} | ${dadosCurriculo.cargo2 || ''}: ${dadosCurriculo.funcoes2 || ''}`}
Cursos/Extras: ${dadosCurriculo.cursos || ''} ${dadosCurriculo.adicionais || ''}

Descrição da Vaga:
${descricaoVaga}

Sua tarefa:
1. Calcule uma estimativa de Match ATS (0 a 100%).
2. Liste as palavras-chave que o candidato JÁ TEM.
3. Liste as palavras-chave que FALTAM no currículo para passar na triagem da Gupy/Sólides.
4. Dê um passo a passo prático do que ele deve alterar no currículo hoje para ser chamado para a entrevista.
`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Você é um especialista brasileiro em currículos ATS, Gupy e Sólides.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao conectar com a IA');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro na otimização:', error);
    throw error;
  }
}

/**
 * Motor Injobman + HireMe Brasil:
 * Gera uma NOVA versão do currículo do candidato moldada para a vaga escolhida
 * (pronta para exportar em PDF/DOCX pelo exportService.js) + Plano de Ação de Match + Entrevista STAR.
 */
export async function gerarCurriculoSobMedidaIA(formData, vagaObj) {
  const tituloVaga = vagaObj.titulo || 'Vaga Alvo';
  const empresaVaga = vagaObj.empresa || 'Empresa Contratante';
  const descVaga = vagaObj.descricao || tituloVaga;

  const prompt = `
Você é o motor integrado Injobman + HireMe + Job Matcher adaptado para o mercado de trabalho do Brasil (Gupy, Sólides, Vagas.com, CLT/PJ).
Analise o currículo atual do candidato e a vaga escolhida. Gere uma versão otimizada do currículo para que ele tenha o maior Match possível sem inventar empresas falsas (apenas reescreva o objetivo, as funções realizadas e habilidades usando linguagem forte de resultados e palavras-chave da vaga).

CURRÍCULO ATUAL DO CANDIDATO:
Nome: ${formData.nome || 'Candidato'}
Objetivo atual: ${formData.objetivo || ''}
Formação: ${formData.formacao || ''}
Experiência 1: Cargo "${formData.cargo1 || ''}" na empresa "${formData.empresa1 || ''}" - Funções: ${formData.funcoes1 || ''}
Experiência 2: Cargo "${formData.cargo2 || ''}" na empresa "${formData.empresa2 || ''}" - Funções: ${formData.funcoes2 || ''}
Cursos: ${formData.cursos || ''}
Informações Adicionais: ${formData.adicionais || ''}

VAGA ESCOLHIDA:
Cargo: ${tituloVaga}
Empresa: ${empresaVaga}
Cidade: ${vagaObj.cidade || formData.cidade || 'Brasil'}
Descrição/Requisitos: ${descVaga}

Retorne APENAS um JSON válido (sem markdown \`\`\`json) exatamente com esta estrutura:
{
  "match_atual": 65,
  "match_pos_otimizacao": 94,
  "pontos_fortes": ["habilidade 1", "habilidade 2"],
  "gaps_faltantes": ["termo faltante 1", "termo faltante 2"],
  "o_que_fazer_para_match": [
    "Ação prática 1 para aumentar o match nesta vaga",
    "Ação prática 2 (ex: destacar vivência em X ou curso rápido de Y)",
    "Ação prática 3"
  ],
  "curriculo_otimizado": {
    "objetivo": "Novo objetivo profissional focado no cargo ${tituloVaga} e palavras-chave ATS",
    "funcoes1": "Linha 1 reescrita com verbo de ação e palavra-chave da vaga\\nLinha 2 focada em resultado\\nLinha 3 alinhada aos requisitos",
    "funcoes2": "Linha 1 otimizada\\nLinha 2 otimizada",
    "adicionais": "Resumo de competências-chave e diferenciais para o ATS (separados por tópicos)"
  },
  "carta_apresentacao": "Texto completo de carta de apresentação / mensagem para recrutador no LinkedIn ou Gupy em português",
  "perguntas_entrevista": [
    {
      "pergunta": "Pergunta técnica/comportamental muito provável para ${tituloVaga}",
      "resposta_star": "Roteiro de como responder usando Situação, Tarefa, Ação e Resultado com base no currículo do candidato"
    },
    {
      "pergunta": "Segunda pergunta provável do gestor ou RH",
      "resposta_star": "Roteiro STAR prático"
    }
  ],
  "script_pretensao_salarial": "Script palavra por palavra de como responder sobre pretensão salarial e negociar proposta para ${tituloVaga} no Brasil"
}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Responda apenas com JSON válido em português do Brasil.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.35
      })
    });

    if (response.ok) {
      const data = await response.json();
      const raw = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Fallback para motor Python Career Coach:', err);
  }

  // Fallback seguro via Backend Python (/api/preparar-candidatura)
  const resBack = await fetch(`${BACKEND_URL}/preparar-candidatura`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...vagaObj,
      email: formData.email,
      curriculo: formData,
      termos: formData.objetivo || tituloVaga
    })
  });
  const kit = await resBack.json();

  return {
    match_atual: kit.match?.match_score || 70,
    match_pos_otimizacao: Math.min(98, (kit.match?.match_score || 70) + 22),
    pontos_fortes: kit.match?.matched_keywords || [tituloVaga],
    gaps_faltantes: kit.match?.missing_keywords || [],
    o_que_fazer_para_match: [
      kit.match?.tailoring_action || `Adicione os termos específicos de ${tituloVaga} no seu objetivo e experiências.`,
      `Destaque resultados práticos e sistemas utilizados na função de ${tituloVaga}.`,
      `Personalize o título do seu Objetivo Profissional exatamente como "${tituloVaga}" antes de enviar na plataforma.`
    ],
    curriculo_otimizado: {
      objetivo: `${tituloVaga} — ${kit.injobman?.resumo_ats || ''}`,
      funcoes1: (kit.injobman?.bullets_curriculo || []).join('\n').replace(/•\s*/g, ''),
      funcoes2: formData.funcoes2 || '',
      adicionais: `${formData.adicionais ? formData.adicionais + '\n' : ''}Competências em destaque para ${tituloVaga}: ${(kit.match?.matched_keywords || []).concat(kit.match?.missing_keywords || []).join(', ')}.`
    },
    carta_apresentacao: kit.injobman?.carta_apresentacao || '',
    perguntas_entrevista: (kit.hireme?.perguntas_80_20 || []).map(p => ({
      pergunta: p.pergunta,
      resposta_star: p.como_responder_star
    })),
    script_pretensao_salarial: `${kit.hireme?.scripts_negociacao?.pretensao_inicial || ''}\n\nContraproposta:\n${kit.hireme?.scripts_negociacao?.contraproposta || ''}`
  };
}
