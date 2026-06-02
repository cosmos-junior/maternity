import { useEffect, useRef, useState } from 'react';
import { Mail, Phone, User as UserIcon, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface Props {
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
}

export default function UserMenu({ user, onClose, onLogout }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const shouldShowProfileReminder = user && !user.profile_completed;

  const handleViewProfile = () => {
    navigate('/profile');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: '76px', right: 20, zIndex: 200, maxWidth: 'calc(100vw - 40px)' }}>
      <div ref={ref} className="user-menu card" style={{ width: 320, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
        {/* Notification Alert Banner */}
        {shouldShowProfileReminder && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
            borderBottom: '1px solid var(--border)',
            color: 'var(--hosp-blue)',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}>
            <Bell size={16} />
            <span>Complete your profile to get started</span>
          </div>
        )}

        {/* Profile Header */}
        <div style={{ display: 'flex', gap: 12, padding: 16, alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg,var(--hosp-blue),var(--purple))', color: 'white' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{user?.full_name || 'Unknown'}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{user?.role || 'NURSE'}</div>
          </div>
        </div>

        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}><Mail size={16} /></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email || 'n/a'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}><Phone size={16} /></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.phone_number || 'n/a'}</div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

          {/* Notification Bell Button */}
          <button 
            className="btn"
            style={{
              justifyContent: 'flex-start',
              gap: 12,
              position: 'relative',
            }}
            onClick={() => setShowNotification(!showNotification)}
            title="View notifications"
          >
            <Bell size={18} />
            Notifications
            {shouldShowProfileReminder && (
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#EF4444',
                marginLeft: 'auto',
              }} />
            )}
          </button>

          {/* View Profile Button */}
          <button 
            className="btn"
            style={{ justifyContent: 'flex-start', gap: 12 }}
            onClick={handleViewProfile}
          >
            <UserIcon size={18} /> View Profile
          </button>
          
          <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: 12, color: 'var(--danger)' }} onClick={onLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* Notification Drawer */}
        {showNotification && (
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '12px 16px',
            background: 'var(--bg-hover)',
            maxHeight: 200,
            overflowY: 'auto',
          }}>
            {shouldShowProfileReminder ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{
                  padding: '12px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
                  border: '1px solid var(--hosp-blue)',
                  borderOpacity: 0.3,
                }}>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}>
                    Complete Your Profile
                  </p>
                  <p style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                  }}>
                    Add your bio and update your information to personalize your account.
                  </p>
                  <button
                    onClick={handleViewProfile}
                    style={{
                      marginTop: 8,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'var(--hosp-blue)',
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    Go to Profile
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}>
                No new notifications
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
