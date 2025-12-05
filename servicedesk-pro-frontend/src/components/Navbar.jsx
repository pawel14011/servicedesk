import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

export const Navbar = () => {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (userRole) {
      case 'client':
        return [
          { path: '/dashboard', label: '🏠 Strona główna', icon: '🏠' },
          { path: '/create-ticket', label: '➕ Nowe zgłoszenie', icon: '➕' },
          { path: '/my-tickets', label: '📋 Moje zgłoszenia', icon: '📋' },
          { path: '/devices', label: '🖥️ Moje urządzenia', icon: '🖥️' },
        ];
      case 'worker':
        return [
          { path: '/dashboard', label: '🏠 Strona główna', icon: '🏠' },
          { path: '/create-ticket-worker', label: '➕ Nowe zgłoszenie', icon: '➕' },
          { path: '/my-tickets', label: '📋 Wszystkie zgłoszenia', icon: '📋' },
          { path: '/devices', label: '🖥️ Wszystkie urządzenia', icon: '🖥️' },
        ];
      case 'technician':
        return [
          { path: '/dashboard', label: '🏠 Strona główna', icon: '🏠' },
          { path: '/my-tickets', label: '📋 Moje zgłoszenia', icon: '📋' },
          { path: '/devices', label: '🖥️ Wszystkie urządzenia', icon: '🖥️' },
        ];
      case 'manager':
        return [
          { path: '/dashboard', label: '🏠 Strona główna', icon: '🏠' },
          { path: '/manager-tickets', label: '📋 Zarządzanie ticketami', icon: '📋' },
          { path: '/devices', label: '🖥️ Wszystkie urządzenia', icon: '🖥️' },
          { path: '/reports', label: '📊 Raporty', icon: '📊' },
          { path: '/users', label: '👥 Użytkownicy', icon: '👥' },
        ];
      default:
        return [{ path: '/dashboard', label: '🏠 Strona główna', icon: '🏠' }];
    }
  };

  return (
    <nav className="navbar">
      <h1 onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        ServiceDesk Pro
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="navbar-links" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {getNavLinks().map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="navbar-link"
              style={{
                padding: '8px 15px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.3s',
              }}
              onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.1)')}
            >
              {link.label}
            </button>
          ))}
        </div>
        <div className="navbar-user">
          <span>{user?.email}</span>
          <span className="badge">{userRole}</span>
          <button onClick={handleLogout} className="btn-logout">
            Wyloguj się
          </button>
        </div>
      </div>
    </nav>
  );
};

