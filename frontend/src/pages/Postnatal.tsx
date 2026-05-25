import { useEffect, useState } from 'react';
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

  const mark7Day  = async (id: number) => { await postnatalApi.mark7Day(id);  flash('7-day review marked ✓');  load(); };
  const mark6Week = async (id: number) => { await postnatalApi.mark6Week(id); flash('6-week review marked ✓'); load(); };

  const handleSaved = () => { setShowModal(false); flash('Delivery record saved ✓'); load(); };




  return (
    <>
      <header className="page-header">
        <h1>👶 Postnatal Follow-Up</h1>
        <div className="header-actions">
          <button id="add-postnatal-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Record</button>
        </div>
      </header>

      <div className="page-body">
        {actionMsg && <div className="alert alert-success">✓ {actionMsg}</div>}

        {loading ? <div className="loading-wrap"><div className="spinner" /></div>
        : records.length === 0
        ? (
          <div className="empty-state">
            <div className="empty-icon">👶</div>
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
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{r.patient_name}</span>
                      {(r as any).pregnancy_number > 1 && (
                        <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                          Pregnancy #{(r as any).pregnancy_number}
                        </span>
                      )}
                    </div>
                    <div className="text-muted text-sm">{r.patient_number} · Delivered {formatDate(r.delivery_date)} ({r.delivery_type})</div>
                    {r.baby_weight_kg && <div className="text-muted text-sm">Baby: {r.baby_weight_kg}kg · {r.baby_gender}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {r.review_7day_overdue  && <span className="badge badge-danger">7-Day Overdue!</span>}
                    {r.review_6week_overdue && <span className="badge badge-danger">6-Week Overdue!</span>}
                  </div>
                </div>

                <div className="divider" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* 7-Day Review */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>7-Day Review — {formatDate(r.review_7day_date)}</div>
                    {r.review_7day_attended
                      ? <span className="badge badge-success">✓ Attended</span>
                      : <div style={{ display: 'flex', gap: 8 }}>
                          <span className={`badge badge-${r.review_7day_overdue ? 'danger' : 'warning'}`}>Pending</span>
                          <button className="btn btn-success btn-sm" onClick={() => mark7Day(r.id)}>✓ Mark Attended</button>
                        </div>
                    }
                  </div>
                  {/* 6-Week Review */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>6-Week Review — {formatDate(r.review_6week_date)}</div>
                    {r.review_6week_attended
                      ? <span className="badge badge-success">✓ Attended</span>
                      : <div style={{ display: 'flex', gap: 8 }}>
                          <span className={`badge badge-${r.review_6week_overdue ? 'danger' : 'warning'}`}>Pending</span>
                          <button className="btn btn-success btn-sm" onClick={() => mark6Week(r.id)}>✓ Mark Attended</button>
                        </div>
                    }
                  </div>
                </div>

                {/* Immunizations */}
                <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {([['BCG', r.bcg_given], ['OPV-0', r.opv0_given], ['Hep B', r.hep_b_given]] as const).map(
                    ([label, checked]) => (
                      <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: checked ? 'var(--success)' : 'var(--text-muted)' }}>
                        {checked ? '✅' : '⬜'} {label}
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
