import Dexie, { type Table } from 'dexie';

// ─── Database Schema ─────────────────────────────────────────
export interface CachedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  permissions?: Record<string, any>;
  cachedAt: number;
}

export interface CachedSetting {
  key: string;
  value: any;
  cachedAt: number;
}

export interface CachedDashboard {
  id: string; // e.g. 'sales-dashboard', 'marketing-dashboard'
  data: any;
  cachedAt: number;
  expiresAt: number;
}

export interface CachedLead {
  id: string;
  tenantId: string;
  data: any;
  cachedAt: number;
}

export interface CachedContact {
  id: string;
  tenantId: string;
  data: any;
  cachedAt: number;
}

export interface OfflineDraft {
  id: string;
  type: string; // 'lead', 'contact', 'campaign', 'email', 'expense', 'invoice'
  data: any;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

export interface PendingRequest {
  id?: number;
  method: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  createdAt: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'failed';
}

export interface FormAutoSave {
  id: string; // e.g. 'create-lead-form', 'create-campaign-form'
  formData: any;
  savedAt: number;
}

// ─── Dexie Database ──────────────────────────────────────────
class CRMDatabase extends Dexie {
  users!: Table<CachedUser, string>;
  settings!: Table<CachedSetting, string>;
  dashboards!: Table<CachedDashboard, string>;
  leads!: Table<CachedLead, string>;
  contacts!: Table<CachedContact, string>;
  drafts!: Table<OfflineDraft, string>;
  pendingRequests!: Table<PendingRequest, number>;
  formAutoSaves!: Table<FormAutoSave, string>;

  constructor() {
    super('HubNestCRM');

    this.version(1).stores({
      users: 'id, email, role, tenantId, cachedAt',
      settings: 'key, cachedAt',
      dashboards: 'id, cachedAt, expiresAt',
      leads: 'id, tenantId, cachedAt',
      contacts: 'id, tenantId, cachedAt',
      drafts: 'id, type, synced, createdAt, updatedAt',
      pendingRequests: '++id, status, createdAt',
      formAutoSaves: 'id, savedAt',
    });
  }
}

export const db = new CRMDatabase();

// ─── Cache Expiration Defaults (milliseconds) ────────────────
const CACHE_TTL = {
  user: 24 * 60 * 60 * 1000,       // 24 hours
  settings: 12 * 60 * 60 * 1000,   // 12 hours
  dashboard: 5 * 60 * 1000,        // 5 minutes
  leads: 10 * 60 * 1000,           // 10 minutes
  contacts: 10 * 60 * 1000,        // 10 minutes
  formAutoSave: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── User Session Cache ──────────────────────────────────────
export async function cacheUser(user: CachedUser): Promise<void> {
  await db.users.put({ ...user, cachedAt: Date.now() });
}

export async function getCachedUser(id: string): Promise<CachedUser | undefined> {
  const user = await db.users.get(id);
  if (user && Date.now() - user.cachedAt > CACHE_TTL.user) {
    await db.users.delete(id);
    return undefined;
  }
  return user;
}

export async function clearUserCache(): Promise<void> {
  await db.users.clear();
}

// ─── Settings Cache ──────────────────────────────────────────
export async function cacheSetting(key: string, value: any): Promise<void> {
  await db.settings.put({ key, value, cachedAt: Date.now() });
}

export async function getCachedSetting(key: string): Promise<any | undefined> {
  const setting = await db.settings.get(key);
  if (setting && Date.now() - setting.cachedAt > CACHE_TTL.settings) {
    await db.settings.delete(key);
    return undefined;
  }
  return setting?.value;
}

export async function clearSettingsCache(): Promise<void> {
  await db.settings.clear();
}

// ─── Dashboard Cache ─────────────────────────────────────────
export async function cacheDashboard(id: string, data: any, ttl?: number): Promise<void> {
  const now = Date.now();
  await db.dashboards.put({
    id,
    data,
    cachedAt: now,
    expiresAt: now + (ttl || CACHE_TTL.dashboard),
  });
}

export async function getCachedDashboard(id: string): Promise<any | undefined> {
  const cached = await db.dashboards.get(id);
  if (!cached || Date.now() > cached.expiresAt) {
    if (cached) await db.dashboards.delete(id);
    return undefined;
  }
  return cached.data;
}

export async function clearDashboardCache(): Promise<void> {
  await db.dashboards.clear();
}

// ─── Leads Cache ─────────────────────────────────────────────
export async function cacheLeads(leads: any[], tenantId: string): Promise<void> {
  const now = Date.now();
  const entries = leads.map((lead) => ({
    id: lead.id,
    tenantId,
    data: lead,
    cachedAt: now,
  }));
  await db.leads.bulkPut(entries);
}

export async function getCachedLeads(tenantId: string): Promise<any[]> {
  const cutoff = Date.now() - CACHE_TTL.leads;
  const leads = await db.leads
    .where('tenantId')
    .equals(tenantId)
    .filter((l) => l.cachedAt > cutoff)
    .toArray();
  return leads.map((l) => l.data);
}

export async function clearLeadsCache(): Promise<void> {
  await db.leads.clear();
}

// ─── Contacts Cache ──────────────────────────────────────────
export async function cacheContacts(contacts: any[], tenantId: string): Promise<void> {
  const now = Date.now();
  const entries = contacts.map((contact) => ({
    id: contact.id,
    tenantId,
    data: contact,
    cachedAt: now,
  }));
  await db.contacts.bulkPut(entries);
}

export async function getCachedContacts(tenantId: string): Promise<any[]> {
  const cutoff = Date.now() - CACHE_TTL.contacts;
  const contacts = await db.contacts
    .where('tenantId')
    .equals(tenantId)
    .filter((c) => c.cachedAt > cutoff)
    .toArray();
  return contacts.map((c) => c.data);
}

export async function clearContactsCache(): Promise<void> {
  await db.contacts.clear();
}

// ─── Offline Drafts ──────────────────────────────────────────
export async function saveDraft(id: string, type: string, data: any): Promise<void> {
  const now = Date.now();
  const existing = await db.drafts.get(id);
  await db.drafts.put({
    id,
    type,
    data,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    synced: false,
  });
}

export async function getDraft(id: string): Promise<OfflineDraft | undefined> {
  return db.drafts.get(id);
}

export async function getDraftsByType(type: string): Promise<OfflineDraft[]> {
  return db.drafts.where('type').equals(type).toArray();
}

export async function getUnsyncedDrafts(): Promise<OfflineDraft[]> {
  return db.drafts.where('synced').equals(0).toArray(); // Dexie converts false to 0
}

export async function markDraftSynced(id: string): Promise<void> {
  await db.drafts.update(id, { synced: true, updatedAt: Date.now() });
}

export async function deleteDraft(id: string): Promise<void> {
  await db.drafts.delete(id);
}

export async function clearDrafts(): Promise<void> {
  await db.drafts.clear();
}

// ─── Pending Requests Queue ──────────────────────────────────
export async function queueRequest(
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): Promise<number> {
  const id = await db.pendingRequests.add({
    method,
    url,
    body,
    headers,
    createdAt: Date.now(),
    retries: 0,
    maxRetries: 3,
    status: 'pending',
  });
  return id as number;
}

export async function getPendingRequests(): Promise<PendingRequest[]> {
  return db.pendingRequests.where('status').equals('pending').toArray();
}

export async function markRequestProcessing(id: number): Promise<void> {
  await db.pendingRequests.update(id, { status: 'processing' });
}

export async function markRequestFailed(id: number): Promise<void> {
  const req = await db.pendingRequests.get(id);
  if (req) {
    const newRetries = req.retries + 1;
    if (newRetries >= req.maxRetries) {
      await db.pendingRequests.update(id, { status: 'failed', retries: newRetries });
    } else {
      await db.pendingRequests.update(id, { status: 'pending', retries: newRetries });
    }
  }
}

export async function removeRequest(id: number): Promise<void> {
  await db.pendingRequests.delete(id);
}

export async function clearPendingRequests(): Promise<void> {
  await db.pendingRequests.clear();
}

// ─── Form Auto-Save ──────────────────────────────────────────
export async function autoSaveForm(id: string, formData: any): Promise<void> {
  await db.formAutoSaves.put({ id, formData, savedAt: Date.now() });
}

export async function getAutoSavedForm(id: string): Promise<any | undefined> {
  const saved = await db.formAutoSaves.get(id);
  if (saved && Date.now() - saved.savedAt > CACHE_TTL.formAutoSave) {
    await db.formAutoSaves.delete(id);
    return undefined;
  }
  return saved?.formData;
}

export async function clearAutoSavedForm(id: string): Promise<void> {
  await db.formAutoSaves.delete(id);
}

export async function clearAllAutoSaves(): Promise<void> {
  await db.formAutoSaves.clear();
}

// ─── Cache Expiration Cleanup ────────────────────────────────
export async function cleanExpiredCache(): Promise<void> {
  const now = Date.now();

  // Clean expired dashboards
  const expiredDashboards = await db.dashboards
    .filter((d) => now > d.expiresAt)
    .toArray();
  await db.dashboards.bulkDelete(expiredDashboards.map((d) => d.id));

  // Clean expired leads
  const leadsCutoff = now - CACHE_TTL.leads;
  const expiredLeads = await db.leads
    .filter((l) => l.cachedAt < leadsCutoff)
    .toArray();
  await db.leads.bulkDelete(expiredLeads.map((l) => l.id));

  // Clean expired contacts
  const contactsCutoff = now - CACHE_TTL.contacts;
  const expiredContacts = await db.contacts
    .filter((c) => c.cachedAt < contactsCutoff)
    .toArray();
  await db.contacts.bulkDelete(expiredContacts.map((c) => c.id));

  // Clean expired auto-saves
  const autoSaveCutoff = now - CACHE_TTL.formAutoSave;
  const expiredSaves = await db.formAutoSaves
    .filter((f) => f.savedAt < autoSaveCutoff)
    .toArray();
  await db.formAutoSaves.bulkDelete(expiredSaves.map((f) => f.id));

  // Clean old failed requests (older than 24 hours)
  const requestCutoff = now - 24 * 60 * 60 * 1000;
  const oldRequests = await db.pendingRequests
    .filter((r) => r.status === 'failed' && r.createdAt < requestCutoff)
    .toArray();
  if (oldRequests.length) {
    await db.pendingRequests.bulkDelete(oldRequests.map((r) => r.id!));
  }
}

// ─── Full Database Clear ─────────────────────────────────────
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.users.clear(),
    db.settings.clear(),
    db.dashboards.clear(),
    db.leads.clear(),
    db.contacts.clear(),
    db.drafts.clear(),
    db.pendingRequests.clear(),
    db.formAutoSaves.clear(),
  ]);
}

// ─── Migration from localStorage ─────────────────────────────
export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  const migrated = localStorage.getItem('_idb_migrated');
  if (migrated === 'true') return;

  try {
    // Migrate user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.id) {
          await cacheUser({
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            role: user.role || '',
            tenantId: user.tenantId || '',
            permissions: user.permissions,
            cachedAt: Date.now(),
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Migrate theme setting
    const theme = localStorage.getItem('theme');
    if (theme) {
      await cacheSetting('theme', theme);
    }

    // Migrate sidebar preference
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed) {
      await cacheSetting('sidebarCollapsed', sidebarCollapsed === 'true');
    }

    // Mark migration as done (don't remove localStorage items as they may still be used)
    localStorage.setItem('_idb_migrated', 'true');
  } catch (e) {
    console.error('IndexedDB migration from localStorage failed:', e);
  }
}

export default db;
