export type ThemeMode = 'light' | 'dark' | 'system';
export type ChartType = 'line' | 'bar';

export interface Settings {
  id: 'settings';
  targetCalories: number;
  themeMode: ThemeMode;
  chartType: ChartType;
  updatedAt: string;
}

export interface DailyEntry {
  date: string;
  calories: number;
  exerciseMinutes: number;
  targetCalories: number;
  dietPower: number;
  createdAt: string;
  updatedAt: string;
}
