import { useState, useMemo, ReactNode, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Baby,
  Stethoscope,
  Folder,
  Hospital,
  MessageSquare,
  AlertCircle,
  UserCog,
  FileText,
  Search,
  Menu,
  ChevronUp,
  Activity,
  HeartPulse,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate } from '../utils';
import AlertBanner from './AlertBanner';
import OfflineBanner from './OfflineBanner';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import ProfileOnboardingModal from './ProfileOnboardingModal';

interface NavItem { to: string; icon: ReactNode; label: string; roles?: string[] }

interface NavSection {
  label: string;
  roles?: string[];
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'DASHBOARD',
    items: [
      { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    ]
  },
  {
    label: 'RECEPTION',
    items: [
      { to: '/patients', icon: <Users size={18} />, label: 'Patients Management' },
      { to: '/appointments', icon: <Calendar size={18} />, label: 'Appointments' },
    ]
  },
  {
    label: 'OUTPATIENT',
    items: [
      { to: '/children', icon: <Baby size={18} />, label: 'Child Profiles' },
      { to: '/postnatal', icon: <Activity size={18} />, label: 'Postnatal' },
      { to: '/clinical-notes', icon: <Stethoscope size={18} />, label: 'Clinical Notes' },
      { to: '/documents', icon: <Folder size={18} />, label: 'Documents' },
      { to: '/procedures', icon: <Hospital size={18} />, label: 'Procedures' },
    ]
  },
  {
    label: 'SYSTEM',
    roles: ['ADMIN', 'NURSE'],
    items: [
      { to: '/reminders', icon: <MessageSquare size={18} />, label: 'SMS Reminders', roles: ['ADMIN', 'NURSE'] },
      { to: '/alerts', icon: <AlertCircle size={18} />, label: 'Clinical Alerts' },
      { to: '/admin/users', icon: <UserCog size={18} />, label: 'User Management', roles: ['ADMIN'] },
      { to: '/admin/audit', icon: <FileText size={18} />, label: 'Audit Trail', roles: ['ADMIN'] },
    ]
  }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding modal only if profile is not completed
  useEffect(() => {
    if (user && !user.profile_completed) {
      // Small delay to ensure page has rendered
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    } else {
      // Hide modal if profile becomes completed
      setShowOnboarding(false);
    }
  }, [user?.profile_completed, user?.id]);

  const userRole = user?.role ?? '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="layout">
      {/* ── Mobile Backdrop ── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{ background: 'var(--bg-card)', padding: '6px', borderRadius: '8px', color: '#3B82F6' }}>
              <HeartPulse size={20} />
            </div>
            <div className="logo-text" style={{ fontSize: '0.75rem', lineHeight: '1.2', maxWidth: '140px', color: 'var(--text-primary)', fontWeight: 700 }}>
              ITIERIO MATERNITY AND NURSING HOME
            </div>
          </div>
        </div>

        {/* Search menu */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search menu..." style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--text-primary)' }} />
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            if (section.roles && !section.roles.includes(userRole)) return null;
            const visibleItems = section.items.filter(item => !item.roles || item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} style={{ marginBottom: 16 }}>
                <div className="nav-section-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderOpen size={12} /> {section.label}
                </div>
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="user-card cursor-pointer" style={{ marginBottom: 10, background: 'transparent', padding: '0 8px' }} onClick={() => setShowProfile(true)}>
            <div className="user-avatar" style={{ background: '#3B82F6', width: 40, height: 40 }}>{initials}</div>
            <div className="user-info">
              <div className="user-name" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user?.full_name || 'Joachim Odhaimbo'}</div>
              <div className='email-name' style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{user?.email || 'neville@itierionursin..'}</div>
            </div>
            <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        className="main-content"
        style={{
          background: 'var(--bg-base)',
        }}
      >
        {/* Top Header */}
        <header className="page-header" style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
          <button 
            className="lg:hidden p-2 -ml-2 text-primary"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div className="hidden md:flex" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', alignItems: 'center', gap: '8px', width: '400px' }}>
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search..." style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-primary)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>⌘K</span>
            </div>
          </div>
          <div className="header-actions" style={{ gap: '20px', color: 'var(--text-muted)' }}>
            <ThemeToggle />
            <button
              className="btn btn-ghost hidden sm:inline-flex"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 6px rgba(2,6,23,0.04)'
              }}
            >
              <Calendar size={16} /> {formatDate(new Date().toISOString().split('T')[0])}
            </button>
            <span className="cursor-pointer hidden sm:inline flex items-center gap-2">
              <Hospital size={16} /> IMNH
            </span>


            <div className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowProfile(true)}>
              <div style={{ width: 24, height: 24, background: '#3B82F6', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{initials}</div>
              <span className="hidden sm:inline" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{user?.full_name || 'JOACHIM ODHIAMBO'} </span>
            </div>
          </div>
        </header>

        <div style={{ padding: '0' }}>
          <OfflineBanner />
          <AlertBanner />
          <Outlet />
        </div>
      </main>

      {/* ── User Menu (hamburger-style dropdown) ── */}
      {showProfile && (
        <UserMenu user={user} onClose={() => setShowProfile(false)} onLogout={handleLogout} />
      )}

      {/* ── Profile Onboarding Modal ── */}
      <ProfileOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onProfileClick={() => {
          setShowOnboarding(false);
          navigate('/profile');
        }}
      />
    </div>
  );
}
