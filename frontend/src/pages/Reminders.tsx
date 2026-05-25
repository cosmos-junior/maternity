import { useEffect, useState } from 'react';
import { remindersApi, patientsApi, appointmentsApi } from '../api';
import { ReminderLog, Patient, Appointment } from '../types';
import { formatDateTime, APPT_TYPE_LABELS } from '../utils';

export default function Reminders() {
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patient_id: '', appointment_id: '', use_template: true, message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);

  const load = async () => {
    const [lRes, pRes, aRes] = await Promise.all([
      remindersApi.list(),
      patientsApi.list(),
      appointmentsApi.list({ status: 'UPCOMING' }),
    ]);
    setLogs(lRes.data.results ?? lRes.data);
    setPatients(pRes.data.results ?? pRes.data);
    setAppointments(aRes.data.results ?? aRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true); setResult(null);
    try {
      const payload: any = { patient_id: +form.patient_id, use_template: form.use_template };
      if (form.appointment_id) payload.appointment_id = +form.appointment_id;
      if (!form.use_template && form.message) payload.message = form.message;
      const { data } = await remindersApi.send(payload);
      if (data.success) {
        setResult({ success: true, msg: 'SMS sent successfully! ✓' });
        setShowModal(false); load();
      } else {
        setResult({ success: false, msg: `SMS failed: ${data.error || 'Unknown error'}` });
      }
    } catch (err: any) {
      const detail = err.response?.data?.error || err.response?.data?.detail || err.message;
      setResult({ success: false, msg: `Error: ${detail || 'Could not reach the server.'}` });
    } finally { setSending(false); }
  };

  const patientAppointments = appointments.filter(a => a.patient === +form.patient_id);

  return (
    <>
      <header className="page-header">
        <h1>💬 SMS Reminders</h1>
        <div className="header-actions">
          <button id="send-reminder-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>+ Send Reminder</button>
        </div>
      </header>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px', background: 'var(--warning-glow)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.3rem' }}>📱</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--warning)' }}>Africa's Talking Integration</div>
              <div className="text-muted text-sm">Configure your API key in <code style={{ color: 'var(--primary)' }}>.env</code> (AT_API_KEY). Use sandbox mode for testing. Ensure the phone numbers are in international format (+254XXXXXXXXX).</div>
            </div>
          </div>
        </div>

        {loading ? <div className="loading-wrap"><div className="spinner" /></div>
        : (
          <div className="card">
            <div className="section-title mb-4">📋 Sent Reminders ({logs.length})</div>
            {logs.length === 0
              ? <div className="empty-state" style={{ padding: '30px' }}>
                  <div className="empty-icon">💬</div>
                  <div className="empty-title">No reminders sent yet</div>
                  <div className="empty-desc">Use the button above to send your first SMS reminder.</div>
                </div>
              : (
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Patient</th><th>Phone</th><th>Appointment</th>
                      <th>Sent At</th><th>Status</th><th>Provider</th>
                    </tr></thead>
                    <tbody>
                      {logs.map(l => (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 600 }}>{l.patient_name}</td>
                          <td className="text-muted">{l.phone_number}</td>
                          <td className="text-muted">{l.appointment_info ?? '—'}</td>
                          <td className="text-muted">{formatDateTime(l.sent_at)}</td>
                          <td>
                            <span className={`badge badge-${l.delivery_status === 'SENT' ? 'success' : l.delivery_status === 'FAILED' ? 'danger' : 'warning'}`}>
                              {l.delivery_status}
                            </span>
                          </td>
                          <td className="text-muted text-sm">{l.provider.replace('_', "'s ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Send SMS Reminder</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {result && (
              <div className={`alert alert-${result.success ? 'success' : 'danger'}`}>
                {result.success ? '✓' : '⚠️'} {result.msg}
              </div>
            )}
            <form onSubmit={handleSend}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select className="form-select" required value={form.patient_id} onChange={e => setForm(f => ({...f, patient_id: e.target.value, appointment_id: ''}))}>
                  <option value="">— Select Patient —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.patient_number} — {p.full_name} ({p.phone_number})</option>)}
                </select>
              </div>
              {patientAppointments.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Link to Appointment (optional)</label>
                  <select className="form-select" value={form.appointment_id} onChange={e => setForm(f => ({...f, appointment_id: e.target.value}))}>
                    <option value="">— None —</option>
                    {patientAppointments.map(a => (
                      <option key={a.id} value={a.id}>{APPT_TYPE_LABELS[a.appointment_type]} on {a.scheduled_date}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input type="checkbox" checked={form.use_template} onChange={e => setForm(f => ({...f, use_template: e.target.checked}))} />
                  Use automatic message template
                </label>
              </div>
              {!form.use_template && (
                <div className="form-group">
                  <label className="form-label">Custom Message *</label>
                  <textarea className="form-textarea" rows={4} required={!form.use_template}
                    value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
                    placeholder="Dear Jane, your appointment at Itierio Nursing Home…" />
                  <span className="form-hint">{form.message.length}/160 characters</span>
                </div>
              )}
              {form.use_template && form.patient_id && (
                <div className="alert alert-warning" style={{ fontSize: '0.8rem' }}>
                  📱 Message preview: "Dear [Patient Name], your ANC appointment at Itierio Nursing Home is scheduled for [date] at [time]. Please attend…"
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="confirm-send-btn" type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending…' : '📱 Send SMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
