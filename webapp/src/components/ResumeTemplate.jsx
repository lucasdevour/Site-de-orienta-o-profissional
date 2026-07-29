import React from 'react';

// Um layout super simples, limpo e legível para ATS
const ResumeTemplate = React.forwardRef(({ data }, ref) => {
  return (
    <div style={{ display: 'none' }}>
      <div 
        ref={ref} 
        style={{
          padding: '40px',
          fontFamily: 'Arial, sans-serif',
          color: '#333',
          lineHeight: '1.6',
          backgroundColor: '#fff',
          width: '800px', // Força uma largura fixa para o PDF ficar consistente
          margin: '0 auto'
        }}
      >
        <header style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#111' }}>{data.nome || 'Seu Nome'}</h1>
          <p style={{ margin: '0', fontSize: '14px', color: '#555' }}>
            {data.email} | {data.telefone}
          </p>
        </header>

        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>
            Resumo Profissional
          </h2>
          <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
            {data.resumo || 'Nenhum resumo informado.'}
          </p>
        </section>

        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>
            Experiência
          </h2>
          <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>
            {data.experiencias || 'Nenhuma experiência informada.'}
          </p>
        </section>
        
        {/* Você pode adicionar Formação Acadêmica e Idiomas aqui no futuro */}
      </div>
    </div>
  );
});

export default ResumeTemplate;
