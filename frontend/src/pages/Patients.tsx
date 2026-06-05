import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  RefreshCw, 
  X, 
  ChevronRight,
  Plus,
  Calendar,
  Filter,
  Check,
  ChevronLeft,
  Eye,
  Salad,
  Activity
} from 'lucide-react';
import { patientsApi } from '../api';
import { Patient, PatientForm, ClinicStage, RiskLevel } from '../types';
import { formatDate, STAGE_LABELS, STAGE_COLORS } from '../utils';
import HighRiskBadge from '../components/HighRiskBadge';
import EddCountdownWidget from '../components/EddCountdownWidget';
import { useFormValidation, patientSchema, PatientFormFields } from '../hooks/useFormValidation';


const BLANK_FORM: PatientForm = {
  full_name: '', phone_number: '', next_of_kin_name: '', next_of_kin_phone: '',
  national_id: '', nhif_number: '', date_of_birth: null, lmp: '', clinic_stage: 'ANC1', risk_level: 'LOW',
  blood_group: 'O+', lang: 'en', medical_history: '', surgical_history: '', allergies: '', family_history: '',
  address: '', notes: '', is_active: true, registered_by: null,
};

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [eddFrom, setEddFrom] = useState('');
  const [eddTo, setEddTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PatientForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { getError, validateOne, validateAll, touch, reset } = useFormValidation(patientSchema);

  const hasFilters = !!(search || stageFilter || riskFilter || eddFrom || eddTo);

  const clearFilters = () => {
    setSearch(''); setStageFilter(''); setRiskFilter('');
    setEddFrom(''); setEddTo('');
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string,string> = { page: String(page) };
    if (search) params.search = search;
    if (stageFilter) params.stage = stageFilter;
    if (riskFilter) params.risk = riskFilter;
    if (eddFrom) params.edd_from = eddFrom;
    if (eddTo) params.edd_to = eddTo;
    const { data } = await patientsApi.list(params);
    const list = data.results ?? data;
    setPatients(list);
    setTotalCount(data.count ?? list.length);
    setLoading(false);
  }, [search, stageFilter, riskFilter, eddFrom, eddTo, page]);

  useEffect(() => { setPage(1); }, [search, stageFilter, riskFilter, eddFrom, eddTo]);
  useEffect(() => { load(); }, [load]);

  const openModal = () => { setForm(BLANK_FORM); setError(''); reset(); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Run full validation before submitting
    const formAsFields: PatientFormFields = {
      full_name:        form.full_name,
      phone_number:     form.phone_number,
      next_of_kin_name: form.next_of_kin_name,
      next_of_kin_phone:form.next_of_kin_phone,
      date_of_birth:    form.date_of_birth ?? '',
      lmp:              form.lmp,
      clinic_stage:     form.clinic_stage,
      risk_level:       form.risk_level,
      blood_group:      (form as any).blood_group ?? '',
      lang:             form.lang,
      medical_history:  (form as any).medical_history ?? '',
      surgical_history: (form as any).surgical_history ?? '',
      allergies:        (form as any).allergies ?? '',
      family_history:   (form as any).family_history ?? '',
      address:          form.address,
    };
    if (!validateAll(formAsFields)) return;
    setSaving(true); setError('');
    try {
      await patientsApi.create(form);
      setShowModal(false); load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to register patient.');
    } finally { setSaving(false); }
  };

  const set = (field: keyof PatientForm, val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    // Live-validate touched fields
    validateOne(field as keyof PatientFormFields, val, {
      full_name: form.full_name, phone_number: form.phone_number,
      next_of_kin_name: form.next_of_kin_name, next_of_kin_phone: form.next_of_kin_phone,
      date_of_birth: form.date_of_birth ?? '', lmp: form.lmp,
      clinic_stage: form.clinic_stage, risk_level: form.risk_level,
      blood_group: (form as any).blood_group ?? '', address: form.address,
      lang: form.lang,
      medical_history: (form as any).medical_history ?? '',
      surgical_history: (form as any).surgical_history ?? '',
      allergies: (form as any).allergies ?? '',
      family_history: (form as any).family_history ?? '',
      [field]: val,
    });
  };

  return (
    <>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <Users className="text-primary" size={28} /> Patient Registry
        </h1>
        <div className="header-actions">
          <button id="register-patient-btn" className="btn btn-primary flex items-center gap-2" onClick={openModal}>
            <UserPlus size={18} /> Register Patient
          </button>
        </div>
      </header>

      <div className="page-body">
        <div className="filter-bar flex flex-wrap items-center gap-3 mb-4">
          <div className="search-wrap flex-1 min-w-[200px]" style={{ position: 'relative' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input
              className="form-input" placeholder="Search by name, ID, phone or address…"
              style={{ paddingLeft: 40 }}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted" />
            <select className="form-select w-auto" style={{ width: '100%', maxWidth: 150, minWidth: 0 }} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
              <option value="">All Stages</option>
              {(Object.keys(STAGE_LABELS) as ClinicStage[]).map(s => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
            <select className="form-select w-auto" style={{ width: '100%', maxWidth: 130, minWidth: 0 }} value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
              <option value="">All Risk</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* EDD Date Range + Active Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Calendar size={14} />
            <span>EDD from</span>
            <input
              type="date" className="form-input"
              style={{ width: '100%', maxWidth: 140, minWidth: 0, padding: '5px 8px', fontSize: '0.78rem' }}
              value={eddFrom} onChange={e => setEddFrom(e.target.value)}
            />
            <span>to</span>
            <input
              type="date" className="form-input"
              style={{ width: '100%', maxWidth: 140, minWidth: 0, padding: '5px 8px', fontSize: '0.78rem' }}
              value={eddTo} onChange={e => setEddTo(e.target.value)}
            />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-neutral" style={{ padding: '5px 12px' }}>
              {totalCount} result{totalCount !== 1 ? 's' : ''}
            </span>
            {hasFilters && (
              <button
                className="btn btn-ghost btn-sm flex items-center gap-1"
                onClick={clearFilters}
                style={{ color: 'var(--danger)', fontSize: '0.76rem' }}
              >
                <X size={14} /> Clear all filters
              </button>
            )}
          </div>
        </div>

        <div className="card">
          {loading ? <div className="loading-wrap"><div className="spinner" /></div>
          : patients.length === 0
          ? <div className="empty-state">
              <div className="empty-icon"><Users size={48} /></div>
              <div className="empty-title">No patients found</div>
              <div className="empty-desc">Register a patient to get started.</div>
            </div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Patient #</th><th>Name</th><th>Phone</th>
                  <th>LMP</th><th>EDD</th><th>Weeks</th>
                  <th>Stage</th><th>Risk</th><th></th>
                </tr></thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} className={p.risk_level === 'HIGH' ? 'tr-high-risk' : ''}>
                      <td><span className="mono">{p.patient_number}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.risk_level === 'HIGH' && <HighRiskBadge riskLevel="HIGH" inline />}
                          <span style={{ fontWeight: 600 }}>{p.full_name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{p.phone_number}</td>
                      <td className="text-muted">{formatDate(p.lmp)}</td>
                      <td>
                        <EddCountdownWidget edd={p.edd} weeksPregnant={p.weeks_pregnant} compact />
                      </td>
                      <td>{p.weeks_pregnant != null ? `${p.weeks_pregnant}w` : '—'}</td>
                      <td><span className={`badge badge-${STAGE_COLORS[p.clinic_stage]}`}>{STAGE_LABELS[p.clinic_stage]}</span></td>
                      <td><HighRiskBadge riskLevel={p.risk_level} inline /></td>
                      <td>
                        <Link to={`/patients/${p.id}`} className="btn btn-ghost btn-sm flex items-center gap-1">
                          <Eye size={14} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Page {page} of {Math.ceil(totalCount / PAGE_SIZE)} &nbsp;·&nbsp; {totalCount} patients
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page * PAGE_SIZE >= totalCount}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Register Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-wide">
            <div className="modal-header">
              <div className="modal-title">Register New Patient</div>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close modal"><X size={20} /></button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSave} noValidate>
              <div className="form-grid">

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className={`form-input${getError('full_name') ? ' input-error' : ''}`}
                    value={form.full_name}
                    placeholder="Jane Kemunto"
                    onChange={e => set('full_name', e.target.value)}
                    onBlur={() => touch('full_name')}
                  />
                  {getError('full_name') && <span className="form-error">{getError('full_name')}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    className={`form-input${getError('phone_number') ? ' input-error' : ''}`}
                    value={form.phone_number}
                    placeholder="0712345678"
                    onChange={e => set('phone_number', e.target.value)}
                    onBlur={() => touch('phone_number')}
                  />
                  {getError('phone_number') && <span className="form-error">{getError('phone_number')}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">National ID</label>
                  <input className="form-input" value={form.national_id ?? ''}
                    onChange={e => set('national_id', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">NHIF Number</label>
                  <input className="form-input" value={form.nhif_number ?? ''}
                    onChange={e => set('nhif_number', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={form.blood_group ?? 'O+'}
                    onChange={e => set('blood_group', e.target.value)}>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Language</label>
                  <select className="form-select" value={form.lang ?? 'en'}
                    onChange={e => set('lang', e.target.value)}>
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Next of Kin Name</label>
                  <input className="form-input" value={form.next_of_kin_name}
                    onChange={e => set('next_of_kin_name', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Next of Kin Phone</label>
                  <input
                    className={`form-input${getError('next_of_kin_phone') ? ' input-error' : ''}`}
                    value={form.next_of_kin_phone}
                    placeholder="0712345678"
                    onChange={e => set('next_of_kin_phone', e.target.value)}
                    onBlur={() => touch('next_of_kin_phone')}
                  />
                  {getError('next_of_kin_phone') && <span className="form-error">{getError('next_of_kin_phone')}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    className={`form-input${getError('date_of_birth') ? ' input-error' : ''}`}
                    type="date"
                    value={form.date_of_birth ?? ''}
                    onChange={e => set('date_of_birth', e.target.value)}
                    onBlur={() => touch('date_of_birth')}
                  />
                  {getError('date_of_birth') && <span className="form-error">{getError('date_of_birth')}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Last Menstrual Period (LMP) *</label>
                  <input
                    className={`form-input${getError('lmp') ? ' input-error' : ''}`}
                    type="date"
                    value={form.lmp}
                    onChange={e => set('lmp', e.target.value)}
                    onBlur={() => touch('lmp')}
                  />
                  {getError('lmp')
                    ? <span className="form-error">{getError('lmp')}</span>
                    : <span className="form-hint">EDD will be auto-calculated (LMP + 280 days)</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Clinic Stage *</label>
                  <select className="form-select" value={form.clinic_stage}
                    onChange={e => set('clinic_stage', e.target.value as ClinicStage)}>
                    {(Object.keys(STAGE_LABELS) as ClinicStage[]).map(s =>
                      <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Risk Level *</label>
                  <select className="form-select" value={form.risk_level}
                    onChange={e => set('risk_level', e.target.value as RiskLevel)}>
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                  </select>
                </div>

              </div>
              <div className="form-group">
                <label className="form-label">Medical History</label>
                <textarea className="form-textarea" value={form.medical_history ?? ''}
                  onChange={e => set('medical_history', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Surgical History</label>
                <textarea className="form-textarea" value={form.surgical_history ?? ''}
                  onChange={e => set('surgical_history', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Allergies</label>
                <textarea className="form-textarea" value={form.allergies ?? ''}
                  onChange={e => set('allergies', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Family History</label>
                <textarea className="form-textarea" value={form.family_history ?? ''}
                  onChange={e => set('family_history', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address}
                  onChange={e => set('address', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Clinical Notes</label>
                <textarea className="form-textarea" value={form.notes}
                  onChange={e => set('notes', e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="save-patient-btn" type="submit" className="btn btn-primary flex items-center gap-2" disabled={saving}>
                  {saving ? 'Saving…' : <><Check size={18} /> Register Patient</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
