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
              <button onClick={() => navigate('/create-ticket')}>Zgłoś nową awarię</button>
              <button onClick={() => navigate('/my-tickets')}>Moje zgłoszenia</button>
              <button onClick={() => navigate('/devices')}>Moje urządzenia</button>
            </div>
          )}

          {/* ============= WORKER ============= */}
          {userRole === 'worker' && (
            <div>
              <h3>👷 Panel Pracownika</h3>
              <p>Możesz rejestrować zgłoszenia i urządzenia</p>
              <button onClick={() => navigate('/create-ticket-worker')}>
                Nowe zgłoszenie (Worker)
              </button>
              <button onClick={() => navigate('/my-tickets')}>Wszystkie zgłoszenia</button>
              <button onClick={() => navigate('/devices')}>Wszystkie urządzenia</button>
            </div>
          )}

          {/* ============= TECHNICIAN ============= */}
          {userRole === 'technician' && (
            <div>
              <h3>🔧 Panel Technika</h3>
              <p>Możesz przeglądać i naprawiać przypisane urządzenia</p>
              <button onClick={() => navigate('/my-tickets')}>Moje zgłoszenia</button>
              <button onClick={() => navigate('/devices')}>Wszystkie urządzenia</button>
            </div>
          )}

          {/* ============= MANAGER ============= */}

          {userRole === 'manager' && (
            <div>
              <h3>📊 Panel Menedżera</h3>
              <p>Masz dostęp do wszystkich funkcji i raportów</p>
              <button onClick={() => navigate('/manager-tickets')}>Zarządzanie ticketami</button>
              <button onClick={() => navigate('/devices')}>Wszystkie urządzenia</button>
              <button onClick={() => navigate('/reports')}>Raporty</button>
              <button onClick={() => navigate('/users')}>Użytkownicy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
