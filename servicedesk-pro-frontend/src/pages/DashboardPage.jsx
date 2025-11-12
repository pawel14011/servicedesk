import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import { seedAllData } from '../scripts/seedFirestore';

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
           <button onClick={seedAllData} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#4CAF50', color: 'white', cursor: 'pointer' }}>
            🌱 Seed Data
          </button>

        <div className="role-info">
          {userRole === 'client' && (
            <div>
              <h3>📋 Panel Klienta</h3>
              <p>Możesz zgłaszać awarie i śledzić ich status</p>
              <button>Zgłoś nową awarie</button>
            </div>
          )}

          {userRole === 'worker' && (
            <div>
              <h3>👷 Panel Pracownika</h3>
              <p>Możesz rejestrować zgłoszenia i urządzenia</p>
              <button>Nowe zgłoszenie</button>
            </div>
          )}

          {userRole === 'technician' && (
            <div>
              <h3>🔧 Panel Technika</h3>
              <p>Możesz przeglądać i naprawiać przypisane urządzenia</p>
              <button>Moje zgłoszenia</button>
            </div>
          )}

          {userRole === 'manager' && (
            <div>
              <h3>📊 Panel Menedżera</h3>
              <p>Masz dostęp do wszystkich funkcji i raportów</p>
              <button>Raporty</button>
              <button>Użytkownicy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
