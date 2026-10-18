import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  FileDown,
  FileText,
  Copy,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { otimizarCurriculo, gerarCurriculoSobMedidaIA } from '../services/aiService';
import { exportToPDF, exportToWord } from '../services/exportService';

const API_URL = 'https://site-de-orienta-o-profissional-1.onrender.com/api';

const INICIAL_DATA = {
  nome: '', idade: '', nacionalidade: 'Brasileiro(a)', estado_civil: 'Solteiro(a)',
  rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  tel1: '', tel2: '', email: '', linkedin: '', cnh: '',
  situacao: '', busca: '', nivel_estudo: '', exp_area: '',
  objetivo: '', resumo: '', habilidades: '', formacao: '', idiomas: '',
  empresa1: '', periodo1: '', cargo1: '', funcoes1: '',
  empresa2: '', periodo2: '', cargo2: '', funcoes2: '',
  empresa3: '', periodo3: '', cargo3: '', funcoes3: '',
  cursos: '', adicionais: ''
};

const TEMPLATES = [
  { id: '1', nome: 'Clássico Corporativo (ATS Recomendado)', desc: 'Padrão ouro para Gupy, Sólides e grandes empresas brasileiras.', badge: 'Mais Aprovado em ATS' },
  { id: '8', nome: 'Tradicional Forte (ATS Puro)', desc: 'Títulos em caixa alta limpa, 100% legível por qualquer robô de triagem.', badge: 'Ideal Gupy' },
  { id: '2', nome: 'Moderno Minimalista', desc: 'Alinhado à esquerda, espaçado e focado em leitura rápida de recrutadores.', badge: 'Startups & Tech' },
  { id: '3', nome: 'Executivo Enxuto (1 Página)', desc: 'Margens otimizadas para caber até 3 experiências em uma única folha A4.', badge: 'Compacto' },
  { id: '10', nome: 'Profissional Tech & Dados', desc: 'Destaques em azul royal para áreas de TI, Engenharia, BI e Produto.', badge: 'Tecnologia' },
  { id: '4', nome: 'Corporativo Azul', desc: 'Toques de azul escuro nos títulos para um visual executivo moderno.' },
  { id: '5', nome: 'Elegante Esmeralda', desc: 'Destaques sóbrios em verde escuro para áreas financeiras, saúde e agro.' },
  { id: '6', nome: 'Destaque Lateral', desc: 'Cabeçalho alinhado à direita com forte presença visual.' },
  { id: '7', nome: 'Impacto Jovem / 1º Emprego', desc: 'Ideal para estágio, jovem aprendiz e início de carreira.' },
  { id: '9', nome: 'Soft Minimal', desc: 'Divisórias suaves e tipografia leve para áreas criativas e comerciais.' }
];

const STEP_LABELS = [
  { num: 1, title: 'Dados & Contato' },
  { num: 2, title: 'Objetivo, Resumo & Skills' },
  { num: 3, title: 'Experiências & Cursos' },
  { num: 4, title: 'IA, Gupy & Exportação' }
];

export default function Stepper() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => ({
    ...INICIAL_DATA,
    email: localStorage.getItem('userEmail') || ''
  }));
  const [isLoaded, setIsLoaded] = useState(false);

  // AI States
  const [tituloVagaAlvo, setTituloVagaAlvo] = useState('');
  const [vaga, setVaga] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSugestoes, setAiSugestoes] = useState('');
  const [pacoteSobMedida, setPacoteSobMedida] = useState(null);
  const [aplicadoSucesso, setAplicadoSucesso] = useState(false);

  // Gallery States
  const [copiedSection, setCopiedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('modelos'); // 'modelos' | 'ia' | 'copia'

  useEffect(() => {
    const carregarDados = async () => {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        setIsLoaded(true);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/curriculo/${email}`);
        if (response.ok) {
          const data = await response.json();
          if (Object.keys(data).length > 0) setFormData(prev => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    carregarDados();
  }, []);

  const salvarDados = async (dadosCustom = null) => {
    try {
      const payload = dadosCustom || formData;
      if (!payload.email) return;
      await fetch(`${API_URL}/curriculo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error('Erro ao salvar:', e);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      salvarDados();
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, isLoaded]);

  const handleNext = async () => {
    await salvarDados();
    setStep(s => Math.min(s + 1, 4));
  };

  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGerarSobMedida = async () => {
    if (!vaga.trim()) return alert('Cole a descrição da vaga primeiro.');
    setLoadingAi(true);
    setPacoteSobMedida(null);
    setAiSugestoes('');
    setAplicadoSucesso(false);
    try {
      const res = await gerarCurriculoSobMedidaIA(formData, {
        titulo: tituloVagaAlvo || formData.objetivo || 'Vaga Alvo',
        empresa: 'Empresa Recrutadora',
        localizacao: formData.cidade || 'Brasil',
        descricao: vaga
      });
      setPacoteSobMedida(res);
    } catch (error) {
      try {
        const comp = { ...formData, resumo: formData.resumo || formData.objetivo, experiencias: `${formData.funcoes1} ${formData.funcoes2}` };
        const sugestoes = await otimizarCurriculo(comp, vaga);
        setAiSugestoes(sugestoes);
      } catch (err2) {
        alert('Erro ao otimizar com IA: ' + err2.message);
      }
    } finally {
      setLoadingAi(false);
    }
  };

  const aplicarPacoteAoCurriculo = async () => {
    if (!pacoteSobMedida) return;
    const novo = {
      ...formData,
      objetivo: pacoteSobMedida.objetivo_otimizado || formData.objetivo,
      resumo: pacoteSobMedida.resumo_otimizado || formData.resumo,
      habilidades: pacoteSobMedida.habilidades_otimizadas || formData.habilidades,
      funcoes1: pacoteSobMedida.funcoes1_otimizadas || formData.funcoes1,
      funcoes2: pacoteSobMedida.funcoes2_otimizadas || formData.funcoes2,
      funcoes3: pacoteSobMedida.funcoes3_otimizadas || formData.funcoes3
    };
    setFormData(novo);
    await salvarDados(novo);
    setAplicadoSucesso(true);
    setTimeout(() => setAplicadoSucesso(false), 4000);
  };

  const handleCopy = (text, sectionName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const renderCopyCard = (title, content, sectionName) => {
    if (!content || content.trim() === '') return null;
    return (
      <div className="glass-panel" style={{ padding: '1.15rem', marginBottom: '1rem', textAlign: 'left', background: 'rgba(11, 15, 25, 0.55)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700 }}>{title}</h4>
          <button
            type="button"
            onClick={() => handleCopy(content, sectionName)}
            className="btn-secondary"
            style={{
              background: copiedSection === sectionName ? 'var(--accent-color)' : undefined,
              color: copiedSection === sectionName ? 'white' : undefined,
              padding: '6px 12px',
              fontSize: '0.8rem'
            }}
          >
            {copiedSection === sectionName ? <><CheckCircle2 size={14} /> Copiado!</> : <><Copy size={14} /> Copiar Bloco</>}
          </button>
        </div>
        <div style={{
          background: 'rgba(17, 24, 39, 0.8)',
          padding: '0.85rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-wrap',
          fontSize: '0.86rem'
        }}>
          {content}
        </div>
      </div>
    );
  };

  const exp1 = formData.empresa1 || formData.cargo1 ? `${formData.cargo1 || ''} - ${formData.empresa1 || ''} (${formData.periodo1 || ''})\n${formData.funcoes1 || ''}` : '';
  const exp2 = formData.empresa2 || formData.cargo2 ? `${formData.cargo2 || ''} - ${formData.empresa2 || ''} (${formData.periodo2 || ''})\n${formData.funcoes2 || ''}` : '';
  const exp3 = formData.empresa3 || formData.cargo3 ? `${formData.cargo3 || ''} - ${formData.empresa3 || ''} (${formData.periodo3 || ''})\n${formData.funcoes3 || ''}` : '';

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', overflowX: 'hidden' }}>
      {/* Barra de Etapas Clicável */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.65rem',
        marginBottom: '2rem'
      }}>
        {STEP_LABELS.map((item) => {
          const active = step === item.num;
          const done = step > item.num;
          return (
            <button
              key={item.num}
              type="button"
              onClick={() => setStep(item.num)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: active
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(79, 70, 229, 0.12))'
                  : done
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(17, 24, 39, 0.6)',
                border: active
                  ? '1px solid rgba(99, 102, 241, 0.5)'
                  : done
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid var(--border-color)',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: 'none',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: done ? 'var(--accent-color)' : active ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {done ? <Check size={14} /> : item.num}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.75 }}>
                  Passo {item.num}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* PASSO 1 */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '0.35rem', fontSize: '1.25rem' }}>Passo 1: Dados Pessoais e Contato</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
            Essas informações aparecem no cabeçalho do seu currículo em PDF e Word. Tudo é salvo automaticamente.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Nome Completo</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Lucas Oliveira" required />
            </div>

            <div className="input-group">
              <label>Celular / WhatsApp</label>
              <input type="text" name="tel1" value={formData.tel1} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>
            <div className="input-group">
              <label>Telefone Recado (Opcional)</label>
              <input type="text" name="tel2" value={formData.tel2} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>E-mail Profissional</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>LinkedIn ou Portfólio (Recomendado p/ ATS)</label>
              <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="linkedin.com/in/seu-perfil" />
            </div>

            <div className="input-group">
              <label>Cidade</label>
              <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Ex: São Paulo" />
            </div>
            <div className="input-group">
              <label>Estado (UF)</label>
              <input type="text" name="estado" value={formData.estado} onChange={handleChange} placeholder="Ex: SP" maxLength={2} />
            </div>
            <div className="input-group">
              <label>Bairro</label>
              <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>CNH (Opcional)</label>
              <input type="text" name="cnh" value={formData.cnh} onChange={handleChange} placeholder="Ex: AB" />
            </div>

            <div className="input-group">
              <label>Idade (Opcional)</label>
              <input type="text" name="idade" value={formData.idade} onChange={handleChange} placeholder="Ex: 28" />
            </div>
            <div className="input-group">
              <label>Nacionalidade</label>
              <select name="nacionalidade" value={formData.nacionalidade} onChange={handleChange}>
                <option>Brasileiro(a)</option>
                <option>Venezuelano(a)</option>
                <option>Uruguaio(a)</option>
                <option>Haitiano(a)</option>
                <option>Outra</option>
              </select>
            </div>
            <div className="input-group">
              <label>Estado Civil</label>
              <select name="estado_civil" value={formData.estado_civil} onChange={handleChange}>
                <option>Solteiro(a)</option>
                <option>Casado(a)</option>
                <option>Divorciado(a)</option>
                <option>União Estável</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* PASSO 2 */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '0.35rem', fontSize: '1.25rem' }}>Passo 2: Objetivo, Resumo ATS, Habilidades e Formação</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
            Estes campos são os mais importantes para os algoritmos da Gupy, Sólides e LinkedIn e para o nosso calculador de Match.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '0.5rem' }}>
            <div className="input-group">
              <label>Momento Atual</label>
              <select name="situacao" value={formData.situacao} onChange={handleChange}>
                <option value="">Selecione...</option>
                <option>Empregado (Buscando transição)</option>
                <option>Disponível p/ início imediato</option>
                <option>Em busca do 1º Emprego / Estágio</option>
              </select>
            </div>
            <div className="input-group">
              <label>Escolaridade</label>
              <select name="nivel_estudo" value={formData.nivel_estudo} onChange={handleChange}>
                <option value="">Selecione...</option>
                <option>Fundamental</option>
                <option>Médio</option>
                <option>Técnico</option>
                <option>Superior Cursando</option>
                <option>Superior Completo</option>
                <option>Pós-Graduação / MBA</option>
              </select>
            </div>
            <div className="input-group">
              <label>Possui experiência profissional?</label>
              <select name="exp_area" value={formData.exp_area} onChange={handleChange}>
                <option value="">Selecione...</option>
                <option>Sim</option>
                <option>Não</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Cargo-Alvo / Objetivo Profissional</label>
            <input
              type="text"
              name="objetivo"
              value={formData.objetivo}
              onChange={handleChange}
              placeholder="Ex: Analista Administrativo / Assistente Financeiro / Desenvolvedor Full Stack"
            />
          </div>

          <div className="input-group">
            <label>Resumo Profissional (Foco em Resultados e Palavras-Chave ATS)</label>
            <textarea
              name="resumo"
              value={formData.resumo}
              onChange={handleChange}
              rows="3"
              placeholder="Ex: Profissional com 4 anos de atuação na área administrativa e financeira, com domínio de Excel avançado, ERP SAP, faturamento, conciliação bancária e atendimento ao cliente..."
            />
          </div>

          <div className="input-group">
            <label>Habilidades Técnicas, Sistemas e Competências (Separadas por vírgula)</label>
            <textarea
              name="habilidades"
              value={formData.habilidades}
              onChange={handleChange}
              rows="2"
              placeholder="Ex: Excel Avançado, Power BI, SAP, Emissão de Notas Fiscais, Gestão de Indicadores, Atendimento ao Cliente..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="input-group">
              <label>Formação Acadêmica</label>
              <textarea
                name="formacao"
                value={formData.formacao}
                onChange={handleChange}
                rows="3"
                placeholder="Ex: Administração de Empresas — Universidade Paulista (Concluído em 2023)"
              />
            </div>
            <div className="input-group">
              <label>Idiomas</label>
              <textarea
                name="idiomas"
                value={formData.idiomas}
                onChange={handleChange}
                rows="3"
                placeholder="Ex: Português (Nativo), Inglês (Intermediário - Leitura e Conversação), Espanhol (Básico)"
              />
            </div>
          </div>
        </div>
      )}

      {/* PASSO 3 */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '0.35rem', fontSize: '1.25rem' }}>
            {formData.exp_area === 'Não' ? 'Passo 3: Vivências, Projetos e Cursos' : 'Passo 3: Experiências Profissionais e Cursos'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
            Descreva suas atividades usando verbos de ação e resultados (ex: "Reduzi o tempo de atendimento em 20%", "Controlei planilhas de fluxo de caixa").
          </p>

          {formData.exp_area === 'Não' && (
            <div style={{
              padding: '1rem',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}>
              <strong>Dica para 1º Emprego:</strong> Utilize os blocos abaixo para destacar projetos acadêmicos, trabalhos autônomos, empresa júnior ou voluntariado.
            </div>
          )}

          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--border-color)',
                padding: '1.15rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                background: 'rgba(11, 15, 25, 0.45)'
              }}
            >
              <h3 style={{ fontSize: '0.92rem', marginBottom: '0.75rem', color: 'var(--primary-hover)' }}>
                {formData.exp_area === 'Não' ? `Vivência ou Projeto ${idx}` : `Experiência Profissional ${idx}`} {idx > 1 && '(Opcional)'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div className="input-group">
                  <label>{formData.exp_area === 'Não' ? 'Instituição / Projeto' : 'Empresa'}</label>
                  <input type="text" name={`empresa${idx}`} value={formData[`empresa${idx}`]} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>{formData.exp_area === 'Não' ? 'Papel / Atividade' : 'Cargo'}</label>
                  <input type="text" name={`cargo${idx}`} value={formData[`cargo${idx}`]} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Período</label>
                  <input type="text" name={`periodo${idx}`} value={formData[`periodo${idx}`]} onChange={handleChange} placeholder="Ex: Jan/2022 - Atual" />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Principais Entregas e Responsabilidades (Uma por linha)</label>
                <textarea name={`funcoes${idx}`} value={formData[`funcoes${idx}`]} onChange={handleChange} rows="3" />
              </div>
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="input-group">
              <label>Cursos e Certificações</label>
              <textarea name="cursos" value={formData.cursos} onChange={handleChange} rows="3" placeholder="Ex: Excel Avançado (Fundação Bradesco), Power BI (Alura)..." />
            </div>
            <div className="input-group">
              <label>Informações Adicionais (Disponibilidade, Viagens, Premiações)</label>
              <textarea name="adicionais" value={formData.adicionais} onChange={handleChange} rows="3" />
            </div>
          </div>
        </div>
      )}

      {/* PASSO 4 */}
      {step === 4 && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('modelos')}
              className={activeTab === 'modelos' ? '' : 'btn-secondary'}
              style={{ flex: 1, minWidth: '180px' }}
            >
              <FileDown size={16} /> 1. Baixar PDF / Word (10 Modelos)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ia')}
              className={activeTab === 'ia' ? '' : 'btn-secondary'}
              style={{ flex: 1, minWidth: '180px' }}
            >
              <Wand2 size={16} /> 2. Adaptar p/ Vaga com IA (Injobman)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('copia')}
              className={activeTab === 'copia' ? '' : 'btn-secondary'}
              style={{ flex: 1, minWidth: '180px' }}
            >
              <Copy size={16} /> 3. Copiar Blocos (Gupy / Sólides)
            </button>
          </div>

          {activeTab === 'modelos' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Escolha o Layout para Download</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Todos os 10 modelos já incluem automaticamente seu <strong>Objetivo, Resumo Profissional, Habilidades Técnicas, Experiências, Formação e Idiomas</strong>.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))', gap: '1.1rem' }}>
                {TEMPLATES.map(tpl => (
                  <div
                    key={tpl.id}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'rgba(11, 15, 25, 0.55)',
                      border: tpl.badge ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--border-color)'
                    }}
                  >
                    {tpl.badge && (
                      <span className="badge badge-primary" style={{ alignSelf: 'flex-start', marginBottom: '0.5rem', fontSize: '0.7rem' }}>
                        {tpl.badge}
                      </span>
                    )}
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.35rem' }}>{tpl.nome}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: '1.15rem', flex: 1 }}>{tpl.desc}</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => exportToPDF(formData, tpl.id)}
                        style={{ flex: 1, background: '#DC2626', padding: '0.55rem 0', fontSize: '0.82rem' }}
                      >
                        <FileDown size={15} /> Baixar PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => exportToWord(formData, tpl.id)}
                        style={{ flex: 1, background: '#2563EB', padding: '0.55rem 0', fontSize: '0.82rem' }}
                      >
                        <FileText size={15} /> Word (.doc)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ia' && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                Reescrever Meu Currículo para uma Vaga Específica (Injobman + HireMe)
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                Cole os requisitos de uma vaga abaixo. A IA vai adaptar seu Resumo, Habilidades e Experiências para você atingir o maior Match possível, permitindo aplicar ao seu currículo com 1 clique.
              </p>

              <div className="input-group">
                <label>Cargo da Vaga Alvo</label>
                <input
                  type="text"
                  value={tituloVagaAlvo}
                  onChange={(e) => setTituloVagaAlvo(e.target.value)}
                  placeholder="Ex: Analista Financeiro Pleno"
                />
              </div>

              <div className="input-group">
                <label>Descrição e Requisitos da Vaga</label>
                <textarea
                  value={vaga}
                  onChange={(e) => setVaga(e.target.value)}
                  rows="4"
                  placeholder="Cole aqui a descrição completa da vaga da Gupy, LinkedIn ou Vagas.com.br..."
                />
              </div>

              <button
                type="button"
                onClick={handleGerarSobMedida}
                disabled={loadingAi}
                className="btn-emerald"
                style={{ width: '100%' }}
              >
                <Sparkles size={18} /> {loadingAi ? 'Reescrevendo Currículo Sob Medida...' : 'Gerar Versão Otimizada com IA'}
              </button>

              {pacoteSobMedida && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.35rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.35)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <span className="badge badge-success">Novo Currículo Gerado pela IA</span>
                      <h3 style={{ fontSize: '1.05rem', marginTop: '0.35rem' }}>Prévia das Melhorias para a Vaga</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" onClick={aplicarPacoteAoCurriculo} className="btn-emerald">
                        <CheckCircle2 size={16} /> {aplicadoSucesso ? 'Aplicado ao Currículo!' : 'Aplicar ao Meu Currículo Agora'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.85rem', fontSize: '0.88rem' }}>
                    <div style={{ background: 'rgba(11, 15, 25, 0.65)', padding: '0.9rem', borderRadius: '8px' }}>
                      <strong style={{ color: 'var(--accent-color)' }}>Novo Resumo Profissional ATS:</strong>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>
                        {pacoteSobMedida.resumo_otimizado}
                      </p>
                    </div>
                    <div style={{ background: 'rgba(11, 15, 25, 0.65)', padding: '0.9rem', borderRadius: '8px' }}>
                      <strong style={{ color: 'var(--primary-hover)' }}>Habilidades Alinhadas à Vaga:</strong>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>
                        {pacoteSobMedida.habilidades_otimizadas}
                      </p>
                    </div>
                    {pacoteSobMedida.funcoes1_otimizadas && (
                      <div style={{ background: 'rgba(11, 15, 25, 0.65)', padding: '0.9rem', borderRadius: '8px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Experiência 1 Reescrita:</strong>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>
                          {pacoteSobMedida.funcoes1_otimizadas}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {aiSugestoes && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1.25rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)'
                }}>
                  {aiSugestoes}
                </div>
              )}
            </div>
          )}

          {activeTab === 'copia' && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>Blocos Prontos para Colar na Gupy / Sólides / LinkedIn</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                Ao preencher formulários externos, copie cada seção abaixo com 1 clique.
              </p>
              {renderCopyCard('Objetivo Profissional', formData.objetivo, 'objetivo')}
              {renderCopyCard('Resumo Profissional ATS', formData.resumo, 'resumo')}
              {renderCopyCard('Habilidades e Competências Técnicas', formData.habilidades, 'habilidades')}
              {renderCopyCard('Experiência 1', exp1, 'exp1')}
              {renderCopyCard('Experiência 2', exp2, 'exp2')}
              {renderCopyCard('Experiência 3', exp3, 'exp3')}
              {renderCopyCard('Formação Acadêmica', formData.formacao, 'formacao')}
              {renderCopyCard('Cursos e Certificações', formData.cursos, 'cursos')}
              {renderCopyCard('Idiomas', formData.idiomas, 'idiomas')}
            </div>
          )}
        </div>
      )}

      {/* Navegação Inferior */}
      <div className="stepper-nav" style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={handlePrev}
          style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        {step < 4 ? (
          <button type="button" onClick={handleNext}>
            Próximo Passo <ChevronRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={() => salvarDados()} className="btn-emerald">
            <Check size={16} /> Salvar Currículo no Perfil
          </button>
        )}
      </div>
    </div>
  );
}
