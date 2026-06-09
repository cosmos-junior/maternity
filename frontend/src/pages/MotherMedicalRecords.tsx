import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Stethoscope, 
  Info,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { motherApi } from '../api';
import { MotherMedicalRecordsData } from '../types';
import { formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';

export default function MotherMedicalRecords() {
  const [data, setData] = useState<MotherMedicalRecordsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await motherApi.medicalRecords();
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error || 'No data available.'}</p>
      </div>
    );
  }

  const { demographics_and_history, clinical_notes, uploaded_documents } = data;

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
        {/* Header */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl" 
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.35) 0%, rgba(186, 226, 230, 0.25) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
          <div className="relative overflow-hidden p-6 md:p-8">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div style={{
                backgroundImage: `url(${motherPortalImages.records})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.6) saturate(1.1)',
                opacity: 0.4
              }} className="absolute inset-0" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2">Medical Records</h1>
                <p className="text-white/90 drop-shadow text-sm md:text-base">Your complete health profile and clinical documentation</p>
              </div>
              <div className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap"
                style={{
                  background: 'rgba(34, 197, 94, 0.3)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  color: '#86efac'
                }}>
                <ShieldCheck size={16} />
                Secure
              </div>
            </div>
          </div>
        </div>

        {/* Demographics Summary */}
        <div className="mb-8 rounded-3xl p-6 md:p-8 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(186, 226, 230, 0.2) 0%, rgba(221, 240, 255, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(186, 226, 230, 0.3)'
          }}>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <User className="text-cyan-300" size={24} />
            Patient Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)'}}>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Full Name</p>
              <p className="text-white font-bold">{demographics_and_history.full_name}</p>
            </div>
            <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)'}}>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Patient Number</p>
              <p className="text-white font-bold">{demographics_and_history.patient_number}</p>
            </div>
            <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)'}}>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Blood Group</p>
              <p className="text-white font-bold">{demographics_and_history.blood_group}</p>
            </div>
            <div className="rounded-2xl p-4 lg:col-span-2" style={{background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)'}}>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Next of Kin</p>
              <p className="text-white font-bold">
                {demographics_and_history.next_of_kin_name} • {demographics_and_history.next_of_kin_phone}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)'}}>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-2">LMP Date</p>
              <p className="text-white font-bold">{formatDate(demographics_and_history.lmp)}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Clinical Notes */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Stethoscope className="text-pink-300" size={24} />
              Clinical Notes & Consultations
            </h2>
            {clinical_notes && clinical_notes.length > 0 ? (
              clinical_notes.map((note) => (
                <div key={note.id} className="rounded-3xl p-6 shadow-lg transition-all hover:shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.2) 0%, rgba(244, 199, 215, 0.15) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(251, 191, 206, 0.3)'
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{
                        background: 'rgba(236, 72, 153, 0.2)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        color: '#f472b6'
                      }}>
                      {note.category}
                    </span>
                    <span className="text-xs text-white/60 flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{note.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl p-12 text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)'
                }}>
                <Stethoscope className="mx-auto text-white/40 mb-3" size={32} />
                <p className="text-white/60">No clinical notes recorded yet</p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="rounded-3xl p-6 md:p-8 shadow-lg h-fit"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(165, 243, 252, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(34, 211, 238, 0.3)'
            }}>
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <FileText className="text-cyan-300" size={24} />
              Documents
            </h2>
            {uploaded_documents && uploaded_documents.length > 0 ? (
              <div className="space-y-3">
                {uploaded_documents.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-2xl flex items-center justify-between transition-all hover:shadow-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer'
                    }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate" title={doc.title}>
                        <FileText size={14} className="inline mr-1.5" />
                        {doc.title}
                      </div>
                      <div className="text-xs text-white/60 mt-1 uppercase tracking-wider">
                        {doc.document_type}
                      </div>
                    </div>
                    <a 
                      href={doc.file} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2 rounded-lg transition-all ml-2 flex-shrink-0"
                      style={{
                        background: 'rgba(236, 72, 153, 0.2)',
                        color: '#f472b6',
                        border: '1px solid rgba(236, 72, 153, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 72, 153, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)';
                      }}>
                      <Download size={16} />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl p-8 text-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)'
                }}>
                <FileText className="mx-auto text-white/40 mb-2" size={28} />
                <p className="text-white/60 text-sm">No documents uploaded</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
