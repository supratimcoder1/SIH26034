import React, { useState, useEffect } from 'react';
import { Page, Card } from '../components/UI';
import { getUsers, toggleSuspendUser, deleteUser } from '../api';
import { User } from '../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  const load = () => {
    getUsers()
      .then(setUsers)
      .catch(e => setError(e.message || 'Failed to load users'));
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleSuspend = async (id: string, currentlySuspended: boolean) => {
    try {
      await toggleSuspendUser(id, !currentlySuspended);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    try {
      await deleteUser(id);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <Page title="User Management" subtitle="Manage access for officers and viewers">
      <Card>
        {error && <div className="auth-error">{error}</div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><b>{u.name}</b></td>
                  <td>{u.email}</td>
                  <td>{u.role.replace('_', ' ').toUpperCase()}</td>
                  <td>
                    <span className={`badge ${u.isSuspended ? 'red' : 'green'}`}>
                      {u.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <div className="action-buttons">
                        <button 
                          className="secondary compact" 
                          onClick={() => handleToggleSuspend(u.id, u.isSuspended)}
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button 
                          className="danger compact" 
                          onClick={() => handleDelete(u.id)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}
