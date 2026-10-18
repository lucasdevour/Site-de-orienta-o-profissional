import { useState, useEffect } from 'react';
import { Loader2, Save, Search, Sparkles, ShieldAlert, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';

const API_URL = 'https://site-de-orienta-o-profissional-1.onrender.com/api';

const TAGS_SUGERIDAS = [
  'Assistente Administrativo', 'Recepcionista', 'Jovem Aprendiz',
  'Atendimento ao Cliente', 'Vendas', 'Caixa',
  'Logística', 'Estoque', 'Recursos Humanos', 'TI / Suporte', 'Eletricista'
];

export default function Robo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [vagas, setVagas] = useState([]);
  const [kitAtivo, setKitAtivo] = useState(null);
  const [loadingKit, setLoadingKit] = useState(false);
  const [copiadoMsg, setCopiadoMsg] = useState('');

  const [botConfig, setBotConfig] = useState({
    estado: 'SC',
    cidade: 'Itajaí',
    termos: 'Recursos Humanos, Assistente Administrativo'
  });

  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    const fetchData = async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      try {
        const resConfig = await fetch(`${API_URL}/preferencias/${email}`);
        if (resConfig.ok) {
          const conf = await resConfig.json();
          setBotConfig({
            estado: conf.estado || 'SC',
            cidade: conf.cidade || 'Itajaí',
            termos: conf.termos || 'Recursos Humanos, Assistente Administrativo'
          });
        }
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [email]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/preferencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...botConfig })
      });
      alert('Preferências salvas com sucesso!');
    } catch (e) {
      alert('Erro ao salvar preferências.');
    } finally {
      setSaving(false);
    }
  };

  const handleBuscarVagas = async () => {
    setSearching(true);
    setKitAtivo(null);
    try {
      const res = await fetch(`${API_URL}/buscar-vagas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...botConfig })
      });
      if (res.ok) {
        const data = await res.json();
        setVagas(data.vagas || []);
      } else {
        alert('Não foi possível buscar vagas no momento.');
      }
    } catch (e) {
      console.error('Erro na busca:', e);
      alert('Erro ao conectar ao servidor de busca.');
    } finally {
      setSearching(false);
    }
  };

  const handleGerarKit = async (vaga) => {
    setLoadingKit(true);
    try {
      const res = await fetch(`${API_URL}/preparar-candidatura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vaga,
          email,
          termos: botConfig.termos
        })
      });
      if (res.ok) {
        const kit = await res.json();
        setKitAtivo({ ...kit, recruitxray: vaga.recruitxray });
      }
    } catch (e) {
      console.error('Erro ao gerar kit:', e);
    } finally {
      setLoadingKit(false);
    }
  };

  const copiarTexto = (texto, label) => {
    navigator.clipboard.writeText(texto);
    setCopiadoMsg(label);
    setTimeout(() => setCopiadoMsg(''), 2500);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin mx-auto text-[var(--accent-color)]" />
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
            Caçador de Vagas & Inteligência de Carreira
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Busque vagas ao vivo com Score ATS (Job Matcher), Auditoria Anti-Golpe (RecruitXray) e Kit de Candidatura IA (Injobman + HireMe).
          </p>
        </div>
        <a
          href="/suite.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#60a5fa',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <Sparkles size={16} /> Abrir Suíte Completa (7 Skills) <ExternalLink size={14} />
        </a>
      </div>

      {/* Painel de Configuração e Busca */}
      <div className="glass-panel animate-slide-up" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          1. Configurar Parâmetros de Busca
        </h3>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '90px' }}>
            <label>Estado (UF)</label>
            <input
              type="text"
              value={botConfig.estado}
              onChange={e => setBotConfig({ ...botConfig, estado: e.target.value.toUpperCase() })}
              placeholder="SC"
              maxLength={2}
            />
          </div>
          <div className="input-group" style={{ flex: 3, minWidth: '200px' }}>
            <label>Cidade</label>
            <input
              type="text"
              value={botConfig.cidade}
              onChange={e => setBotConfig({ ...botConfig, cidade: e.target.value })}
              placeholder="Ex: Itajaí"
            />
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: '15px' }}>
          <label>Cargos / Palavras-Chave (Separados por vírgula)</label>
          <input
            type="text"
            value={botConfig.termos}
            onChange={e => setBotConfig({ ...botConfig, termos: e.target.value })}
            placeholder="Ex: Recursos Humanos, Assistente Administrativo"
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            {TAGS_SUGERIDAS.map(tag => {
              const isSelected = botConfig.termos.toLowerCase().includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  onClick={() => {
                    let novosTermos = botConfig.termos.split(',').map(t => t.trim()).filter(t => t);
                    if (isSelected) {
                      novosTermos = novosTermos.filter(t => t.toLowerCase() !== tag.toLowerCase());
                    } else {
                      novosTermos.push(tag);
                    }
                    setBotConfig({ ...botConfig, termos: novosTermos.join(', ') });
                  }}
                  className={`tag-button ${isSelected ? 'selected' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  type="button"
                >
                  {isSelected ? '✓ ' : '+ '}{tag}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <button
            onClick={handleBuscarVagas}
            disabled={searching}
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: '#fff',
              fontWeight: 700
            }}
          >
            {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {searching ? 'Varrendo Vagas & Calculando Score ATS...' : 'Buscar Vagas Ao Vivo (Job Matcher + RecruitXray)'}
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </div>

      {/* Lista de Vagas Encontradas */}
      {vagas.length > 0 && (
        <div className="glass-panel animate-slide-up" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            2. Vagas Encontradas & Ranqueadas por Compatibilidade ({vagas.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vagas.map((vaga, idx) => {
              const match = vaga.match || { match_score: 75, match_tier: 'Forte', emoji_tier: '🔵', matched_keywords: [], missing_keywords: [], tailoring_action: '' };
              const xray = vaga.recruitxray || { badge_label: '🟢 Baixo Risco', risk_score: 10, brutal_truth: '' };

              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        {vaga.titulo}
                      </h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        🏢 <strong>{vaga.empresa || 'Empresa Confidencial'}</strong> • 📍 {vaga.cidade} • 🌐 {vaga.plataforma}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        color: '#22d3ee',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        🎯 ATS: {match.match_score}% ({match.match_tier})
                      </span>
                      <span style={{
                        background: xray.risk_score > 60 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: xray.risk_score > 60 ? '#fb7185' : '#34d399',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {xray.badge_label} ({xray.risk_score}/100)
                      </span>
                    </div>
                  </div>

                  {vaga.descricao && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      {vaga.descricao}
                    </p>
                  )}

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                    <div>💡 <strong>Dica Job Matcher:</strong> {match.tailoring_action}</div>
                    {xray.brutal_truth && (
                      <div style={{ marginTop: '4px' }}>🛡️ <strong>RecruitXray:</strong> {xray.brutal_truth}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleGerarKit(vaga)}
                      disabled={loadingKit}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.55rem 1rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      <Sparkles size={16} /> Gerar Kit de Candidatura & Entrevista (Injobman + HireMe)
                    </button>

                    <a
                      href={vaga.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.55rem 1rem',
                        fontSize: '0.85rem',
                        background: 'rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      Candidatar-se na Vaga <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kit de Candidatura e Entrevista Gerado (Injobman + HireMe + RecruitXray) */}
      {kitAtivo && (
        <div className="glass-panel animate-slide-up" style={{ padding: '2rem', border: '1px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ color: 'var(--primary-color)' }}>
              ⚡ Kit IA: {kitAtivo.vaga?.titulo} @ {kitAtivo.vaga?.empresa}
            </h3>
            {copiadoMsg && (
              <span style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> {copiadoMsg} copiado!
              </span>
            )}
          </div>

          {/* 1. Injobman Resumo & Bullets */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ color: '#60a5fa' }}>📄 1. Resumo & Bullets Otimizados para o Currículo (Injobman)</h4>
              <button
                type="button"
                onClick={() => copiarTexto(`${kitAtivo.injobman?.resumo_ats}\n\n${(kitAtivo.injobman?.bullets_curriculo || []).join('\n')}`, 'Resumo ATS')}
                style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Copy size={14} /> Copiar
              </button>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.8)', padding: '1rem', borderRadius: '8px', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '0.75rem' }}><strong>Resumo Profissional:</strong> {kitAtivo.injobman?.resumo_ats}</p>
              {(kitAtivo.injobman?.bullets_curriculo || []).map((b, i) => (
                <div key={i} style={{ color: '#34d399', marginBottom: '4px' }}>{b}</div>
              ))}
            </div>
          </div>

          {/* 2. Injobman Carta de Apresentação */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ color: '#34d399' }}>✉️ 2. Carta de Apresentação Personalizada (Injobman)</h4>
              <button
                type="button"
                onClick={() => copiarTexto(kitAtivo.injobman?.carta_apresentacao || '', 'Carta de apresentação')}
                style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Copy size={14} /> Copiar Carta
              </button>
            </div>
            <pre style={{
              background: 'rgba(15,23,42,0.8)',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              lineHeight: 1.6
            }}>
              {kitAtivo.injobman?.carta_apresentacao}
            </pre>
          </div>

          {/* 3. HireMe Perguntas 80/20 + STAR */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#a78bfa', marginBottom: '0.5rem' }}>🎤 3. Perguntas Prováveis de Entrevista & Roteiro STAR (HireMe)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(kitAtivo.hireme?.perguntas_80_20 || []).map((q, i) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.8)', padding: '1rem', borderRadius: '8px', fontSize: '0.86rem' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '4px' }}>{q.categoria}</div>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>“{q.pergunta}”</div>
                  <div style={{ color: 'var(--text-secondary)' }}><strong>Como responder (STAR):</strong> {q.como_responder_star}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. HireMe Negociação Salarial */}
          <div>
            <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>💰 4. Scripts de Negociação Salarial (HireMe)</h4>
            <div style={{ background: 'rgba(15,23,42,0.8)', padding: '1rem', borderRadius: '8px', fontSize: '0.86rem', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '0.5rem' }}><strong>Pretensão Inicial:</strong> {kitAtivo.hireme?.scripts_negociacao?.pretensao_inicial}</p>
              <p><strong>Contraproposta:</strong> {kitAtivo.hireme?.scripts_negociacao?.contraproposta}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
