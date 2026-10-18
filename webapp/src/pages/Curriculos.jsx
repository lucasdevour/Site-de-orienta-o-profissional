import { Link } from 'react-router-dom';
import { Sparkles, Briefcase } from 'lucide-react';
import Stepper from '../components/Stepper';

export default function Curriculos() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '2.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem',
        padding: '1.35rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14), rgba(17, 24, 39, 0.85))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
      }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.45rem' }}>
            <Sparkles size={13} /> Passo a Passo + Otimização IA
          </span>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Construtor de Currículo Base (ATS Brasil)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Monte seu currículo principal com auxílio da IA e exporte em PDF ou Word (.docx). Para criar versões sob medida para uma vaga específica, acesse a central de Vagas & Match.
          </p>
        </div>
        <Link to="/robo" className="btn-secondary" style={{ textDecoration: 'none' }}>
          <Briefcase size={16} /> Ir para Vagas & Match
        </Link>
      </div>

      <Stepper />
    </div>
  );
}
