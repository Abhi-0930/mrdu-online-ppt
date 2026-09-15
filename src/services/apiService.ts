import { Batch, SessionLog, AppSettings, TodayScheduleQueue } from '@/types/batch';

const API_BASE = '/api';

export const ApiService = {
  // Batches
  async getAllBatches(section?: 'AIML-E' | 'AIML-A'): Promise<Batch[]> {
    const url = section ? `${API_BASE}/batches?section=${section}` : `${API_BASE}/batches`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch batches: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async createBatch(batch: Omit<Batch, 'id' | 'createdDate' | 'updatedDate'> & { id?: string }): Promise<Batch> {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(`Failed to create batch: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async updateBatch(batch: Batch): Promise<Batch> {
    const res = await fetch(`${API_BASE}/batches/${batch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(`Failed to update batch: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async deleteBatch(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/batches/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete batch: ${res.statusText}`);
  },

  async resetAllStatuses(section?: 'AIML-E' | 'AIML-A'): Promise<Batch[]> {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_all', section }),
    });
    if (!res.ok) throw new Error(`Failed to reset statuses: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async bulkImportBatches(batches: Batch[], replaceExisting: boolean, section?: 'AIML-E' | 'AIML-A'): Promise<Batch[]> {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk_import', batches, replaceExisting, section }),
    });
    if (!res.ok) throw new Error(`Failed to bulk import batches: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async reseedDatabase(): Promise<Batch[]> {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed' }),
    });
    if (!res.ok) throw new Error(`Failed to re-seed batches: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async clearAllBatches(section?: 'AIML-E' | 'AIML-A'): Promise<void> {
    const url = section ? `${API_BASE}/batches?section=${section}` : `${API_BASE}/batches`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to clear batches: ${res.statusText}`);
  },

  // Session Logs
  async getAllSessionLogs(section?: 'AIML-E' | 'AIML-A'): Promise<SessionLog[]> {
    const url = section ? `${API_BASE}/logs?section=${section}` : `${API_BASE}/logs`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch session logs: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async createSessionLog(log: SessionLog): Promise<SessionLog> {
    const res = await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error(`Failed to create session log: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async clearAllSessionLogs(section?: 'AIML-E' | 'AIML-A'): Promise<void> {
    const url = section ? `${API_BASE}/logs?section=${section}` : `${API_BASE}/logs`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to clear logs: ${res.statusText}`);
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch settings: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error(`Failed to update settings: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  // Schedule
  async getSchedule(section?: 'AIML-E' | 'AIML-A'): Promise<TodayScheduleQueue | null> {
    const url = section ? `${API_BASE}/schedule?section=${section}` : `${API_BASE}/schedule`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  },

  async saveSchedule(schedule: { section: string; batchIds: string[]; currentIndex: number }): Promise<TodayScheduleQueue> {
    const res = await fetch(`${API_BASE}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    if (!res.ok) throw new Error(`Failed to save schedule: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },
};

export default ApiService;
