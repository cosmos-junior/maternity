import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Clock, 
  Heart, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Baby,
  ChevronRight
} from 'lucide-react';
import { patientsApi, partographApi } from '../api';
import { Patient } from '../types';

interface PartographEntry {
  id: number;
  hours_in_labour: string;
  cervical_dilation_cm: string | null;
  fetal_heart_rate: number | null;
  recorded_at: string;
}

interface BoardPatient {
  patient: Patient;
  latestEntry: PartographEntry | null;
  defaultColumn: string;
}

const COLUMNS = [
  'Early Labour',
  'Active Labour',
  'Pushing',
  'Delivered',
  'Recovery'
];

const RISK_BADGES = {
  LOW: 'badge-success',
  MEDIUM: 'badge-warning',
  HIGH: 'badge-danger',
};

export default function LabourWard() {
  const [boardPatients, setBoardPatients] = useState<BoardPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Custom column overrides saved in localStorage
  const [overrides, setOverrides] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('labour_board_columns');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const loadData = async () => {
    try {
      setError('');
      const { data: pRes } = await patientsApi.list({ limit: '100' });
      const activePatients = (pRes.results ?? pRes).filter((p: Patient) => p.is_active);

      // Fetch partographs for all active patients
      const promises = activePatients.map(async (p: Patient) => {
        try {
          const { data: partographs } = await partographApi.list(p.id);
          const entriesList: PartographEntry[] = partographs.results ?? partographs;
          
          // Sort by hours_in_labour descending to get latest
          const sorted = [...entriesList].sort((a, b) => parseFloat(b.hours_in_labour) - parseFloat(a.hours_in_labour));
          return { patient: p, entries: sorted };
        } catch {
          return { patient: p, entries: [] };
        }
      });

      const results = await Promise.all(promises);

      // Filter: Patient must have at least one partograph entry in the last 24 hours OR clinic_stage is DELIVERED/POSTNATAL
      const filtered = results.filter(({ patient, entries }) => {
        if (patient.clinic_stage === 'DELIVERED' || patient.clinic_stage === 'POSTNATAL') {
          return true;
        }
        if (entries.length > 0) {
          const latest = entries[0];
          const diffMs = Date.now() - new Date(latest.recorded_at).getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          return diffHours <= 24; // within last 24 hours
        }
        return false;
      });

      // Map to board structure
      const mapped: BoardPatient[] = filtered.map(({ patient, entries }) => {
        const latest = entries.length > 0 ? entries[0] : null;
        let defaultColumn = 'Early Labour';

        if (patient.clinic_stage === 'DELIVERED') {
          defaultColumn = 'Delivered';
        } else if (patient.clinic_stage === 'POSTNATAL') {
          defaultColumn = 'Recovery';
        } else if (latest) {
          const dilation = latest.cervical_dilation_cm ? parseFloat(latest.cervical_dilation_cm) : 0;
          if (dilation >= 10) {
            defaultColumn = 'Pushing';
          } else if (dilation >= 4) {
            defaultColumn = 'Active Labour';
          } else {
            defaultColumn = 'Early Labour';
          }
        }

        return {
          patient,
          latestEntry: latest,
          defaultColumn
        };
      });

      setBoardPatients(mapped);
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Unable to refresh the Labour Ward Board. Please check your network connection, click the refresh button above, or contact system support if the connection persists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto refresh every 2 minutes
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Update override in localStorage
  const movePatient = (patientId: number, targetColumn: string) => {
    const newOverrides = { ...overrides, [patientId]: targetColumn };
    setOverrides(newOverrides);
    localStorage.setItem('labour_board_columns', JSON.stringify(newOverrides));
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, patientId: number) => {
    e.dataTransfer.setData('text/plain', patientId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    const patientIdStr = e.dataTransfer.getData('text/plain');
    if (patientIdStr) {
      movePatient(parseInt(patientIdStr, 10), targetColumn);
    }
  };

  // Get current column for a patient
  const getPatientColumn = (bp: BoardPatient) => {
    return overrides[bp.patient.id] || bp.defaultColumn;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <header className="page-header" style={{ marginBottom: '16px', flexShrink: 0 }}>
        <h1 className="flex items-center gap-3">
          <Baby className="text-primary" size={28} /> Labour Ward Board
        </h1>
        <div className="header-actions flex items-center gap-4">
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button 
            className="btn btn-ghost btn-sm flex items-center gap-1"
            onClick={() => { setLoading(true); loadData(); }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="alert alert-danger flex items-center gap-2 mb-4" style={{ flexShrink: 0 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-wrap" style={{ flexGrow: 1 }}><div className="spinner" /></div>
      ) : (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))', 
            gap: '16px', 
            flexGrow: 1, 
            overflowX: 'auto',
            paddingBottom: '16px'
          }}
        >
          {COLUMNS.map((column) => {
            const patientsInCol = boardPatients.filter(bp => getPatientColumn(bp) === column);

            return (
              <div 
                key={column} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column)}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px',
                  display: 'flex', 
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Column Header */}
                <div 
                  style={{ 
                    padding: '14px 16px', 
                    borderBottom: '2px solid var(--border)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'var(--bg-input)'
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{column}</h3>
                  <span 
                    style={{ 
                      background: 'var(--primary)', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: '22px', 
                      height: '22px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    {patientsInCol.length}
                  </span>
                </div>

                {/* Column Body */}
                <div 
                  style={{ 
                    padding: '12px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px', 
                    flexGrow: 1, 
                    overflowY: 'auto',
                    minHeight: '200px'
                  }}
                >
                  {patientsInCol.length === 0 ? (
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexGrow: 1, 
                        color: 'var(--text-muted)', 
                        fontSize: '0.8rem',
                        border: '2px dashed var(--border)',
                        borderRadius: '8px',
                        padding: '24px',
                        textAlign: 'center'
                      }}
                    >
                      No mothers in this stage. Drag and drop a patient card here, or use the drop-down selector on the patient card to update their labour progress.
                    </div>
                  ) : (
                    patientsInCol.map((bp) => {
                      const { patient, latestEntry } = bp;
                      return (
                        <div
                          key={patient.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, patient.id)}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '12px',
                            cursor: 'grab',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                            position: 'relative'
                          }}
                          className="hover:border-primary transition-colors"
                        >
                          <div className="flex-between mb-2">
                            <span className={`badge ${RISK_BADGES[patient.risk_level] || 'badge-secondary'}`} style={{ fontSize: '0.7rem' }}>
                              {patient.risk_level} Risk
                            </span>
                            
                            {/* Column Quick Mover controls */}
                            <select
                              value={column}
                              onChange={(e) => movePatient(patient.id, e.target.value)}
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '2px 4px', 
                                borderRadius: '4px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-input)'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>

                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700 }}>{patient.full_name}</h4>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {patient.patient_number}</span>

                          <div className="divider" style={{ margin: '8px 0' }} />

                          {latestEntry ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                              <div className="flex items-center gap-1">
                                <Clock size={12} className="text-primary" />
                                <span>Active Labour: <strong>{latestEntry.hours_in_labour} hrs</strong></span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity size={12} className="text-success" />
                                <span>Cervix Dilation: <strong>{latestEntry.cervical_dilation_cm || '—'} cm</strong></span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart size={12} className="text-danger" />
                                <span>Fetal HR: <strong>{latestEntry.fetal_heart_rate || '—'} bpm</strong></span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                              No partograph entries today.
                            </div>
                          )}

                          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                            <Link 
                              to={`/patients/${patient.id}/partograph`} 
                              className="btn btn-ghost btn-sm flex items-center gap-1"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Partograph <ChevronRight size={12} />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
