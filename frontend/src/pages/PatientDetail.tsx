import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Salad, 
  Activity, 
  CheckCircle, 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  Clock, 
  AlertCircle, 
  Check, 
  Send, 
  Baby, 
  ChevronRight,
  Plus,
  Stethoscope,
  Heart,
  FileText
} from 'lucide-react';
import { patientsApi, appointmentsApi, remindersApi, pediatricsApi } from '../api';
import { Patient, Appointment, ChildProfile } from '../types';
import { formatDate, STAGE_LABELS, STAGE_COLORS, RISK_COLORS, STATUS_COLORS, APPT_TYPE_LABELS } from '../utils';
import HighRiskBadge from '../components/HighRiskBadge';
import EddCountdownWidget from '../components/EddCountdownWidget';


export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  const load = async () => {
    if (!id) return;
    const [pRes, aRes, sRes, cRes] = await Promise.all([
      patientsApi.get(+id),
      appointmentsApi.list({ patient: id }),
      patientsApi.stats(+id),
      pediatricsApi.listProfiles({ mother: id }),
    ]);
    setPatient(pRes.data);
    setAppointments(aRes.data.results ?? aRes.data);
    setStats(sRes.data);
    setChildren(cRes.data.results ?? cRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const markAttended = async (aId: number) => {
    await appointmentsApi.markAttended(aId);
    setActionMsg('Marked as attended'); load();
  };
  const sendReminder = async (a: Appointment) => {
    setSendingReminder(a.id);
    try {
      await remindersApi.send({ patient_id: a.patient, appointment_id: a.id, use_template: true });
      setActionMsg('SMS reminder sent');
    } catch { setActionMsg('Failed to send SMS'); }
    setSendingReminder(null);
    setTimeout(() => setActionMsg(''), 3000);
  };

  if (loading) return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-2"><User /> Patient Detail</h1>
      </header>
      <div className="page-body loading-wrap"><div className="spinner" /></div>
    </>
  );
  if (!patient) return (
    <div className="page-body flex items-center gap-2 text-danger">
      <AlertCircle size={18} /> Patient not found.
    </div>
  );

  return (
    <>
      <header className="page-header">
        <Link to="/patients" className="btn btn-ghost btn-sm flex items-center gap-1">
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="truncate flex items-center gap-2">
          <User className="text-primary" /> {patient.full_name}
        </h1>
        <div className="header-actions flex flex-wrap gap-2">
          <HighRiskBadge riskLevel={patient.risk_level} inline />
          <span className={`badge badge-${STAGE_COLORS[patient.clinic_stage]}`}>{STAGE_LABELS[patient.clinic_stage]}</span>
          <Link to={`/patients/${patient.id}/nutrition`} className="btn btn-ghost btn-sm flex items-center gap-1">
            <Salad size={16} /> Nutrition
          </Link>
          <Link to={`/patients/${patient.id}/partograph`} className="btn btn-ghost btn-sm flex items-center gap-1">
            <Activity size={16} /> Partograph
          </Link>
        </div>
      </header>

      <div className="page-body">
        {actionMsg && (
          <div className="alert alert-success flex items-center gap-2">
            <CheckCircle size={18} /> {actionMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Patient Info Card */}
          <div className="card">
            <div className="section-title flex items-center gap-2">
              <User size={18} className="text-primary" /> Patient Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              {[
                ['Patient #', patient.patient_number],
                ['Phone', patient.phone_number],
                ['National ID', patient.national_id || '—'],
                ['NHIF Number', patient.nhif_number || '—'],
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
            <div className="card h-full">
              <div className="section-title flex items-center gap-2">
                <Stethoscope size={18} className="text-primary" /> Maternity Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-5">
                {[
                  ['LMP', formatDate(patient.lmp)],
                  ['EDD', formatDate(patient.edd)],
                  ['Weeks Pregnant', patient.weeks_pregnant != null ? `${patient.weeks_pregnant} weeks` : '—'],
                  ['Blood Group', patient.blood_group || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontWeight: 500, fontSize: '0.88rem', marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>

              <div className="divider" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-5">
                {[
                  ['Medical History', patient.medical_history || '—'],
                  ['Surgical History', patient.surgical_history || '—'],
                  ['Allergies', patient.allergies || '—'],
                  ['Family History', patient.family_history || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontWeight: 500, fontSize: '0.88rem', marginTop: 2, whiteSpace: 'pre-wrap' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* EDD Countdown widget */}
              <EddCountdownWidget edd={patient.edd} weeksPregnant={patient.weeks_pregnant} />

              {patient.notes && <><div className="divider" /><div className="text-muted" style={{ fontSize: '0.8rem' }}>{patient.notes}</div></>}

              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                  {[
                    ['Total', stats.total_appointments, 'primary'],
                    ['Attended', stats.attended, 'success'],
                    ['Missed', stats.missed, 'danger'],
                    ['Upcoming', stats.upcoming, 'warning'],
                  ].map(([label, val, color]) => (
                    <div key={label as string} className={`kpi-card ${color}`} style={{ padding: '12px' }}>
                      <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{val}</div>
                      <div className="kpi-label">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </HighRiskBadge>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="flex-between mb-4">
            <div className="section-title flex items-center gap-2" style={{ margin: 0 }}>
              <Baby size={18} className="text-primary" /> Child Profiles
            </div>
          </div>
          {children.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-icon"><Baby size={48} className="text-muted opacity-20" /></div>
              <div className="empty-title">No child profiles linked yet</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {children.map((child) => (
                <Link key={child.id} to={`/children/${child.id}`} className="card hover:border-primary transition-colors" style={{ border: '1px solid var(--border)', padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }} className="flex items-center gap-2">
                    <Baby size={14} className="text-primary" /> {child.first_name || 'Baby'} {child.last_name || ''}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>DOB: {formatDate(child.date_of_birth)}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Gender: {child.gender}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Appointment Timeline */}
        <div className="card">
          <div className="flex-between mb-4">
            <div className="section-title flex items-center gap-2" style={{ margin: 0 }}>
              <Calendar size={18} className="text-primary" /> Appointment History
            </div>
          </div>
          {appointments.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-icon"><Calendar size={48} className="text-muted opacity-20" /></div>
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
                            <button className="btn btn-success btn-sm flex items-center gap-1" onClick={() => markAttended(a.id)}>
                              <Check size={14} /> Attended
                            </button>
                            <button className="btn btn-ghost btn-sm flex items-center gap-1" disabled={sendingReminder === a.id} onClick={() => sendReminder(a)}>
                              {sendingReminder === a.id ? '…' : <><Send size={14} /> Remind</>}
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
