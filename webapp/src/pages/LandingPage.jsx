import { useNavigate } from 'react-router-dom';
import { Sparkles, Target, FileText, ShieldCheck, ArrowRight, CheckCircle2, Mic } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ paddingBottom: '4rem', overflowX: 'hidden' }}>
      {/* Top Navbar */}
      <header style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '1.25rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59,130,246,0.4)'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem' }}>
              Carreira<span className="text-gradient">IA</span>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="secondary" onClick={() => navigate('/login')} style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            Entrar
          </button>
          <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
            Criar Conta Grátis
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="animate-fade-in" style={{
        minHeight: '78vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        maxWidth: '1100px',
        margin: '0 auto'
      }}>
        <div className="badge badge-purple" style={{ marginBottom: '1.5rem', padding: '8px 18px', fontSize: '0.85rem' }}>
          <Sparkles size={15} /> Plataforma Brasileira de Empregabilidade & Match por IA
        </div>

        <h1 style={{
          fontSize: 'clamp(2.3rem, 5vw, 4.2rem)',
          fontWeight: 800,
          lineHeight: 1.12,
          marginBottom: '1.5rem',
          maxWidth: '920px'
        }}>
          Encontre vagas com <span className="text-gradient">Match Real</span> para o seu currículo — ou crie um novo sob medida com IA.
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: 'var(--text-secondary)',
          marginBottom: '2.5rem',
          maxWidth: '720px',
          lineHeight: 1.65
        }}>
          Chega de enviar o mesmo currículo para dezenas de vagas na Gupy, Sólides e Vagas.com sem resposta.
          Nossa IA cruza seu perfil com vagas reais na sua cidade, mostra exatamente o que falta para dar 100% de match e gera um currículo personalizado para cada vaga.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3.5rem' }}>
          <button
            onClick={() => navigate('/login')}
            className="btn-emerald"
            style={{
              fontSize: '1.08rem',
              padding: '1rem 2.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '12px'
            }}
          >
            Começar Agora Gratuitamente <ArrowRight size={20} />
          </button>
          <button
            className="secondary"
            onClick={() => navigate('/login')}
            style={{
              fontSize: '1.02rem',
              padding: '1rem 2rem',
              borderRadius: '12px'
            }}
          >
            Já tenho conta
          </button>
        </div>

        {/* 4-Step Interactive Preview Banner */}
        <div className="glass-panel animate-slide-up" style={{
          width: '100%',
          padding: '2rem',
          textAlign: 'left',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span className="badge badge-blue">COMO FUNCIONA NA PRÁTICA</span>
            <h3 style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>O Ciclo Completo da Sua Aprovação</h3>
          </div>
          <div className="grid-2">
            <div className="card-interactive">
              <div className="badge badge-blue" style={{ marginBottom: '0.6rem' }}>PASSO 1 • SEU CURRÍCULO BASE</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Cadastre suas experiências uma única vez</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Preencha seu histórico profissional (ou projetos de primeiro emprego) e veja o Índice de Força do seu currículo em tempo real.
              </p>
            </div>
            <div className="card-interactive">
              <div className="badge badge-green" style={{ marginBottom: '0.6rem' }}>PASSO 2 • MATCH AUTOMÁTICO OU BUSCA LIVRE</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Vagas recomendadas pelo seu perfil + Pesquisa aberta</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Veja vagas que já combinam com seu currículo atual ou pesquise livremente qualquer outra área ou cidade que você queira tentar.
              </p>
            </div>
            <div className="card-interactive">
              <div className="badge badge-amber" style={{ marginBottom: '0.6rem' }}>PASSO 3 • O QUE FAZER PARA SER UM MATCH (GAP ANALYSIS)</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Descubra o que falta para passar na triagem ATS</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                O módulo <strong>Job Matcher + RecruitXray</strong> revela as palavras-chave exatas que faltam no seu currículo e audita se a vaga é confiável.
              </p>
            </div>
            <div className="card-interactive">
              <div className="badge badge-purple" style={{ marginBottom: '0.6rem' }}>PASSO 4 • NOVO CURRÍCULO IA + ENTREVISTA (INJOBMAN & HIREME)</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Gere um currículo novo para a vaga em 1 clique</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                A IA reescreve seu objetivo e funções para aquela vaga específica, exporta em 10 layouts PDF/Word e cria seu roteiro de entrevista e salário.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section style={{ maxWidth: '1150px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Tecnologia de Recrutamento Adaptada para o Brasil</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
            Desenvolvido para vencer os filtros da Gupy, Sólides, Vagas.com.br, Catho e LinkedIn Brasil.
          </p>
        </div>

        <div className="grid-3">
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.12)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
              <Target size={24} color="var(--primary-color)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Job Matcher Brasil</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Compara seu currículo com qualquer vaga e mostra sua nota de compatibilidade (0 a 100%), pontos fortes e termos que você precisa incluir.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ background: 'rgba(16,185,129,0.12)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
              <FileText size={24} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Injobman — Gerador IA de Currículos</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Cria uma versão nova do seu currículo adaptada para a vaga escolhida e exporta na hora em PDF ou Word em 10 modelos aprovados por RH.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ background: 'rgba(139,92,246,0.12)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
              <Mic size={24} color="var(--accent-color)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>HireMe & RecruitXray</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Prepara você para as perguntas mais prováveis da entrevista (método STAR), negociação salarial CLT/PJ e protege contra vagas falsas.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
