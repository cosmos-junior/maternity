import { useEffect, useState } from 'react';
import { staffApi } from '../api';
import { StaffUser } from '../types';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'var(--hosp-red, #ef4444)',
  DOCTOR: 'var(--hosp-teal, #14b8a6)',
  NURSE: 'var(--hosp-green, #22c55e)',
};

const BLANK_FORM = { email: '', full_name: '', password: '', role: 'NURSE' as const, phone_number: '' };

export default function AdminUsers() {
  const [users, setUsers]     = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(BLANK_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await staffApi.list();
      setUsers(data.results ?? data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await staffApi.register(form);
      setSuccess('Staff member created ✓');
      setTimeout(() => setSuccess(''), 3000);
      setForm(BLANK_FORM);
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await staffApi.deactivate(id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed.');
    }
  };

  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      await staffApi.changeRole(id, newRole);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed.');
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>👥 User Management</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Close' : '+ Add Staff'}
          </button>
        </div>
      </header>

      <div className="page-body">
        {success && <div className="alert alert-success">✓ {success}</div>}

        {showForm && (
          <div className="card mb-6" style={{ borderLeft: '3px solid var(--hosp-teal)' }}>
            <div className="section-title">➕ Register New Staff Member</div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" required value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-select" value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                    <option value="NURSE">Nurse</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={form.phone_number}
                    onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : '✓ Create Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.full_name}</strong></td>
                      <td className="text-muted">{u.email}</td>
                      <td>
                        <select
                          className="form-select"
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{
                            width: 130,
                            color: ROLE_COLORS[u.role],
                            fontWeight: 700,
                            fontSize: '0.78rem',
                          }}
                        >
                          <option value="NURSE">NURSE</option>
                          <option value="DOCTOR">DOCTOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="text-muted">{u.phone_number || '—'}</td>
                      <td className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(u.date_joined).toLocaleDateString('en-KE')}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeactivate(u.id)}
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
