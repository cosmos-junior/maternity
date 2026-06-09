import React, { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { 
  AlertTriangle, 
  CheckCircle, 
  History, 
  AlertCircle,
  PlusCircle,
  Activity,
  Heart,
  Droplets,
  Brain,
  Eye,
  Zap,
  Waves,
  Thermometer,
  Baby,
  Send,
  Loader2,
  Circle
} from 'lucide-react';
import { motherApi } from '../api';
import { SymptomReport } from '../types';
import { extractListData, formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';

const SYMPTOM_OPTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'bleeding', label: 'Vaginal bleeding / spotting', icon: Droplets },
  { id: 'headache', label: 'Severe headache', icon: Brain },
  { id: 'vision_changes', label: 'Vision changes', icon: Eye },
  { id: 'abdominal_pain', label: 'Severe abdominal pain', icon: Zap },
  { id: 'swelling', label: 'Sudden swelling', icon: Waves },
  { id: 'fever', label: 'High fever or chills', icon: Thermometer },
  { id: 'reduced_movement', label: 'Reduced fetal movement', icon: Baby },
];

export default function MotherSymptoms() {
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await motherApi.listSymptoms();
      setReports(extractListData<SymptomReport>(res.data));
    } catch (err: any) {
      console.error(err);
      setError('Failed to load symptom reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSymptomToggle = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0 && !description.trim()) {
      setError('Please select at least one symptom or describe your symptoms.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        symptoms: selectedSymptoms.join(', '),
        description,
        severity
      };
      await motherApi.reportSymptoms(payload);
      setSubmitSuccess('Symptom report submitted successfully.');
      setTimeout(() => {
        setSelectedSymptoms([]);
        setDescription('');
        setSeverity('LOW');
        setSubmitSuccess('');
        loadReports();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const apiError = err.response?.data;
      const message = typeof apiError === 'string'
        ? apiError
        : apiError?.detail
        || (Array.isArray(apiError?.non_field_errors) ? apiError.non_field_errors[0] : null)
        || (typeof apiError === 'object' ? Object.values(apiError).flat()[0] : null);
      setError(message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 72px)' }}>
      {/* Warm Gradient Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: `
          linear-gradient(135deg, rgba(251, 191, 206, 0.08) 0%, rgba(253, 224, 207, 0.08) 50%, rgba(186, 226, 230, 0.08) 100%)
        `
      }} />

      <div className="relative z-10 p-4 md:p-6 max-w-6xl mx-auto">
        {/* Hero Section with Alert Status */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl" 
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.35) 0%, rgba(253, 224, 207, 0.25) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
          <div className="relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div style={{
                backgroundImage: `url(${motherPortalImages.symptoms})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.6) saturate(1.1)',
                opacity: 0.4
              }} className="absolute inset-0" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2">Health Monitoring</h1>
                  <p className="text-white/90 drop-shadow text-sm md:text-base">Report any symptoms for immediate care</p>
                </div>
                <div className="px-6 py-3 rounded-full"
                  style={{
                    background: 'rgba(16, 185, 129, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(16, 185, 129, 0.5)'
                  }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white">Monitoring Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Symptoms Reporting Form (Spans 2 columns on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(244, 199, 215, 0.15) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(236, 72, 153, 0.3)'
                }}>
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="text-pink-300" size={20} />
                  <p className="text-white/70 text-xs uppercase tracking-widest">Overall Status</p>
                </div>
                <p className="text-2xl font-bold text-white">Good</p>
              </div>

              <div className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 197, 253, 0.15) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="text-blue-300" size={20} />
                  <p className="text-white/70 text-xs uppercase tracking-widest">Reports</p>
                </div>
                <p className="text-2xl font-bold text-white">{reports.length}</p>
              </div>

              <div className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(134, 239, 172, 0.15) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="text-green-300" size={20} />
                  <p className="text-white/70 text-xs uppercase tracking-widest">Reviewed</p>
                </div>
                <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'REVIEWED').length}</p>
              </div>
            </div>

            {/* Main Form Card */}
            <div className="rounded-3xl p-6 md:p-8 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.25) 0%, rgba(254, 240, 214, 0.15) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}>
              
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <PlusCircle className="text-pink-300" size={24} />
                Report Symptoms
              </h2>

              {submitSuccess && (
                <div className="p-4 mb-6 rounded-2xl border flex items-center gap-3"
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    borderColor: 'rgba(34, 197, 94, 0.3)'
                  }}>
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-400 text-sm font-semibold">{submitSuccess}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Symptom Selection Grid */}
                <div className="flex flex-col gap-3">
                  <label className="text-white/90 text-sm font-bold">Select Symptoms You're Experiencing</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SYMPTOM_OPTIONS.map(opt => {
                      const checked = selectedSymptoms.includes(opt.id);
                      const SymptomIcon = opt.icon;
                      return (
                        <button
                          key={opt.id} 
                          type="button"
                          onClick={() => handleSymptomToggle(opt.id)}
                          className="relative p-4 rounded-2xl text-left transition-all group"
                          style={{
                            background: checked
                              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0.15) 100%)'
                              : 'rgba(255, 255, 255, 0.08)',
                            border: checked
                              ? '1.5px solid rgba(236, 72, 153, 0.5)'
                              : '1px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: checked ? '0 0 20px rgba(236, 72, 153, 0.2)' : 'none'
                          }}>
                          
                          <div className="flex items-center gap-3">
                            <SymptomIcon size={20} className={checked ? 'text-pink-300' : 'text-white/60'} />
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${checked ? 'text-white' : 'text-white/80'}`}>
                                {opt.label}
                              </p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              checked 
                                ? 'border-pink-400 bg-pink-500' 
                                : 'border-white/30 group-hover:border-white/50'
                            }`}>
                              {checked && <CheckCircle size={16} className="text-white" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Severity Selection */}
                <div className="flex flex-col gap-3">
                  <label className="text-white/90 text-sm font-bold">How Severe Is This?</label>
                  <div className="flex gap-3">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className="flex-1 py-3 text-sm font-bold rounded-2xl border transition-all"
                        style={{
                          background: severity === sev
                            ? sev === 'HIGH'
                              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.15) 100%)'
                              : sev === 'MEDIUM'
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.15) 100%)'
                              : 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.15) 100%)'
                            : 'rgba(255, 255, 255, 0.08)',
                          borderColor: severity === sev
                            ? sev === 'HIGH'
                              ? 'rgba(239, 68, 68, 0.5)'
                              : sev === 'MEDIUM'
                              ? 'rgba(245, 158, 11, 0.5)'
                              : 'rgba(34, 197, 94, 0.5)'
                            : 'rgba(255, 255, 255, 0.15)',
                          color: severity === sev
                            ? sev === 'HIGH'
                              ? '#fca5a5'
                              : sev === 'MEDIUM'
                              ? '#fcd34d'
                              : '#86efac'
                            : 'rgba(255, 255, 255, 0.6)'
                        }}>
                        <span className="inline-flex items-center gap-1.5">
                          <Circle size={10} fill="currentColor" />
                          {sev === 'LOW' ? 'Low' : sev === 'MEDIUM' ? 'Medium' : 'High'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Details */}
                <div className="flex flex-col gap-3">
                  <label className="text-white/90 text-sm font-bold">Additional Details</label>
                  <textarea 
                    placeholder="Describe when symptoms started, how long they've been occurring, and any other relevant details..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="px-4 py-3 rounded-2xl border text-white text-sm focus:outline-none h-28 resize-none transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      color: 'white'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-2xl border flex items-center gap-3"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      borderColor: 'rgba(239, 68, 68, 0.3)'
                    }}>
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm font-semibold">{error}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  style={{
                    background: submitting
                      ? 'rgba(236, 72, 153, 0.5)'
                      : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}>
                  <span className="inline-flex items-center justify-center gap-2">
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {submitting ? 'Submitting Report...' : 'Report Symptoms Now'}
                  </span>
                </button>

              </form>
            </div>
          </div>

          {/* RIGHT: Recent Reports Sidebar */}
          <div className="rounded-3xl p-6 md:p-8 shadow-lg h-fit"
            style={{
              background: 'linear-gradient(135deg, rgba(221, 240, 255, 0.2) 0%, rgba(186, 226, 230, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(186, 226, 230, 0.3)'
            }}>
            
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <History className="text-cyan-300" size={24} />
              Recent Reports
            </h2>

            {reports && reports.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {reports.slice(0, 10).map((report) => (
                  <div key={report.id} className="rounded-2xl p-4 transition-all hover:shadow-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderLeftWidth: '4px',
                      borderLeftColor: report.severity === 'HIGH'
                        ? 'rgba(239, 68, 68, 0.6)'
                        : report.severity === 'MEDIUM'
                        ? 'rgba(245, 158, 11, 0.6)'
                        : 'rgba(34, 197, 94, 0.6)'
                    }}>
                    
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          report.severity === 'HIGH' 
                            ? 'bg-red-500/20 text-red-300'
                            : report.severity === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {report.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/50 whitespace-nowrap">{formatDate(report.reported_at)}</span>
                    </div>

                    <p className="text-xs text-white font-semibold mb-2 line-clamp-2">
                      {report.symptoms || 'Custom report'}
                    </p>

                    {report.description && (
                      <p className="text-white/60 text-[11px] mb-3 line-clamp-2">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-[10px] font-semibold">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        report.status === 'PENDING' 
                          ? 'bg-amber-500 animate-pulse' 
                          : 'bg-emerald-500'
                      }`} />
                      <span className={report.status === 'PENDING' ? 'text-amber-400' : 'text-emerald-400'}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)'
                }}>
                <AlertCircle className="mx-auto text-white/40 mb-2" size={32} />
                <p className="text-white/60 text-sm">No reports submitted yet</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
