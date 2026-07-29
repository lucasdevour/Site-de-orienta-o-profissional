import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, FileText, Bot, LayoutDashboard } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="app-layout">
      
      {/* Sidebar (Desktop) / Dock (Mobile) */}
      <nav className="bottom-dock glass-panel" style={{ borderRadius: 0 }}>
        
        {/* Logo/Brand (Only visible on Desktop usually, but we can hide it on mobile via CSS if needed, for now just standard items) */}
        <div style={{ padding: '1rem', display: 'none' }} className="desktop-only">
          <h2 className="text-gradient">Balcão IA</h2>
        </div>

        <button 
          className={`dock-item ${isActive('/app')}`} 
          onClick={() => navigate('/app')}
        >
          <LayoutDashboard size={24} />
          <span>Início</span>
        </button>
        
        <button 
          className={`dock-item ${isActive('/app/curriculos')}`} 
          onClick={() => navigate('/app/curriculos')}
        >
          <FileText size={24} />
          <span>Currículo</span>
        </button>
        
        <button 
          className={`dock-item ${isActive('/app/robo')}`} 
          onClick={() => navigate('/app/robo')}
        >
          <Bot size={24} />
          <span>Robô</span>
        </button>
        
        <div style={{ flex: 1 }} className="spacer-desktop"></div>

        <button 
          className="dock-item" 
          onClick={handleLogout}
          style={{ marginTop: 'auto' }}
        >
          <LogOut size={24} />
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
