import type { DailyEntry, ThemeMode } from './types';

export const DEFAULT_TARGET = 2000;
export const SWEET_SPOT_OFFSET = 100;

export function calculateDietPower(calories: number, targetCalories: number, exerciseMinutes: number): number {
  const sweetSpot = Math.max(0, targetCalories - SWEET_SPOT_OFFSET);
  const calorieScore = Math.max(0, 1 - Math.abs(calories - sweetSpot) / targetCalories);
  const effectiveExercise = exerciseMinutes <= 60
    ? exerciseMinutes
    : exerciseMinutes <= 90
      ? 60 + (exerciseMinutes - 60) * 0.5
      : 75 + (exerciseMinutes - 90) * 0.25;
  const exerciseScore = Math.min(effectiveExercise / 120, 1);
  return Math.round(100 * (0.7 * calorieScore + 0.3 * exerciseScore));
}

export function validateEntry(calories: number, exerciseMinutes: number): string | null {
  if (!Number.isFinite(calories) || calories < 0 || calories > 100000) return 'Calories must be between 0 and 100,000.';
  if (!Number.isFinite(exerciseMinutes) || exerciseMinutes < 0 || exerciseMinutes > 1440) return 'Exercise must be between 0 and 1,440 minutes.';
  return null;
}

export function validateDate(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today()) return 'You can only log today or an earlier date.';
  return null;
}

export function validateTarget(targetCalories: number): string | null {
  if (!Number.isFinite(targetCalories) || targetCalories <= 0 || targetCalories > 100000) return 'Target must be between 1 and 100,000 calories.';
  return null;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

export function today(): string {
  const date = new Date();
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function entryFromInput(date: string, calories: number, exerciseMinutes: number, target: number, existing?: DailyEntry): DailyEntry {
  const now = new Date().toISOString();
  return {
    date,
    calories,
    exerciseMinutes,
    targetCalories: target,
    dietPower: calculateDietPower(calories, target, exerciseMinutes),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}
