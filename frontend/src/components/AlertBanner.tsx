import { useEffect, useState, useCallback } from 'react';
import { alertsApi } from '../api';
import { ClinicalAlert } from '../types';

const POLL_INTERVAL = 30_000; // 30 seconds

/**
 * AlertBanner
 * ───────────
 * Polls the server every 30 s for unacknowledged clinical alerts.
 * Displays a sticky banner at the top of the layout for CRITICAL alerts.
 */
export default function AlertBanner() {
  const [alerts, setAlerts]   = useState<ClinicalAlert[]>([]);
  const [total, setTotal]     = useState(0);
  const [critical, setCritical] = useState(0);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await alertsApi.count();
      setTotal(data.total);
      setCritical(data.critical);
      setAlerts(data.recent ?? []);
    } catch {
      /* silent — don't break the UI if alerts endpoint isn't ready */
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await alertsApi.acknowledge(alertId);
      setDismissed(prev => new Set(prev).add(alertId));
      fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="alert-banner-container">
      {visibleAlerts.map(alert => (
        <div
          key={alert.id}
          className={`alert-banner alert-banner--${alert.severity.toLowerCase()}`}
          role="alert"
        >
          <div className="alert-banner__icon">
            {alert.severity === 'CRITICAL' ? '🚨' : '⚠️'}
          </div>
          <div className="alert-banner__content">
            <strong>{alert.alert_type_display}</strong>
            <span className="alert-banner__patient">
              {' '}— {alert.patient_name} ({alert.patient_number})
            </span>
            <span className="alert-banner__value">
              {' '}| Value: {alert.value_triggered}
            </span>
          </div>
          <button
            className="alert-banner__ack"
            onClick={() => handleAcknowledge(alert.id)}
            title="Acknowledge alert"
          >
            ✓ Acknowledge
          </button>
        </div>
      ))}
      {total > visibleAlerts.length && (
        <div className="alert-banner__more">
          + {total - visibleAlerts.length} more unacknowledged alert{total - visibleAlerts.length !== 1 ? 's' : ''}
          <a href="/alerts" className="alert-banner__link">View All →</a>
        </div>
      )}
    </div>
  );
}
