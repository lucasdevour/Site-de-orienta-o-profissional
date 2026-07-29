import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Sparkles, FileDown, FileText, Image as ImageIcon, Copy, CheckCircle2 } from 'lucide-react';
import { otimizarCurriculo } from '../services/aiService';
import { exportToPDF, exportToWord } from '../services/exportService';

const API_URL = 'http://localhost:8000/api';

const INICIAL_DATA = {
  nome: '', idade: '', nacionalidade: 'Brasileiro(a)', estado_civil: 'Solteiro(a)',
  rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  tel1: '', tel2: '', email: '', cnh: '',
  situacao: '', busca: '', nivel_estudo: '', exp_area: '', objetivo: '', formacao: '',
  empresa1: '', periodo1: '', cargo1: '', funcoes1: '',
  empresa2: '', periodo2: '', cargo2: '', funcoes2: '',
  empresa3: '', periodo3: '', cargo3: '', funcoes3: '',
  cursos: '', adicionais: ''
};

const TEMPLATES = [
  { id: '1', nome: 'Clássico Corporativo', desc: 'Sóbrio, fontes serifadas, ideal para bancos e indústrias.' },
  { id: '2', nome: 'Moderno Minimalista', desc: 'Limpo, sem serifa, espaçado, foco em startups.' },
  { id: '3', nome: 'Executivo Enxuto', desc: 'Design compacto para caber muita informação.' },
  { id: '4', nome: 'Criativo Azul', desc: 'Toques de azul escuro nos títulos, moderno e seguro.' },
  { id: '5', nome: 'Elegante Verde', desc: 'Destaques em verde musgo para um perfil confiante.' },
  { id: '6', nome: 'Destaque Lateral', desc: 'Contatos à direita, forte apelo visual.' },
  { id: '7', nome: 'Impacto Jovem', desc: 'Linhas grossas, ideal para quem tem pouca experiência.' },
  { id: '8', nome: 'Tradicional Forte', desc: 'Títulos em caixa alta pesada, legível para ATS.' },
  { id: '9', nome: 'Soft Minimal', desc: 'Tons de cinza suave para separar sessões, super clean.' },
  { id: '10', nome: 'Profissional Tech', desc: 'Visual de código fonte leve, ideal para TI e Dados.' }
];

export default function Stepper() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => ({
    ...INICIAL_DATA,
    email: localStorage.getItem('userEmail') || ''
  }));
  const [isLoaded, setIsLoaded] = useState(false);
  
  // AI States
  const [vaga, setVaga] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSugestoes, setAiSugestoes] = useState('');

  // Gallery States
  const [copiedSection, setCopiedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('modelos'); // 'modelos' ou 'copia'

  // Carregar dados
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
        console.error("Erro ao carregar dados:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    carregarDados();
  }, []);

  const salvarDados = async () => {
    try {
      if (!formData.email) return;
      await fetch(`${API_URL}/curriculo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } catch (e) {
      console.error("Erro ao salvar:", e);
    }
  };

  // Auto-Save Rascunho
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
  
  const handleOtimizar = async () => {
    if (!vaga.trim()) return alert("Cole a descrição da vaga primeiro.");
    setLoadingAi(true); setAiSugestoes('');
    try {
      const comp = { ...formData, resumo: formData.objetivo, experiencias: formData.funcoes1 + ' ' + formData.funcoes2 };
      const sugestoes = await otimizarCurriculo(comp, vaga);
      setAiSugestoes(sugestoes);
    } catch (error) {
      alert("Erro ao otimizar: " + error.message);
    } finally {
      setLoadingAi(false);
    }
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
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{title}</h3>
          <button onClick={() => handleCopy(content, sectionName)} style={{ background: copiedSection === sectionName ? '#10B981' : 'var(--bg-secondary)', color: copiedSection === sectionName ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'none' }}>
            {copiedSection === sectionName ? <><CheckCircle2 size={16}/> Copiado!</> : <><Copy size={16}/> Copiar</>}
          </button>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
          {content}
        </div>
      </div>
    );
  };

  const exp1 = `${formData.cargo1 || ''} - ${formData.empresa1 || ''} (${formData.periodo1 || ''})\n\n${formData.funcoes1 || ''}`;
  const exp2 = formData.empresa2 ? `${formData.cargo2 || ''} - ${formData.empresa2 || ''} (${formData.periodo2 || ''})\n\n${formData.funcoes2 || ''}` : '';

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '1rem', overflowX: 'hidden' }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        {[1, 2, 3, 4].map((num) => (
          <div key={num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              backgroundColor: step >= num ? 'var(--accent-color)' : 'var(--border-color)',
              color: step >= num ? 'white' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '0.9rem', zIndex: 1
            }}>
              {step > num ? <Check size={16} /> : num}
            </div>
            {num < 4 && <div style={{ height: '2px', flex: 1, backgroundColor: step > num ? 'var(--accent-color)' : 'var(--border-color)', margin: '0 -5px' }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Passo 1: Dados Básicos</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Estes dados vieram do seu perfil. Você pode alterá-los aqui caso queira informações diferentes apenas neste currículo.
          </p>
          
          <div className="input-group">
            <label>NOME COMPLETO</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '100px' }}>
              <label>Idade</label>
              <input type="text" name="idade" value={formData.idade} onChange={handleChange} placeholder="Ex: 25" />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label>Nacionalidade</label>
              <select name="nacionalidade" value={formData.nacionalidade} onChange={handleChange}>
                <option>Brasileiro(a)</option><option>Venezuelano(a)</option><option>Uruguaio(a)</option><option>Haitiano(a)</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label>Estado Civil</label>
              <select name="estado_civil" value={formData.estado_civil} onChange={handleChange}>
                <option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>União Estável</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 3, minWidth: '200px' }}>
              <label>Rua / Avenida</label>
              <input type="text" name="rua" value={formData.rua} onChange={handleChange} placeholder="Ex: Rua das Flores" />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '80px' }}>
              <label>Número</label>
              <input type="text" name="numero" value={formData.numero} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label>Bairro</label>
              <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '100px' }}>
              <label>Complemento (Opcional)</label>
              <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 2, minWidth: '150px' }}>
              <label>Cidade</label>
              <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '100px' }}>
              <label>Estado (Sigla)</label>
              <input type="text" name="estado" value={formData.estado} onChange={handleChange} placeholder="Ex: SC" maxLength={2} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label>Celular / WhatsApp</label>
              <input type="text" name="tel1" value={formData.tel1} onChange={handleChange} />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label>Telefone Secundário</label>
              <input type="text" name="tel2" value={formData.tel2} onChange={handleChange} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 2, minWidth: '200px' }}>
              <label>E-mail no Currículo</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '120px' }}>
              <label>CNH (Opcional)</label>
              <input type="text" name="cnh" value={formData.cnh} onChange={handleChange} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Passo 2: Perfil e Formação</h2>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Momento Atual</label>
              <select name="situacao" value={formData.situacao} onChange={handleChange}>
                <option value="">Selecione...</option><option>Empregado</option><option>Desempregado</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Nível de Estudo</label>
              <select name="nivel_estudo" value={formData.nivel_estudo} onChange={handleChange}>
                <option value="">Selecione...</option><option>Fundamental</option><option>Médio</option><option>Técnico</option><option>Superior</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Possui experiência profissional?</label>
              <select name="exp_area" value={formData.exp_area} onChange={handleChange}>
                <option value="">Selecione...</option><option>Sim</option><option>Não</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>OBJETIVO PROFISSIONAL</label>
            <input type="text" name="objetivo" value={formData.objetivo} onChange={handleChange} placeholder="Ex: Auxiliar Administrativo / Atendimento ao Cliente" />
          </div>

          <div className="input-group">
            <label>FORMAÇÃO ACADÊMICA</label>
            <textarea name="formacao" value={formData.formacao} onChange={handleChange} rows="3" placeholder="Ex: Ensino Médio Completo&#10;Escola Nome da Escola (Ano de conclusão)" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
            {formData.exp_area === 'Não' ? 'Passo 3: Vivências e Habilidades' : 'Passo 3: Experiências e Extras'}
          </h2>
          
          {formData.exp_area === 'Não' && (
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary-color)', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              <strong>Dica de Ouro:</strong> Como você busca o primeiro emprego, use os blocos abaixo para colocar projetos da escola, trabalhos informais (ex: venda de doces, ajudante de obras), voluntariado na igreja, ou facilidade com computadores.
            </div>
          )}
          
          <div style={{ border: '1px solid var(--border-color)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>{formData.exp_area === 'Não' ? 'Vivência ou Projeto 1' : 'Experiência 1'}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="input-group" style={{ flex: 2 }}><label>{formData.exp_area === 'Não' ? 'Onde (Escola, Igreja, etc.)' : 'Empresa'}</label><input type="text" name="empresa1" value={formData.empresa1} onChange={handleChange} /></div>
              <div className="input-group" style={{ flex: 1 }}><label>Período</label><input type="text" name="periodo1" value={formData.periodo1} onChange={handleChange} /></div>
            </div>
            <div className="input-group"><label>{formData.exp_area === 'Não' ? 'Atividade Principal' : 'Cargo'}</label><input type="text" name="cargo1" value={formData.cargo1} onChange={handleChange} /></div>
            <div className="input-group"><label>Funções / O que você fez? (Uma por linha)</label><textarea name="funcoes1" value={formData.funcoes1} onChange={handleChange} rows="2" /></div>
          </div>

          <div style={{ border: '1px solid var(--border-color)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>{formData.exp_area === 'Não' ? 'Vivência ou Projeto 2 (Opcional)' : 'Experiência 2 (Opcional)'}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="input-group" style={{ flex: 2 }}><label>{formData.exp_area === 'Não' ? 'Onde' : 'Empresa'}</label><input type="text" name="empresa2" value={formData.empresa2} onChange={handleChange} /></div>
              <div className="input-group" style={{ flex: 1 }}><label>Período</label><input type="text" name="periodo2" value={formData.periodo2} onChange={handleChange} /></div>
            </div>
            <div className="input-group"><label>{formData.exp_area === 'Não' ? 'Atividade' : 'Cargo'}</label><input type="text" name="cargo2" value={formData.cargo2} onChange={handleChange} /></div>
            <div className="input-group"><label>Funções (Uma por linha)</label><textarea name="funcoes2" value={formData.funcoes2} onChange={handleChange} rows="2" /></div>
          </div>

          <div className="input-group"><label>CURSOS (Opcional)</label><textarea name="cursos" value={formData.cursos} onChange={handleChange} rows="2" /></div>
          <div className="input-group"><label>INFORMAÇÕES ADICIONAIS (Opcional)</label><textarea name="adicionais" value={formData.adicionais} onChange={handleChange} rows="2" /></div>
        </div>
      )}

      {step === 4 && (
        <div className="animate-fade-in">
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', justifyContent: 'center' }}>
            <button onClick={() => setActiveTab('modelos')} style={{ background: activeTab === 'modelos' ? 'var(--gradient-brand)' : 'var(--bg-secondary)', color: activeTab === 'modelos' ? 'white' : 'var(--text-secondary)', flex: 1 }}>
              Exportar Layouts
            </button>
            <button onClick={() => setActiveTab('copia')} style={{ background: activeTab === 'copia' ? 'var(--gradient-brand)' : 'var(--bg-secondary)', color: activeTab === 'copia' ? 'white' : 'var(--text-secondary)', flex: 1 }}>
              Cópia Rápida & IA
            </button>
          </div>

          {activeTab === 'modelos' ? (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Selecione seu Modelo</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {TEMPLATES.map(tpl => (
                  <div key={tpl.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.4)' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{tpl.nome}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', flex: 1 }}>{tpl.desc}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => exportToPDF(formData, tpl.id)} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '4px', background: '#DC2626', padding: '10px 0', fontSize: '0.85rem' }}>
                        <FileDown size={16}/> PDF
                      </button>
                      <button onClick={() => exportToWord(formData, tpl.id)} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '4px', background: '#2563EB', padding: '10px 0', fontSize: '0.85rem' }}>
                        <FileText size={16}/> DOCX
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>IA & Cópia Rápida</h2>
              
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label>Análise de Vaga (IA)</label>
                <textarea value={vaga} onChange={(e) => setVaga(e.target.value)} rows="2" placeholder="Cole a descrição da vaga aqui para a IA otimizar..." />
                <button onClick={handleOtimizar} disabled={loadingAi} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10B981', width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                  <Sparkles size={18} /> {loadingAi ? 'Analisando...' : 'Analisar com IA'}
                </button>
              </div>

              {aiSugestoes && (
                <div style={{ padding: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                  <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>💡 Análise Concluída:</strong><br/><br/>{aiSugestoes}
                </div>
              )}

              <hr style={{ borderColor: 'var(--border-color)', margin: '2rem 0' }} />
              
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Blocos para Cadastro Externo (Gupy)</h3>
              {renderCopyCard('Objetivo', formData.objetivo, 'objetivo')}
              {renderCopyCard('Formação', formData.formacao, 'formacao')}
              {renderCopyCard('Experiência 1', exp1, 'exp1')}
              {renderCopyCard('Experiência 2', exp2, 'exp2')}
            </div>
          )}
        </div>
      )}

      {/* Navegação */}
      <div className="stepper-nav" style={{ marginTop: '2rem' }}>
        <button className="secondary" onClick={handlePrev} style={{ visibility: step === 1 ? 'hidden' : 'visible', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ChevronLeft size={16} /> Voltar
        </button>
        
        {step < 4 ? (
          <button onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Próximo Passo <ChevronRight size={16} />
          </button>
        ) : (
          <div /> 
        )}
      </div>
    </div>
  );
}
