import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * OfflineBanner
 * ─────────────
 * Detects when the browser goes offline and shows a non-intrusive
 * notification banner. Auto-dismisses 2s after coming back online.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      setShowReconnect(true);
      setTimeout(() => setShowReconnect(false), 2000);
    };
    const handleOffline = () => {
      setOffline(true);
      setShowReconnect(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline && !showReconnect) return null;

  return (
    <div
      className={`offline-banner ${offline ? 'offline-banner--offline' : 'offline-banner--online'}`}
      role="status"
      aria-live="polite"
    >
      {offline ? (
        <>
          <span className="offline-banner__icon"><WifiOff size={16} /></span>
          <span>You are offline — viewing cached data only. Changes will sync when reconnected.</span>
        </>
      ) : (
        <>
          <span className="offline-banner__icon"><Wifi size={16} /></span>
          <span>Back online — data is syncing.</span>
        </>
      )}
    </div>
  );
}
