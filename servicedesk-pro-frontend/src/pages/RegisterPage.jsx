import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, fullName, role, phone);
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
        <h2>Rejestracja</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Imię i Nazwisko:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Telefon:</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
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

          <div className="form-group">
            <label>Rola:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Klient</option>
              <option value="worker">Pracownik</option>
              <option value="technician">Technik</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Rejestracja...' : 'Zarejestruj się'}
          </button>
        </form>

        <p>
          Masz już konto? <a href="/login">Zaloguj się</a>
        </p>
      </div>
    </div>
  );
};
