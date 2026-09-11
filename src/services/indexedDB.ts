import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Batch, SessionLog, AppSettings, TodayScheduleQueue } from '@/types/batch';

const DB_NAME = 'ClassroomPresentationManagerDB_v4';
const DB_VERSION = 1;

interface CPMDatabase extends DBSchema {
  batches: {
    key: string;
    value: Batch;
    indexes: {
      'by-status': string;
      'by-batchNumber': string | number;
      'by-updated': string;
    };
  };
  sessions: {
    key: string;
    value: SessionLog;
    indexes: {
      'by-timestamp': string;
      'by-batchId': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
  schedules: {
    key: string;
    value: TodayScheduleQueue;
  };
}

let dbPromise: Promise<IDBPDatabase<CPMDatabase>> | null = null;

export function getDB(): Promise<IDBPDatabase<CPMDatabase>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser environment.'));
  }

  if (!dbPromise) {
    dbPromise = openDB<CPMDatabase>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Batches store
        if (!db.objectStoreNames.contains('batches')) {
          const batchStore = db.createObjectStore('batches', { keyPath: 'id' });
          batchStore.createIndex('by-status', 'status');
          batchStore.createIndex('by-batchNumber', 'batchNumber');
          batchStore.createIndex('by-updated', 'updatedDate');
        }

        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-timestamp', 'timestamp');
          sessionStore.createIndex('by-batchId', 'batchId');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Schedules store
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
      },
    });
  }

  return dbPromise;
}

// ----------------- Batch Operations -----------------

export async function dbGetAllBatches(): Promise<Batch[]> {
  try {
    const db = await getDB();
    const batches = await db.getAll('batches');
    return batches.sort((a, b) => {
      // Sort by batchNumber if numeric or alphanumeric
      const numA = Number(a.batchNumber);
      const numB = Number(b.batchNumber);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return String(a.batchNumber).localeCompare(String(b.batchNumber), undefined, { numeric: true });
    });
  } catch (error) {
    console.error('Failed to get batches from IndexedDB:', error);
    return [];
  }
}

export async function dbGetBatchById(id: string): Promise<Batch | undefined> {
  const db = await getDB();
  return db.get('batches', id);
}

export async function dbSaveBatch(batch: Batch): Promise<string> {
  const db = await getDB();
  await db.put('batches', batch);
  return batch.id;
}

export async function dbSaveBatchesBulk(batches: Batch[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('batches', 'readwrite');
  for (const batch of batches) {
    await tx.store.put(batch);
  }
  await tx.done;
}

export async function dbDeleteBatch(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('batches', id);
}

export async function dbClearAllBatches(): Promise<void> {
  const db = await getDB();
  await db.clear('batches');
}

// ----------------- Session Logs Operations -----------------

export async function dbSaveSessionLog(log: SessionLog): Promise<void> {
  const db = await getDB();
  await db.put('sessions', log);
}

export async function dbGetAllSessionLogs(): Promise<SessionLog[]> {
  try {
    const db = await getDB();
    const logs = await db.getAll('sessions');
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Failed to get session logs:', error);
    return [];
  }
}

export async function dbClearAllSessionLogs(): Promise<void> {
  const db = await getDB();
  await db.clear('sessions');
}

// ----------------- Settings Operations -----------------

const DEFAULT_SETTINGS: AppSettings = {
  facultyName: 'Faculty Member',
  subjectName: 'AI & Machine Learning Lab',
  academicYear: '2026-2027',
  soundEffects: true,
  confettiEnabled: true,
  rubricMaxScore: 10,
  customSnippets: [],
};

export async function dbGetSettings(): Promise<AppSettings> {
  try {
    const db = await getDB();
    const result = await db.get('settings', 'app_config');
    return result ? { ...DEFAULT_SETTINGS, ...result.value } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to get settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function dbSaveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { id: 'app_config', value: settings });
}

// ----------------- Today's Schedule Operations -----------------

export async function dbSaveSchedule(schedule: TodayScheduleQueue): Promise<void> {
  const db = await getDB();
  await db.put('schedules', schedule);
}

export async function dbGetLatestSchedule(): Promise<TodayScheduleQueue | undefined> {
  try {
    const db = await getDB();
    const schedules = await db.getAll('schedules');
    if (schedules.length === 0) return undefined;
    return schedules.sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime())[0];
  } catch {
    return undefined;
  }
}

// ----------------- Full Database Backup & Restore -----------------

export async function dbExportBackupJSON(): Promise<string> {
  const batches = await dbGetAllBatches();
  const sessions = await dbGetAllSessionLogs();
  const settings = await dbGetSettings();

  const backupData = {
    appName: 'Classroom Presentation Manager',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      batches,
      sessions,
      settings,
    },
  };

  return JSON.stringify(backupData, null, 2);
}

export async function dbImportBackupJSON(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data || !Array.isArray(parsed.data.batches)) {
      throw new Error('Invalid backup file format: missing batches array.');
    }

    const batches: Batch[] = parsed.data.batches;
    const sessions: SessionLog[] = parsed.data.sessions || [];
    const settings: AppSettings = parsed.data.settings || DEFAULT_SETTINGS;

    const db = await getDB();
    
    // Clear and restore batches
    const batchTx = db.transaction('batches', 'readwrite');
    await batchTx.store.clear();
    for (const b of batches) {
      await batchTx.store.put(b);
    }
    await batchTx.done;

    // Clear and restore sessions
    const sessionTx = db.transaction('sessions', 'readwrite');
    await sessionTx.store.clear();
    for (const s of sessions) {
      await sessionTx.store.put(s);
    }
    await sessionTx.done;

    // Save settings
    await dbSaveSettings(settings);

    return { success: true, count: batches.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Unknown error parsing backup.' };
  }
}
