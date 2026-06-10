import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Baby, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  Droplets,
  Activity,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { motherApi } from '../api';
import { MotherPregnancyTrackingData } from '../types';
import { formatDate } from '../utils';
import { motherPortalImages } from '../utils/motherImages';

// Compute the trimester at a given visit date, based on the mother's LMP.
function getTrimesterAtDate(lmpIso: string, visitDateIso: string): 'First' | 'Second' | 'Third' {
  if (!lmpIso || !visitDateIso) return 'First';
  const lmp = new Date(lmpIso).getTime();
  const visit = new Date(visitDateIso).getTime();
  const days = (visit - lmp) / (1000 * 60 * 60 * 24);
  const weeks = days / 7;
  if (weeks <= 13) return 'First';
  if (weeks <= 27) return 'Second';
  return 'Third';
}

export default function MotherPregnancy() {
  const [data, setData] = useState<MotherPregnancyTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPregnancyData = async () => {
    try {
      setLoading(true);
      const res = await motherApi.pregnancyTracking();
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load pregnancy journey data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPregnancyData();
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

  const { weeks_pregnant, edd, lmp, trimester_info, milestones, anc_visits } = data;

  // Calculate days remaining
  const daysRemaining = edd ? Math.ceil((new Date(edd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const progressPercent = weeks_pregnant ? (weeks_pregnant / 40) * 100 : 0;

  // Baby size comparisons by week
  const babySizeComparisons: { [key: number]: { size: string; length: string; weight: string } } = {
    8: { size: 'Raspberry', length: '1.6 cm', weight: '1 g' },
    12: { size: 'Plum', length: '6.1 cm', weight: '14 g' },
    16: { size: 'Avocado', length: '11.6 cm', weight: '100 g' },
    20: { size: 'Banana', length: '16.4 cm', weight: '300 g' },
    24: { size: 'Corn', length: '21 cm', weight: '600 g' },
    28: { size: 'Eggplant', length: '25 cm', weight: '1 kg' },
    32: { size: 'Squash', length: '29 cm', weight: '1.7 kg' },
    36: { size: 'Romaine Lettuce', length: '33 cm', weight: '2.6 kg' },
    40: { size: 'Watermelon', length: '36 cm', weight: '3.5 kg' }
  };

  const closestWeek = Object.keys(babySizeComparisons)
    .map(Number)
    .reduce((prev, curr) => 
      Math.abs(curr - (weeks_pregnant || 0)) < Math.abs(prev - (weeks_pregnant || 0)) ? curr : prev
    );
  const babyInfo = babySizeComparisons[closestWeek] || { size: 'Growing', length: 'TBD', weight: 'TBD' };

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

      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto">
        {/* HERO SECTION */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl" 
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.4) 0%, rgba(253, 224, 207, 0.3) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
          <div className="relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div style={{
                backgroundImage: `url(${motherPortalImages.pregnancy})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.7) saturate(1.2)',
                opacity: 0.6
              }} className="absolute inset-0" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full">
              {/* Top Section */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                {/* Left: Week & Days Info */}
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg">{weeks_pregnant || '—'}</span>
                    <span className="text-xl text-white/90 drop-shadow-lg">weeks</span>
                  </div>
                  <p className="text-white/80 drop-shadow text-sm">of 40-week pregnancy</p>
                </div>

                {/* Center: Trimester Badge */}
                <div className="px-6 py-3 rounded-full"
                  style={{
                    background: 'rgba(236, 72, 153, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(236, 72, 153, 0.5)'
                  }}>
                  <span className="font-bold text-white">{trimester_info || 'Trimester Info'}</span>
                </div>

                {/* Right: Days Remaining */}
                <div className="text-right">
                  <div className="text-3xl md:text-4xl font-extrabold text-pink-300 drop-shadow-lg">{daysRemaining}</div>
                  <p className="text-white/80 drop-shadow text-sm">days until EDD</p>
                </div>
              </div>

              {/* Bottom Section: Baby Size */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-white/70 text-xs uppercase tracking-widest mb-3 drop-shadow">Your baby is about the size of</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-white drop-shadow-lg">{babyInfo.size}</h3>
                    <div className="flex gap-6 mt-2 text-sm">
                      <div>
                        <p className="text-white/70 text-xs uppercase tracking-widest">Length</p>
                        <p className="text-white font-semibold">{babyInfo.length}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs uppercase tracking-widest">Weight</p>
                        <p className="text-white font-semibold">{babyInfo.weight}</p>
                      </div>
                    </div>
                  </div>
                  <Baby className="text-pink-200" size={48} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PREGNANCY PROGRESS CARD */}
        <div className="mb-8 rounded-3xl p-6 md:p-8 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(244, 199, 215, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(236, 72, 153, 0.3)'
          }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Pregnancy Progress</h2>
            <span className="text-2xl font-extrabold text-pink-300">{Math.round(progressPercent)}%</span>
          </div>
          
          {/* Large Progress Bar */}
          <div className="relative h-8 rounded-full overflow-hidden mb-4"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)',
                boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)'
              }}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Week {Math.floor(progressPercent / 2.5)}</span>
            <span className="text-white/70">Week 40</span>
          </div>
        </div>

        {/* TWO COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* BABY DEVELOPMENT CARD */}
          <div className="rounded-3xl p-6 md:p-8 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.25) 0%, rgba(254, 240, 214, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Baby className="text-pink-300" size={24} />
              Baby Development
            </h2>
            
            {/* Placeholder Image Area */}
            <div className="relative mb-4 aspect-square rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.3) 0%, rgba(253, 224, 207, 0.2) 100%)',
                border: '2px dashed rgba(255, 255, 255, 0.2)'
              }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Baby className="mx-auto text-white/40 mb-2" size={40} />
                  <p className="text-white/50 text-sm">Baby Photo</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl p-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                <p className="text-white/70 text-xs mb-1 uppercase tracking-widest">Length</p>
                <p className="text-white font-bold text-lg">{babyInfo.length}</p>
              </div>
              <div className="rounded-xl p-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                <p className="text-white/70 text-xs mb-1 uppercase tracking-widest">Weight</p>
                <p className="text-white font-bold text-lg">{babyInfo.weight}</p>
              </div>
              <div className="rounded-xl p-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                <p className="text-white/70 text-xs mb-1 uppercase tracking-widest">Week</p>
                <p className="text-white font-bold text-lg">{closestWeek}</p>
              </div>
            </div>

            <p className="text-white/70 text-sm mt-4 leading-relaxed">
              Your baby is developing beautifully. All systems are forming and growing stronger each day.
            </p>
          </div>

          {/* QUICK STATS CARD */}
          <div className="rounded-3xl p-6 md:p-8 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(186, 226, 230, 0.2) 0%, rgba(221, 240, 255, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(186, 226, 230, 0.3)'
            }}>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="text-cyan-300" size={24} />
              Key Dates
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Last Menstrual Period</p>
                <p className="text-white font-bold text-lg">{formatDate(lmp)}</p>
              </div>

              <div className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Expected Delivery Date</p>
                <p className="text-pink-300 font-bold text-lg">{formatDate(edd)}</p>
              </div>

              <div className="text-center py-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.1) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.3)'
                }}>
                <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Time to Meet Baby</p>
                <p className="text-2xl font-bold text-pink-300">{Math.max(0, daysRemaining)} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* JOURNEY TIMELINE - VERTICAL MOBILE-FIRST */}
        <div className="mb-8 rounded-3xl p-6 md:p-8 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.2) 0%, rgba(221, 240, 255, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="text-pink-300" size={24} />
            Pregnancy Journey
          </h2>

          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-6 md:left-1/2 top-8 bottom-0 w-0.5 bg-gradient-to-b from-pink-400/50 to-cyan-400/50" />

            {/* Timeline Items */}
            <div className="space-y-6">
              {milestones.slice(0, 5).map((milestone, i) => (
                <div key={milestone.id} className="relative pl-20 md:pl-0">
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 md:left-1/2 top-0 w-12 h-12 rounded-full flex items-center justify-center md:-ml-6 transition-transform ${
                    milestone.completed 
                      ? 'scale-100' 
                      : 'scale-75'
                  }`}
                    style={{
                      background: milestone.completed 
                        ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: milestone.completed 
                        ? '2px solid rgba(255, 255, 255, 0.5)'
                        : '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                    {milestone.completed ? (
                      <CheckCircle2 size={24} className="text-white" />
                    ) : (
                      <Circle size={20} className="text-white/50" />
                    )}
                  </div>

                  {/* Timeline Content */}
                  <div className={`md:w-1/2 ${i % 2 === 0 ? 'md:ml-auto md:pr-12 text-left md:text-right' : 'md:pr-auto md:pl-12 text-left'}`}>
                    <div className="rounded-2xl p-4"
                      style={{
                        background: milestone.completed
                          ? 'rgba(236, 72, 153, 0.15)'
                          : 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                      <h3 className={`font-bold mb-1 ${milestone.completed ? 'text-white' : 'text-white/70'}`}>
                        {milestone.name}
                      </h3>
                      {milestone.date && (
                        <p className="text-sm text-white/60">
                          {formatDate(milestone.date)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ANC VISITS - RESPONSIVE CARDS */}
        <div className="rounded-3xl p-6 md:p-8 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(221, 240, 255, 0.2) 0%, rgba(186, 226, 230, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(186, 226, 230, 0.3)'
          }}>
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-cyan-300" size={24} />
            Antenatal Care Visits
          </h2>

          {anc_visits && anc_visits.length > 0 ? (
            <div className="space-y-4">
              {anc_visits.map((visit) => (
                <div key={visit.id} className="rounded-2xl p-4 md:p-5 transition-all hover:shadow-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer'
                  }}>
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">Trimester: {getTrimesterAtDate(lmp, visit.visit_date)}</h3>
                      <p className="text-white/60 text-sm">{formatDate(visit.visit_date)}</p>
                    </div>
                    <ChevronRight className="text-white/40 flex-shrink-0" size={20} />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg p-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Weight</p>
                      <p className="text-white font-semibold">{visit.weight_kg ? `${visit.weight_kg} kg` : '—'}</p>
                    </div>

                    <div className="rounded-lg p-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">BP</p>
                      <p className="text-white font-semibold">
                        {visit.bp_systolic && visit.bp_diastolic ? `${visit.bp_systolic}/${visit.bp_diastolic}` : '—'}
                      </p>
                    </div>

                    <div className="rounded-lg p-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">FH</p>
                      <p className="text-white font-semibold">{visit.fundal_height_cm ? `${visit.fundal_height_cm} cm` : '—'}</p>
                    </div>

                    <div className="rounded-lg p-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">FHR</p>
                      <p className="text-white font-semibold">{visit.fetal_heart_rate ? `${visit.fetal_heart_rate} bpm` : '—'}</p>
                    </div>
                  </div>

                  {/* Remarks */}
                  {visit.remarks && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-white/70 text-sm italic">{visit.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px dashed rgba(255, 255, 255, 0.2)'
              }}>
              <Calendar className="mx-auto text-white/40 mb-2" size={32} />
              <p className="text-white/60">No antenatal care visits logged yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
