import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

export const DashboardPage = () => {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>ServiceDesk Pro</h1>
        <div className="navbar-user">
          <span>{user?.email}</span>
          <span className="badge">{userRole}</span>
          <button onClick={handleLogout} className="btn-logout">
            Wyloguj się
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h2>Witaj, {user?.email}!</h2>
        <p>
          Twoja rola: <strong>{userRole}</strong>
        </p>

        <div className="role-info">
          {/* ============= CLIENT ============= */}
          {userRole === 'client' && (
            <div>
              <h3>📋 Panel Klienta</h3>
              <p>Możesz zgłaszać awarie i śledzić ich status</p>
              <div className="dashboard-nav">
                <button onClick={() => navigate('/create-ticket')} className="nav-button">
                  ➕ Zgłoś nową awarię
                </button>
                <button onClick={() => navigate('/my-tickets')} className="nav-button">
                  📋 Moje zgłoszenia
                </button>
                <button onClick={() => navigate('/devices')} className="nav-button">
                  🖥️ Moje urządzenia
                </button>
              </div>
            </div>
          )}

          {/* ============= WORKER ============= */}
          {userRole === 'worker' && (
            <div>
              <h3>👷 Panel Pracownika</h3>
              <p>Możesz rejestrować zgłoszenia i urządzenia</p>
              <div className="dashboard-nav">
                <button onClick={() => navigate('/create-ticket-worker')} className="nav-button">
                  ➕ Nowe zgłoszenie
                </button>
                <button onClick={() => navigate('/my-tickets')} className="nav-button">
                  📋 Wszystkie zgłoszenia
                </button>
                <button onClick={() => navigate('/devices')} className="nav-button">
                  🖥️ Wszystkie urządzenia
                </button>
              </div>
            </div>
          )}

          {/* ============= TECHNICIAN ============= */}
          {userRole === 'technician' && (
            <div>
              <h3>🔧 Panel Technika</h3>
              <p>Możesz przeglądać i naprawiać przypisane urządzenia</p>
              <div className="dashboard-nav">
                <button onClick={() => navigate('/my-tickets')} className="nav-button">
                  📋 Moje zgłoszenia
                </button>
                <button onClick={() => navigate('/devices')} className="nav-button">
                  🖥️ Wszystkie urządzenia
                </button>
              </div>
            </div>
          )}

          {/* ============= MANAGER ============= */}

          {userRole === 'manager' && (
            <div>
              <h3>📊 Panel Menedżera</h3>
              <p>Masz dostęp do wszystkich funkcji i raportów</p>
              <div className="dashboard-nav">
                <button onClick={() => navigate('/manager-tickets')} className="nav-button">
                  📋 Zarządzanie ticketami
                </button>
                <button onClick={() => navigate('/devices')} className="nav-button">
                  🖥️ Wszystkie urządzenia
                </button>
                <button onClick={() => navigate('/reports')} className="nav-button">
                  📊 Raporty
                </button>
                <button onClick={() => navigate('/users')} className="nav-button">
                  👥 Użytkownicy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
