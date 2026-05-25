import { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import AlertBanner from './AlertBanner';
import OfflineBanner from './OfflineBanner';



interface NavItem { to: string; icon: string; label: string; roles?: string[] }

interface NavSection {
  label: string;
  roles?: string[];
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'DASHBOARD',
    items: [
      { to: '/', icon: '⌂', label: 'Dashboard' },
    ]
  },
  {
    label: 'RECEPTION',
    items: [
      { to: '/patients', icon: '👤', label: 'Patients Management' },
      { to: '/appointments', icon: '📅', label: 'Appointments' },
    ]
  },
  {
    label: 'OUTPATIENT',
    items: [
      { to: '/postnatal', icon: '⚕', label: 'Postnatal' },
      { to: '/clinical-notes', icon: '🩺', label: 'Clinical Notes' },
      { to: '/documents', icon: '📁', label: 'Documents' },
      { to: '/procedures', icon: '🏥', label: 'Procedures' },
    ]
  },
  {
    label: 'SYSTEM',
    roles: ['ADMIN', 'NURSE'],
    items: [
      { to: '/reminders', icon: '💬', label: 'SMS Reminders', roles: ['ADMIN', 'NURSE'] },
      { to: '/alerts', icon: '🚨', label: 'Clinical Alerts' },
      { to: '/admin/users', icon: '👥', label: 'User Management', roles: ['ADMIN'] },
      { to: '/admin/audit', icon: '📋', label: 'Audit Trail', roles: ['ADMIN'] },
    ]
  }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

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
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <div className="logo-icon" style={{ fontSize: '1.2rem' }}>⚕️</div>
            <div className="logo-text" style={{ fontSize: '0.8rem', lineHeight: '1.1', maxWidth: '140px', color: '#1E3A8A' }}>
              ITIERIO MATERNITY AND NURSING HOME LIMITED
            </div>
          </div>
        </div>

        {/* Search menu */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input type="text" placeholder="Search menu..." style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }} />
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
                <div className="nav-section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  📁 {section.label}
                </div>
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <span className="nav-icon" style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="user-card cursor-pointer" style={{ marginBottom: 10, background: 'transparent', padding: '0 8px' }} onClick={() => setShowConfirm(true)}>
            <div className="user-avatar" style={{ background: '#3B82F6', width: 40, height: 40 }}>{initials}</div>
            <div className="user-info">
              <div className="user-name" style={{ fontSize: '0.9rem', color: '#1E293B' }}>{user?.full_name || 'Joachim Odhaimbo'}</div>
              <div className='email-name' style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{user?.email || 'neville@itierionursin..'}</div>

              <div style={{ color: 'var(--text-muted)' }}>⌃</div>
            </div>
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
        <header className="page-header" style={{ padding: '0 24px', justifyContent: 'flex-end', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', width: '400px' }}>
              <span style={{ color: 'var(--text-muted)' }}>🔍</span>
              <input type="text" placeholder="Search..." style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>⌘K</span>
            </div>
          </div>
          <div className="header-actions" style={{ gap: '20px', color: 'var(--text-muted)' }}>
            <span className="cursor-pointer">🏥 IMNH</span>


            <div className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 24, height: 24, background: '#3B82F6', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{initials}</div>
              <span style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: 500 }}>{user?.full_name || 'JOACHIM ODHIAMBO'} </span>
            </div>
          </div>
        </header>

        <div style={{ padding: '0' }}>
          <OfflineBanner />
          <AlertBanner />
          <Outlet />
        </div>
      </main>

      {/* ── Logout confirmation modal ── */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="modal"
            style={{ maxWidth: 380, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: 12 }}></div>
            <div className="modal-title" style={{ marginBottom: 8 }}>Sign Out</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
              Are you sure you want to sign out,{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{user?.full_name?.split(' ')?.[0]}</strong>?
              <br />Your session will be ended.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                id="confirm-logout-btn"
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
