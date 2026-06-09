import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Calendar, 
  Baby, 
  ShieldAlert, 
  MessageSquare, 
  AlertTriangle, 
  AlertCircle, 
  Phone, 
  Clock, 
  Info,
  CalendarDays,
  Ambulance,
  Building2,
  Stethoscope,
  CheckCheck
} from 'lucide-react';
import { motherApi } from '../api';
import { MotherDashboardData } from '../types';
import { formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';

export default function MotherDashboard() {
  const [data, setData] = useState<MotherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await motherApi.dashboard();
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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
        <AlertTriangle size={32} className="mx-auto mb-2" />
        <p>{error || 'No data available.'}</p>
      </div>
    );
  }

  const {
    pregnancy_status,
    gestational_age_weeks,
    expected_delivery_date,
    trimester,
    next_appointment,
    upcoming_vaccines,
    unread_messages_count,
    care_alerts,
    risk_level
  } = data;

  const handleMarkCareAlertRead = async (id: number) => {
    try {
      await motherApi.markCareAlertRead(id);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

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

      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl" 
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.35) 0%, rgba(253, 224, 207, 0.25) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
          <div className="relative overflow-hidden p-6 md:p-8">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div style={{
                backgroundImage: `url(${motherPortalImages.dashboard})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.6) saturate(1.1)',
                opacity: 0.4
              }} className="absolute inset-0" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2 flex items-center gap-2">
                  Your Pregnancy Journey <Heart className="text-pink-300 fill-pink-300 animate-pulse" size={28} />
                </h1>
                <p className="text-white/90 drop-shadow text-sm md:text-base">
                  Real-time health monitoring and care insights for you and your baby
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                {unread_messages_count > 0 && (
                  <div className="px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2"
                    style={{
                      background: 'rgba(99, 102, 241, 0.3)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(99, 102, 241, 0.5)',
                      color: 'white'
                    }}>
                    <MessageSquare size={16} />
                    {unread_messages_count} Unread
                  </div>
                )}
                <div className="px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2"
                  style={{
                    background: risk_level === 'HIGH'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : risk_level === 'MEDIUM'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(34, 197, 94, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: risk_level === 'HIGH'
                      ? '1px solid rgba(239, 68, 68, 0.5)'
                      : risk_level === 'MEDIUM'
                      ? '1px solid rgba(245, 158, 11, 0.5)'
                      : '1px solid rgba(34, 197, 94, 0.5)',
                    color: risk_level === 'HIGH'
                      ? '#fca5a5'
                      : risk_level === 'MEDIUM'
                      ? '#fcd34d'
                      : '#86efac'
                  }}>
                  <div className="w-2 h-2 rounded-full bg-current" />
                  {risk_level} RISK
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Stats Cards (2 columns) */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Gestational Age */}
            <div className="rounded-3xl p-6 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(244, 199, 215, 0.15) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                transition: 'all 0.3s ease'
              }}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-white/70 text-xs uppercase tracking-widest">Gestational Age</span>
                <div className="p-2.5 rounded-2xl" style={{background: 'rgba(236, 72, 153, 0.2)'}}>
                  <Baby className="text-pink-300" size={20} />
                </div>
              </div>
              <h2 className="text-5xl font-extrabold text-white mb-2">{gestational_age_weeks}</h2>
              <p className="text-white/70 text-sm">
                Weeks • <span className="text-pink-300 font-semibold">{trimester || 'Postnatal'}</span>
              </p>
            </div>

            {/* Expected Delivery Date */}
            <div className="rounded-3xl p-6 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(165, 180, 252, 0.15) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                transition: 'all 0.3s ease'
              }}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-white/70 text-xs uppercase tracking-widest">Expected Delivery</span>
                <div className="p-2.5 rounded-2xl" style={{background: 'rgba(99, 102, 241, 0.2)'}}>
                  <CalendarDays className="text-indigo-300" size={20} />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2">{formatDate(expected_delivery_date)}</h2>
              <p className="text-white/70 text-sm">{pregnancy_status}</p>
            </div>

            {/* Next Appointment */}
            <div className="md:col-span-2 rounded-3xl p-6 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(165, 243, 252, 0.15) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                transition: 'all 0.3s ease'
              }}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-white/70 text-xs uppercase tracking-widest">Next Appointment</span>
                <div className="p-2.5 rounded-2xl" style={{background: 'rgba(34, 211, 238, 0.2)'}}>
                  <Calendar className="text-cyan-300" size={20} />
                </div>
              </div>
              {next_appointment ? (
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{next_appointment.appointment_type}</h3>
                  <p className="text-cyan-300 font-semibold text-sm mb-2">
                    {formatDate(next_appointment.scheduled_date)} at {next_appointment.scheduled_time || 'TBD'}
                  </p>
                  <p className="text-white/60 text-xs italic">
                    {next_appointment.notes || 'No notes from clinician'}
                  </p>
                </div>
              ) : (
                <p className="text-white/60 text-sm flex items-center gap-2">
                  <Info size={16} /> No upcoming appointments scheduled
                </p>
              )}
            </div>
          </div>

          {/* Emergency Sidebar */}
          <div className="rounded-3xl p-6 shadow-lg h-fit"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(248, 113, 113, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
            <h2 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2">
              <ShieldAlert size={20} /> Emergency
            </h2>
            <p className="text-white/70 text-xs mb-6 leading-relaxed">
              If you experience severe bleeding, headaches, vision loss, or high fever, call immediately.
            </p>
            <div className="space-y-3">
              <a href="tel:999" className="flex items-center justify-between p-3.5 rounded-2xl transition-all"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5'
                }}>
                <span className="font-bold text-sm flex items-center gap-2">
                  <Ambulance size={16} /> Ambulance Dispatch
                </span>
                <Phone size={16} className="animate-pulse" />
              </a>
              <a href="tel:+254700000000" className="flex items-center justify-between p-3.5 rounded-2xl transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                <span className="font-semibold text-white text-sm flex items-center gap-2">
                  <Building2 size={16} /> Hospital Hotline
                </span>
                <Phone size={16} className="text-white/60" />
              </a>
              <a href="tel:+254711111111" className="flex items-center justify-between p-3.5 rounded-2xl transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                <span className="font-semibold text-white text-sm flex items-center gap-2">
                  <Baby size={16} /> Maternity Ward
                </span>
                <Phone size={16} className="text-white/60" />
              </a>
            </div>
          </div>
        </div>

        {/* Alerts & Vaccines Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Alerts */}
          <div className="rounded-3xl p-6 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.2) 0%, rgba(244, 199, 215, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(251, 191, 206, 0.3)'
            }}>
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <AlertCircle className="text-pink-300" size={20} />
              Important Alerts
            </h2>
            {care_alerts && care_alerts.length > 0 ? (
              <div className="space-y-3">
                {care_alerts.map(alert => (
                  <div key={alert.id} className="p-4 rounded-2xl flex gap-3 items-start"
                    style={{
                      background: alert.is_read
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(239, 68, 68, 0.15)',
                      border: alert.is_read
                        ? '1px solid rgba(255, 255, 255, 0.15)'
                        : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                    <Stethoscope className={`shrink-0 mt-0.5 ${alert.is_read ? 'text-white/50' : 'text-red-300'}`} size={16} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                        <span>{alert.sender_name || 'Care Team'}</span>
                        {!alert.is_read && (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5' }}>
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-white/80 text-sm mt-2 leading-relaxed">{alert.message}</p>
                      <p className="text-white/45 text-[11px] mt-2">{formatDate(alert.created_at)}</p>
                    </div>
                    {!alert.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkCareAlertRead(alert.id)}
                        className="shrink-0 p-2 rounded-xl"
                        style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                        title="Mark as read"
                      >
                        <CheckCheck size={16} className="text-white/70" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/60 text-sm flex items-center gap-2 py-4">
                <Info size={16} /> No messages from your care team at this time
              </div>
            )}
          </div>

          {/* Vaccines */}
          <div className="rounded-3xl p-6 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(186, 226, 230, 0.2) 0%, rgba(221, 240, 255, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(186, 226, 230, 0.3)'
            }}>
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Clock className="text-cyan-300" size={20} />
              Recommended Vaccines
            </h2>
            {upcoming_vaccines && upcoming_vaccines.length > 0 ? (
              <div className="space-y-3">
                {upcoming_vaccines.map((vac, i) => (
                  <div key={i} className="p-4 rounded-2xl flex justify-between items-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}>
                    <div>
                      <div className="text-sm font-bold text-white">{vac.vaccine_name}</div>
                      <div className="text-xs text-white/60 mt-0.5">
                        Target: <span className="text-pink-300 font-semibold">{vac.target}</span>
                        {vac.recommended_week && ` • Week ${vac.recommended_week}`}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      vac.status === 'OVERDUE'
                        ? 'bg-red-500/20 text-red-300'
                        : vac.status === 'DUE'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {vac.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/60 text-sm flex items-center gap-2 py-4">
                <Info size={16} /> No vaccination schedule found
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
