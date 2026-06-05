import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Baby, 
  ChevronRight, 
  Activity, 
  Scale, 
  Ruler, 
  Syringe, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileBox,
  TrendingUp,
  LineChart as LineChartIcon,
  Stethoscope,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { pediatricsApi } from '../api';
import { ChildProfile, GrowthRecord, VaccinationRecord } from '../types';
import { formatDate } from '../utils';
import { useAuth } from '../context/AuthContext';

const CHART_TOOLTIP_STYLE = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  boxShadow: 'var(--shadow-card)',
};

export default function ChildProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'UNKNOWN',
    date_of_birth: '',
    birth_weight_kg: '',
    birth_certificate_number: '',
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !profile) return;
    setSaving(true);
    setError('');
    try {
      await pediatricsApi.updateProfile(+id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        gender: editForm.gender,
        date_of_birth: editForm.date_of_birth,
        birth_weight_kg: editForm.birth_weight_kg ? parseFloat(editForm.birth_weight_kg) : null,
        birth_certificate_number: editForm.birth_certificate_number || null,
      });
      setShowEditModal(false);
      await load();
    } catch (err) {
      setError('Failed to update child details. Please check the inputs and try again.');
    } finally {
      setSaving(false);
    }
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [profileRes, growthRes, vacRes] = await Promise.all([
        pediatricsApi.getProfile(+id),
        pediatricsApi.listGrowth({ child: id }),
        pediatricsApi.listVaccinations({ child: id }),
      ]);
      setProfile(profileRes.data);
      setGrowthRecords(growthRes.data.results ?? growthRes.data);
      setVaccinations(vacRes.data.results ?? vacRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const growthSeries = useMemo(() => {
    return growthRecords
      .slice()
      .reverse()
      .map((r) => ({
        date: formatDate(r.date_recorded),
        weight: r.weight_kg ? Number(r.weight_kg) : null,
        height: r.height_cm ? Number(r.height_cm) : null,
        head: r.head_circumference_cm ? Number(r.head_circumference_cm) : null,
      }));
  }, [growthRecords]);

  const vaccinationCounts = useMemo(() => {
    return vaccinations.reduce(
      (acc, v) => {
        acc.total += 1;
        if (v.status === 'GIVEN') acc.given += 1;
        if (v.status === 'MISSED') acc.missed += 1;
        if (v.status === 'PENDING') acc.pending += 1;
        return acc;
      },
      { total: 0, given: 0, pending: 0, missed: 0 }
    );
  }, [vaccinations]);

  const markGiven = async (v: VaccinationRecord) => {
    setUpdating(v.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      await pediatricsApi.updateVaccination(v.id, {
        status: 'GIVEN',
        given_date: v.given_date || today,
      });
      await load();
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="page-body loading-wrap"><div className="spinner" /></div>
    );
  }

  if (!profile) {
    return (
      <div className="page-body">
        <p>Child profile not found.</p>
      </div>
    );
  }

  return (
    <>
      <header className="page-header">
        <Link to={`/patients/${profile.mother}`} className="btn btn-ghost btn-sm flex items-center gap-2">
           <ChevronRight size={14} className="rotate-180" /> ← Back to Mother
        </Link>
        <h1 className="flex items-center gap-2">
          <Baby className="text-primary" /> Child Profile: {profile.first_name || 'Baby'}
        </h1>
        <div className="header-actions">
          <span className="badge badge-success">{profile.gender}</span>
          <span className="badge badge-primary">DOB: {formatDate(profile.date_of_birth)}</span>
        </div>
      </header>

      <div className="page-body">
        <div className="dash-grid mb-6">
          <div className="card">
            <div className="flex-between mb-4">
              <div className="section-title" style={{ margin: 0 }}>Baby Details</div>
              {isAdmin && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditForm({
                      first_name: profile.first_name || '',
                      last_name: profile.last_name || '',
                      gender: profile.gender || 'UNKNOWN',
                      date_of_birth: profile.date_of_birth || '',
                      birth_weight_kg: profile.birth_weight_kg ? String(profile.birth_weight_kg) : '',
                      birth_certificate_number: profile.birth_certificate_number || '',
                    });
                    setShowEditModal(true);
                  }}
                >
                  Edit Details
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {[
                ['First Name', profile.first_name || '—'],
                ['Last Name', profile.last_name || '—'],
                ['Gender', profile.gender],
                ['Date of Birth', formatDate(profile.date_of_birth)],
                ['Birth Weight (kg)', profile.birth_weight_kg || '—'],
                ['Birth Cert #', profile.birth_certificate_number || '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: 500, fontSize: '0.88rem', marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title">Vaccination Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                ['Total', vaccinationCounts.total, 'primary'],
                ['Given', vaccinationCounts.given, 'success'],
                ['Pending', vaccinationCounts.pending, 'warning'],
                ['Missed', vaccinationCounts.missed, 'danger'],
              ].map(([label, val, color]) => (
                <div key={label as string} className={`kpi-card ${color}`} style={{ padding: '12px' }}>
                  <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{val}</div>
                  <div className="kpi-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mb-6 shadow-sm border-none">
          <div className="section-title flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Growth Trends
          </div>
          {growthSeries.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-icon"><Activity size={48} className="text-muted opacity-20" /></div>
              <div className="empty-title">No growth records yet</div>
            </div>
          ) : (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={growthSeries} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="weight" stroke="var(--hosp-teal)" strokeWidth={3} dot={{ r: 3 }} name="Weight (kg)" />
                  <Line type="monotone" dataKey="height" stroke="var(--hosp-blue)" strokeWidth={3} dot={{ r: 3 }} name="Height (cm)" />
                  <Line type="monotone" dataKey="head" stroke="var(--purple)" strokeWidth={3} dot={{ r: 3 }} name="Head Circ (cm)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card shadow-sm border-none">
          <div className="section-title flex items-center gap-2">
            <Syringe size={20} className="text-primary" /> Vaccination Schedule
          </div>
          {vaccinations.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-icon"><Activity size={48} className="text-muted opacity-20" /></div>
              <div className="empty-title">No vaccinations found</div>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left italic-none">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="uppercase text-[11px] font-bold tracking-wider text-slate-500">
                    <th className="px-4 py-3">Vaccine</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Given Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vaccinations.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-semibold text-sm">{v.vaccine_name_display || v.vaccine_name}</td>
                      <td className="px-4 py-4 text-sm text-muted">{v.expected_date ? formatDate(v.expected_date) : '—'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`badge badge-${v.status === 'GIVEN' ? 'success' : v.status === 'MISSED' ? 'danger' : 'warning'} text-[10px]`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">{v.given_date ? formatDate(v.given_date) : '—'}</td>
                      <td className="px-4 py-4 text-right">
                        {v.status !== 'GIVEN' && (
                          <button
                            className="btn btn-success btn-xs flex items-center gap-1 ml-auto"
                            onClick={() => markGiven(v)}
                            disabled={updating === v.id}
                          >
                            <CheckCircle size={14} /> {updating === v.id ? 'Saving...' : 'Mark Given'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit Child Details</div>
              <button className="modal-close" onClick={() => setShowEditModal(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            {error && <div className="alert alert-danger mb-4">⚠️ {error}</div>}
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editForm.first_name}
                  onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editForm.last_name}
                  onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select
                  className="form-input"
                  value={editForm.gender}
                  onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={editForm.date_of_birth}
                  onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Birth Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={editForm.birth_weight_kg}
                  onChange={e => setEditForm(f => ({ ...f, birth_weight_kg: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Birth Certificate Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.birth_certificate_number}
                  onChange={e => setEditForm(f => ({ ...f, birth_certificate_number: e.target.value }))}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
