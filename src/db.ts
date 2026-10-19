import { openDB, type DBSchema } from 'idb';
import type { DailyEntry, Settings } from './types';
import { DEFAULT_TARGET } from './domain';

interface DietDB extends DBSchema {
  settings: { key: 'settings'; value: Settings };
  entries: { key: string; value: DailyEntry; indexes: { 'by-date': string } };
}

const dbPromise = openDB<DietDB>('simple-diet', 1, {
  upgrade(db) {
    db.createObjectStore('settings');
    const entries = db.createObjectStore('entries', { keyPath: 'date' });
    entries.createIndex('by-date', 'date');
  },
});

export async function getSettings(): Promise<Settings> {
  const db = await dbPromise;
  return (
    (await db.get('settings', 'settings')) ?? {
      id: 'settings',
      targetCalories: DEFAULT_TARGET,
      themeMode: 'system',
      chartType: 'line',
      updatedAt: new Date().toISOString(),
    }
  );
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await dbPromise;
  await db.put('settings', settings, 'settings');
}

export async function listEntries(from: string, to: string): Promise<DailyEntry[]> {
  const db = await dbPromise;
  const entries = await db.getAll('entries');
  return entries
    .filter((entry) => entry.date >= from && entry.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getEntry(date: string): Promise<DailyEntry | undefined> {
  return (await dbPromise).get('entries', date);
}

export async function saveEntry(entry: DailyEntry): Promise<void> {
  await (await dbPromise).put('entries', entry);
}

export async function deleteEntry(date: string): Promise<void> {
  await (await dbPromise).delete('entries', date);
}

export async function clearAllData(): Promise<void> {
  const db = await dbPromise;
  const transaction = db.transaction(['settings', 'entries'], 'readwrite');
  await Promise.all([
    transaction.objectStore('settings').clear(),
    transaction.objectStore('entries').clear(),
  ]);
  await transaction.done;
}
