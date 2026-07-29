import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';

const API_URL = 'https://site-de-orienta-o-profissional-1.onrender.com/api';

export default function Robo() {
  const [link, setLink] = useState('');
  const [vinculado, setVinculado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [botConfig, setBotConfig] = useState({
    estado: '',
    cidade: '',
    termos: ''
  });

  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    const fetchData = async () => {
      if (!email) return;
      try {
        // Puxa link
        const resLink = await fetch(`${API_URL}/telegram-link/${email}`);
        if (resLink.ok) {
          const data = await resLink.json();
          setLink(data.link);
        }
        
        // Puxa configurações reais
        const resConfig = await fetch(`${API_URL}/bot-config/${email}`);
        if (resConfig.ok) {
          const conf = await resConfig.json();
          setVinculado(conf.vinculado);
          if (conf.vinculado) {
            setBotConfig({ estado: conf.estado, cidade: conf.cidade, termos: conf.termos });
          }
        }
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [email]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/bot-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...botConfig })
      });
      alert("Configurações salvas! O robô agora buscará essas vagas.");
    } catch (e) {
      alert("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 size={32} className="animate-spin mx-auto text-[var(--accent-color)]" /></div>;
  }
  
  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-color)' }}>Painel do Robô</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gerencie seus alertas do Telegram diretamente por aqui.</p>
      </div>

      {!vinculado ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Conecte seu Telegram</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Para receber alertas automáticos de vagas diárias, ative o bot.</p>
          <a 
            href={link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', background: 'var(--gradient-brand)', color: 'white', padding: '1rem 2.5rem', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)' }}
          >
            Ativar Alertas no Telegram
          </a>
        </div>
      ) : (
        <div className="glass-panel animate-slide-up" style={{ padding: '2.5rem' }}>
          <div style={{ color: '#10B981', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
            ✅ Conta Vinculada ao Telegram
          </div>
          
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Configurar Buscas</h3>

          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Estado (Sigla)</label>
              <input type="text" value={botConfig.estado} onChange={e => setBotConfig({...botConfig, estado: e.target.value})} placeholder="SC" maxLength={2} />
            </div>
            <div className="input-group" style={{ flex: 3 }}>
              <label>Cidade</label>
              <input type="text" value={botConfig.cidade} onChange={e => setBotConfig({...botConfig, cidade: e.target.value})} placeholder="Ex: Itajaí" />
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label>Áreas de Interesse (Cargos)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {[
                'Assistente Administrativo', 'Recepcionista', 'Jovem Aprendiz', 
                'Atendimento ao Cliente', 'Vendas', 'Caixa', 
                'Logística', 'Estoque', 'Recursos Humanos', 'TI / Suporte'
              ].map(tag => {
                const isSelected = botConfig.termos.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      let novosTermos = botConfig.termos.split(',').map(t => t.trim()).filter(t => t);
                      if (isSelected) {
                        novosTermos = novosTermos.filter(t => t !== tag);
                      } else {
                        novosTermos.push(tag);
                      }
                      setBotConfig({ ...botConfig, termos: novosTermos.join(', ') });
                    }}
                    className={`tag-button ${isSelected ? 'selected' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    type="button"
                  >
                    {isSelected ? '✓ ' : '+ '}{tag}
                  </button>
                );
              })}
            </div>
            <small style={{ color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>
              Selecione as áreas que você deseja receber vagas no Telegram.
            </small>
          </div>

          <button onClick={handleSaveConfig} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
            <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Preferências no Robô'}
          </button>
        </div>
      )}
    </div>
  );
}
