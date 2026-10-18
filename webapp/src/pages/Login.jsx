import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, UserPlus, Sparkles, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'error' | 'success', msg: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const endpoint = isLogin ? '/api/login' : '/api/cadastro';
    try {
      const res = await fetch(`https://site-de-orienta-o-profissional-1.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          localStorage.setItem('userEmail', data.email);
          navigate('/app');
        } else {
          setFeedback({ type: 'success', msg: 'Conta criada com sucesso! Faça seu login abaixo para acessar a plataforma.' });
          setIsLogin(true);
        }
      } else {
        setFeedback({ type: 'error', msg: data.detail || 'Não foi possível autenticar. Verifique seus dados.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', msg: 'Servidor iniciando ou indisponível no momento. Tente novamente em alguns segundos.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div style={{ width: '100%', maxWidth: '430px', marginBottom: '1rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Voltar para a Página Inicial
        </Link>
      </div>

      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '430px',
        width: '100%',
        padding: '2.25rem',
        textAlign: 'center',
        border: '1px solid rgba(99, 102, 241, 0.3)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'var(--gradient-brand)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          marginBottom: '1rem',
          boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)'
        }}>
          <Sparkles size={24} />
        </div>

        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          {isLogin ? 'Acesse sua Carreira IA' : 'Crie sua Conta Gratuita'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.6rem' }}>
          {isLogin
            ? 'Entre para ver seu Match com vagas reais e gerar currículos sob medida.'
            : 'Monte seu currículo ATS e descubra seu Match com vagas de todo o Brasil.'}
        </p>

        {feedback && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            textAlign: 'left',
            fontSize: '0.85rem',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
            border: feedback.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            color: feedback.type === 'success' ? '#6EE7B7' : '#FCA5A5'
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} style={{ flexShrink: 0 }} /> : <AlertCircle size={18} style={{ flexShrink: 0 }} />}
            <span>{feedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="input-group">
            <label>Seu E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} style={{ position: 'absolute', left: '13px', top: '13px', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label>Sua Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', left: '13px', top: '13px', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? 'Conectando...' : (isLogin ? 'Entrar na Plataforma' : 'Criar Minha Conta')}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', fontSize: '0.88rem' }}
            onClick={() => {
              setIsLogin(!isLogin);
              setFeedback(null);
            }}
          >
            {isLogin ? 'Ainda não tem conta? Cadastre-se grátis' : 'Já possui cadastro? Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
