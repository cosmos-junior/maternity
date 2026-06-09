import { useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  Activity,
  Calendar,
  Stethoscope,
  AlertCircle,
  MessageSquare,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPersonalizedGreeting } from '../utils';

const MOTHER_NAV = [
  { to: '/mother/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/mother/journey', icon: <Activity size={18} />, label: 'Journey' },
  { to: '/mother/appointments', icon: <Calendar size={18} />, label: 'Appointments' },
  { to: '/mother/records', icon: <Stethoscope size={18} />, label: 'Records' },
  { to: '/mother/symptoms', icon: <AlertCircle size={18} />, label: 'Symptoms' },
  { to: '/mother/messages', icon: <MessageSquare size={18} />, label: 'Messages' },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/mother/dashboard': {
    title: 'Mother Dashboard',
    subtitle: 'Your personalized pregnancy overview for today.'
  },
  '/mother/journey': {
    title: 'ANC Journey',
    subtitle: 'View your antenatal care visits, lab results, and clinical assessments.'
  },
  '/mother/pregnancy': {
    title: 'Pregnancy Journey',
    subtitle: 'Track milestones, expected delivery, and antenatal history.'
  },
  '/mother/appointments': {
    title: 'Appointments',
    subtitle: 'Manage upcoming visits and review your appointment history.'
  },
  '/mother/records': {
    title: 'Medical Records',
    subtitle: 'Review your health notes, documents, and condition summary.'
  },
  '/mother/symptoms': {
    title: 'Report Symptoms',
    subtitle: 'Submit urgent symptoms and keep your care team informed.'
  },
  '/mother/messages': {
    title: 'Messages',
    subtitle: 'Secure chat with your clinic care team.'
  }
};

export default function MotherLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace(/\/$/, '');
  const meta = PAGE_META[path] ?? { title: 'Mother Portal', subtitle: 'Your maternal care space' };
  const showBack = path !== '/mother/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  // Force dark mode with purple/pink theme for mother portal only
  // No way to toggle to light mode in mother portal
  useEffect(() => {
    // Save previous theme state
    const previousTheme = localStorage.getItem('theme');
    
    // Force dark mode
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    
    // Add mother-portal-specific class for custom styling
    document.body.classList.add('mother-portal-active');
    
    return () => {
      // Restore previous theme when leaving mother portal
      document.body.classList.remove('mother-portal-active');
      if (previousTheme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else if (!previousTheme) {
        // If no previous theme, check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (!prefersDark) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      }
    };
  }, []);

  return (
    <div className="mother-shell">
      {/* Centered Mobile Header matching the reference design */}
      <header className="mother-mobile-header">
        {showBack ? (
          <button
            type="button"
            className="mother-mobile-back-button"
            onClick={() => navigate('/mother/dashboard')}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="mother-mobile-back-button"
            style={{
              color: '#fca5a5',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              background: isDarkMode ? '#1E293B' : '#FFFFFF'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDarkMode ? '#1E293B' : '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            <LogOut size={20} />
          </button>
        )}

        <h1 className="mother-mobile-header-title">
          {meta.title}
        </h1>

        <div className="mother-mobile-header-placeholder" />
      </header>

      <main className="mother-content">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation Bar */}
      <nav className="mother-bottom-nav" aria-label="Mother portal navigation">
        {MOTHER_NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mother-bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="mother-bottom-nav-icon">{item.icon}</span>
            <span className="mother-bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
