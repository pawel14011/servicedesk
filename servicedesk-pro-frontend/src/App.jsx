import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import './App.css';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Ładowanie aplikacji...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect to dashboard by default */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
        />

        {/* Unauthorized */}
        <Route
          path="/unauthorized"
          element={
            <div style={{ textAlign: 'center', padding: '50px' }}>
              ❌ Brak dostępu do tej strony
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
