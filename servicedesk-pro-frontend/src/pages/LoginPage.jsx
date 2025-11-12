import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>ServiceDesk Pro</h1>
        <h2>Zaloguj się</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Hasło:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <p>
          Nie masz konta? <a href="/register">Zarejestruj się</a>
        </p>

        <hr />
        <h3>Demo Konta:</h3>
        <ul>
          <li>👤 Client: client@example.com / password123</li>
          <li>👷 Worker: worker@example.com / password123</li>
          <li>🔧 Technician: technician@example.com / password123</li>
          <li>📊 Manager: manager@example.com / password123</li>
        </ul>
      </div>
    </div>
  );
};
