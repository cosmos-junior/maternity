import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi } from '../api';
import { onTicketResolved } from '../utils/ticketEvents';

export default function NotificationBell() {
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCount = async () => {
    setLoading(true);
    try {
      const { data } = await ticketsApi.unresolvedCount();
      setTicketCount(data?.unresolved_count ?? 0);
    } catch (error) {
      setTicketCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCount();
    const interval = window.setInterval(loadCount, 20000);
    const removeListener = onTicketResolved(() => {
      setTicketCount(count => Math.max(0, count - 1));
    });
    return () => {
      window.clearInterval(interval);
      removeListener();
    };
  }, []);

  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{ position: 'relative', minWidth: 40 }}
      onClick={() => navigate('/tickets')}
      title="View open tickets"
      aria-label="View open tickets"
    >
      {ticketCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
      {ticketCount > 0 && (
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
          {ticketCount}
        </span>
      )}
    </button>
  );
}
