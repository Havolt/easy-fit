import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllData,
  deleteEntry,
  getEntry,
  getSettings,
  listEntries,
  saveEntry,
  saveSettings,
} from './db';
import type { DailyEntry } from './types';

const entry = (date: string): DailyEntry => ({
  date,
  calories: 1800,
  exerciseMinutes: 70,
  targetCalories: 2000,
  dietPower: 91,
  createdAt: `${date}T08:00:00.000Z`,
  updatedAt: `${date}T18:00:00.000Z`,
});

describe('database persistence', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('returns default settings and persists updates', async () => {
    const defaults = await getSettings();
    expect(defaults.targetCalories).toBe(2000);

    const updated = { ...defaults, targetCalories: 1800, themeMode: 'dark' as const };
    await saveSettings(updated);

    await expect(getSettings()).resolves.toMatchObject({
      targetCalories: 1800,
      themeMode: 'dark',
    });
  });

  it('saves, retrieves, lists, and deletes entries by date', async () => {
    await saveEntry(entry('2026-01-01'));
    await saveEntry(entry('2026-01-03'));

    await expect(getEntry('2026-01-01')).resolves.toMatchObject({ calories: 1800 });
    await expect(listEntries('2026-01-01', '2026-01-02')).resolves.toHaveLength(1);
    await expect(listEntries('2026-01-01', '2026-01-03')).resolves.toEqual([
      entry('2026-01-01'),
      entry('2026-01-03'),
    ]);

    await deleteEntry('2026-01-01');
    await expect(getEntry('2026-01-01')).resolves.toBeUndefined();
  });

  it('clears settings and entries', async () => {
    await saveSettings({ ...(await getSettings()), targetCalories: 1800 });
    await saveEntry(entry('2026-01-01'));

    await clearAllData();

    await expect(getEntry('2026-01-01')).resolves.toBeUndefined();
    await expect(getSettings()).resolves.toMatchObject({ targetCalories: 2000 });
  });
});
