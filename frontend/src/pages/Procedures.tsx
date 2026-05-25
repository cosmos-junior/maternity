import { useEffect, useState } from 'react';
import { proceduresApi } from '../api';

export default function Procedures() {
  const [activeTab, setActiveTab] = useState<'PROCEDURES' | 'EMERGENCIES'>('EMERGENCIES');
  const [procedures, setProcedures] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([
        proceduresApi.listProcedures(),
        proceduresApi.listEmergencies(),
      ]);
      setProcedures(pRes.data);
      setEmergencies(eRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <header className="page-header">
        <h1>🏥 Clinical Procedures & Emergency Dashboard</h1>
      </header>

      <div className="page-body">
        {/* Tabs */}
        <div className="tabs" style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
          <button
            className={`btn btn-ghost ${activeTab === 'EMERGENCIES' ? 'active' : ''}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'EMERGENCIES' ? '3px solid var(--danger)' : 'none', color: activeTab === 'EMERGENCIES' ? 'var(--danger)' : '' }}
            onClick={() => setActiveTab('EMERGENCIES')}
          >
            🚨 Emergency Protocols
          </button>
          <button
            className={`btn btn-ghost ${activeTab === 'PROCEDURES' ? 'active' : ''}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'PROCEDURES' ? '3px solid var(--primary)' : 'none', color: activeTab === 'PROCEDURES' ? 'var(--primary)' : '' }}
            onClick={() => setActiveTab('PROCEDURES')}
          >
            📋 Standard Procedures
          </button>
        </div>

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : (
          <div>
            {activeTab === 'EMERGENCIES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {emergencies.length === 0 ? (
                  <div className="empty-state">No emergency protocols configured.</div>
                ) : (
                  emergencies.map(em => (
                    <div key={em.id} className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                      <div 
                        className="flex-between cursor-pointer" 
                        onClick={() => setExpandedId(expandedId === em.id ? null : em.id)}
                        style={{ padding: '8px 0' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: '1.8rem' }}>{em.icon}</span>
                          <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{em.title}</div>
                            <div className="badge badge-danger mt-1">{em.emergency_type_display}</div>
                          </div>
                        </div>
                        <div>{expandedId === em.id ? '▲' : '▼'}</div>
                      </div>

                      {expandedId === em.id && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                          <div className="form-grid-2">
                            <div>
                              <div className="text-muted text-sm mb-1" style={{ fontWeight: 600 }}>Danger Signs</div>
                              <div className="alert alert-warning" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                {em.danger_signs}
                              </div>

                              <div className="text-muted text-sm mb-1 mt-4" style={{ fontWeight: 600 }}>Immediate Response Algorithm</div>
                              <div className="alert alert-danger" style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', fontWeight: 500 }}>
                                {em.immediate_response}
                              </div>
                            </div>
                            
                            <div>
                              {em.drugs && em.drugs.length > 0 && (
                                <>
                                  <div className="text-muted text-sm mb-2" style={{ fontWeight: 600 }}>Required Emergency Drugs</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {em.drugs.map((drug: any) => (
                                      <div key={drug.id} style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 6, border: '1px solid var(--border)' }}>
                                        <div className="flex-between mb-1">
                                          <strong style={{ color: 'var(--primary)' }}>{drug.drug_name}</strong>
                                          <span className="badge badge-neutral">{drug.route_display}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem' }}><strong>Dose:</strong> {drug.dosage}</div>
                                        <div className="text-muted text-sm mt-1">{drug.frequency} {drug.max_dose ? `(Max: ${drug.max_dose})` : ''}</div>
                                        {drug.important_notes && <div className="text-sm mt-2" style={{ color: 'var(--danger)' }}>⚠️ {drug.important_notes}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}

                              <div className="text-muted text-sm mb-1 mt-4" style={{ fontWeight: 600 }}>Escalation & Monitoring</div>
                              <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 6, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                <strong>Escalation Steps:</strong><br/>
                                {em.escalation_steps}<br/><br/>
                                <strong>Monitoring:</strong><br/>
                                {em.monitoring_requirements}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'PROCEDURES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {procedures.length === 0 ? (
                  <div className="empty-state">No clinical procedures configured.</div>
                ) : (
                  procedures.map(proc => (
                    <div key={proc.id} className="card" style={{ borderLeft: proc.severity === 'URGENT' ? '4px solid var(--warning)' : '4px solid var(--primary)' }}>
                      <div 
                        className="flex-between cursor-pointer" 
                        onClick={() => setExpandedId(expandedId === proc.id ? null : proc.id)}
                        style={{ padding: '8px 0' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: '1.8rem' }}>{proc.icon}</span>
                          <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{proc.title}</div>
                            <div className="text-muted text-sm mt-1">{proc.category_display}</div>
                          </div>
                        </div>
                        <div>{expandedId === proc.id ? '▲' : '▼'}</div>
                      </div>

                      {expandedId === proc.id && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: 16 }}>{proc.summary}</p>
                          
                          <div className="text-muted text-sm mb-2" style={{ fontWeight: 600 }}>Procedure Steps</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {proc.steps?.map((step: any) => (
                              <div key={step.id} style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--bg-app)', borderRadius: 6 }}>
                                <div style={{ 
                                  width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 
                                }}>
                                  {step.step_number}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{step.title}</div>
                                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{step.description}</div>
                                  {step.warning_note && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: 6, fontWeight: 500 }}>
                                      ⚠️ {step.warning_note}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
