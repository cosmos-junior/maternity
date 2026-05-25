import { useState } from 'react';
import { auditApi } from '../api';
import { AuditEntry } from '../types';

const MODEL_OPTIONS = [
  { value: 'patient', label: 'Patient' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'partograph', label: 'Partograph Entry' },
  { value: 'postnatal', label: 'Postnatal Record' },
];

export default function AuditLog() {
  const [model, setModel]     = useState('patient');
  const [pk, setPk]           = useState('');
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pk) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await auditApi.getHistory(model, Number(pk));
      setEntries(data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load audit history.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = (t: string) =>
    t === '+' ? '🟢 Created' : t === '~' ? '🟡 Updated' : '🔴 Deleted';

  return (
    <>
      <header className="page-header">
        <h1>📋 Audit Trail</h1>
      </header>

      <div className="page-body">
        <div className="card mb-6">
          <div className="section-title">🔍 Lookup Record History</div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: 180 }}>
              <label className="form-label">Record Type</label>
              <select className="form-select" value={model} onChange={e => setModel(e.target.value)}>
                {MODEL_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ minWidth: 120 }}>
              <label className="form-label">Record ID</label>
              <input className="form-input" type="number" min="1" placeholder="e.g. 1" value={pk}
                onChange={e => setPk(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !pk}>
              {loading ? 'Loading…' : '🔍 Search'}
            </button>
          </form>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {entries.length > 0 && (
          <div className="card">
            <div className="section-title">📜 Change History ({entries.length} entries)</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Date</th>
                    <th>Changed By</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.history_id}>
                      <td>{typeLabel(e.history_type)}</td>
                      <td className="text-muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {new Date(e.history_date).toLocaleString('en-KE', {
                          dateStyle: 'short', timeStyle: 'short',
                        })}
                      </td>
                      <td>{e.history_user}</td>
                      <td>
                        {Object.keys(e.changes).length === 0 ? (
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>Initial record</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {Object.entries(e.changes).map(([field, vals]) => (
                              <div key={field} style={{ fontSize: '0.8rem' }}>
                                <strong>{field}</strong>:{' '}
                                <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>
                                  {vals.old ?? '(empty)'}
                                </span>
                                {' → '}
                                <span style={{ color: 'var(--success, #22c55e)' }}>
                                  {vals.new ?? '(empty)'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
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
