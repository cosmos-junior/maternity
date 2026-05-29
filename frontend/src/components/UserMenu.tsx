import { useEffect, useRef } from 'react';
import { Mail, Phone, User as UserIcon, LogOut } from 'lucide-react';
import { User } from '../types';

interface Props {
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
}

export default function UserMenu({ user, onClose, onLogout }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

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

  return (
    <div style={{ position: 'fixed', top: '76px', right: 20, zIndex: 200, maxWidth: 'calc(100vw - 40px)' }}>
      <div ref={ref} className="user-menu card" style={{ width: 320, maxWidth: '100%', padding: 0, overflow: 'hidden' }}>
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

          <button className="btn" style={{ justifyContent: 'flex-start', gap: 12 }} onClick={() => { /* view full profile action — could navigate to /profile */ onClose(); }}>
            <UserIcon size={18} /> View Profile
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: 12, color: 'var(--danger)' }} onClick={onLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
