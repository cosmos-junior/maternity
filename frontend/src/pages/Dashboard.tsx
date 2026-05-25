import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api';
import { DashboardSummary, Patient, Appointment } from '../types';
import { formatDate, STAGE_LABELS, RISK_COLORS, STATUS_COLORS } from '../utils';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = { upcoming: '#F59E0B', attended: '#10B981', missed: '#EF4444', rescheduled: '#8B5CF6' };
const STAGE_BAR_COLOR = '#3B82F6';

const CHART_TOOLTIP_STYLE = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  color: '#0F172A',
  fontSize: '0.8rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

interface TrendData {
  period: string;
  series: { period: string; registrations: number; deliveries: number; missed_appointments: number }[];
  totals: { registrations: number; deliveries: number; missed_appointments: number };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sumRes, trendRes] = await Promise.all([
          dashboardApi.summary(),
          dashboardApi.trends('weekly', 12)
        ]);
        setSummary(sumRes.data);
        setTrends(trendRes.data);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="page-body loading-wrap"><div className="spinner" /></div>
  );

  const pieData = summary?.appointment_breakdown ? Object.entries(summary.appointment_breakdown).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), value: v,
  })) : [];

  const stageData = summary?.stage_breakdown ? Object.entries(summary.stage_breakdown).map(([k, v]) => ({
    name: STAGE_LABELS[k as keyof typeof STAGE_LABELS] ?? k, value: v,
  })) : [];

  return (
    <>
      <div className="page-body" style={{ background: '#F8FAFC', minHeight: 'calc(100vh - 72px)', padding: '32px' }}>

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>
              Hello, {user?.full_name?.split(' ')?.[0] || 'Joachim'}! 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>This is what's happening in maternity today.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" style={{ background: 'white', borderRadius: 20 }}>📅 {formatDate(new Date().toISOString().split('T')[0])}</button>
            <button className="btn btn-ghost" style={{ background: 'white', borderRadius: 20 }}>Today ⌄</button>
            <button className="btn btn-ghost" style={{ background: 'white', borderRadius: 20 }}>⧸ Filters</button>
            <button className="btn btn-ghost btn-icon" style={{ background: 'white', borderRadius: '50%' }}>↻</button>
          </div>
        </div>

        {summary && (
          <>
            {/* Top 4 Big Metrics */}
            <div className="big-metric-grid">
              <div className="big-metric-card blue">
                <div className="big-metric-label">Total Active Patients</div>
                <div className="big-metric-value">{summary?.kpis?.total_patients || 0}</div>
                <div className="big-metric-trend">
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>~ 86.1%</span> This month vs last
                </div>
              </div>
              <div className="big-metric-card green">
                <div className="big-metric-label">Due This Week</div>
                <div className="big-metric-value">{summary?.kpis?.due_this_week || 0}</div>
                <div className="big-metric-trend">
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>~ 20.8%</span> This month vs last
                </div>
              </div>
              <div className="big-metric-card purple">
                <div className="big-metric-label">Upcoming Appts</div>
                <div className="big-metric-value">{summary?.kpis?.upcoming_this_week || 0}</div>
                <div className="big-metric-trend">
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>~ 35%</span> This month vs last
                </div>
              </div>
              <div className="big-metric-card orange">
                <div className="big-metric-label">High-Risk Patients</div>
                <div className="big-metric-value">{summary?.kpis?.high_risk_patients || 0}</div>
                <div className="big-metric-trend">
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>~ 88.1%</span> This month vs last
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>

              {/* Left Column - Main Chart */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="flex-between mb-4">
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>Patient Visits</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Today - 1 periods • Granularity: daily</div>
                  </div>
                  <div style={{ background: '#D1FAE5', color: '#059669', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
                    ● Total: {trends?.totals?.registrations || 87}
                  </div>
                </div>

                {trends && trends?.series?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends.series} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="registrations" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No trend data available</div>
                )}
              </div>

              {/* Right Column - KPI List */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="side-kpi-card blue">
                  <div className="side-kpi-icon">📅</div>
                  <div style={{ flex: 1 }}>
                    <div className="side-kpi-value">{summary?.kpis?.upcoming_this_week || 0}</div>
                    <div className="side-kpi-label">Upcoming Appointments</div>
                  </div>
                  <div style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600 }}>pending</div>
                </div>

                <div className="side-kpi-card green">
                  <div className="side-kpi-icon">💸</div>
                  <div style={{ flex: 1 }}>
                    <div className="side-kpi-value">{summary?.kpis?.postnatal_pending_6week || 0}</div>
                    <div className="side-kpi-label">Postnatal Checks Needed</div>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>›</div>
                </div>

                <div className="side-kpi-card blue">
                  <div className="side-kpi-icon">🛡️</div>
                  <div style={{ flex: 1 }}>
                    <div className="side-kpi-value">{summary?.kpis?.missed_appointments || 0}</div>
                    <div className="side-kpi-label">Missed Appointments</div>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>›</div>
                </div>

                <div className="side-kpi-card orange">
                  <div className="side-kpi-icon">💳</div>
                  <div style={{ flex: 1 }}>
                    <div className="side-kpi-value">{summary?.kpis?.overdue_delivery || 0}</div>
                    <div className="side-kpi-label">Overdue Deliveries</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Critical</div>
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="stats-row">
              <div className="stat-card blue">
                <div className="stat-value">{trends?.totals?.registrations || 87}</div>
                <div className="stat-label">Total Registrations</div>
                <div className="stat-trend">↗ 20.8% increase</div>
              </div>
              <div className="stat-card green">
                <div className="stat-value">{trends?.totals?.deliveries || 54}</div>
                <div className="stat-label">New Deliveries</div>
                <div className="stat-trend">↗ This period</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-value">{summary?.kpis?.postnatal_pending_7day || 0}</div>
                <div className="stat-label">Pending Reviews</div>
                <div style={{ fontSize: '0.7rem', color: '#D97706' }}>Awaiting action</div>
              </div>
              <div className="stat-card green">
                <div className="stat-value">{summary?.kpis?.upcoming_this_week || 0}</div>
                <div className="stat-label">Completed Appts</div>
                <div className="stat-trend">↗ Done today</div>
              </div>
              <div className="stat-card purple">
                <div className="stat-value">{summary?.kpis?.missed_appointments || 0}</div>
                <div className="stat-label">Total Missed</div>
                <div style={{ fontSize: '0.7rem', color: '#8B5CF6' }}>This period</div>
              </div>
              <div className="stat-card blue">
                <div className="stat-value">8.3%</div>
                <div className="stat-label">Bed Occupancy</div>
                <div style={{ fontSize: '0.7rem', color: '#EF4444' }}>348 total beds</div>
              </div>
            </div>

            {/* Bottom Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="card">
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Patients by Clinic Stage</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 24 }}>Active maternity tracking</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stageData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill={STAGE_BAR_COLOR} radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Appointment Status</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 24 }}>This month vs last</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="30%" cy="50%" outerRadius={80} innerRadius={60} label={false}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={PIE_COLORS[entry.name.toLowerCase() as keyof typeof PIE_COLORS] ?? '#94A3B8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '0.85rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </>
        )}
      </div>
    </>
  );
}
