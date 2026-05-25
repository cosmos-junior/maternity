import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientsApi, appointmentsApi, remindersApi } from '../api';
import { Patient, Appointment } from '../types';
import { formatDate, STAGE_LABELS, STAGE_COLORS, RISK_COLORS, STATUS_COLORS, APPT_TYPE_LABELS } from '../utils';
import HighRiskBadge from '../components/HighRiskBadge';
import EddCountdownWidget from '../components/EddCountdownWidget';


export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  const load = async () => {
    if (!id) return;
    const [pRes, aRes, sRes] = await Promise.all([
      patientsApi.get(+id),
      appointmentsApi.list({ patient: id }),
      patientsApi.stats(+id),
    ]);
    setPatient(pRes.data);
    setAppointments(aRes.data.results ?? aRes.data);
    setStats(sRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const markAttended = async (aId: number) => {
    await appointmentsApi.markAttended(aId);
    setActionMsg('Marked as attended ✓'); load();
  };
  const sendReminder = async (a: Appointment) => {
    setSendingReminder(a.id);
    try {
      await remindersApi.send({ patient_id: a.patient, appointment_id: a.id, use_template: true });
      setActionMsg('SMS reminder sent ✓');
    } catch { setActionMsg('Failed to send SMS'); }
    setSendingReminder(null);
    setTimeout(() => setActionMsg(''), 3000);
  };

  if (loading) return (
    <>
      <header className="page-header"><h1>Patient Detail</h1></header>
      <div className="page-body loading-wrap"><div className="spinner" /></div>
    </>
  );
  if (!patient) return <div className="page-body"><p>Patient not found.</p></div>;

  return (
    <>
      <header className="page-header">
        <Link to="/patients" className="btn btn-ghost btn-sm">← Back</Link>
        <h1>{patient.full_name}</h1>
        <div className="header-actions">
          <HighRiskBadge riskLevel={patient.risk_level} inline />
          <span className={`badge badge-${STAGE_COLORS[patient.clinic_stage]}`}>{STAGE_LABELS[patient.clinic_stage]}</span>
          <Link to={`/patients/${patient.id}/nutrition`} className="btn btn-ghost btn-sm">
            🥗 Nutrition
          </Link>
          <Link to={`/patients/${patient.id}/partograph`} className="btn btn-ghost btn-sm">
            📈 Partograph
          </Link>
        </div>
      </header>

      <div className="page-body">
        {actionMsg && <div className="alert alert-success">✓ {actionMsg}</div>}

        <div className="dash-grid mb-6">
          {/* Patient Info Card */}
          <div className="card">
            <div className="section-title">👤 Patient Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {[
                ['Patient #', patient.patient_number],
                ['Phone', patient.phone_number],
                ['Date of Birth', formatDate(patient.date_of_birth)],
                ['Age', patient.age != null ? `${patient.age} years` : '—'],
                ['Next of Kin', patient.next_of_kin_name || '—'],
                ['NOK Phone', patient.next_of_kin_phone || '—'],
                ['Address', patient.address || '—'],
                ['Registered', formatDate(patient.created_at)],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: 500, fontSize: '0.88rem', marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Maternity Info */}
          <HighRiskBadge riskLevel={patient.risk_level} wrapCard>
            <div className="card">
              <div className="section-title">🩺 Maternity Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 20 }}>
                {[
                  ['LMP', formatDate(patient.lmp)],
                  ['EDD', formatDate(patient.edd)],
                  ['Weeks Pregnant', patient.weeks_pregnant != null ? `${patient.weeks_pregnant} weeks` : '—'],
                  ['Blood Group', (patient as any).blood_group || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontWeight: 500, fontSize: '0.88rem', marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* EDD Countdown widget */}
              <EddCountdownWidget edd={patient.edd} weeksPregnant={patient.weeks_pregnant} />

              {patient.notes && <><div className="divider" /><div className="text-muted" style={{ fontSize: '0.8rem' }}>{patient.notes}</div></>}

              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 20 }}>
                  {[
                    ['Total', stats.total_appointments, 'primary'],
                    ['Attended', stats.attended, 'success'],
                    ['Missed', stats.missed, 'danger'],
                    ['Upcoming', stats.upcoming, 'warning'],
                  ].map(([label, val, color]) => (
                    <div key={label as string} className={`kpi-card ${color}`} style={{ padding: '12px' }}>
                      <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{val}</div>
                      <div className="kpi-label">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </HighRiskBadge>
        </div>

        {/* Appointment Timeline */}
        <div className="card">
          <div className="flex-between mb-4">
            <div className="section-title" style={{ margin: 0 }}>📅 Appointment History</div>
          </div>
          {appointments.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-icon">📅</div>
              <div className="empty-title">No appointments scheduled</div>
            </div>
          ) : (
            <div className="timeline">
              {appointments.map(a => (
                <div key={a.id} className="timeline-item">
                  <div className={`timeline-dot ${a.status.toLowerCase()}`} />
                  <div className="timeline-date">{formatDate(a.scheduled_date)}{a.scheduled_time ? ` · ${a.scheduled_time}` : ''}</div>
                  <div className="timeline-content">
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontWeight: 600 }}>{APPT_TYPE_LABELS[a.appointment_type]}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className={`badge badge-${STATUS_COLORS[a.status]}`}>{a.status}</span>
                        {a.status === 'UPCOMING' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => markAttended(a.id)}>✓ Attended</button>
                            <button className="btn btn-ghost btn-sm" disabled={sendingReminder === a.id} onClick={() => sendReminder(a)}>
                              {sendingReminder === a.id ? '…' : '💬 Remind'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {a.notes && <div className="text-muted mt-1">{a.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
