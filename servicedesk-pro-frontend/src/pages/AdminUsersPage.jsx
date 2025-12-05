import { useState, useEffect } from 'react';


import { useAuth } from '../context/AuthContext';
import {
  getAllUsers,
  updateUser,
  changeUserRole,
  deactivateUser,
  activateUser,
  deleteUser,
  createUserProfile,
  createUserWithAccount,
} from '../services/userService';
import '../styles/admin-users.css';

export const AdminUsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'client',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
      console.log('✅ Users loaded:', usersData.length);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = filter === 'all' ? users : users.filter((u) => u.role === filter);

  const handleEdit = (userData) => {
    setEditingId(userData.id);
    setEditFormData(userData);
  };

  const handleSave = async (userId) => {
    try {
      await updateUser(userId, {
        fullName: editFormData.fullName,
        phone: editFormData.phone,
        email: editFormData.email,
      });
      setEditingId(null);
      await fetchUsers();
      alert('✅ Użytkownik zaktualizowany');
    } catch (error) {
      alert('❌ Błąd: ' + error.message);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Zmienić rolę na "${newRole}"?`)) return;

    try {
      await changeUserRole(userId, newRole);
      await fetchUsers();
      alert('✅ Rola zmieniona');
    } catch (error) {
      alert('❌ Błąd: ' + error.message);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    if (!window.confirm(currentStatus ? 'Deaktywować użytkownika?' : 'Aktywować użytkownika?'))
      return;

    try {
      if (currentStatus) {
        await deactivateUser(userId);
      } else {
        await activateUser(userId);
      }
      await fetchUsers();
      alert('✅ Status zmieniony');
    } catch (error) {
      alert('❌ Błąd: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Na pewno usunąć tego użytkownika? (Tej operacji nie można cofnąć)'))
      return;

    try {
      await deleteUser(userId);
      await fetchUsers();
      alert('✅ Użytkownik usunięty');
    } catch (error) {
      alert('❌ Błąd: ' + error.message);
    }
  };

  const handleAddUser = async () => {
    if (!newUserData.fullName || !newUserData.email) {
      alert('Wypełnij wymagane pola');
      return;
    }

    try {
      // Dla worker, technician, manager - wymagane jest konto z hasłem
      const rolesRequiringAccount = ['worker', 'technician', 'manager'];
      const requiresAccount = rolesRequiringAccount.includes(newUserData.role);

      if (requiresAccount) {
        if (!newUserData.password || newUserData.password.length < 6) {
          alert('Dla tej roli wymagane jest hasło (min. 6 znaków)');
          return;
        }

        // Utwórz użytkownika z kontem authentication
        const newUserId = await createUserWithAccount(
          {
            fullName: newUserData.fullName,
            email: newUserData.email,
            phone: newUserData.phone,
            role: newUserData.role,
            createdBy: user.uid,
          },
          newUserData.password
        );

        setNewUserData({ fullName: '', email: '', phone: '', role: 'client', password: '' });
        setShowNewUserForm(false);
        await fetchUsers();
        alert('✅ Użytkownik dodany z kontem do logowania');
      } else {
        // Dla klienta - tylko profil bez konta
        const newUserId = await createUserProfile({
          fullName: newUserData.fullName,
          email: newUserData.email,
          phone: newUserData.phone,
          role: newUserData.role,
          createdBy: user.uid,
        });

        setNewUserData({ fullName: '', email: '', phone: '', role: 'client', password: '' });
        setShowNewUserForm(false);
        await fetchUsers();
        alert('✅ Użytkownik dodany (bez hasła - klient)');
      }
    } catch (error) {
      alert('❌ Błąd: ' + error.message);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      client: '#2196F3',
      worker: '#FF9800',
      technician: '#4CAF50',
      manager: '#9C27B0',
    };
    return colors[role] || '#999';
  };

  const getRoleLabel = (role) => {
    const labels = {
      client: '👤 Klient',
      worker: '👷 Pracownik',
      technician: '🔧 Technik',
      manager: '📊 Menedżer',
    };
    return labels[role] || role;
  };

  return (
    <div className="admin-users-container">
      <div className="admin-header">
        <h2>👥 Zarządzanie Użytkownikami</h2>
        <button onClick={() => setShowNewUserForm(true)} className="btn-add-user">
          ➕ Dodaj użytkownika
        </button>
      </div>

      {/* Formularz dodawania nowego użytkownika */}
      {showNewUserForm && (
        <div className="new-user-form">
          <div className="form-card">
            <h3>Nowy użytkownik</h3>

            <div className="form-group">
              <label>Imię i Nazwisko:</label>
              <input
                type="text"
                value={newUserData.fullName}
                onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                placeholder="np. Jan Kowalski"
              />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="jan@example.com"
              />
            </div>

            <div className="form-group">
              <label>Telefon (opcjonalnie):</label>
              <input
                type="tel"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                placeholder="123456789"
              />
            </div>

            <div className="form-group">
              <label>Rola:</label>
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
              >
                <option value="client">👤 Klient</option>
                <option value="worker">👷 Pracownik</option>
                <option value="technician">🔧 Technik</option>
                <option value="manager">📊 Menedżer</option>
              </select>
            </div>

            {(newUserData.role === 'worker' || newUserData.role === 'technician' || newUserData.role === 'manager') && (
              <div className="form-group">
                <label>Hasło (wymagane dla tej roli):</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Min. 6 znaków"
                  required
                />
                <small style={{ color: '#999' }}>
                  Dla pracownika, technika i menedżera wymagane jest hasło do logowania
                </small>
              </div>
            )}

            <div className="form-actions">
              <button onClick={handleAddUser} className="btn-save">
                ✓ Dodaj
              </button>
              <button onClick={() => setShowNewUserForm(false)} className="btn-cancel">
                ✕ Anuluj
              </button>
            </div>
            <small style={{ color: '#999', marginTop: '10px', display: 'block' }}>
              ℹ️ Dla klienta: tylko profil bez hasła. Dla pracownika/technika/menedżera: wymagane
              hasło do logowania.
            </small>
          </div>
        </div>
      )}

      {/* Filtry */}
      <div className="admin-filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          Wszyscy ({users.length})
        </button>
        <button className={filter === 'client' ? 'active' : ''} onClick={() => setFilter('client')}>
          Klienci ({users.filter((u) => u.role === 'client').length})
        </button>
        <button className={filter === 'worker' ? 'active' : ''} onClick={() => setFilter('worker')}>
          Pracownicy ({users.filter((u) => u.role === 'worker').length})
        </button>
        <button
          className={filter === 'technician' ? 'active' : ''}
          onClick={() => setFilter('technician')}
        >
          Technicy ({users.filter((u) => u.role === 'technician').length})
        </button>
        <button
          className={filter === 'manager' ? 'active' : ''}
          onClick={() => setFilter('manager')}
        >
          Menedżerowie ({users.filter((u) => u.role === 'manager').length})
        </button>
      </div>

      {/* Tabela użytkowników */}
      {loading ? (
        <p>Ładowanie...</p>
      ) : filteredUsers.length === 0 ? (
        <p>Brak użytkowników</p>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Imię i Nazwisko</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Rola</th>
                <th>Status</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((usr) => (
                <tr key={usr.id} className={!usr.active ? 'inactive' : ''}>
                  {editingId === usr.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editFormData.fullName}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, fullName: e.target.value })
                          }
                          className="inline-input"
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, email: e.target.value })
                          }
                          className="inline-input"
                        />
                      </td>
                      <td>
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, phone: e.target.value })
                          }
                          className="inline-input"
                        />
                      </td>
                      <td>
                        <select
                          value={editFormData.role}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, role: e.target.value })
                          }
                          className="inline-select"
                        >
                          <option value="client">👤 Klient</option>
                          <option value="worker">👷 Pracownik</option>
                          <option value="technician">🔧 Technik</option>
                          <option value="manager">📊 Menedżer</option>
                        </select>
                      </td>
                      <td>
                        <span className="status-badge active">Aktywny</span>
                      </td>
                      <td>
                        <button onClick={() => handleSave(usr.id)} className="btn-save-inline">
                          ✓
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-cancel-inline">
                          ✕
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <strong>{usr.fullName}</strong>
                      </td>
                      <td>{usr.email || 'Brak'}</td>
                      <td>{usr.phone || 'Brak'}</td>
                      <td>
                        <span
                          className="role-badge"
                          style={{ backgroundColor: getRoleColor(usr.role) }}
                        >
                          {getRoleLabel(usr.role)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${usr.active !== false ? 'active' : 'inactive'}`}
                        >
                          {usr.active !== false ? '✓ Aktywny' : '✕ Nieaktywny'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-group">
                          <button
                            onClick={() => handleEdit(usr)}
                            className="btn-edit"
                            title="Edytuj"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleActive(usr.id, usr.active !== false)}
                            className="btn-toggle"
                            title={usr.active !== false ? 'Deaktywuj' : 'Aktywuj'}
                          >
                            {usr.active !== false ? '🔒' : '🔓'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(usr.id)}
                            className="btn-delete"
                            title="Usuń"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
