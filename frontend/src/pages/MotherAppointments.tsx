import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Activity,
  HeartPulse,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Hourglass,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motherApi } from '../api';
import { Appointment } from '../types';
import { extractListData, formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';

export default function MotherAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ONGOING' | 'PENDING' | 'FINISHED'>('ONGOING');
  
  // Rescheduling Modal State
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await motherApi.appointments();
      setAppointments(extractListData<Appointment>(res.data));
    } catch (err: any) {
      console.error(err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const getStatusGroup = (appt: Appointment) => {
    if (appt.status === 'UPCOMING') return 'ONGOING';
    if (appt.status === 'RESCHEDULED') return 'PENDING';
    return 'FINISHED';
  };

  const filteredAppointments = appointments.filter(appt => getStatusGroup(appt) === activeTab);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt || !newDate) return;

    try {
      setSubmitting(true);
      setError('');
      await motherApi.rescheduleAppointment(selectedAppt.id, newDate, newTime || null, reason);
      setSubmitSuccess('Reschedule request submitted successfully.');
      setTimeout(() => {
        setSelectedAppt(null);
        setSubmitSuccess('');
        setNewDate('');
        setNewTime('');
        setReason('');
        loadAppointments();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit reschedule request. Please try again.');
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

  const formatReferenceDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      const year = date.getFullYear();
      return `${day} ${weekday} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const getAppointmentIcon = (appointmentType: string) => {
    switch (appointmentType) {
      case 'ANC1':
      case 'ANC2':
      case 'ANC3':
      case 'ANC4':
        return <HeartPulse className="text-blue-500" size={40} />;
      case 'POSTNATAL_7DAY':
      case 'POSTNATAL_6WEEK':
        return <ShieldCheck className="text-blue-500" size={40} />;
      default:
        return <Activity className="text-blue-500" size={40} />;
    }
  };

  return (
    <>
      <div className="mother-appointments-container max-w-lg mx-auto py-6 px-4">
        {/* Tab Filters - Text only, centered pill style matching image */}
        <div className="mother-tabs-row flex justify-center items-center gap-6 mb-8 py-2">
          {[
            { key: 'ONGOING', label: 'Ongoing' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'FINISHED', label: 'Finished' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'ONGOING' | 'PENDING' | 'FINISHED')}
              className={`mother-tab-text-btn ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointments List - Single column centered rounded cards */}
        <div className="mother-cards-list flex flex-col items-center gap-6">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(appt => (
              <div
                key={appt.id}
                onClick={() => appt.status === 'UPCOMING' && setSelectedAppt(appt)}
                className="mother-appt-card bg-white dark:bg-[#1A1F4A] rounded-[24px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800/50 flex flex-col items-center text-center cursor-pointer transition-transform active:scale-[0.98]"
              >
                {/* Top Centered Icon */}
                <div className="mother-appt-card-icon mb-4 flex items-center justify-center p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-full">
                  {getAppointmentIcon(appt.appointment_type)}
                </div>

                {/* Title */}
                <h3 className="mother-appt-card-title text-[#0F172A] dark:text-white font-bold text-lg mb-2 leading-snug">
                  {appt.appointment_type.replace(/_/g, ' ')}
                </h3>

                {/* Date */}
                <p className="mother-appt-card-date text-[#64748B] dark:text-slate-400 text-sm font-medium">
                  {formatReferenceDate(appt.scheduled_date)}
                </p>

                {appt.status === 'UPCOMING' && (
                  <span className="text-xs text-blue-500 font-semibold mt-4 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
                    Tap to Reschedule
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-[24px] p-12 text-center bg-white/40 dark:bg-[#1A1F4A]/30 border border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={40} />
              <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1">No appointments found.</p>
              <p className="text-slate-400 dark:text-slate-600 text-sm">Check back later or contact your clinic to schedule a visit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.3) 0%, rgba(253, 224, 207, 0.2) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
            
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-bold text-white mb-2">Request Reschedule</h3>
              <p className="text-white/70 text-sm mb-6">
                Rescheduling {selectedAppt.appointment_type.replace(/_/g, ' ')} appointment. Clinicians will be notified.
              </p>

              {submitSuccess ? (
                <div className="p-4 rounded-2xl border flex items-center gap-3"
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    borderColor: 'rgba(34, 197, 94, 0.3)'
                  }}>
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-400 text-sm font-semibold">{submitSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleRescheduleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-white/90 text-sm font-bold">New Date</label>
                    <input 
                      type="date" 
                      required
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-white/90 text-sm font-bold">Preferred Time (Optional)</label>
                    <input 
                      type="time" 
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-white/90 text-sm font-bold">Reason</label>
                    <textarea 
                      placeholder="e.g. Work conflict, feeling unwell..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none h-24 resize-none transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl border flex items-center gap-2 text-sm"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5'
                      }}>
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedAppt(null);
                        setError('');
                      }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.8)'
                      }}>
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                      style={{
                        background: submitting
                          ? 'rgba(236, 72, 153, 0.5)'
                          : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                        color: 'white',
                        cursor: submitting ? 'not-allowed' : 'pointer'
                      }}>
                      <span className="inline-flex items-center justify-center gap-2">
                        {submitting && <Loader2 size={16} className="animate-spin" />}
                        {submitting ? 'Submitting...' : 'Submit Request'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
