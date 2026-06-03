import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCount = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.unreadCount();
      setUnreadCount(data?.unread_count ?? 0);
    } catch (error) {
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCount();
    const interval = window.setInterval(loadCount, 20000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{ position: 'relative', minWidth: 40 }}
      onClick={() => navigate('/notifications')}
      title="Admin notifications"
    >
      {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 18,
            height: 18,
            borderRadius: 999,
            background: '#ef4444',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            padding: '0 5px',
          }}
        >
          {unreadCount}
        </span>
      )}
    </button>
  );
}
