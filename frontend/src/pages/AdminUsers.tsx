import { useEffect, useState } from 'react';
import { staffApi } from '../api';
import { StaffUser } from '../types';
import { Users, UserPlus, ShieldCheck, Trash2, Mail, Phone, Shield } from 'lucide-react';

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
      setSuccess('Staff member created');
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
        <h1 className="flex items-center gap-2 italic-none"><Users className="text-primary" /> User Management</h1>
        <div className="header-actions">
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Close' : <><UserPlus size={18} /> Add Staff</>}
          </button>
        </div>
      </header>

      <div className="page-body">
        {success && <div className="alert alert-success italic-none flex items-center gap-2"><ShieldCheck size={18} /> {success}</div>}

        {showForm && (
          <div className="card mb-6 border-l-4 border-teal-500 shadow-sm italic-none">
            <div className="section-title flex items-center gap-2">
               <UserPlus size={20} className="text-teal-500" /> Register New Staff Member
            </div>
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
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="form-input pl-10" type="email" required value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="form-input pl-10" value={form.phone_number}
                      onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+254..." />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input className="form-input" type="password" required value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <div className="relative">
                    <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select className="form-select pl-10 text-xs font-bold" value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                      <option value="NURSE">NURSE</option>
                      <option value="DOCTOR">DOCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 italic-none">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                   {saving ? 'Registering...' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : (
          <div className="card shadow-sm border-none italic-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="uppercase text-[11px] font-bold tracking-wider text-slate-500">
                    <th className="px-4 py-3">User / Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-center">Contact</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 italic-none">
                        <div className="font-bold text-sm text-slate-900">{u.full_name || 'Staff Member'}</div>
                        <div className="text-slate-400 text-xs">{u.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          className="bg-transparent border-none font-bold text-[10px] cursor-pointer focus:ring-0 p-0 outline-none"
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{ color: ROLE_COLORS[u.role] }}
                        >
                          <option value="NURSE">NURSE</option>
                          <option value="DOCTOR">DOCTOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                           <Phone size={12} className="text-slate-400" /> {u.phone_number || '—'}
                         </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {new Date(u.date_joined).toLocaleDateString('en-KE')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50"
                          onClick={() => handleDeactivate(u.id)}
                          title="Deactivate User"
                        >
                          <Trash2 size={16} />
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
