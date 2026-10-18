import { useState, useEffect } from 'react';
import {
  Loader2, Search, Sparkles, ExternalLink, Copy, CheckCircle2,
  Target, Compass, FileDown, FileText, ShieldCheck, AlertTriangle, Check, Mic
} from 'lucide-react';
import { gerarCurriculoSobMedidaIA } from '../services/aiService';
import { exportToPDF, exportToWord } from '../services/exportService';

const API_URL = 'https://site-de-orienta-o-profissional-1.onrender.com/api';

const AREAS_BRASIL = [
  'Assistente Administrativo', 'Recursos Humanos', 'Recepcionista',
  'Atendimento ao Cliente', 'Vendas / Comercial', 'Logística / Estoque',
  'Financeiro / Faturamento', 'Eletricista / Manutenção', 'TI / Suporte',
  'Produção / Operacional', 'Jovem Aprendiz'
];

const MODELOS_EXPORT = [
  { id: '1', nome: '1. Clássico Corporativo (Padrão Gupy/ATS)' },
  { id: '2', nome: '2. Moderno Minimalista' },
  { id: '3', nome: '3. Executivo Enxuto (1 Página)' },
  { id: '4', nome: '4. Criativo Azul' },
  { id: '5', nome: '5. Elegante Verde' },
  { id: '8', nome: '8. Tradicional Forte (Leitura Rápida RH)' },
  { id: '10', nome: '10. Profissional Tech & Dados' }
];

export default function Robo() {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [modoBusca, setModoBusca] = useState('curriculo'); // 'curriculo' | 'livre' | 'colar'
  const [curriculoBase, setCurriculoBase] = useState({});
  const [vagas, setVagas] = useState([]);

  // Filtros de busca
  const [buscaConfig, setBuscaConfig] = useState({
    estado: 'SC',
    cidade: 'Itajaí',
    termos: ''
  });

  // Modo colar vaga avulsa (Gupy, LinkedIn, WhatsApp)
  const [vagaManual, setVagaManual] = useState({
    titulo: '',
    empresa: '',
    descricao: ''
  });

  // Estúdio IA (Injobman + HireMe + Job Matcher para a vaga selecionada)
  const [vagaSelecionada, setVagaSelecionada] = useState(null);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [curriculoAdaptado, setCurriculoAdaptado] = useState(null);
  const [modeloPdfId, setModeloPdfId] = useState('1');
  const [abaEstudio, setAbaEstudio] = useState('curriculo'); // 'curriculo' | 'gaps' | 'entrevista'
  const [copiadoMsg, setCopiadoMsg] = useState('');
  const [salvandoBase, setSalvandoBase] = useState(false);

  const email = localStorage.getItem('userEmail');

  // Carrega o currículo do candidato e inicia busca baseada no perfil
  useEffect(() => {
    const carregarPerfilEVagas = async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      try {
        const [resCurr, resPref] = await Promise.all([
          fetch(`${API_URL}/curriculo/${email}`),
          fetch(`${API_URL}/preferencias/${email}`)
        ]);

        let currData = {};
        if (resCurr.ok) {
          currData = await resCurr.json();
          setCurriculoBase(currData || {});
        }

        let prefData = {};
        if (resPref.ok) {
          prefData = await resPref.json();
        }

        // Extrai cargos automaticamente do currículo do candidato
        const termosDoCurriculo = [
          currData?.objetivo,
          currData?.cargo1,
          currData?.cargo2
        ].filter(Boolean).join(', ');

        const estadoInicial = currData?.estado || prefData?.estado || 'SC';
        const cidadeInicial = currData?.cidade || prefData?.cidade || 'Itajaí';
        const termosIniciais = termosDoCurriculo || prefData?.termos || 'Assistente Administrativo, Recursos Humanos';

        const configInicial = {
          estado: estadoInicial,
          cidade: cidadeInicial,
          termos: termosIniciais
        };
        setBuscaConfig(configInicial);

        // Dispara busca inicial automática baseada no currículo
        await executarBusca(configInicial, currData);
      } catch (err) {
        console.error('Erro ao inicializar radar de vagas:', err);
      } finally {
        setLoading(false);
      }
    };
    carregarPerfilEVagas();
  }, [email]);

  const executarBusca = async (config, curr = curriculoBase) => {
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/buscar-vagas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          estado: config.estado,
          cidade: config.cidade,
          termos: config.termos,
          curriculo: curr
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVagas(data.vagas || []);
      }
    } catch (e) {
      console.error('Erro na busca de vagas:', e);
    } finally {
      setSearching(false);
    }
  };

  const buscarPorMeuCurriculo = () => {
    setModoBusca('curriculo');
    const termosAuto = [
      curriculoBase?.objetivo,
      curriculoBase?.cargo1,
      curriculoBase?.cargo2
    ].filter(Boolean).join(', ') || buscaConfig.termos || 'Assistente Administrativo';

    const novaConfig = {
      estado: curriculoBase?.estado || buscaConfig.estado || 'SC',
      cidade: curriculoBase?.cidade || buscaConfig.cidade || 'Itajaí',
      termos: termosAuto
    };
    setBuscaConfig(novaConfig);
    executarBusca(novaConfig, curriculoBase);
  };

  const abrirEstudioIAParaVaga = async (vaga) => {
    setVagaSelecionada(vaga);
    setGerandoIA(true);
    setResultadoIA(null);
    setAbaEstudio('curriculo');

    // Rola suavemente até o Estúdio IA
    setTimeout(() => {
      const el = document.getElementById('estudio-ia-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);

    try {
      const resIA = await gerarCurriculoSobMedidaIA(
        { ...curriculoBase, email: email || curriculoBase.email },
        vaga
      );
      setResultadoIA(resIA);

      // Cria uma cópia do currículo do candidato com os campos otimizados pela IA para aquela vaga
      setCurriculoAdaptado({
        ...curriculoBase,
        nome: curriculoBase.nome || 'Candidato(a)',
        email: curriculoBase.email || email || '',
        objetivo: resIA.curriculo_otimizado?.objetivo || vaga.titulo || curriculoBase.objetivo,
        empresa1: curriculoBase.empresa1 || 'Experiência Profissional',
        cargo1: curriculoBase.cargo1 || vaga.titulo,
        periodo1: curriculoBase.periodo1 || 'Recente',
        funcoes1: resIA.curriculo_otimizado?.funcoes1 || curriculoBase.funcoes1 || '',
        funcoes2: resIA.curriculo_otimizado?.funcoes2 || curriculoBase.funcoes2 || '',
        adicionais: resIA.curriculo_otimizado?.adicionais || curriculoBase.adicionais || ''
      });
    } catch (err) {
      console.error('Erro ao gerar adaptação IA:', err);
    } finally {
      setGerandoIA(false);
    }
  };

  const salvarCurriculoAdaptadoComoPrincipal = async () => {
    if (!curriculoAdaptado || !email) return;
    setSalvandoBase(true);
    try {
      await fetch(`${API_URL}/curriculo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...curriculoAdaptado, email })
      });
      setCurriculoBase(curriculoAdaptado);
      copiarFeedback('Currículo salvo como principal!');
    } catch (e) {
      alert('Erro ao salvar no banco.');
    } finally {
      setSalvandoBase(false);
    }
  };

  const copiarFeedback = (msg) => {
    setCopiadoMsg(msg);
    setTimeout(() => setCopiadoMsg(''), 2800);
  };

  const copiarTexto = (texto, label) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    copiarFeedback(`${label} copiado!`);
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <Loader2 size={38} className="animate-spin mx-auto" style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Analisando seu currículo e buscando vagas com Match...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Header Principal */}
      <div style={{ marginBottom: '1.75rem' }}>
        <span className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>
          RADAR INTELIGENTE • JOB MATCHER + INJOBMAN + HIREME
        </span>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
          Radar de Vagas & Gerador de Currículo Sob Medida
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Encontre vagas com Match automático para o seu currículo atual, explore novas áreas livremente e gere um currículo personalizado com IA para qualquer vaga escolhida.
        </p>
      </div>

      {/* Seletor de Modo: Match pelo Currículo vs Busca Livre vs Colar Vaga */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={buscarPorMeuCurriculo}
          style={{
            background: modoBusca === 'curriculo' ? 'var(--gradient-brand)' : 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.25rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: modoBusca === 'curriculo' ? '0 8px 20px rgba(59,130,246,0.35)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.98rem' }}>
            <Target size={18} /> 1. Match com Meu Currículo
          </div>
          <span style={{ fontSize: '0.78rem', opacity: 0.85, fontWeight: 400 }}>
            Busca vagas usando automaticamente seu objetivo e experiências salvas.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setModoBusca('livre')}
          style={{
            background: modoBusca === 'livre' ? 'var(--gradient-brand)' : 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.25rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: modoBusca === 'livre' ? '0 8px 20px rgba(59,130,246,0.35)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.98rem' }}>
            <Compass size={18} /> 2. Explorar Outras Vagas Livremente
          </div>
          <span style={{ fontSize: '0.78rem', opacity: 0.85, fontWeight: 400 }}>
            Pesquise qualquer outra área, cargo ou cidade e veja o que falta para dar Match.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setModoBusca('colar')}
          style={{
            background: modoBusca === 'colar' ? 'var(--gradient-brand)' : 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.25rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: modoBusca === 'colar' ? '0 8px 20px rgba(59,130,246,0.35)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.98rem' }}>
            <Sparkles size={18} /> 3. Colar Vaga da Gupy / LinkedIn
          </div>
          <span style={{ fontSize: '0.78rem', opacity: 0.85, fontWeight: 400 }}>
            Achou uma vaga fora daqui? Cole a descrição e gere um currículo sob medida para ela.
          </span>
        </button>
      </div>

      {/* Painel de Busca ou Colagem */}
      {modoBusca !== 'colar' ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>
              {modoBusca === 'curriculo'
                ? '🎯 Buscando vagas alinhadas ao seu Currículo Base'
                : '🔎 Pesquisa Livre de Vagas em Qualquer Área'}
            </h3>
            {curriculoBase?.objetivo && modoBusca === 'curriculo' && (
              <span className="badge badge-green">
                Seu Objetivo Atual: {curriculoBase.objetivo}
              </span>
            )}
          </div>

          <div className="grid-3" style={{ marginBottom: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Estado (UF)</label>
              <input
                type="text"
                value={buscaConfig.estado}
                onChange={e => setBuscaConfig({ ...buscaConfig, estado: e.target.value.toUpperCase() })}
                placeholder="SC"
                maxLength={2}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Cidade</label>
              <input
                type="text"
                value={buscaConfig.cidade}
                onChange={e => setBuscaConfig({ ...buscaConfig, cidade: e.target.value })}
                placeholder="Ex: Itajaí, São Paulo, Curitiba"
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Cargos ou Áreas Desejadas</label>
              <input
                type="text"
                value={buscaConfig.termos}
                onChange={e => setBuscaConfig({ ...buscaConfig, termos: e.target.value })}
                placeholder="Ex: Analista Financeiro, Logística, Vendas"
              />
            </div>
          </div>

          {/* Atalhos Rápidos de Áreas Brasileiras */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Sugestões rápidas de áreas (clique para adicionar/remover da pesquisa):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {AREAS_BRASIL.map(area => {
                const selecionado = buscaConfig.termos.toLowerCase().includes(area.toLowerCase());
                return (
                  <button
                    key={area}
                    type="button"
                    className={`tag-button ${selecionado ? 'selected' : ''}`}
                    onClick={() => {
                      let lista = buscaConfig.termos.split(',').map(t => t.trim()).filter(Boolean);
                      if (selecionado) {
                        lista = lista.filter(t => t.toLowerCase() !== area.toLowerCase());
                      } else {
                        lista.push(area);
                      }
                      setBuscaConfig({ ...buscaConfig, termos: lista.join(', ') });
                    }}
                  >
                    {selecionado ? '✓ ' : '+ '}{area}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => executarBusca(buscaConfig, curriculoBase)}
            disabled={searching}
            className="btn-emerald"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {searching ? 'Buscando vagas reais e calculando seu Match ATS...' : 'Buscar Vagas e Calcular Meu Match Agora'}
          </button>

          {/* Radar Multi-Plataforma Brasil (Live Job Hunter) */}
          <div style={{
            marginTop: '1.15rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem'
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              🌐 <strong>Radar Direto nos Portais (Live Job Hunter):</strong> Abrir busca filtrada por <em>"{(buscaConfig.termos || 'Vagas').split(',')[0].trim()}"</em> e colar na Aba 3:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {[
                {
                  nome: 'Gupy Portal',
                  url: `https://portal.gupy.io/job-search/term=${encodeURIComponent((buscaConfig.termos || '').split(',')[0].trim())}`
                },
                {
                  nome: 'LinkedIn Brasil',
                  url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent((buscaConfig.termos || '').split(',')[0].trim())}&location=${encodeURIComponent(`${buscaConfig.cidade || ''} ${buscaConfig.estado || 'Brasil'}`.trim())}`
                },
                {
                  nome: 'InfoJobs',
                  url: `https://www.infojobs.com.br/empregos.aspx?Palabra=${encodeURIComponent((buscaConfig.termos || '').split(',')[0].trim())}`
                },
                {
                  nome: 'Glassdoor BR',
                  url: `https://www.glassdoor.com.br/Vaga/brasil-vagas-SRCH_IL.0,6_IN36.htm?sc.keyword=${encodeURIComponent((buscaConfig.termos || '').split(',')[0].trim())}`
                }
              ].map((portal) => (
                <a
                  key={portal.nome}
                  href={portal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="badge badge-blue"
                  style={{ textDecoration: 'none', padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                >
                  {portal.nome} <ExternalLink size={11} />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>
            ✨ Analisar Vaga Externa (Gupy, LinkedIn, Sólides, Indeed) & Gerar Currículo
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Cole os dados de qualquer vaga que você viu na internet. Nossa IA vai mostrar o que falta para você ser um Match e gerar um currículo adaptado para ela.
          </p>

          <div className="grid-2">
            <div className="input-group">
              <label>Nome do Cargo da Vaga</label>
              <input
                type="text"
                value={vagaManual.titulo}
                onChange={e => setVagaManual({ ...vagaManual, titulo: e.target.value })}
                placeholder="Ex: Assistente de Logística / Analista de RH"
              />
            </div>
            <div className="input-group">
              <label>Nome da Empresa (Opcional)</label>
              <input
                type="text"
                value={vagaManual.empresa}
                onChange={e => setVagaManual({ ...vagaManual, empresa: e.target.value })}
                placeholder="Ex: WEG, Mercado Livre, Empresa Local"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Descrição / Requisitos da Vaga</label>
            <textarea
              rows={4}
              value={vagaManual.descricao}
              onChange={e => setVagaManual({ ...vagaManual, descricao: e.target.value })}
              placeholder="Cole aqui as atividades e requisitos pedidos na vaga..."
            />
          </div>

          <button
            type="button"
            className="btn-emerald"
            onClick={() => {
              if (!vagaManual.titulo && !vagaManual.descricao) {
                alert('Preencha pelo menos o cargo ou a descrição da vaga!');
                return;
              }
              abrirEstudioIAParaVaga({
                titulo: vagaManual.titulo || 'Vaga Selecionada',
                empresa: vagaManual.empresa || 'Empresa Contratante',
                cidade: buscaConfig.cidade || 'Brasil',
                descricao: vagaManual.descricao,
                plataforma: 'Vaga Externa'
              });
            }}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={18} /> Diagnosticar Match e Gerar Novo Currículo para Esta Vaga
          </button>
        </div>
      )}

      {/* Lista de Vagas com Termômetro de Match e Diagnóstico de Gaps */}
      {modoBusca !== 'colar' && vagas.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>
              📋 Oportunidades Encontradas ({vagas.length})
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Ordenadas da maior para a menor compatibilidade com seu currículo
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vagas.map((vaga, idx) => {
              const match = vaga.match || { match_score: 70, match_tier: 'Forte', matched_keywords: [], missing_keywords: [], tailoring_action: '' };
              const xray = vaga.recruitxray || { badge_label: '🟢 Baixo Risco', risk_score: 10, brutal_truth: '' };
              const score = match.match_score || 70;

              return (
                <div key={idx} className="card-interactive">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.25rem' }}>
                        {vaga.titulo}
                      </h4>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                        🏢 <strong>{vaga.empresa || 'Empresa Confidencial'}</strong> • 📍 {vaga.cidade} • 🌐 {vaga.plataforma}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge ${score >= 78 ? 'badge-green' : score >= 55 ? 'badge-blue' : 'badge-amber'}`} style={{ fontSize: '0.88rem', padding: '6px 14px' }}>
                        🎯 Match Atual: {score}% ({match.match_tier})
                      </span>
                      <span className={`badge ${xray.risk_score > 60 ? 'badge-rose' : 'badge-green'}`}>
                        <ShieldCheck size={14} /> {xray.badge_label}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso do Match */}
                  <div className="progress-track" style={{ height: '7px', marginBottom: '0.9rem' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${score}%`,
                        background: score >= 78 ? 'var(--gradient-emerald)' : 'var(--gradient-brand)'
                      }}
                    />
                  </div>

                  {vaga.descricao && (
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '0.9rem', lineHeight: 1.55 }}>
                      {vaga.descricao}
                    </p>
                  )}

                  {/* Raio-X Rápido: O que você tem vs O que falta para ser um Match */}
                  <div className="grid-2" style={{ background: 'rgba(7, 11, 20, 0.55)', padding: '0.9rem 1rem', borderRadius: '10px', marginBottom: '1rem', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
                        ✅ Pontos em comum com seu currículo:
                      </div>
                      <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                        {match.matched_keywords && match.matched_keywords.length > 0
                          ? match.matched_keywords.join(', ')
                          : vaga.termo || 'Alinhado à sua busca'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>
                        ⚠️ O que fazer para subir seu Match nesta vaga:
                      </div>
                      <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                        {match.tailoring_action || 'Clique abaixo para a IA adaptar seu currículo com as palavras-chave desta vaga.'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => abrirEstudioIAParaVaga(vaga)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }}
                    >
                      <Sparkles size={16} /> Adaptar Meu Currículo & Ver Como Dar 100% Match (IA)
                    </button>

                    {vaga.link && (
                      <a
                        href={vaga.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          fontSize: '0.86rem',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          fontWeight: 600
                        }}
                      >
                        Abrir Vaga Original <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== ESTÚDIO IA: INJOBMAN + HIREME + JOB MATCHER ==================== */}
      <div id="estudio-ia-section">
        {gerandoIA && (
          <div className="glass-panel animate-fade-in" style={{ padding: '3rem 2rem', textAlign: 'center', border: '1px solid var(--primary-color)' }}>
            <Loader2 size={42} className="animate-spin mx-auto" style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              A IA está construindo seu Currículo Sob Medida para &ldquo;{vagaSelecionada?.titulo}&rdquo;...
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Módulos <strong>Job Matcher</strong>, <strong>Injobman</strong> e <strong>HireMe</strong> reescrevendo seu objetivo, experiências, plano de ação e perguntas da entrevista.
            </p>
          </div>
        )}

        {!gerandoIA && resultadoIA && curriculoAdaptado && (
          <div className="glass-panel animate-slide-up" style={{ padding: '2rem', border: '2px solid var(--primary-color)' }}>
            {/* Cabeçalho do Estúdio IA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
                  ESTÚDIO IA • CURRÍCULO & PREPARAÇÃO PERSONALIZADA
                </span>
                <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>
                  {vagaSelecionada?.titulo} — {vagaSelecionada?.empresa}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div className="badge badge-amber" style={{ fontSize: '0.88rem', padding: '6px 12px' }}>
                  Antes: {resultadoIA.match_atual}%
                </div>
                <span style={{ fontWeight: 800, color: '#34d399' }}>➔</span>
                <div className="badge badge-green" style={{ fontSize: '0.95rem', padding: '7px 14px' }}>
                  🚀 Novo Match IA: {resultadoIA.match_pos_otimizacao}%
                </div>
              </div>
            </div>

            {copiadoMsg && (
              <div style={{ marginBottom: '1rem', padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {copiadoMsg}
              </div>
            )}

            {/* Abas do Estúdio IA */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setAbaEstudio('curriculo')}
                className={abaEstudio === 'curriculo' ? '' : 'secondary'}
                style={{ flex: 1, minWidth: '210px', fontSize: '0.88rem' }}
              >
                📄 1. Novo Currículo Gerado (Baixar PDF / Word)
              </button>
              <button
                type="button"
                onClick={() => setAbaEstudio('gaps')}
                className={abaEstudio === 'gaps' ? '' : 'secondary'}
                style={{ flex: 1, minWidth: '210px', fontSize: '0.88rem' }}
              >
                🎯 2. O Que Fazer Para Ser um Match + Carta
              </button>
              <button
                type="button"
                onClick={() => setAbaEstudio('entrevista')}
                className={abaEstudio === 'entrevista' ? '' : 'secondary'}
                style={{ flex: 1, minWidth: '210px', fontSize: '0.88rem' }}
              >
                🎤 3. Entrevista STAR & Pretensão Salarial
              </button>
            </div>

            {/* ABA 1: NOVO CURRÍCULO GERADO PELA IA + EXPORTAÇÃO IMEDIATA */}
            {abaEstudio === 'curriculo' && (
              <div className="animate-fade-in">
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  ✨ <strong>Módulo Injobman ativo:</strong> Abaixo está a versão do seu currículo reescrita pela IA especificamente para passar na triagem da vaga de <strong>{vagaSelecionada?.titulo}</strong>. Você pode revisar/editar qualquer texto abaixo e baixar o PDF ou Word na hora!
                </div>

                <div className="input-group">
                  <label>Objetivo Profissional Otimizado para a Vaga</label>
                  <input
                    type="text"
                    value={curriculoAdaptado.objetivo}
                    onChange={e => setCurriculoAdaptado({ ...curriculoAdaptado, objetivo: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Empresa 1</label>
                    <input
                      type="text"
                      value={curriculoAdaptado.empresa1}
                      onChange={e => setCurriculoAdaptado({ ...curriculoAdaptado, empresa1: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Cargo 1</label>
                    <input
                      type="text"
                      value={curriculoAdaptado.cargo1}
                      onChange={e => setCurriculoAdaptado({ ...curriculoAdaptado, cargo1: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Funções / Resultados da Experiência 1 (Reescritos com Palavras-Chave ATS)</label>
                  <textarea
                    rows={4}
                    value={curriculoAdaptado.funcoes1}
                    onChange={e => setCurriculoAdaptado({ ...curriculoAdaptado, funcoes1: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Competências-Chave e Informações Adicionais Destacadas</label>
                  <textarea
                    rows={3}
                    value={curriculoAdaptado.adicionais}
                    onChange={e => setCurriculoAdaptado({ ...curriculoAdaptado, adicionais: e.target.value })}
                  />
                </div>

                {/* Barra de Exportação Direta em PDF / Word */}
                <div style={{ background: 'rgba(7, 11, 20, 0.75)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', marginTop: '1.25rem' }}>
                  <h4 style={{ marginBottom: '0.85rem', fontSize: '1rem' }}>
                    📥 Exportar Este Novo Currículo Otimizado
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={modeloPdfId}
                      onChange={e => setModeloPdfId(e.target.value)}
                      style={{ flex: 2, minWidth: '220px' }}
                    >
                      {MODELOS_EXPORT.map(m => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => exportToPDF(curriculoAdaptado, modeloPdfId)}
                      style={{ background: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileDown size={18} /> Baixar em PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => exportToWord(curriculoAdaptado, modeloPdfId)}
                      style={{ background: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileText size={18} /> Baixar em Word (.DOC)
                    </button>

                    <button
                      type="button"
                      className="secondary"
                      disabled={salvandoBase}
                      onClick={salvarCurriculoAdaptadoComoPrincipal}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Check size={16} /> {salvandoBase ? 'Salvando...' : 'Salvar como Meu Currículo Principal'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: O QUE FAZER PARA SER UM MATCH + CARTA DE APRESENTAÇÃO */}
            {abaEstudio === 'gaps' && (
              <div className="animate-fade-in">
                <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '1.1rem' }}>
                    <h4 style={{ color: '#34d399', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      ✅ Pontos Fortes que Você Já Tem
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(resultadoIA.pontos_fortes || []).map((pf, i) => (
                        <span key={i} className="badge badge-green">✓ {pf}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '1.1rem' }}>
                    <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      ⚠️ Palavras-Chave que Faltavam no Currículo
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(resultadoIA.gaps_faltantes || []).length > 0 ? (
                        resultadoIA.gaps_faltantes.map((gap, i) => (
                          <span key={i} className="badge badge-amber">+ {gap}</span>
                        ))
                      ) : (
                        <span className="badge badge-green">Todas as palavras-chave cobertas!</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(7, 11, 20, 0.65)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#60a5fa', marginBottom: '0.75rem' }}>
                    🎯 Plano de Ação: O que fazer para conquistar esta vaga
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(resultadoIA.o_que_fazer_para_match || []).map((acao, i) => (
                      <div key={i} style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>{i + 1}.</span>
                        <span>{acao}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#34d399' }}>✉️ Carta de Apresentação / Mensagem para o Recrutador</h4>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => copiarTexto(resultadoIA.carta_apresentacao, 'Carta de Apresentação')}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Copy size={14} /> Copiar Mensagem
                    </button>
                  </div>
                  <pre style={{
                    background: 'rgba(7, 11, 20, 0.75)',
                    border: '1px solid var(--border-color)',
                    padding: '1rem',
                    borderRadius: '10px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)'
                  }}>
                    {resultadoIA.carta_apresentacao}
                  </pre>
                </div>
              </div>
            )}

            {/* ABA 3: PREPARADOR DE ENTREVISTA (STAR) & NEGOCIAÇÃO SALARIAL (HIREME) */}
            {abaEstudio === 'entrevista' && (
              <div className="animate-fade-in">
                <h4 style={{ color: '#c084fc', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mic size={18} /> Perguntas Mais Prováveis na Entrevista & Como Responder (Método STAR)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
                  {(resultadoIA.perguntas_entrevista || []).map((item, i) => (
                    <div key={i} style={{ background: 'rgba(7, 11, 20, 0.7)', border: '1px solid var(--border-color)', padding: '1.15rem', borderRadius: '10px' }}>
                      <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.45rem', fontSize: '0.96rem' }}>
                        ❓ Pergunta {i + 1}: &ldquo;{item.pergunta}&rdquo;
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <strong style={{ color: '#34d399' }}>💡 Roteiro de Resposta STAR:</strong> {item.resposta_star}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#fbbf24' }}>💰 Como Responder &ldquo;Qual sua pretensão salarial?&rdquo; e Negociar</h4>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => copiarTexto(resultadoIA.script_pretensao_salarial, 'Script Salarial')}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Copy size={14} /> Copiar Script
                    </button>
                  </div>
                  <pre style={{
                    background: 'rgba(7, 11, 20, 0.75)',
                    border: '1px solid var(--border-color)',
                    padding: '1rem',
                    borderRadius: '10px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)'
                  }}>
                    {resultadoIA.script_pretensao_salarial}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
