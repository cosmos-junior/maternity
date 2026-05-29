import { useEffect, useState } from 'react';
import { 
  Baby, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Stethoscope,
  Activity,
  CalendarCheck,
  CalendarClock,
  Check
} from 'lucide-react';
import { postnatalApi, patientsApi } from '../api';
import { PostnatalRecord, Patient } from '../types';
import { formatDate } from '../utils';
import DeliveryForm from '../components/DeliveryForm';
import HighRiskBadge from '../components/HighRiskBadge';

export default function Postnatal() {
  const [records, setRecords] = useState<PostnatalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [form, setForm] = useState({
    patient: '', delivery_date: '', delivery_type: 'NORMAL',
    baby_weight_kg: '', baby_gender: 'UNKNOWN', mother_condition: '',
    baby_condition: '', notes: '', bcg_given: false, opv0_given: false, hep_b_given: false,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [rRes, pRes] = await Promise.all([postnatalApi.list(), patientsApi.list()]);
    setRecords(rRes.data.results ?? rRes.data);
    setPatients((pRes.data.results ?? pRes.data));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const mark7Day  = async (id: number) => { await postnatalApi.mark7Day(id);  flash('7-day review marked');  load(); };
  const mark6Week = async (id: number) => { await postnatalApi.mark6Week(id); flash('6-week review marked'); load(); };

  const handleSaved = () => { setShowModal(false); flash('Delivery record saved'); load(); };




  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-2">
          <Baby className="text-primary" /> Postnatal Follow-Up
        </h1>
        <div className="header-actions">
          <button id="add-postnatal-btn" className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add Record
          </button>
        </div>
      </header>

      <div className="page-body">
        {actionMsg && <div className="alert alert-success flex items-center gap-2">
          <CheckCircle size={16} /> {actionMsg}
        </div>}

        {loading ? <div className="loading-wrap"><div className="spinner" /></div>
        : records.length === 0
        ? (
          <div className="empty-state">
            <div className="empty-icon"><Baby size={48} className="text-muted opacity-20" /></div>
            <div className="empty-title">No postnatal records yet</div>
            <div className="empty-desc">Add a postnatal record after a patient delivers.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {records.map(r => (
              <div key={r.id} className="card" style={{ borderLeft: `4px solid ${r.review_7day_overdue || r.review_6week_overdue ? 'var(--danger)' : 'var(--success)'}` }}>
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="font-bold text-lg">{r.patient_name}</span>
                      {(r as any).pregnancy_number > 1 && (
                        <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                          Pregnancy #{(r as any).pregnancy_number}
                        </span>
                      )}
                    </div>
                    <div className="text-muted text-sm flex items-center gap-2">
                       <Stethoscope size={14} /> {r.patient_number} · <Calendar size={14} /> Delivered {formatDate(r.delivery_date)} ({r.delivery_type})
                    </div>
                    {r.baby_weight_kg && <div className="text-muted text-sm flex items-center gap-2">
                      <Baby size={14} /> Baby: {r.baby_weight_kg}kg · Sex: {r.baby_gender}
                    </div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {r.review_7day_overdue  && <span className="badge badge-danger flex items-center gap-1"><AlertCircle size={12} /> 7-Day Overdue!</span>}
                    {r.review_6week_overdue && <span className="badge badge-danger flex items-center gap-1"><AlertCircle size={12} /> 6-Week Overdue!</span>}
                  </div>
                </div>

                <div className="divider" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 7-Day Review */}
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                      <CalendarClock size={16} className="text-primary" /> 7-Day Review — {formatDate(r.review_7day_date)}
                    </div>
                      {r.review_7day_attended
                        ? <span className="badge badge-success flex items-center gap-1 w-fit"><Check size={12} /> Attended</span>
                        : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className={`badge badge-${r.review_7day_overdue ? 'danger' : 'warning'}`}>Pending</span>
                            <button className="btn btn-success btn-sm flex items-center gap-1" onClick={() => mark7Day(r.id)}>
                              <Check size={14} /> Mark Attended
                            </button>
                          </div>
                    }
                  </div>
                  {/* 6-Week Review */}
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                      <CalendarCheck size={16} className="text-primary" /> 6-Week Review — {formatDate(r.review_6week_date)}
                    </div>
                    {r.review_6week_attended
                      ? <span className="badge badge-success flex items-center gap-1 w-fit"><Check size={12} /> Attended</span>
                      : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className={`badge badge-${r.review_6week_overdue ? 'danger' : 'warning'}`}>Pending</span>
                          <button className="btn btn-success btn-sm flex items-center gap-1" onClick={() => mark6Week(r.id)}>
                            <Check size={14} /> Mark Attended
                          </button>
                        </div>
                    }
                  </div>
                </div>

                {/* Immunizations */}
                <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {([['BCG', r.bcg_given], ['OPV-0', r.opv0_given], ['Hep B', r.hep_b_given]] as const).map(
                    ([label, checked]) => (
                      <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: checked ? 'var(--success)' : 'var(--text-muted)' }}>
                        {checked ? <Check size={14} /> : <div style={{ width: 14, height: 14, border: '1px solid currentColor', borderRadius: 2 }} />} {label}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <DeliveryForm
          patients={patients}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
