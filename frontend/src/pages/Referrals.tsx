import { useEffect, useState, FormEvent } from 'react';
import { 
  ArrowUpRight, 
  MapPin, 
  User, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  X,
  Truck
} from 'lucide-react';
import { referralsApi, patientsApi } from '../api';
import { Patient } from '../types';
import { formatDate } from '../utils';

interface Referral {
  id: number;
  patient: number;
  patient_name: string;
  patient_number: string;
  referred_by: number;
  referred_by_name: string;
  referral_date: string;
  destination_facility: string;
  reason: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  clinical_summary: string;
  transport_mode: 'AMBULANCE' | 'PRIVATE' | 'PUBLIC';
  feedback_received: boolean;
  outcome_notes: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED';
  created_at: string;
  updated_at: string;
}

interface Facility {
  id: number;
  code: string;
  name: string;
  county: string;
}

const URGENCY_COLORS = {
  ROUTINE: 'blue',
  URGENT: 'warning',
  EMERGENCY: 'danger',
};

const STATUS_COLORS = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  COMPLETED: 'success',
  DECLINED: 'danger',
};

export default function Referrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [patientId, setPatientId] = useState<number | ''>('');
  const [referralDate, setReferralDate] = useState(new Date().toISOString().split('T')[0]);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [suggestedFacilities, setSuggestedFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [transportMode, setTransportMode] = useState<'AMBULANCE' | 'PRIVATE' | 'PUBLIC'>('PUBLIC');

  // Update Modal State
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [feedbackReceived, setFeedbackReceived] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [status, setStatus] = useState<Referral['status']>('PENDING');

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, pRes] = await Promise.all([
        referralsApi.list(),
        patientsApi.list({ limit: '100' })
      ]);
      setReferrals(rRes.data.results ?? rRes.data);
      setPatients(pRes.data.results ?? pRes.data);
    } catch (err) {
      setError('Failed to load referral data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search facilities for autocomplete
  useEffect(() => {
    if (destinationSearch.length < 2) {
      setSuggestedFacilities([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await referralsApi.facilities(destinationSearch);
        setSuggestedFacilities(data.results ?? data);
      } catch {
        setSuggestedFacilities([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [destinationSearch]);

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError('Please select a patient.');
      return;
    }
    const facilityName = selectedFacility 
      ? `${selectedFacility.code} — ${selectedFacility.name}`
      : destinationSearch;

    if (!facilityName) {
      setError('Please select or specify a destination facility.');
      return;
    }

    try {
      await referralsApi.create({
        patient: patientId,
        referral_date: referralDate,
        destination_facility: facilityName,
        reason,
        urgency,
        clinical_summary: clinicalSummary,
        transport_mode: transportMode,
        status: 'PENDING',
      });
      setIsCreateOpen(false);
      resetCreateForm();
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create referral.');
    }
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedReferral) return;

    try {
      await referralsApi.update(selectedReferral.id, {
        feedback_received: feedbackReceived,
        outcome_notes: outcomeNotes,
        status: status,
      });
      setIsUpdateOpen(false);
      setSelectedReferral(null);
      loadData();
    } catch (err) {
      setError('Failed to update referral status.');
    }
  };

  const resetCreateForm = () => {
    setPatientId('');
    setReferralDate(new Date().toISOString().split('T')[0]);
    setDestinationSearch('');
    setSelectedFacility(null);
    setSuggestedFacilities([]);
    setReason('');
    setUrgency('ROUTINE');
    setClinicalSummary('');
    setTransportMode('PUBLIC');
    setError('');
  };

  const openUpdateModal = (ref: Referral) => {
    setSelectedReferral(ref);
    setFeedbackReceived(ref.feedback_received);
    setOutcomeNotes(ref.outcome_notes);
    setStatus(ref.status);
    setIsUpdateOpen(true);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="flex items-center gap-3">
          <ArrowUpRight className="text-primary" size={28} /> Clinical Referral Tracking
        </h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}
          >
            <Plus size={16} /> Create Referral
          </button>
        </div>
      </header>

      <div className="page-body">
        {error && (
          <div className="alert alert-danger flex items-center gap-2 mb-4">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : referrals.length === 0 ? (
          <div className="card empty-state" style={{ padding: '40px' }}>
            <ArrowUpRight size={48} className="text-muted opacity-20 mb-3" />
            <h3>No referrals tracked yet</h3>
            <p className="text-muted">Create a referral to log patient transfers to other institutions.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {referrals.map((ref) => (
              <div key={ref.id} className="card hover:shadow-md transition-shadow">
                <div className="card-body">
                  <div className="flex-between flex-wrap gap-4 mb-3">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }} className="flex items-center gap-2 text-primary">
                        <User size={16} /> {ref.patient_name} ({ref.patient_number})
                      </h3>
                      <div className="text-muted flex items-center gap-1 mt-1" style={{ fontSize: '0.85rem' }}>
                        <MapPin size={14} /> Referred to: <strong>{ref.destination_facility}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-${URGENCY_COLORS[ref.urgency]}`}>{ref.urgency}</span>
                      <span className={`badge badge-${STATUS_COLORS[ref.status]}`}>{ref.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <span className="text-muted block">Referral Date</span>
                      <strong>{formatDate(ref.referral_date)}</strong>
                    </div>
                    <div>
                      <span className="text-muted block">Transport Mode</span>
                      <strong className="flex items-center gap-1"><Truck size={14} /> {ref.transport_mode}</strong>
                    </div>
                    <div>
                      <span className="text-muted block">Referred By</span>
                      <strong>{ref.referred_by_name || 'Staff'}</strong>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-muted block" style={{ fontSize: '0.85rem' }}>Reason for Referral</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>{ref.reason}</p>
                  </div>

                  {ref.clinical_summary && (
                    <div className="mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <span className="text-muted block" style={{ fontSize: '0.85rem' }}>Clinical Summary</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{ref.clinical_summary}</p>
                    </div>
                  )}

                  {ref.feedback_received && (
                    <div className="mt-3" style={{ background: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid #10b981', padding: '10px', borderRadius: '4px' }}>
                      <span className="text-success block" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Outcome & Feedback Notes</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{ref.outcome_notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <button 
                      className="btn btn-ghost btn-sm flex items-center gap-1"
                      onClick={() => openUpdateModal(ref)}
                    >
                      <CheckCircle size={14} /> Update Outcome / Feedback
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3>Create Patient Referral</h3>
              <button className="btn-close" onClick={() => setIsCreateOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
                <label className="form-label mb-3">
                  Select Patient *
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
                    className="form-select"
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.patient_number} — {p.full_name}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <label className="form-label">
                    Referral Date *
                    <input
                      type="date"
                      value={referralDate}
                      onChange={(e) => setReferralDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </label>

                  <label className="form-label">
                    Urgency *
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="ROUTINE">Routine</option>
                      <option value="URGENT">Urgent</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </label>
                </div>

                <div className="mb-3" style={{ position: 'relative' }}>
                  <label className="form-label">
                    Destination Facility (KMHFL code + name) *
                    <input
                      type="text"
                      value={destinationSearch}
                      onChange={(e) => {
                        setDestinationSearch(e.target.value);
                        if (selectedFacility) setSelectedFacility(null);
                      }}
                      placeholder="Type facility name or code to search..."
                      className="form-input"
                      required
                    />
                  </label>

                  {/* Autocomplete suggestions dropdown */}
                  {suggestedFacilities.length > 0 && !selectedFacility && (
                    <div style={{
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
                    }}>
                      {suggestedFacilities.map(f => (
                        <div
                          key={f.id}
                          onClick={() => {
                            setSelectedFacility(f);
                            setDestinationSearch(`${f.code} — ${f.name}`);
                            setSuggestedFacilities([]);
                          }}
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

                <label className="form-label mb-3">
                  Transport Mode *
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="PUBLIC">Public Transport</option>
                    <option value="PRIVATE">Private Vehicle</option>
                    <option value="AMBULANCE">Ambulance</option>
                  </select>
                </label>

                <label className="form-label mb-3">
                  Reason for Referral *
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="form-textarea"
                    rows={3}
                    placeholder="Provide specific medical reason for referral..."
                    required
                  />
                </label>

                <label className="form-label mb-3">
                  Clinical Summary & Status
                  <textarea
                    value={clinicalSummary}
                    onChange={(e) => setClinicalSummary(e.target.value)}
                    className="form-textarea"
                    rows={4}
                    placeholder="Vitals, symptoms, administered medications, and diagnostic results..."
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Referral</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE OUTCOME MODAL */}
      {isUpdateOpen && selectedReferral && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>Update Referral Outcome</h3>
              <button className="btn-close" onClick={() => { setIsUpdateOpen(false); setSelectedReferral(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p>Outcome for <strong>{selectedReferral.patient_name}</strong> to <strong>{selectedReferral.destination_facility}</strong></p>

                <label className="flex items-center gap-2 mb-4 cursor-pointer" style={{ fontSize: '0.95rem' }}>
                  <input
                    type="checkbox"
                    checked={feedbackReceived}
                    onChange={(e) => setFeedbackReceived(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Feedback received from destination facility
                </label>

                <label className="form-label mb-3">
                  Referral Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </label>

                <label className="form-label mb-3">
                  Outcome & Feedback Notes
                  <textarea
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    className="form-textarea"
                    rows={4}
                    placeholder="Enter details about what happened at the destination hospital..."
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setIsUpdateOpen(false); setSelectedReferral(null); }}>Cancel</button>
                <button type="submit" className="btn btn-success">Save Outcome</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
