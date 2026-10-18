import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, FileText, Target, LayoutDashboard, Sparkles } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = localStorage.getItem('userEmail') || '';

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="app-layout">
      {/* Sidebar (Desktop) / Bottom Dock (Mobile) */}
      <nav className="bottom-dock glass-panel" style={{ borderRadius: 0 }}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(59,130,246,0.4)'
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h2 className="text-gradient" style={{ fontSize: '1.2rem', lineHeight: 1.1 }}>Carreira IA</h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Match & Currículos Brasil
              </span>
            </div>
          </div>
          {email && (
            <div style={{
              marginTop: '0.6rem',
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              👤 {email}
            </div>
          )}
        </div>

        <button
          className={`dock-item ${isActive('/app')}`}
          onClick={() => navigate('/app')}
        >
          <LayoutDashboard size={20} />
          <span>Painel & Perfil</span>
        </button>

        <button
          className={`dock-item ${isActive('/app/curriculos')}`}
          onClick={() => navigate('/app/curriculos')}
        >
          <FileText size={20} />
          <span>Currículo & IA</span>
        </button>

        <button
          className={`dock-item ${isActive('/app/robo')}`}
          onClick={() => navigate('/app/robo')}
        >
          <Target size={20} />
          <span>Vagas & Match</span>
        </button>

        <div style={{ flex: 1 }} className="spacer-desktop"></div>

        <button
          className="dock-item"
          onClick={handleLogout}
          style={{ marginTop: 'auto', color: '#fb7185' }}
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="app-content animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
