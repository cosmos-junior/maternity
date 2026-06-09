import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  FileText, 
  Heart, 
  Baby, 
  Stethoscope,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  TestTube,
  Pill,
  Info
} from 'lucide-react';
import { motherApi } from '../api';
import { formatDate } from '../utils';

interface ANCVisit {
  id: number;
  visit_number: number;
  visit_date: string;
  weight_kg: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse_rate: number | null;
  temperature_c: number | null;
  fundal_height_cm: number | null;
  fetal_heart_rate: number | null;
  fetal_presentation: string;
  fetal_presentation_display: string;
  blood_group_confirmed: string;
  blood_group_confirmed_display: string;
  hemoglobin_gdl: number | null;
  anemia_severity: string;
  anemia_severity_display: string;
  blood_sugar_mgdl: number | null;
  blood_sugar_type: string;
  blood_sugar_type_display: string;
  urine_protein: string;
  urine_glucose: string;
  urine_ketones: string;
  hiv_status: string;
  hiv_status_display: string;
  syphilis_status: string;
  syphilis_status_display: string;
  hepatitis_b_surface_ag: string;
  hepatitis_b_surface_ag_display: string;
  rubella_igg: string;
  rubella_igg_display: string;
  ultrasound_results: string;
  complications_noted: string;
  medication_prescribed: string;
  supplements_given: string;
  health_education_given: string;
  general_notes: string;
  remarks: string;
  next_appointment_date: string;
  attending_staff_name: string;
  created_at: string;
  lab_results_summary: string;
}

export default function MotherJourney() {
  const [visits, setVisits] = useState<ANCVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const res = await motherApi.listAncVisits();
      setVisits(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load ANC visit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const handleDownloadPDF = async (visitId: number, visitNumber: number) => {
    try {
      setDownloading(visitId);
      const response = await motherApi.getAncVisitPDF(visitId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ANC_Visit_${visitNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(`/api/v1/clinical/anc-visits/${visitId}/pdf/`, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  const toggleVisit = (visitId: number) => {
    setExpandedVisit(expandedVisit === visitId ? null : visitId);
  };

  const getLabResultStatus = (value: string, normalValues: string[]) => {
    if (normalValues.includes(value)) return 'normal';
    return 'abnormal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !visits.length) {
    return (
      <div className="p-6 text-center">
        <div className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 72px)' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background: `linear-gradient(135deg, rgba(251, 191, 206, 0.08) 0%, rgba(253, 224, 207, 0.08) 50%, rgba(186, 226, 230, 0.08) 100%)`
          }} />
          <div className="relative z-10 p-8 max-w-2xl mx-auto">
            <div className="rounded-3xl p-12 text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(20px)'
              }}>
              <ClipboardList className="mx-auto text-white/40 mb-4" size={48} />
              <h2 className="text-xl font-bold text-white mb-2">No ANC Visits Recorded Yet</h2>
              <p className="text-white/60">
                Your antenatal care visit records will appear here once your healthcare provider completes an ANC consultation.
              </p>
            </div>
          </div>
        </div>
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
        background: `linear-gradient(135deg, rgba(251, 191, 206, 0.08) 0%, rgba(253, 224, 207, 0.08) 50%, rgba(186, 226, 230, 0.08) 100%)`
      }} />

      <div className="relative z-10 p-4 md:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl" 
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.35) 0%, rgba(186, 226, 230, 0.25) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2 flex items-center gap-3">
              <Heart className="text-pink-300 fill-pink-300 animate-pulse" size={32} />
              My ANC Journey
            </h1>
            <p className="text-white/90 drop-shadow text-sm md:text-base">
              Track your antenatal care visits, lab results, and pregnancy progress
            </p>
          </div>
        </div>

        {/* Visit Cards */}
        <div className="space-y-6">
          {visits.map((visit, index) => (
            <div key={visit.id} className="rounded-3xl overflow-hidden shadow-xl transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
              
              {/* Card Header - Always Visible */}
              <div 
                className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleVisit(visit.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(244, 199, 215, 0.2))',
                        border: '1px solid rgba(236, 72, 153, 0.4)'
                      }}>
                      <Baby className="text-pink-300" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-white">
                          ANC Visit {visit.visit_number}
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                          style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#86efac'
                          }}>
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-white/70 text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(visit.visit_date)}
                        </span>
                        {visit.attending_staff_name && (
                          <span className="flex items-center gap-1">
                            <Stethoscope size={14} />
                            {visit.attending_staff_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(visit.id, visit.visit_number);
                      }}
                      disabled={downloading === visit.id}
                      className="p-2 rounded-xl transition-all flex items-center gap-2"
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#a5b4fc'
                      }}
                      title="Download PDF Report"
                    >
                      {downloading === visit.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Download size={16} />
                          <span className="hidden sm:inline text-sm">PDF</span>
                        </>
                      )}
                    </button>
                    {expandedVisit === visit.id ? (
                      <ChevronUp className="text-white/60" size={20} />
                    ) : (
                      <ChevronDown className="text-white/60" size={20} />
                    )}
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {visit.hemoglobin_gdl && (
                    <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Hemoglobin</p>
                      <p className="text-white font-bold">{visit.hemoglobin_gdl} g/dL</p>
                    </div>
                  )}
                  {visit.bp_systolic && visit.bp_diastolic && (
                    <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Blood Pressure</p>
                      <p className="text-white font-bold">{visit.bp_systolic}/{visit.bp_diastolic}</p>
                    </div>
                  )}
                  {visit.blood_sugar_mgdl && (
                    <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Blood Sugar</p>
                      <p className="text-white font-bold">{visit.blood_sugar_mgdl} mg/dL</p>
                    </div>
                  )}
                  {visit.weight_kg && (
                    <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Weight</p>
                      <p className="text-white font-bold">{visit.weight_kg} kg</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedVisit === visit.id && (
                <div className="border-t border-white/10 p-6">
                  {/* Lab Results Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <TestTube className="text-cyan-300" size={20} />
                      Laboratory Results
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Blood Group */}
                      {visit.blood_group_confirmed && (
                        <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Blood Group</p>
                          <p className="text-white font-bold text-lg">{visit.blood_group_confirmed_display}</p>
                        </div>
                      )}
                      
                      {/* Hemoglobin */}
                      {visit.hemoglobin_gdl !== null && (
                        <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Hemoglobin (Anemia Check)</p>
                          <p className="text-white font-bold text-lg">{visit.hemoglobin_gdl} g/dL</p>
                          {visit.anemia_severity_display && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              visit.anemia_severity === 'NORMAL' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {visit.anemia_severity_display}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Blood Sugar */}
                      {visit.blood_sugar_mgdl !== null && (
                        <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Blood Sugar</p>
                          <p className="text-white font-bold text-lg">{visit.blood_sugar_mgdl} mg/dL</p>
                          {visit.blood_sugar_type_display && (
                            <span className="text-xs text-white/50">({visit.blood_sugar_type_display})</span>
                          )}
                        </div>
                      )}
                      
                      {/* Urine Tests */}
                      {(visit.urine_protein !== 'NIL' || visit.urine_glucose !== 'NIL' || visit.urine_ketones !== 'NIL') && (
                        <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Urine Analysis</p>
                          <div className="space-y-1">
                            {visit.urine_protein !== 'NIL' && (
                              <p className="text-white">Protein: <span className="text-amber-300 font-bold">{visit.urine_protein}</span></p>
                            )}
                            {visit.urine_glucose !== 'NIL' && (
                              <p className="text-white">Glucose: <span className="text-amber-300 font-bold">{visit.urine_glucose}</span></p>
                            )}
                            {visit.urine_ketones !== 'NIL' && (
                              <p className="text-white">Ketones: <span className="text-amber-300 font-bold">{visit.urine_ketones}</span></p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* HIV Status */}
                      {visit.hiv_status && (
                        <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">HIV Screening</p>
                          <p className={`font-bold text-lg ${
                            visit.hiv_status === 'NEGATIVE' ? 'text-green-300' : 
                            visit.hiv_status === 'POSITIVE' ? 'text-red-300' : 'text-amber-300'
                          }`}>
                            {visit.hiv_status_display}
                          </p>
                        </div>
                      )}
                      
                      {/* Syphilis Status */}
                      {visit.syphilis_status && (
                        <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Syphilis Screening</p>
                          <p className={`font-bold text-lg ${
                            visit.syphilis_status === 'NON-REACTIVE' ? 'text-green-300' : 
                            visit.syphilis_status === 'REACTIVE' ? 'text-red-300' : 'text-amber-300'
                          }`}>
                            {visit.syphilis_status_display}
                          </p>
                        </div>
                      )}
                      
                      {/* Hepatitis B */}
                      {visit.hepatitis_b_surface_ag && visit.hepatitis_b_surface_ag !== 'NOT_TESTED' && (
                        <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Hepatitis B</p>
                          <p className={`font-bold text-lg ${
                            visit.hepatitis_b_surface_ag === 'NEGATIVE' ? 'text-green-300' : 
                            visit.hepatitis_b_surface_ag === 'POSITIVE' ? 'text-red-300' : 'text-amber-300'
                          }`}>
                            {visit.hepatitis_b_surface_ag_display}
                          </p>
                        </div>
                      )}
                      
                      {/* Rubella */}
                      {visit.rubella_igg && visit.rubella_igg !== 'NOT_TESTED' && (
                        <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Rubella Immunity</p>
                          <p className={`font-bold text-lg ${
                            visit.rubella_igg === 'IMMUNE' ? 'text-green-300' : 
                            visit.rubella_igg === 'NON-IMMUNE' ? 'text-amber-300' : 'text-white'
                          }`}>
                            {visit.rubella_igg_display}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vitals Section */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Heart className="text-pink-300" size={20} />
                      Vital Signs
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {visit.weight_kg && (
                        <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Weight</p>
                          <p className="text-white font-bold">{visit.weight_kg} kg</p>
                        </div>
                      )}
                      {visit.bp_systolic && visit.bp_diastolic && (
                        <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Blood Pressure</p>
                          <p className="text-white font-bold">{visit.bp_systolic}/{visit.bp_diastolic} mmHg</p>
                        </div>
                      )}
                      {visit.pulse_rate && (
                        <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Pulse</p>
                          <p className="text-white font-bold">{visit.pulse_rate} bpm</p>
                        </div>
                      )}
                      {visit.temperature_c && (
                        <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Temperature</p>
                          <p className="text-white font-bold">{visit.temperature_c} °C</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pregnancy Assessment */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Baby className="text-cyan-300" size={20} />
                      Pregnancy Assessment
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {visit.fundal_height_cm && (
                        <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Fundal Height</p>
                          <p className="text-white font-bold">{visit.fundal_height_cm} cm</p>
                        </div>
                      )}
                      {visit.fetal_heart_rate && (
                        <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Fetal Heart Rate</p>
                          <p className="text-white font-bold">{visit.fetal_heart_rate} bpm</p>
                        </div>
                      )}
                      {visit.fetal_presentation && (
                        <div className="rounded-xl p-3" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Fetal Presentation</p>
                          <p className="text-white font-bold">{visit.fetal_presentation_display}</p>
                        </div>
                      )}
                    </div>
                    {visit.ultrasound_results && (
                      <div className="mt-4 rounded-xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                        <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Ultrasound Results</p>
                        <p className="text-white">{visit.ultrasound_results}</p>
                      </div>
                    )}
                  </div>

                  {/* Clinical Management */}
                  {(visit.medication_prescribed || visit.supplements_given || visit.health_education_given || visit.complications_noted) && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Pill className="text-amber-300" size={20} />
                        Clinical Management
                      </h4>
                      <div className="space-y-3">
                        {visit.medication_prescribed && (
                          <div className="rounded-xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Medications</p>
                            <p className="text-white">{visit.medication_prescribed}</p>
                          </div>
                        )}
                        {visit.supplements_given && (
                          <div className="rounded-xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Supplements</p>
                            <p className="text-white">{visit.supplements_given}</p>
                          </div>
                        )}
                        {visit.health_education_given && (
                          <div className="rounded-xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Health Education</p>
                            <p className="text-white">{visit.health_education_given}</p>
                          </div>
                        )}
                        {visit.complications_noted && (
                          <div className="rounded-xl p-4" style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)'}}>
                            <div className="flex items-start gap-2">
                              <AlertCircle className="text-red-300 flex-shrink-0 mt-0.5" size={16} />
                              <div>
                                <p className="text-red-300 text-xs uppercase tracking-wider mb-1">Complications Noted</p>
                                <p className="text-white">{visit.complications_noted}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {(visit.general_notes || visit.remarks) && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="text-white/60" size={20} />
                        Notes
                      </h4>
                      {visit.general_notes && (
                        <div className="rounded-xl p-4" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white">{visit.general_notes}</p>
                        </div>
                      )}
                      {visit.remarks && (
                        <div className="rounded-xl p-4 mt-3" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Remarks</p>
                          <p className="text-white">{visit.remarks}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Appointment */}
                  {visit.next_appointment_date && (
                    <div className="rounded-2xl p-4 flex items-center gap-4"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{background: 'rgba(34, 197, 94, 0.2)'}}>
                        <Clock className="text-green-300" size={20} />
                      </div>
                      <div>
                        <p className="text-white/60 text-xs uppercase tracking-wider">Next Appointment</p>
                        <p className="text-white font-bold">{formatDate(visit.next_appointment_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-8 rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
          <Info className="text-indigo-300 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-white/60 text-sm">
            These records contain your antenatal care visit information including lab results, vital signs, and clinical assessments. 
            Download the PDF report to keep a copy for your records or to share with other healthcare providers.
          </p>
        </div>
      </div>
    </div>
  );
}