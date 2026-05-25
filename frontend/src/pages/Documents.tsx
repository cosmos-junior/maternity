import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clinicalApi, patientsApi } from '../api';
import { formatDate } from '../utils';

interface PatientDoc {
  id: number;
  patient: number;
  patient_name: string;
  document_type: string;
  document_type_display: string;
  title: string;
  description: string;
  file: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_by_name: string | null;
  created_at: string;
}

const DOC_ICONS: Record<string, string> = {
  LAB_REPORT: '🧪',
  ULTRASOUND: '📷',
  SCAN: '🔬',
  PRESCRIPTION: '💊',
  REFERRAL: '🔗',
  CONSENT: '📃',
  ID_DOCUMENT: '🪪',
  OTHER: '📎',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const [docs, setDocs] = useState<PatientDoc[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    patient: patientId || '',
    document_type: 'OTHER',
    title: '',
    description: '',
  });

  const load = async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (patientId) params.patient = patientId;
    const [dRes, pRes] = await Promise.all([
      clinicalApi.listDocs(params),
      patientsApi.list(),
    ]);
    setDocs(dRes.data.results ?? dRes.data);
    setPatients((pRes.data.results ?? pRes.data));
    setLoading(false);
  };

  useEffect(() => { load(); }, [patientId]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('patient', form.patient);
    fd.append('document_type', form.document_type);
    fd.append('title', form.title);
    fd.append('description', form.description);
    try {
      await clinicalApi.uploadDoc(fd);
      setShowForm(false);
      setSelectedFile(null);
      flash('Document uploaded ✓');
      load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this document?')) return;
    await clinicalApi.deleteDoc(id);
    flash('Document deleted');
    load();
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      <header className="page-header">
        <h1>📁 Patient Documents</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Close' : '📤 Upload Document'}
          </button>
        </div>
      </header>

      <div className="page-body">
        {success && <div className="alert alert-success">✓ {success}</div>}

        {/* Upload Form */}
        {showForm && (
          <div className="card mb-6" style={{ borderLeft: '3px solid var(--hosp-teal)' }}>
            <div className="section-title">📤 Upload Document</div>
            <form onSubmit={handleUpload}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select className="form-select" value={form.patient} onChange={e => set('patient', e.target.value)} required>
                    <option value="">Select patient…</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.patient_number})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Document Type</label>
                  <select className="form-select" value={form.document_type} onChange={e => set('document_type', e.target.value)}>
                    {Object.entries(DOC_ICONS).map(([k, icon]) => (
                      <option key={k} value={k}>{icon} {k.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Ultrasound Week 20" />
                </div>
                <div className="form-group">
                  <label className="form-label">File * (max 10MB)</label>
                  <input
                    type="file"
                    className="form-input"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    required
                  />
                  {selectedFile && (
                    <span className="form-hint">{selectedFile.name} — {formatSize(selectedFile.size)}</span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="modal-footer" style={{ paddingTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !selectedFile}>
                  {saving ? 'Uploading…' : '📤 Upload'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Documents Grid */}
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <div className="empty-title">No documents uploaded</div>
            <div className="empty-desc">Upload lab reports, ultrasounds, or scans.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {docs.map(d => (
              <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.8rem' }}>{DOC_ICONS[d.document_type] || '📎'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.title}
                    </div>
                    <div className="text-muted text-sm">{d.patient_name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-primary">{d.document_type_display}</span>
                  <span className="badge badge-neutral">{formatSize(d.file_size_bytes)}</span>
                </div>
                <div className="text-muted text-sm">
                  {formatDate(d.created_at)}
                  {d.uploaded_by_name && ` · by ${d.uploaded_by_name}`}
                </div>
                {d.description && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{d.description}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <a href={d.file} target="_blank" rel="noopener" className="btn btn-ghost btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                    📥 Download
                  </a>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(d.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
