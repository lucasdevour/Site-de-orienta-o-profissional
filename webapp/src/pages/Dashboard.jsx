import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, Target, FileText, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const API_URL = 'https://site-de-orienta-o-profissional-1.onrender.com/api';

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

export function calcularForcaCurriculo(dados) {
  let pontos = 0;
  const dicas = [];

  if (dados.nome && dados.tel1 && dados.cidade && dados.estado) {
    pontos += 20;
  } else {
    dicas.push('Complete seu nome, telefone, cidade e estado.');
  }

  if (dados.objetivo && dados.objetivo.trim().length >= 5) {
    pontos += 20;
  } else {
    dicas.push('Defina seu Objetivo Profissional (cargo alvo).');
  }

  if (dados.formacao && dados.formacao.trim().length >= 8) {
    pontos += 20;
  } else {
    dicas.push('Adicione sua Formação Acadêmica.');
  }

  if (dados.cargo1 && dados.funcoes1 && dados.funcoes1.trim().length >= 15) {
    pontos += 25;
  } else {
    dicas.push('Descreva pelo menos 1 experiência ou vivência prática detalhada.');
  }

  if ((dados.cursos && dados.cursos.trim().length >= 5) || (dados.adicionais && dados.adicionais.trim().length >= 5)) {
    pontos += 15;
  } else {
    dicas.push('Inclua cursos, certificações ou habilidades extras para ganhar pontos no ATS.');
  }

  return { score: Math.min(100, pontos), dicas };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => ({
    ...INICIAL_DATA,
    email: localStorage.getItem('userEmail') || ''
  }));
  const [salvando, setSalvando] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
          if (Object.keys(data).length > 0) {
            setFormData(prev => ({ ...prev, ...data }));
          }
        }
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    carregarDados();
  }, []);

  const salvarDados = async () => {
    try {
      if (!formData.email) return;
      setSalvando(true);
      await fetch(`${API_URL}/curriculo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setTimeout(() => setSalvando(false), 700);
    } catch (e) {
      console.error('Erro ao salvar:', e);
      setSalvando(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => { salvarDados(); }, 1000);
    return () => clearTimeout(timer);
  }, [formData, isLoaded]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleTelefone = (e, campo) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 7) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    setFormData({ ...formData, [campo]: v });
  };

  const { score, dicas } = calcularForcaCurriculo(formData);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '2rem' }}>
      {/* Header Boas-Vindas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>PAINEL DO CANDIDATO</span>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>
            Olá, {formData.nome ? formData.nome.split(' ')[0] : 'Candidato(a)'}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Acompanhe a força do seu currículo base e descubra vagas com Match para o seu perfil.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/app/robo')}
            className="btn-emerald"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', fontSize: '0.9rem' }}
          >
            <Target size={18} /> Ver Vagas com Match p/ Meu Currículo <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/app/curriculos')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', fontSize: '0.9rem' }}
          >
            <Sparkles size={18} /> Construtor & IA de Currículos
          </button>
        </div>
      </div>

      {/* Termômetro de Força do Currículo + Atalhos */}
      <div className="glass-panel animate-slide-up" style={{ padding: '1.75rem', marginBottom: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              📊 Índice de Força do Seu Currículo Base (ATS Brasil)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Quanto mais completo seu currículo base, mais preciso será o cálculo de Match e a geração de novos currículos por IA.
            </p>
          </div>
          <span className={`badge ${score >= 80 ? 'badge-green' : score >= 50 ? 'badge-amber' : 'badge-rose'}`} style={{ fontSize: '1rem', padding: '6px 14px' }}>
            {score}% Completo
          </span>
        </div>

        <div className="progress-track" style={{ marginBottom: '1rem' }}>
          <div
            className="progress-fill"
            style={{
              width: `${score}%`,
              background: score >= 80 ? 'var(--gradient-emerald)' : 'var(--gradient-brand)'
            }}
          />
        </div>

        {dicas.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} /> O que falta para deixar seu perfil 100% pronto:
            </div>
            {dicas.map((d, i) => (
              <div key={i} style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>
                • {d}
              </div>
            ))}
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => navigate('/app/curriculos')}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Preencher Experiências e Formação no Construtor →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.9rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> Seu currículo base está completo! Vá para &ldquo;Vagas & Match&rdquo; para cruzar seu perfil com vagas reais.
          </div>
        )}
      </div>

      {/* Formulário Rápido de Dados Pessoais e Objetivo Alvo */}
      <div className="glass-panel animate-slide-up" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={22} color="var(--primary-color)" />
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>Dados Pessoais & Cargo Alvo</h2>
          </div>
          {salvando && <span className="badge badge-green">Salvando automaticamente...</span>}
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label>Nome Completo</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Seu nome completo" required />
          </div>
          <div className="input-group">
            <label>Cargo / Objetivo Principal (Usado para o Match Automático)</label>
            <input
              type="text"
              name="objetivo"
              value={formData.objetivo}
              onChange={handleChange}
              placeholder="Ex: Assistente Administrativo, Recursos Humanos, Eletricista"
            />
          </div>
        </div>

        <div className="grid-3">
          <div className="input-group">
            <label>Cidade Alvo</label>
            <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Ex: Itajaí" />
          </div>
          <div className="input-group">
            <label>Estado (UF)</label>
            <input type="text" name="estado" value={formData.estado} onChange={handleChange} placeholder="Ex: SC" maxLength={2} />
          </div>
          <div className="input-group">
            <label>Celular / WhatsApp</label>
            <input type="text" value={formData.tel1} onChange={(e) => handleTelefone(e, 'tel1')} placeholder="(00) 00000-0000" />
          </div>
        </div>

        <div className="grid-3">
          <div className="input-group">
            <label>Idade</label>
            <input type="text" name="idade" value={formData.idade} onChange={handleChange} placeholder="Ex: 25" />
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
          <div className="input-group">
            <label>CNH (Opcional)</label>
            <input type="text" name="cnh" value={formData.cnh} onChange={handleChange} placeholder="Ex: AB" />
          </div>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label>Rua / Avenida e Número</label>
            <input type="text" name="rua" value={formData.rua} onChange={handleChange} placeholder="Ex: Rua das Flores, 120" />
          </div>
          <div className="input-group">
            <label>Bairro</label>
            <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Ex: Centro" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '1rem' }}>
          <button
            type="button"
            className="secondary"
            onClick={() => navigate('/app/curriculos')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FileText size={18} /> Editar Experiências, Cursos & Exportar PDF/Word
          </button>

          <button onClick={salvarDados} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> Salvar Dados Base
          </button>
        </div>
      </div>
    </div>
  );
}
