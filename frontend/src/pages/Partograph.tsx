import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientsApi, partographApi } from '../api';
import { Patient } from '../types';
import { formatDate } from '../utils';
import PartographChart, { PartographDataPoint } from '../components/PartographChart';
import { useFormValidation, partographSchema, PartographFormFields } from '../hooks/useFormValidation';

// ─── Entry type from API ───────────────────────────────────────────────────────
interface PartographEntry {
  id: number;
  hours_in_labour: number;
  cervical_dilation_cm: string | null;
  fetal_heart_rate: number | null;
  contractions_per_10min: number | null;
  descent_station: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse_rate: number | null;
  temperature_celsius: string | null;
  moulding: string;
  liquor: string;
  contraction_duration: string;
  urine_protein: string;
  drugs_given: string;
  notes: string;
  recorded_by_name: string | null;
  recorded_at: string;
}

const BLANK_FORM: PartographFormFields = {
  hours_in_labour: '',
  cervical_dilation_cm: '',
  fetal_heart_rate: '',
  contractions_per_10min: '',
  bp_systolic: '',
  bp_diastolic: '',
  pulse_rate: '',
  temperature_celsius: '',
  descent_station: '',
};

const EXTRA_BLANK = {
  moulding: '0',
  liquor: 'I',
  contraction_duration: '',
  urine_protein: 'NIL',
  drugs_given: '',
  notes: '',
};

export default function Partograph() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);

  const [patient, setPatient]   = useState<Patient | null>(null);
  const [entries, setEntries]   = useState<PartographEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm]   = useState<PartographFormFields>(BLANK_FORM);
  const [extra, setExtra] = useState(EXTRA_BLANK);

  const { getError, validateOne, validateAll, touch, reset } = useFormValidation(partographSchema);

  const load = async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        patientsApi.get(patientId),
        partographApi.list(patientId),
      ]);
      setPatient(pRes.data);
      setEntries(eRes.data.results ?? eRes.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [patientId]);

  const setF = (k: keyof PartographFormFields, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    validateOne(k, v, { ...form, [k]: v });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validateAll(form)) return;
    setSaving(true);
    try {
      await partographApi.create(patientId, {
        hours_in_labour:       parseFloat(form.hours_in_labour),
        cervical_dilation_cm:  form.cervical_dilation_cm  ? parseFloat(form.cervical_dilation_cm)  : null,
        fetal_heart_rate:      form.fetal_heart_rate      ? parseInt(form.fetal_heart_rate)         : null,
        contractions_per_10min:form.contractions_per_10min? parseInt(form.contractions_per_10min)   : null,
        descent_station:       form.descent_station       ? parseInt(form.descent_station)           : null,
        bp_systolic:           form.bp_systolic           ? parseInt(form.bp_systolic)               : null,
        bp_diastolic:          form.bp_diastolic          ? parseInt(form.bp_diastolic)              : null,
        pulse_rate:            form.pulse_rate            ? parseInt(form.pulse_rate)                : null,
        temperature_celsius:   form.temperature_celsius   ? parseFloat(form.temperature_celsius)    : null,
        ...extra,
      });
      setSuccessMsg('Observation recorded ✓');
      setTimeout(() => setSuccessMsg(''), 3000);
      setForm(BLANK_FORM);
      setExtra(EXTRA_BLANK);
      reset();
      setShowForm(false);
      load();
    } catch (err: any) {
      setApiError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  // Map entries to chart data
  const chartData: PartographDataPoint[] = entries.map(e => ({
    hours_in_labour:       Number(e.hours_in_labour),
    cervical_dilation_cm:  e.cervical_dilation_cm !== null ? parseFloat(e.cervical_dilation_cm) : null,
    fetal_heart_rate:      e.fetal_heart_rate,
    contractions_per_10min:e.contractions_per_10min,
    descent_station:       e.descent_station,
  }));

  const FieldError = ({ field }: { field: keyof PartographFormFields }) => {
    const err = getError(field);
    return err ? <span className="form-error">{err}</span> : null;
  };

  const ValidatedInput = ({
    field, label, type = 'number', placeholder = '', required = false,
  }: {
    field: keyof PartographFormFields;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div className="form-group">
      <label className="form-label">{label}{required && ' *'}</label>
      <input
        className={`form-input${getError(field) ? ' input-error' : ''}`}
        type={type}
        step="any"
        placeholder={placeholder}
        value={form[field]}
        required={required}
        onChange={e => setF(field, e.target.value)}
        onBlur={() => touch(field)}
      />
      <FieldError field={field} />
    </div>
  );

  if (loading) return (
    <>
      <header className="page-header"><h1>📈 Partograph</h1></header>
      <div className="page-body loading-wrap"><div className="spinner" /></div>
    </>
  );

  if (!patient) return (
    <div className="page-body"><p>Patient not found.</p></div>
  );

  return (
    <>
      <header className="page-header">
        <Link to={`/patients/${patientId}`} className="btn btn-ghost btn-sm">← Back</Link>
        <h1>📈 Partograph — {patient.full_name}</h1>
        <div className="header-actions">
          <span className="badge badge-primary">{patient.patient_number}</span>
          <a
            href={`/api/patients/${patientId}/partograph/pdf/`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            📄 Export PDF
          </a>
          <button
            id="add-partograph-btn"
            className="btn btn-primary"
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? '✕ Close Form' : '+ Add Observation'}
          </button>
        </div>
      </header>

      <div className="page-body">
        {successMsg && <div className="alert alert-success">✓ {successMsg}</div>}

        {/* ── Data entry form ────────────────────────────────────────────── */}
        {showForm && (
          <div className="card mb-6" style={{ borderLeft: '3px solid var(--hosp-teal)' }}>
            <div className="section-title">🩺 Record Labour Observation</div>
            {apiError && <div className="alert alert-danger">{apiError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="partograph-form-grid">

                {/* Column 1: Time + Cervimetry */}
                <div className="partograph-form-col">
                  <div className="partograph-form-group-label">⏱️ Time</div>
                  <ValidatedInput field="hours_in_labour" label="Hours in Labour" placeholder="0–24" required />

                  <div className="partograph-form-group-label">🔬 Cervimetry</div>
                  <ValidatedInput field="cervical_dilation_cm" label="Cervical Dilation (cm)" placeholder="0–10" />
                  <ValidatedInput field="descent_station"      label="Station (-5 to +5)"    placeholder="e.g. -2" />

                  <div className="form-group">
                    <label className="form-label">Moulding</label>
                    <select className="form-select" value={extra.moulding}
                      onChange={e => setExtra(x => ({ ...x, moulding: e.target.value }))}>
                      <option value="0">None (0)</option>
                      <option value="1">+ (mild)</option>
                      <option value="2">++ (moderate)</option>
                      <option value="3">+++ (severe)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Liquor</label>
                    <select className="form-select" value={extra.liquor}
                      onChange={e => setExtra(x => ({ ...x, liquor: e.target.value }))}>
                      <option value="I">Intact</option>
                      <option value="C">Clear</option>
                      <option value="M">Meconium-stained</option>
                      <option value="B">Blood-stained</option>
                      <option value="A">Absent</option>
                    </select>
                  </div>
                </div>

                {/* Column 2: Fetal + Contractions */}
                <div className="partograph-form-col">
                  <div className="partograph-form-group-label">💓 Fetal Parameters</div>
                  <ValidatedInput field="fetal_heart_rate" label="Fetal Heart Rate (bpm)" placeholder="110–160" />

                  <div className="partograph-form-group-label">🔄 Contractions</div>
                  <ValidatedInput field="contractions_per_10min" label="Contractions / 10 min" placeholder="0–5" />
                  <div className="form-group">
                    <label className="form-label">Contraction Duration</label>
                    <select className="form-select" value={extra.contraction_duration}
                      onChange={e => setExtra(x => ({ ...x, contraction_duration: e.target.value }))}>
                      <option value="">— Select —</option>
                      <option value="<20">{'< 20 sec'}</option>
                      <option value="20-40">20–40 sec</option>
                      <option value=">40">{'> 40 sec'}</option>
                    </select>
                  </div>
                </div>

                {/* Column 3: Maternal Vitals */}
                <div className="partograph-form-col">
                  <div className="partograph-form-group-label">🩺 Maternal Vitals</div>
                  <ValidatedInput field="bp_systolic"          label="BP Systolic (mmHg)"    placeholder="e.g. 120" />
                  <ValidatedInput field="bp_diastolic"         label="BP Diastolic (mmHg)"   placeholder="e.g. 80" />
                  <ValidatedInput field="pulse_rate"           label="Pulse Rate (bpm)"       placeholder="e.g. 80" />
                  <ValidatedInput field="temperature_celsius"  label="Temperature (°C)"       placeholder="e.g. 37.0" />

                  <div className="form-group">
                    <label className="form-label">Urine Protein</label>
                    <select className="form-select" value={extra.urine_protein}
                      onChange={e => setExtra(x => ({ ...x, urine_protein: e.target.value }))}>
                      <option value="NIL">Nil</option>
                      <option value="+">+</option>
                      <option value="++">++</option>
                      <option value="+++">+++</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Drugs / Oxytocin</label>
                    <input className="form-input" value={extra.drugs_given} placeholder="e.g. Syntocinon 10 IU"
                      onChange={e => setExtra(x => ({ ...x, drugs_given: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" style={{ minHeight: 52 }}
                      value={extra.notes}
                      onChange={e => setExtra(x => ({ ...x, notes: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button id="save-partograph-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : '✓ Record Observation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Chart ───────────────────────────────────────────────────────── */}
        <div className="card mb-6">
          <div className="flex-between mb-4">
            <div className="section-title" style={{ margin: 0 }}>
              📊 WHO Partograph
            </div>
            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
              {entries.length} observation{entries.length !== 1 ? 's' : ''} recorded
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <div className="empty-title">No observations yet</div>
              <div className="empty-desc">Click "Add Observation" to start recording labour progress.</div>
            </div>
          ) : (
            <PartographChart entries={chartData} />
          )}
        </div>

        {/* ── Data table ─────────────────────────────────────────────────── */}
        {entries.length > 0 && (
          <div className="card">
            <div className="section-title">📋 Observation Log</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hour</th>
                    <th>Dilation (cm)</th>
                    <th>FHR (bpm)</th>
                    <th>Contrax / 10m</th>
                    <th>Station</th>
                    <th>BP</th>
                    <th>Pulse</th>
                    <th>Temp °C</th>
                    <th>Liquor</th>
                    <th>Recorded By</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id}>
                      <td><span className="mono">{e.hours_in_labour}h</span></td>
                      <td>{e.cervical_dilation_cm ?? '—'}</td>
                      <td style={{
                        color: e.fetal_heart_rate && (e.fetal_heart_rate < 110 || e.fetal_heart_rate > 160)
                          ? 'var(--danger)' : undefined,
                        fontWeight: e.fetal_heart_rate && (e.fetal_heart_rate < 110 || e.fetal_heart_rate > 160) ? 700 : undefined,
                      }}>
                        {e.fetal_heart_rate ?? '—'}
                        {e.fetal_heart_rate && (e.fetal_heart_rate < 110 || e.fetal_heart_rate > 160) &&
                          <span title="Abnormal FHR"> ⚠️</span>}
                      </td>
                      <td>{e.contractions_per_10min ?? '—'}</td>
                      <td>{e.descent_station !== null ? (e.descent_station > 0 ? `+${e.descent_station}` : e.descent_station) : '—'}</td>
                      <td>{e.bp_systolic && e.bp_diastolic ? `${e.bp_systolic}/${e.bp_diastolic}` : '—'}</td>
                      <td>{e.pulse_rate ?? '—'}</td>
                      <td>{e.temperature_celsius ?? '—'}</td>
                      <td><span className={`badge badge-${e.liquor === 'M' ? 'warning' : e.liquor === 'B' ? 'danger' : 'neutral'}`}>
                        {e.liquor}
                      </span></td>
                      <td className="text-muted">{e.recorded_by_name ?? '—'}</td>
                      <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(e.recorded_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
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
