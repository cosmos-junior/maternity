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
import { patientsApi, referralsApi } from '../api';
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
  residence_county: 'Kisii', residence_subcounty: '', residence_ward: '', residence_village: '',
  emergency_contact_relationship: '', emergency_contact_address: '',
  health_facility_name: 'Itierio Maternity and Nursing Home', kmhfl_code: '13629', anc_number: '', pnc_number: '',
  gravida: null, parity: null, height: null, weight: null, estate_house_number: '',
  has_diabetes: false, has_hypertension: false, blood_transfusion_history: '', tb_history: '',
  has_drug_allergy: false, drug_allergies_specify: '', family_history_twins: false, family_history_tb: false,
  gender: 'FEMALE', marital_status: 'SINGLE', education_level: '', occupation: '', spouse_name: '', spouse_phone: '',
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

  // Facility autocomplete states
  const [suggestedFacilities, setSuggestedFacilities] = useState<any[]>([]);
  const [showFacilitySuggestions, setShowFacilitySuggestions] = useState(false);



  const { getError, validateOne, validateAll, touch, reset } = useFormValidation(patientSchema);

  useEffect(() => {
    if (!form.health_facility_name || form.health_facility_name.length < 2) {
      setSuggestedFacilities([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await referralsApi.facilities(form.health_facility_name);
        setSuggestedFacilities(data.results ?? data);
      } catch {
        setSuggestedFacilities([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [form.health_facility_name]);

  const handleFacilityChange = (val: string) => {
    set('health_facility_name', val);
    setShowFacilitySuggestions(true);
  };

  const selectFacility = (fac: any) => {
    setForm(f => ({
      ...f,
      health_facility_name: fac.name,
      kmhfl_code: fac.code,
      residence_county: fac.county || f.residence_county,
    }));
    setSuggestedFacilities([]);
    setShowFacilitySuggestions(false);
  };



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

  const openModal = () => {
    setForm(BLANK_FORM);
    setError('');
    reset();
    setShowModal(true);
  };

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
      residence_county: form.residence_county,
      residence_subcounty: form.residence_subcounty,
      residence_ward: form.residence_ward,
      residence_village: form.residence_village,
      emergency_contact_relationship: form.emergency_contact_relationship,
      health_facility_name: form.health_facility_name,
      kmhfl_code: form.kmhfl_code,
      anc_number: form.anc_number,
      pnc_number: form.pnc_number,
      gravida: form.gravida ? String(form.gravida) : '',
      parity: form.parity ? String(form.parity) : '',
      height: form.height ? String(form.height) : '',
      weight: form.weight ? String(form.weight) : '',
      estate_house_number: form.estate_house_number,
      has_diabetes: form.has_diabetes,
      has_hypertension: form.has_hypertension,
      blood_transfusion_history: form.blood_transfusion_history,
      tb_history: form.tb_history,
      has_drug_allergy: form.has_drug_allergy,
      drug_allergies_specify: form.drug_allergies_specify,
      family_history_twins: form.family_history_twins,
      family_history_tb: form.family_history_tb,
    };
    if (!validateAll(formAsFields)) return;
    setSaving(true); setError('');
    try {
      await patientsApi.create({
        ...form,
        gravida: form.gravida ? Number(form.gravida) : null,
        parity: form.parity ? Number(form.parity) : null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
      });
      setShowModal(false); load();
    } catch (err: any) {
      setError('Registration failed. Please make sure the Phone Number or National ID is not already in use. Ensure all required fields are correctly formatted, check your connection, and try again.');
    } finally { setSaving(false); }
  };

  const set = (field: keyof PatientForm, val: any) => {
    setForm(f => ({ ...f, [field]: val }));
    // Live-validate touched fields
    validateOne(field as keyof PatientFormFields, val, {
      full_name: form.full_name, phone_number: form.phone_number,
      national_id: form.national_id ?? '', nhif_number: form.nhif_number ?? '',
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
    } as any);
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
              <div className="empty-desc">This section tracks all maternal patients. Use the 'Register Patient' button at the top right to register a new pregnant mother and begin monitoring her gestation timeline.</div>
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

                {/* 1. Facility Information */}
                <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4, fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginTop: 8 }}>
                  Facility Information
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Name of Health Facility</label>
                  <input
                    className="form-input"
                    value={form.health_facility_name ?? ''}
                    onChange={e => handleFacilityChange(e.target.value)}
                    onFocus={() => setShowFacilitySuggestions(true)}
                  />
                  {showFacilitySuggestions && suggestedFacilities.length > 0 && (
                    <div 
                      onMouseLeave={() => setShowFacilitySuggestions(false)}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        zIndex: 1000,
                        maxHeight: '150px',
                        overflowY: 'auto',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    >
                      {suggestedFacilities.map(f => (
                        <div
                          key={f.id}
                          onClick={() => selectFacility(f)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            borderBottom: '1px solid var(--border)',
                          }}
                          className="hover:bg-primary-light"
                        >
                          <strong>{f.code}</strong> — {f.name} ({f.county} County)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">KMHFL Code</label>
                  <input
                    className="form-input"
                    value={form.kmhfl_code ?? ''}
                    onChange={e => set('kmhfl_code', e.target.value)}
                  />
                </div>

                {/* 2. Patient Demographics */}
                <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4, fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginTop: 16 }}>
                  Patient Demographics
                </div>
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
                   <input 
                     className={`form-input${getError('national_id') ? ' input-error' : ''}`}
                     value={form.national_id ?? ''}
                     onBlur={() => touch('national_id')}
                     onChange={e => set('national_id', e.target.value)} 
                   />
                   {getError('national_id') && <span className="form-error">{getError('national_id')}</span>}
                 </div>
                 <div className="form-group">
                   <label className="form-label">NHIF / SHA / SHIF / Huduma Number</label>
                   <input 
                     className={`form-input${getError('nhif_number') ? ' input-error' : ''}`}
                     value={form.nhif_number ?? ''}
                     onBlur={() => touch('nhif_number')}
                     onChange={e => set('nhif_number', e.target.value)} 
                   />
                   {getError('nhif_number') && <span className="form-error">{getError('nhif_number')}</span>}
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
                  <label className="form-label">Preferred Language</label>
                  <select className="form-select" value={form.lang ?? 'en'}
                    onChange={e => set('lang', e.target.value)}>
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Education Level</label>
                  <select className="form-select" value={form.education_level ?? ''}
                    onChange={e => set('education_level', e.target.value)}>
                    <option value="">Select Education Level</option>
                    <option value="NONE">None</option>
                    <option value="PRIMARY">Primary</option>
                    <option value="SECONDARY">Secondary</option>
                    <option value="TERTIARY">Tertiary</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Marital Status</label>
                  <select className="form-select" value={form.marital_status ?? 'SINGLE'}
                    onChange={e => set('marital_status', e.target.value)}>
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="COHABITING">Cohabiting</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                  </select>
                </div>

                {/* 3. Maternal Profile */}
                <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4, fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginTop: 16 }}>
                  Maternal Profile (Clinical Parameters)
                </div>
                <div className="form-group">
                  <label className="form-label">ANC Number</label>
                  <input
                    className="form-input"
                    value={form.anc_number ?? ''}
                    onChange={e => set('anc_number', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PNC Number</label>
                  <input
                    className="form-input"
                    value={form.pnc_number ?? ''}
                    onChange={e => set('pnc_number', e.target.value)}
                  />
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
                  <label className="form-label">Gravida</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.gravida ?? ''}
                    onChange={e => set('gravida', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Parity</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.parity ?? ''}
                    onChange={e => set('parity', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-input"
                    value={form.height ?? ''}
                    onChange={e => set('height', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-input"
                    value={form.weight ?? ''}
                    onChange={e => set('weight', e.target.value)}
                  />
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

                {/* 4. Residence & Address Details */}
                <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4, fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginTop: 16 }}>
                  Residence & Address Details
                </div>
                <div className="form-group">
                  <label className="form-label">County</label>
                  <input
                    className="form-input"
                    value={form.residence_county ?? ''}
                    onChange={e => set('residence_county', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sub-county</label>
                  <input
                    className="form-input"
                    value={form.residence_subcounty ?? ''}
                    onChange={e => set('residence_subcounty', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ward</label>
                  <input
                    className="form-input"
                    value={form.residence_ward ?? ''}
                    onChange={e => set('residence_ward', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Town/Trading Centre/Village</label>
                  <input
                    className="form-input"
                    value={form.residence_village ?? ''}
                    onChange={e => set('residence_village', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estate / House Number</label>
                  <input
                    className="form-input"
                    value={form.estate_house_number ?? ''}
                    onChange={e => set('estate_house_number', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Physical Address</label>
                  <input className="form-input" value={form.address}
                    onChange={e => set('address', e.target.value)} />
                </div>

                {/* 5. Next of Kin Information */}
                <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4, fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginTop: 16 }}>
                  Next of Kin Information
                </div>
                <div className="form-group">
                  <label className="form-label">Next of Kin Name</label>
                  <input className="form-input" value={form.next_of_kin_name}
                    onChange={e => set('next_of_kin_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Next of Kin Relationship</label>
                  <input
                    className="form-input"
                    value={form.emergency_contact_relationship ?? ''}
                    onChange={e => set('emergency_contact_relationship', e.target.value)}
                  />
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

                {/* 6. Medical & Surgical History */}
                <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4, fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginTop: 16 }}>
                  Medical & Surgical History
                </div>
                
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.has_diabetes ?? false}
                      onChange={e => set('has_diabetes', e.target.checked)}
                    />
                    Diabetes?
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.has_hypertension ?? false}
                      onChange={e => set('has_hypertension', e.target.checked)}
                    />
                    Hypertension?
                  </label>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.has_drug_allergy ?? false}
                      onChange={e => set('has_drug_allergy', e.target.checked)}
                    />
                    Any Drug Allergy?
                  </label>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.family_history_twins ?? false}
                      onChange={e => set('family_history_twins', e.target.checked)}
                    />
                    Family History: Twins
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.family_history_tb ?? false}
                      onChange={e => set('family_history_tb', e.target.checked)}
                    />
                    Family History: Tuberculosis
                  </label>
                </div>

                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">Blood Transfusion (notes/history)</label>
                  <input
                    className="form-input"
                    value={form.blood_transfusion_history ?? ''}
                    onChange={e => set('blood_transfusion_history', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">Tuberculosis History/Contact</label>
                  <input
                    className="form-input"
                    value={form.tb_history ?? ''}
                    onChange={e => set('tb_history', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">If Drug Allergy, specify allergen & reaction</label>
                  <input
                    className="form-input"
                    value={form.drug_allergies_specify ?? ''}
                    onChange={e => set('drug_allergies_specify', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">Other Allergies - Specify</label>
                  <textarea className="form-textarea" value={form.allergies ?? ''}
                    onChange={e => set('allergies', e.target.value)} />
                </div>

                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">Medical History (other notes)</label>
                  <textarea className="form-textarea" value={form.medical_history ?? ''}
                    onChange={e => set('medical_history', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">Surgical Operation - Specify</label>
                  <textarea className="form-textarea" value={form.surgical_history ?? ''}
                    onChange={e => set('surgical_history', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }} className="form-group">
                  <label className="form-label">Family History (other notes)</label>
                  <textarea className="form-textarea" value={form.family_history ?? ''}
                    onChange={e => set('family_history', e.target.value)} />
                </div>

              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
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
