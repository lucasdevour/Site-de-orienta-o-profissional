import Stepper from '../components/Stepper';

export default function Curriculos() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem' }}>Construtor de Currículo</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Crie seu currículo passo a passo e exporte em múltiplos formatos otimizados.
        </p>
      </div>
      
      <Stepper />
    </div>
  );
}
