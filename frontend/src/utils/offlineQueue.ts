import api from '../api';

export interface QueuedRequest {
  id: string;
  url: string;
  data: any;
  type: 'Patient Registration' | 'Appointment' | 'ANC Visit';
  timestamp: number;
}

const STORAGE_KEY = 'maternitrack_offline_queue';

export function getOfflineQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function addToOfflineQueue(url: string, data: any) {
  const queue = getOfflineQueue();
  let type: 'Patient Registration' | 'Appointment' | 'ANC Visit' = 'Patient Registration';
  if (url.includes('/appointments/')) {
    type = 'Appointment';
  } else if (url.includes('/clinical/anc-visits/')) {
    type = 'ANC Visit';
  }

  const newItem: QueuedRequest = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    url,
    data,
    type,
    timestamp: Date.now(),
  };
  queue.push(newItem);
  saveOfflineQueue(queue);
  
  // Dispatch a custom event so other components (Header, banner) can react immediately
  window.dispatchEvent(new Event('offline-queue-changed'));
}

export async function syncOfflineQueue(): Promise<{ success: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: QueuedRequest[] = [];

  for (const item of queue) {
    try {
      await api.post(item.url, item.data);
      success++;
    } catch (err: any) {
      console.error('Failed to sync offline item:', item, err);
      // If server returned a validation error (400 Bad Request) or other client errors (422, etc.), discard it to prevent blocking the queue forever.
      if (err && err.response && err.response.status >= 400 && err.response.status < 500) {
        failed++;
      } else {
        remaining.push(item);
      }
    }
  }

  saveOfflineQueue(remaining);
  window.dispatchEvent(new Event('offline-queue-changed'));
  return { success, failed };
}
