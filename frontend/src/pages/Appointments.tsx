import React, { useEffect, useState, useCallback } from 'react';
import { 
  Calendar, 
  Plus, 
  RefreshCw, 
  Check, 
  X, 
  Clock,
  ChevronRight,
  Filter
} from 'lucide-react';
import { appointmentsApi, patientsApi } from '../api';
import { Appointment, Patient, AppointmentStatus } from '../types';
import { formatDate, STATUS_COLORS, APPT_TYPE_LABELS } from '../utils';

const STATUSES: { val: AppointmentStatus | ''; label: string }[] = [
  { val: '', label: 'All' }, { val: 'UPCOMING', label: 'Upcoming' },
  { val: 'ATTENDED', label: 'Attended' }, { val: 'MISSED', label: 'Missed' },
  { val: 'RESCHEDULED', label: 'Rescheduled' },
];

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [showReschedule, setShowReschedule] = useState<number | null>(null);
  const [newDate, setNewDate] = useState('');
  const [form, setForm] = useState({ patient: '', appointment_type: 'ANC1', scheduled_date: '', scheduled_time: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string,string> = {};
    if (statusFilter) params.status = statusFilter;
    const [aRes, pRes] = await Promise.all([
      appointmentsApi.list(params),
      patientsApi.list(),
    ]);
    setAppointments(aRes.data.results ?? aRes.data);
    setPatients(pRes.data.results ?? pRes.data);
    setLoading(false);
  }, [statusFilter]);
  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const markAttended = async (id: number) => {
    await appointmentsApi.markAttended(id); flash('Marked as attended ✓'); load();
  };
  const markMissed = async (id: number) => {
    await appointmentsApi.markMissed(id); flash('Marked as missed'); load();
  };
  const handleReschedule = async () => {
    if (!showReschedule || !newDate) return;
    await appointmentsApi.reschedule(showReschedule, { scheduled_date: newDate });
    setShowReschedule(null); flash('Rescheduled ✓'); load();
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await appointmentsApi.create(form);
      setShowModal(false); load();
    } finally { setSaving(false); }
  };

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <Calendar className="text-primary" size={28} /> Appointments
        </h1>
        <div className="header-actions">
          <button id="new-appointment-btn" className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </header>

      <div className="page-body">
        {actionMsg && <div className="alert alert-success flex items-center gap-2">
          <Check size={16} /> {actionMsg}
        </div>}

        <div className="filter-bar flex flex-wrap items-center gap-2">
          {STATUSES.map(s => (
            <button
              key={s.val}
              className={`btn ${statusFilter === s.val ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setStatusFilter(s.val)}
            >{s.label}</button>
          ))}
          <button className="btn btn-ghost btn-sm flex items-center gap-2" style={{ marginLeft: 'auto' }} onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="card">
          {loading ? <div className="loading-wrap"><div className="spinner" /></div>
          : appointments.length === 0
          ? <div className="empty-state">
              <div className="empty-icon"><Calendar size={48} /></div>
              <div className="empty-title">No appointments found</div>
            </div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Patient</th><th>Type</th><th>Date</th><th>Time</th>
                  <th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.patient_name}</div>
                        <div className="text-muted text-sm">{a.patient_number}</div>
                      </td>
                      <td>{APPT_TYPE_LABELS[a.appointment_type]}</td>
                      <td>{formatDate(a.scheduled_date)}</td>
                      <td className="text-muted">{a.scheduled_time ?? '—'}</td>
                      <td><span className={`badge badge-${STATUS_COLORS[a.status]}`}>{a.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {a.status === 'UPCOMING' && <>
                            <button className="btn btn-success btn-sm flex items-center gap-1" onClick={() => markAttended(a.id)}>
                              <Check size={14} /> Attend
                            </button>
                            <button className="btn btn-danger btn-sm flex items-center gap-1" onClick={() => markMissed(a.id)}>
                              <X size={14} /> Miss
                            </button>
                            <button className="btn btn-ghost btn-sm flex items-center gap-1" onClick={() => { setShowReschedule(a.id); setNewDate(a.scheduled_date); }}>
                              <Clock size={14} /> Reschedule
                            </button>
                          </>}
                          {a.status === 'MISSED' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => { setShowReschedule(a.id); setNewDate(''); }}>📆 Reschedule</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Schedule Appointment</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select className="form-select" required value={form.patient} onChange={e => setForm(f => ({...f, patient: e.target.value}))}>
                  <option value="">— Select Patient —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.patient_number} — {p.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Appointment Type *</label>
                <select className="form-select" value={form.appointment_type} onChange={e => setForm(f => ({...f, appointment_type: e.target.value}))}>
                  {Object.entries(APPT_TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" required value={form.scheduled_date} onChange={e => setForm(f => ({...f, scheduled_date: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" type="time" value={form.scheduled_time} onChange={e => setForm(f => ({...f, scheduled_time: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="save-appointment-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : '✓ Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowReschedule(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <div className="modal-title">Reschedule Appointment</div>
              <button className="modal-close" onClick={() => setShowReschedule(null)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">New Date *</label>
              <input className="form-input" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowReschedule(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReschedule}>✓ Reschedule</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
