import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { TicketsListPage } from './pages/TicketsListPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { DevicesListPage } from './pages/DevicesListPage';
import { DeviceDetailPage } from './pages/DeviceDetailPage';
import { ManagerTicketsPage } from './pages/ManagerTicketsPage';
import { AddDevicePage } from './pages/AddDevicePage';
import { CreateTicketByWorkerPage } from './pages/CreateTicketByWorkerPage';
import { DashboardReportsPage } from './pages/DashboardReportsPage';
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

        <Route
          path="/create-ticket"
          element={
            <ProtectedRoute requiredRole="client">
              <CreateTicketPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <TicketsListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ticket/:ticketId"
          element={
            <ProtectedRoute>
              <TicketDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <DevicesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredRole="manager">
              <DashboardReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-ticket-worker"
          element={
            <ProtectedRoute requiredRole="worker">
              <CreateTicketByWorkerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/device/:deviceId"
          element={
            <ProtectedRoute>
              <DeviceDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager-tickets"
          element={
            <ProtectedRoute requiredRole="manager">
              <ManagerTicketsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-device"
          element={
            <ProtectedRoute requiredRole="client">
              <AddDevicePage />
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
