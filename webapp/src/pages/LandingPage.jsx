import { useNavigate } from 'react-router-dom';
import { PlayCircle, Sparkles, Send, FileText, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ paddingBottom: '4rem', overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section className="animate-fade-in" style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        
        {/* Badge */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: 'var(--accent-color)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '2rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Sparkles size={14} /> SaaS de Empregabilidade 2.0
        </div>

        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', 
          fontWeight: '700', 
          lineHeight: '1.1',
          marginBottom: '1.5rem',
          maxWidth: '800px'
        }}>
          O primeiro <span className="text-gradient">Balcão de Empregos</span> impulsionado por IA.
        </h1>
        
        <p style={{ 
          fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
          color: 'var(--text-secondary)',
          marginBottom: '3rem',
          maxWidth: '600px',
          lineHeight: '1.6'
        }}>
          Deixe a Inteligência Artificial moldar o seu currículo, calcular seu Score ATS, auditar vagas contra golpes e preparar sua entrevista direto na plataforma.
        </p>

        {/* Video / Demo Area */}
        <div className="glass-panel animate-slide-up" style={{
          width: '100%',
          maxWidth: '800px',
          aspectRatio: '16/9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '3rem',
          background: 'linear-gradient(rgba(30,41,59,0.7), rgba(15,23,42,0.9))'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80") center/cover', opacity: 0.15 }}></div>
          <PlayCircle size={72} color="var(--primary-color)" style={{ filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.5))', zIndex: 10 }} />
          <span style={{ 
            marginTop: '1.5rem', 
            fontWeight: '600', 
            fontSize: '1.1rem',
            color: 'var(--text-primary)',
            zIndex: 10
          }}>
            Assista como funciona (1 min)
          </span>
        </div>

        <button 
          onClick={() => navigate('/login')}
          style={{ 
            fontSize: '1.1rem',
            padding: '1rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderRadius: '12px'
          }}
        >
          Criar Minha Conta Grátis <ArrowRight size={20} />
        </button>
      </section>

      {/* Features Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Tudo que você precisa em um só lugar</h2>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem' 
        }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Sparkles size={24} color="var(--primary-color)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Score ATS & Adaptação IA</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>O motor Job Matcher + Injobman analisa cada vaga, calcula sua compatibilidade ATS e gera resumo, carta de apresentação e roteiro de entrevista.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ background: 'rgba(139,92,246,0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Send size={24} color="var(--accent-color)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Caçador de Vagas & RecruitXray</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>Busque vagas em tempo real por estado, cidade e cargo já auditadas contra golpes e vagas fantasmas pelo motor RecruitXray.</p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <FileText size={24} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Gerador Oficial ATS</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>Exporte currículos em PDF e Word com layouts aprovados por robôs de recrutamento (ATS Friendly).</p>
          </div>

        </div>
      </section>
    </div>
  );
}
