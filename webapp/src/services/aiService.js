const API_KEY = 'sk-bff7148ba8d946af91a330def7da651a';
const API_URL = 'https://api.deepseek.com/chat/completions';

export async function otimizarCurriculo(dadosCurriculo, descricaoVaga) {
  const prompt = `
Você é um especialista em recrutamento e sistemas ATS (Applicant Tracking System) como Gupy e Sólides.
Abaixo estão os dados do currículo do candidato e a descrição da vaga que ele quer aplicar.

Dados do Candidato:
Momento: ${dadosCurriculo.momento}
Resumo: ${dadosCurriculo.resumo}
Experiências: ${dadosCurriculo.experiencias}

Descrição da Vaga:
${descricaoVaga}

Sua tarefa:
1. Identifique quais são as palavras-chave críticas da descrição da vaga (habilidades, ferramentas, requisitos).
2. Verifique se elas estão presentes no currículo.
3. Forneça uma lista curta (bullet points) das palavras-chave ou termos que ESTÃO FALTANDO no currículo e que o candidato deveria tentar adicionar (caso ele tenha essa experiência) para aumentar seu 'match' no sistema ATS.
4. Seja direto e objetivo, sem enrolação. Responda apenas com a lista de sugestões.
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
          { role: 'system', content: 'Você é um assistente focado em otimização de currículos.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro ao conectar com a API');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro na otimização:', error);
    throw error;
  }
}
