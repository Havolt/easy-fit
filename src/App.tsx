import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { clearAllData, deleteEntry, getSettings, listEntries, saveEntry, saveSettings } from './db';
import {
  calculateCalorieScore,
  calculateExerciseBonusMinutes,
  calculateExerciseScore,
  DEFAULT_TARGET,
  entryFromInput,
  formatDate,
  resolveTheme,
  today,
  validateDate,
  validateEntry,
  validateTarget,
} from './domain';
import type { ChartType, DailyEntry, Settings, ThemeMode } from './types';
import { ProgressChart } from './ProgressChart';
import { PandaMascot } from './PandaMascot';
import { QuoteCarousel } from './QuoteCarousel';

const initialDate = today();
function startDate() {
  const date = new Date(`${initialDate}T12:00:00`);
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
}

export default function App() {
  const [settings, setSettings] = useState<Settings>();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calories, setCalories] = useState('');
  const [exercise, setExercise] = useState('');
  const [caloriesBlurred, setCaloriesBlurred] = useState(false);
  const [exerciseBlurred, setExerciseBlurred] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isReady, setReady] = useState(false);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.date === selectedDate),
    [entries, selectedDate],
  );
  useEffect(() => {
    void Promise.all([getSettings(), listEntries(startDate(), initialDate)])
      .then(([loadedSettings, loadedEntries]) => {
        setSettings({ ...loadedSettings, chartType: loadedSettings.chartType ?? 'line' });
        setEntries(
          loadedEntries.map((entry) => ({
            ...entry,
            targetCalories: entry.targetCalories ?? loadedSettings.targetCalories,
          })),
        );
        setReady(true);
      })
      .catch(() =>
        setError('Could not open local storage. Your browser may be blocking offline data.'),
      );
  }, []);
  useEffect(() => {
    if (!settings) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const theme = resolveTheme(settings.themeMode);
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    };
    applyTheme();
    if (settings.themeMode === 'system') {
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [settings]);
  useEffect(() => {
    if (selectedEntry) {
      setCalories(String(selectedEntry.calories));
      setExercise(String(selectedEntry.exerciseMinutes));
    } else {
      setCalories('');
      setExercise('');
    }
    setCaloriesBlurred(false);
    setExerciseBlurred(false);
  }, [selectedEntry, selectedDate]);

  async function updateSettings(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch, updatedAt: new Date().toISOString() };
    await saveSettings(next);
    setSettings(next);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaved(false);
    if (!settings) return;
    const dateValidation = validateDate(selectedDate);
    if (dateValidation) {
      setError(dateValidation);
      return;
    }
    const calorieValue = Number(calories);
    const exerciseValue = Number(exercise);
    const validation = validateEntry(calorieValue, exerciseValue);
    if (validation) {
      setError(validation);
      return;
    }
    const entry = entryFromInput(
      selectedDate,
      calorieValue,
      exerciseValue,
      settings.targetCalories,
      selectedEntry,
    );
    try {
      await saveEntry(entry);
      setEntries((current) =>
        [...current.filter((item) => item.date !== entry.date), entry].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      );
      setSaved(true);
    } catch {
      setError('Could not save this day locally. Please try again.');
    }
  }
  async function removeSelectedEntry() {
    if (!selectedEntry || !window.confirm(`Delete the entry for ${formatDate(selectedDate)}?`))
      return;
    try {
      await deleteEntry(selectedDate);
      setEntries((current) => current.filter((entry) => entry.date !== selectedDate));
      setSaved(false);
      setError('');
    } catch {
      setError('Could not delete this day locally. Please try again.');
    }
  }
  async function removeEntry(date: string) {
    if (!window.confirm(`Delete the entry for ${formatDate(date)}?`)) return;
    try {
      await deleteEntry(date);
      setEntries((current) => current.filter((entry) => entry.date !== date));
      if (selectedDate === date) {
        setCalories('');
        setExercise('');
        setSaved(false);
      }
      setError('');
    } catch {
      setError('Could not delete this day locally. Please try again.');
    }
  }
  async function removeAllData() {
    if (
      !window.confirm(
        'Delete all saved days, your calorie target, and theme preference? This cannot be undone.',
      )
    )
      return;
    try {
      await clearAllData();
      const resetSettings: Settings = {
        id: 'settings',
        targetCalories: DEFAULT_TARGET,
        themeMode: 'system',
        chartType: 'line',
        updatedAt: new Date().toISOString(),
      };
      setSettings(resetSettings);
      setEntries([]);
      setCalories('');
      setExercise('');
      setSaved(false);
      setError('');
    } catch {
      setError('Could not delete your local data. Please try again.');
    }
  }
  if (!isReady || !settings)
    return <main className="loading">Loading your panda-powered plan...</main>;
  const current = selectedEntry;
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}panda.svg`} alt="" />
          <div>
            <p className="eyebrow">Simple Diet</p>
            <h1>Small steps. Strong streak.</h1>
          </div>
        </div>
        <label className="theme-control">
          <span className="sr-only">Color theme</span>
          <select
            className="theme-select"
            value={settings.themeMode}
            aria-label="Color theme"
            onChange={(event) =>
              void updateSettings({ themeMode: event.target.value as ThemeMode })
            }
          >
            <option value="system">◐ System</option>
            <option value="light">☀ Light</option>
            <option value="dark">☾ Dark</option>
          </select>
        </label>
      </header>
      <QuoteCarousel />
      <section className="hero card">
        <div>
          <p className="eyebrow">Your diet power</p>
          {current ? (
            <div className="score">
              {current.dietPower}
              <span>/100</span>
            </div>
          ) : (
            <div className="score pending">Pending</div>
          )}
          <p className="muted">
            {current ? 'This day is in the books.' : 'Log this day to get your score.'}
          </p>
        </div>
        {current && (
          <div className="score-breakdown" aria-label="Daily score breakdown">
            <div className="component-score">
              <span>Calories</span>
              <strong>
                {calculateCalorieScore(current.calories, current.targetCalories)}
                <small>/100</small>
              </strong>
            </div>
            <div className="component-score">
              <span>Exercise</span>
              <strong>
                {calculateExerciseScore(current.exerciseMinutes)}
                <small>/100</small>
              </strong>
              {calculateExerciseBonusMinutes(current.exerciseMinutes) > 0 && (
                <em>+{calculateExerciseBonusMinutes(current.exerciseMinutes)} Bonus Bamboo</em>
              )}
            </div>
          </div>
        )}
        <div className="panda-message">
          <PandaMascot score={current?.dietPower ?? 0} hasData={Boolean(current)} />
          <p>
            {current ? (
              <>
                Keep it simple.
                <br />
                <strong>Keep showing up.</strong>
              </>
            ) : (
              <>
                No score yet.
                <br />
                <strong>Have some bamboo.</strong>
              </>
            )}
          </p>
        </div>
      </section>
      <div className="layout">
        <section className="card form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Daily check-in</p>
              <h2>How did you move today?</h2>
            </div>
            <input
              type="date"
              max={initialDate}
              value={selectedDate}
              onChange={(event) => {
                const date = event.target.value;
                if (!validateDate(date)) {
                  setSelectedDate(date);
                  setError('');
                }
              }}
            />
          </div>
          <form onSubmit={(event) => void submit(event)}>
            <label>
              Calories eaten
              <input
                type="number"
                min="0"
                max="100000"
                value={calories}
                onChange={(event) => {
                  setCalories(event.target.value);
                  setCaloriesBlurred(false);
                }}
                onBlur={() => setCaloriesBlurred(true)}
                placeholder="e.g. 2000"
                required
              />
            </label>
            {caloriesBlurred && calories !== '' && Number(calories) < 1000 && (
              <p className="warning" role="status">
                That is a very low calorie intake for many adults. Consider checking your target
                with a qualified health professional.
              </p>
            )}
            <label>
              Exercise minutes
              <input
                type="number"
                min="0"
                max="1440"
                value={exercise}
                onChange={(event) => {
                  setExercise(event.target.value);
                  setExerciseBlurred(false);
                }}
                onBlur={() => setExerciseBlurred(true)}
                placeholder="e.g. 30"
                required
              />
            </label>
            {exerciseBlurred && exercise !== '' && Number(exercise) < 15 && (
              <p className="warning" role="status">
                Less than 15 minutes of exercise today. Even a short, gentle walk can be a useful
                start if it feels right for you.
              </p>
            )}
            <button type="submit">{current ? 'Update day' : 'Save day'}</button>
            {current && (
              <button
                type="button"
                className="danger-button"
                onClick={() => void removeSelectedEntry()}
              >
                Delete this day
              </button>
            )}
            {saved && (
              <p className="success" role="status">
                {current ? 'Updated locally — nice work.' : 'Saved locally — nice work.'}
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </form>
          <div className="target-row">
            <span>Daily calorie target</span>
            <label>
              <input
                aria-label="Daily calorie target"
                type="number"
                min="1"
                value={settings.targetCalories}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (!validateTarget(value)) void updateSettings({ targetCalories: value });
                }}
              />{' '}
              kcal
            </label>
          </div>
          <div className="target-info">
            <p>
              <strong>Weight-loss target</strong>
            </p>
            <p>
              This is the daily amount you have chosen to aim for weight loss. The score sweet spot
              is around 100 kcal below this target. The app does not calculate or medically assess
              whether it is right for you.
            </p>
          </div>
        </section>
        <section className="card chart-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Last 30 days</p>
              <h2>Your trend</h2>
            </div>
            <div className="chart-tools">
              <span className="legend">
                <i /> Diet power
              </span>
              <div className="chart-toggle" role="group" aria-label="Chart type">
                <button
                  type="button"
                  className={settings.chartType === 'line' ? 'active' : ''}
                  aria-label="Line chart"
                  aria-pressed={settings.chartType === 'line'}
                  onClick={() => void updateSettings({ chartType: 'line' })}
                >
                  ⌁
                </button>
                <button
                  type="button"
                  className={settings.chartType === 'bar' ? 'active' : ''}
                  aria-label="Bar chart"
                  aria-pressed={settings.chartType === 'bar'}
                  onClick={() => void updateSettings({ chartType: 'bar' })}
                >
                  ▥
                </button>
              </div>
            </div>
          </div>
          <ProgressChart
            entries={entries}
            chartType={settings.chartType}
            onSelect={(entry) => setSelectedDate(entry.date)}
          />
          <p className="chart-note">
            Calories make the biggest difference, but exercise helps too.
          </p>
        </section>
      </div>
      <section className="card history">
        <div className="section-heading">
          <div>
            <p className="eyebrow">History</p>
            <h2>Recent days</h2>
          </div>
          <span className="muted">{entries.length} logged</span>
        </div>
        {entries.length ? (
          <div className="history-list">
            {[...entries]
              .reverse()
              .slice(0, 7)
              .map((entry) => (
                <div
                  className={entry.date === selectedDate ? 'history-item selected' : 'history-item'}
                  key={entry.date}
                >
                  <button className="history-select" onClick={() => setSelectedDate(entry.date)}>
                    <span>{formatDate(entry.date)}</span>
                    <strong>
                      {entry.dietPower}
                      <small>/100</small>
                    </strong>
                    <span>
                      {entry.calories} kcal · {entry.exerciseMinutes} min
                    </span>
                  </button>
                  <button
                    type="button"
                    className="history-delete"
                    aria-label={`Delete ${formatDate(entry.date)} from history`}
                    onClick={() => {
                      setSelectedDate(entry.date);
                      void removeEntry(entry.date);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p className="empty">Your panda is ready when you are. Log your first day above.</p>
        )}
      </section>
      <footer>
        Works offline · Your data stays in this browser{' '}
        <button type="button" className="delete-all" onClick={() => void removeAllData()}>
          Delete all data
        </button>
      </footer>
    </main>
  );
}
