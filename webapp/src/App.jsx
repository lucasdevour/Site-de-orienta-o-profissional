import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Curriculos from './pages/Curriculos';
import Robo from './pages/Robo';
import Login from './pages/Login';
import Layout from './components/Layout';

// Um componente simples para proteger rotas
function PrivateRoute({ children }) {
  const user = localStorage.getItem('userEmail');
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="curriculos" element={<Curriculos />} />
          <Route path="robo" element={<Robo />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
