import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Baby, 
  Search, 
  Filter, 
  Download, 
  User, 
  Calendar, 
  ExternalLink,
  Activity,
  ChevronRight,
  UserRound,
  FileText,
  Stethoscope,
  RefreshCw
} from 'lucide-react';
import { pediatricsApi } from '../api';
import { ChildProfile, VaccinationRecord } from '../types';
import { formatDate } from '../utils';

export default function Children() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [dobFrom, setDobFrom] = useState('');
  const [dobTo, setDobTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [profilesRes, vaccinesRes] = await Promise.all([
        pediatricsApi.listProfiles(),
        pediatricsApi.listVaccinations({ page_size: '2000' }),
      ]);
      const data = profilesRes.data;
      setChildren(data.results ?? data);
      setVaccinations(vaccinesRes.data.results ?? vaccinesRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const vaccinationProgress = useMemo(() => {
    const progress: Record<number, { total: number; given: number }> = {};
    vaccinations.forEach((v) => {
      if (!progress[v.child]) {
        progress[v.child] = { total: 0, given: 0 };
      }
      progress[v.child].total += 1;
      if (v.status === 'GIVEN') {
        progress[v.child].given += 1;
      }
    });
    return progress;
  }, [vaccinations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return children.filter((c) => {
      const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase();
      const mother = (c.mother_details?.full_name ?? '').toLowerCase();
      if (q && !(name.includes(q) || mother.includes(q))) return false;
      if (genderFilter && c.gender !== genderFilter) return false;
      if (dobFrom && c.date_of_birth < dobFrom) return false;
      if (dobTo && c.date_of_birth > dobTo) return false;
      return true;
    });
  }, [children, search, genderFilter, dobFrom, dobTo]);

  const exportCsv = () => {
    const header = ['Child Name', 'Mother', 'DOB', 'Gender', 'Birth Weight', 'Vaccination Progress'];
    const rows = filtered.map((c) => {
      const prog = vaccinationProgress[c.id] ?? { given: 0, total: 0 };
      const babyName = `${c.first_name || 'Baby'} ${c.last_name || ''}`.trim();
      return [
        babyName,
        c.mother_details?.full_name || '',
        c.date_of_birth,
        c.gender,
        c.birth_weight_kg || '',
        `${prog.given}/${prog.total}`,
      ];
    });

    const escape = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv = [header, ...rows]
      .map((row) => row.map((v) => escape(String(v))).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'child-profiles.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="flex items-center gap-2">
            <Baby className="text-primary" /> Child Profiles
          </h1>
          <div className="text-muted text-sm mt-1">
             Manage and track pediatric growth and vaccinations.
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      <div className="page-body">
        <div className="card mb-6" style={{ boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.8fr) minmax(180px, 0.7fr) minmax(280px, 1fr)',
              gap: 16,
              alignItems: 'end',
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label flex items-center gap-2">
                <Search size={14} className="text-muted" /> Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Search by baby or mother..."
                  className="form-input pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label flex items-center gap-2">
                <Filter size={14} className="text-muted" /> Gender
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <select
                  className="form-input pl-10"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="">All Genders</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label flex items-center gap-2">
                <Calendar size={14} className="text-muted" /> DOB range
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <input
                  type="date"
                  className="form-input py-1 px-2"
                  value={dobFrom}
                  onChange={(e) => setDobFrom(e.target.value)}
                  aria-label="Date of birth from"
                />
                <span className="text-xs text-muted whitespace-nowrap">to</span>
                <input
                  type="date"
                  className="form-input py-1 px-2"
                  value={dobTo}
                  onChange={(e) => setDobTo(e.target.value)}
                  aria-label="Date of birth to"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? <div className="loading-wrap"><div className="spinner" /></div>
        : filtered.length === 0
        ? (
          <div className="empty-state">
            <div className="empty-icon"><Baby size={48} className="text-muted opacity-20" /></div>
            <div className="empty-title">No child profiles found</div>
            <div className="empty-desc">Try adjusting your search or filters.</div>
          </div>
        ) : (
          <div className="card overflow-hidden p-0" style={{ boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
                  <tr className="uppercase text-[11px] font-bold tracking-wider text-slate-500">
                    <th className="px-6 py-4">Baby Name</th>
                    <th className="px-6 py-4">Mother</th>
                    <th className="px-6 py-4 text-center">DOB</th>
                    <th className="px-6 py-4 text-center">Gender</th>
                    <th className="px-6 py-4 text-center">Birth Weight</th>
                    <th className="px-6 py-4 text-center">Vaccinations</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => {
                    const progress = vaccinationProgress[c.id] ?? { given: 0, total: 0 };
                    return (
                      <tr key={c.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-6 py-4">
                          <div className="font-bold flex items-center gap-2">
                            {c.gender === 'FEMALE' ? <UserRound size={14} className="text-pink-500" /> : <UserRound size={14} className="text-blue-500" />}
                            {c.first_name || 'Baby'} {c.last_name || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link to={`/patients/${c.mother}`} className="flex items-center gap-2 hover:text-primary transition-colors text-sm">
                            <Stethoscope size={14} className="text-primary" /> {c.mother_details?.full_name || '—'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {formatDate(c.date_of_birth)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`badge ${c.gender === 'FEMALE' ? 'badge-purple' : 'badge-primary'} text-[10px]`}>
                            {c.gender}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-sm">
                          {c.birth_weight_kg ? `${c.birth_weight_kg} kg` : '—'}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center gap-2">
                             <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-hosp-green transition-all" 
                                  style={{ width: `${(progress.given / (progress.total || 1)) * 100}%` }} 
                                />
                             </div>
                             <span className="text-[10px] font-bold text-slate-500">{progress.given}/{progress.total}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/children/${c.id}`} className="btn btn-ghost btn-sm flex items-center gap-1 justify-end">
                            View <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
