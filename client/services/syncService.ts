import api from './api';
import {
  getPendingRequests,
  markRequestProcessing,
  markRequestFailed,
  removeRequest,
  getUnsyncedDrafts,
  markDraftSynced,
  cleanExpiredCache,
  migrateFromLocalStorage,
} from './indexedDB';

// ─── Online/Offline Status ───────────────────────────────────
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
const onlineListeners: Array<(online: boolean) => void> = [];

export function getOnlineStatus(): boolean {
  return isOnline;
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  onlineListeners.push(callback);
  return () => {
    const idx = onlineListeners.indexOf(callback);
    if (idx >= 0) onlineListeners.splice(idx, 1);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    onlineListeners.forEach((cb) => cb(true));
    // Sync pending requests when back online
    syncPendingRequests();
    syncDrafts();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    onlineListeners.forEach((cb) => cb(false));
  });
}

// ─── Sync Pending Requests ───────────────────────────────────
let isSyncing = false;

export async function syncPendingRequests(): Promise<{ synced: number; failed: number }> {
  if (isSyncing || !isOnline) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingRequests();

    for (const req of pending) {
      if (!req.id) continue;

      try {
        await markRequestProcessing(req.id);

        const config: any = {
          method: req.method,
          url: req.url,
          headers: req.headers,
        };

        if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
          config.data = req.body;
        }

        await api(config);
        await removeRequest(req.id);
        synced++;
      } catch (err: any) {
        const status = err?.response?.status;
        // Don't retry 4xx errors (except 408, 429)
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          await removeRequest(req.id);
          failed++;
        } else {
          await markRequestFailed(req.id);
          failed++;
        }
      }
    }
  } catch (err) {
    console.error('Failed to sync pending requests:', err);
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

// ─── Sync Offline Drafts ─────────────────────────────────────
const DRAFT_SYNC_ENDPOINTS: Record<string, string> = {
  lead: '/sales/leads',
  contact: '/sales/contacts',
  campaign: '/campaigns',
  expense: '/finance/expenses',
  invoice: '/finance/invoices',
};

export async function syncDrafts(): Promise<{ synced: number; failed: number }> {
  if (!isOnline) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  try {
    const unsyncedDrafts = await getUnsyncedDrafts();

    for (const draft of unsyncedDrafts) {
      const endpoint = DRAFT_SYNC_ENDPOINTS[draft.type];
      if (!endpoint) {
        console.warn(`No sync endpoint for draft type: ${draft.type}`);
        continue;
      }

      try {
        await api.post(endpoint, draft.data);
        await markDraftSynced(draft.id);
        synced++;
      } catch (err: any) {
        console.error(`Failed to sync draft ${draft.id}:`, err?.message);
        failed++;
      }
    }
  } catch (err) {
    console.error('Failed to sync drafts:', err);
  }

  return { synced, failed };
}

// ─── Periodic Cleanup ────────────────────────────────────────
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startPeriodicCleanup(intervalMs: number = 15 * 60 * 1000): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(async () => {
    try {
      await cleanExpiredCache();
    } catch (err) {
      console.error('Cache cleanup failed:', err);
    }
  }, intervalMs);
}

export function stopPeriodicCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// ─── Initialize ──────────────────────────────────────────────
export async function initializeOfflineSupport(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Migrate data from localStorage
    await migrateFromLocalStorage();

    // Clean expired cache
    await cleanExpiredCache();

    // Start periodic cleanup (every 15 minutes)
    startPeriodicCleanup();

    // Sync pending requests if online
    if (isOnline) {
      syncPendingRequests();
      syncDrafts();
    }
  } catch (err) {
    console.error('Failed to initialize offline support:', err);
  }
}

// ─── Conflict Resolution ─────────────────────────────────────
export type ConflictStrategy = 'client-wins' | 'server-wins' | 'latest-wins';

export function resolveConflict(
  clientData: { data: any; updatedAt: number },
  serverData: { data: any; updatedAt: number },
  strategy: ConflictStrategy = 'latest-wins'
): any {
  switch (strategy) {
    case 'client-wins':
      return clientData.data;
    case 'server-wins':
      return serverData.data;
    case 'latest-wins':
    default:
      return clientData.updatedAt > serverData.updatedAt
        ? clientData.data
        : serverData.data;
  }
}
