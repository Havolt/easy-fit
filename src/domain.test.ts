import { describe, expect, it } from 'vitest';
import {
  calculateCalorieScore,
  calculateDietPower,
  calculateExerciseBonusMinutes,
  calculateExerciseScore,
  entryFromInput,
  today,
  validateDate,
  validateEntry,
  validateTarget,
} from './domain';

describe('calculateCalorieScore', () => {
  it('gives full credit across the agreed calorie range', () => {
    expect(calculateCalorieScore(1800, 2000)).toBe(100);
    expect(calculateCalorieScore(1850, 2000)).toBe(100);
    expect(calculateCalorieScore(1900, 2000)).toBe(100);
  });

  it('gradually reduces credit below the full-score range', () => {
    expect(calculateCalorieScore(1700, 2000)).toBe(95);
    expect(calculateCalorieScore(1500, 2000)).toBe(85);
  });

  it('keeps the over-target penalty relative to the sweet spot', () => {
    expect(calculateCalorieScore(2000, 2000)).toBe(95);
    expect(calculateCalorieScore(2100, 2000)).toBe(90);
  });

  it('gradually reduces credit outside the full-score range', () => {
    expect(calculateCalorieScore(1750, 2000)).toBe(98);
    expect(calculateCalorieScore(1950, 2000)).toBe(98);
    expect(calculateCalorieScore(1600, 1500)).toBe(87);
    expect(calculateCalorieScore(1400, 1500)).toBe(100);
  });
});

describe('calculateExerciseScore', () => {
  it('rewards early exercise more strongly with a diminishing curve', () => {
    expect(calculateExerciseScore(35)).toBe(50);
    expect(calculateExerciseScore(70)).toBe(71);
    expect(calculateExerciseScore(120)).toBe(93);
  });

  it('reaches and stays at the maximum at 140 minutes', () => {
    expect(calculateExerciseScore(140)).toBe(100);
    expect(calculateExerciseScore(180)).toBe(100);
  });
});

describe('calculateExerciseBonusMinutes', () => {
  it('only counts exercise beyond the score cap as bonus bamboo', () => {
    expect(calculateExerciseBonusMinutes(0)).toBe(0);
    expect(calculateExerciseBonusMinutes(140)).toBe(0);
    expect(calculateExerciseBonusMinutes(141)).toBe(1);
    expect(calculateExerciseBonusMinutes(180)).toBe(40);
  });
});

describe('calculateDietPower', () => {
  it('combines full calorie and exercise scores to 100', () => {
    expect(calculateDietPower(1800, 2000, 140)).toBe(100);
    expect(calculateDietPower(1900, 2000, 140)).toBe(100);
  });

  it('preserves the 70 percent calorie and 30 percent exercise weighting', () => {
    expect(calculateDietPower(1800, 2000, 0)).toBe(70);
    expect(calculateDietPower(1700, 2000, 140)).toBe(96);
  });

  it('always stays within the 0 to 100 range', () => {
    for (const calories of [0, 1000, 2000, 100000]) {
      for (const exercise of [0, 140, 1440]) {
        expect(calculateDietPower(calories, 2000, exercise)).toBeGreaterThanOrEqual(0);
        expect(calculateDietPower(calories, 2000, exercise)).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('validation', () => {
  it('rejects invalid entry values', () => {
    expect(validateEntry(-1, 30)).toBeTruthy();
    expect(validateEntry(100001, 30)).toBeTruthy();
    expect(validateEntry(1800, -1)).toBeTruthy();
    expect(validateEntry(1800, 1441)).toBeTruthy();
    expect(validateEntry(1800, 30)).toBeNull();
  });

  it('rejects invalid calorie targets', () => {
    expect(validateTarget(0)).toBeTruthy();
    expect(validateTarget(100001)).toBeTruthy();
    expect(validateTarget(2000)).toBeNull();
  });

  it('rejects malformed and future dates', () => {
    expect(validateDate('not-a-date')).toBeTruthy();
    expect(validateDate('2999-01-01')).toBeTruthy();
    expect(validateDate(today())).toBeNull();
  });
});

describe('entryFromInput', () => {
  it('creates a scored entry with timestamps', () => {
    const entry = entryFromInput('2026-01-01', 1800, 140, 2000);

    expect(entry).toMatchObject({
      date: '2026-01-01',
      calories: 1800,
      exerciseMinutes: 140,
      targetCalories: 2000,
      dietPower: 100,
    });
    expect(entry.createdAt).toEqual(expect.any(String));
    expect(entry.updatedAt).toEqual(expect.any(String));
  });

  it('preserves creation time while updating an existing entry', () => {
    const existing = entryFromInput('2026-01-01', 1800, 30, 2000);
    const updated = entryFromInput('2026-01-01', 1900, 60, 2000, existing);

    expect(updated.createdAt).toBe(existing.createdAt);
    expect(updated.updatedAt).toBeTruthy();
  });
});
