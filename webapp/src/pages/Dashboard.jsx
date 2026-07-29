import { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';

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

export default function Dashboard() {
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
        console.error("Erro ao carregar dados:", e);
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
      setTimeout(() => setSalvando(false), 800);
    } catch (e) {
      console.error("Erro ao salvar:", e);
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
    if (v.length > 7) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    setFormData({ ...formData, [campo]: v });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.8rem', color: 'var(--primary-color)' }}>Meu Perfil</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Gerencie suas informações de conta e dados pessoais.
      </p>
      
      <div className="glass-panel animate-slide-up" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <User size={24} color="var(--accent-color)" />
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>Informações Básicas</h2>
        </div>

        <div className="input-group">
          <label>NOME COMPLETO</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '100px' }}>
            <label>Idade</label>
            <input type="text" name="idade" value={formData.idade} onChange={handleChange} placeholder="Ex: 25" />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label>Nacionalidade</label>
            <select name="nacionalidade" value={formData.nacionalidade} onChange={handleChange}>
              <option>Brasileiro(a)</option><option>Venezuelano(a)</option><option>Uruguaio(a)</option><option>Haitiano(a)</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label>Estado Civil</label>
            <select name="estado_civil" value={formData.estado_civil} onChange={handleChange}>
              <option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>União Estável</option>
            </select>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', margin: '1rem 0 0.5rem 0' }}>Endereço</h3>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 3, minWidth: '200px' }}>
            <label>Rua / Avenida</label>
            <input type="text" name="rua" value={formData.rua} onChange={handleChange} placeholder="Ex: Rua das Flores" />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '80px' }}>
            <label>Número</label>
            <input type="text" name="numero" value={formData.numero} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label>Bairro</label>
            <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '100px' }}>
            <label>Complemento (Opcional)</label>
            <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 2, minWidth: '150px' }}>
            <label>Cidade</label>
            <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '100px' }}>
            <label>Estado (Sigla)</label>
            <input type="text" name="estado" value={formData.estado} onChange={handleChange} placeholder="Ex: SC" maxLength={2} />
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', margin: '1rem 0 0.5rem 0' }}>Contato</h3>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label>Celular / WhatsApp</label>
            <input type="text" value={formData.tel1} onChange={(e) => handleTelefone(e, 'tel1')} placeholder="(00) 00000-0000" />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label>Telefone Recado</label>
            <input type="text" value={formData.tel2} onChange={(e) => handleTelefone(e, 'tel2')} placeholder="(00) 00000-0000" />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div className="input-group" style={{ flex: 2, minWidth: '200px' }}>
            <label>E-mail de Cadastro</label>
            <input type="email" name="email" value={formData.email} disabled style={{ opacity: 0.7 }} />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '120px' }}>
            <label>CNH (Opcional)</label>
            <input type="text" name="cnh" value={formData.cnh} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
          {salvando && <span style={{ color: '#10B981', fontSize: '0.9rem' }}>Salvando alterações...</span>}
          <button onClick={salvarDados} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> Salvar Perfil
          </button>
        </div>
      </div>
    </div>
  );
}
