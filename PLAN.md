# Simple Diet App Plan

## 1. Product goal

Build a deliberately simple dieting app that asks for only two daily inputs:

1. Calories consumed
2. Minutes spent exercising

The app compares calories consumed with a user-defined daily calorie target, combines calorie adherence and exercise into a single **diet power score**, and displays progress over time in a D3 line chart. It must be installable as a Progressive Web App (PWA) and remain fully usable without an internet connection after the first visit.

The score is intended as a motivating trend indicator, not an exact health or medical measurement.

## 2. Product personality

The app's mascot is a friendly panda wearing a sweatband. The mascot should make the app feel encouraging and approachable without turning the experience into a complex game.

### Mascot usage

- Use the panda in the app shell, empty state, and lightweight success or encouragement states.
- Keep the artwork simple, recognizable, and suitable for small screens and offline-bundled assets.
- Use expressions or poses to reinforce progress without implying medical judgment.
- Treat the mascot as visual encouragement only; it must not obscure scores, inputs, errors, or accessibility labels.
- Include the mascot assets in the PWA cache so they work offline.
- Animate the mascot by score branch: 0–19 sleeping, 20–39 sitting, 40–59 standing, 60–79 walking, and 80–100 sprinting.
- Provide a text label and respect `prefers-reduced-motion` so the state remains understandable without animation.

### Theme modes

- Offer `Light`, `Dark`, and `System` choices.
- Use the operating system's `prefers-color-scheme` setting when `System` is selected.
- Persist the user's choice in IndexedDB so it is retained across reloads, browser restarts, and offline use.
- Apply the theme before the main interface renders where practical to minimize a flash of the wrong theme.
- Ensure text, controls, chart lines, chart grid elements, focus indicators, and panda artwork maintain accessible contrast in every mode.
- Respect `prefers-reduced-motion` for theme transitions and chart interactions.

## 3. MVP scope

### Included

- Set and edit a daily calorie target.
- Record one entry per calendar day.
- Enter calories consumed for a day.
- Enter exercise minutes for a day.
- Calculate and display a daily diet power score from 0 to 100.
- Show the score for the selected day.
- Show a line chart of scores across previous days.
- Allow switching the progress visualization between line and bar charts.
- Show the calorie target, consumed calories, and exercise minutes alongside the score.
- Edit an existing day.
- Delete an individual day or all locally stored data.
- Prevent entries for dates after the current local date.
- Save the calorie target used for each day while allowing the default target to be changed for future entries.
- Explain that the target is a user-selected weight-loss goal and that the score sweet spot is approximately 100 calories below it, with a general-reference caveat.
- Responsive, accessible interface for desktop and mobile.
- Light, dark, and system theme modes.
- Show an offline carousel of 200 attributed fitness, health, and perseverance quotations: 100 public-domain selections and 100 contemporary quotations supplied by the user.
- Persist data locally in the browser so entries survive reloads, app restarts, and offline use.
- Install and launch as a PWA.
- Cache the application shell and assets with a service worker.

### Explicitly not included in the first version

- Food databases, barcode scanning, meal-level tracking, or recipe planning.
- Wearable or fitness-device integrations.
- Weight tracking, body measurements, or medical recommendations.
- Social features, accounts, sharing, or subscriptions.
- Automated calorie-target recommendations.
- Gamification beyond the trend visualization.

## 4. Proposed user flow

1. The user opens the app and sees the current calorie target.
2. The user enters today's calories and exercise minutes.
3. The app validates the values and saves the daily entry.
4. The app calculates today's diet power score.
5. The dashboard shows:
   - Today's score
   - Calories versus target
   - Exercise minutes
   - A short status such as "On target" or "Above target"
6. The line chart plots today's score alongside previous daily scores.
7. The user can select a day on the chart or from the daily history to inspect its details.

## 5. Diet power formula

The first implementation should make the formula visible in the UI or help text so users understand that it is a simple, configurable heuristic.

### Draft formula

Let:

- `targetCalories` be the user's daily target.
- `calories` be the calories consumed.
- `exerciseMinutes` be the minutes exercised.

Calorie adherence:

```text
sweetSpot = max(0, targetCalories - 100)
calorieScore = max(0, 1 - abs(calories - sweetSpot) / targetCalories)
```

Exercise contribution:

```text
if exerciseMinutes <= 60:
    effectiveExercise = exerciseMinutes
else if exerciseMinutes <= 90:
    effectiveExercise = 60 + (exerciseMinutes - 60) * 0.5
else:
    effectiveExercise = 75 + (exerciseMinutes - 90) * 0.25

exerciseScore = min(effectiveExercise / 120, 1)
```

Combined score:

```text
dietPower = round(100 * (0.7 * calorieScore + 0.3 * exerciseScore))
```

The entered target is a strong result, but the calorie component peaks at a sweet spot approximately 100 calories below the target. Moving above or below that sweet spot gradually reduces the calorie component. This is a simple heuristic and is not a recommendation to restrict calories to a medically unsafe level.

This gives calorie adherence the larger weight while allowing exercise beyond 60 minutes to continue improving the score like chip damage: every additional minute can help, but its effect is smaller. Exercise is linear through 60 minutes, contributes at half-rate from 60 to 90 minutes, and contributes at quarter-rate beyond 90 minutes. The score is bounded at its maximum so long workouts cannot overwhelm calorie adherence. This is a motivational heuristic rather than a physiological model of total energy expenditure.

### Formula safeguards

- Reject zero or negative calorie targets.
- Reject negative calorie or exercise values.
- Decide and document a reasonable upper bound for numeric inputs.
- Keep the approximately 100-calorie sweet spot configurable and prevent the formula from rewarding increasingly restrictive intake.
- Avoid presenting a high or low score as a medical judgment.
- Keep the scoring function isolated and unit-tested so the weights or diminishing-return thresholds can be changed later without rewriting the UI or storage layer.

## 6. Technical architecture

### Frontend

- React with TypeScript.
- Vite for development and production bundling.
- D3 for the score line chart, scales, axes, paths, points, and interaction.
- A small component structure:
  - `Dashboard`
  - `TargetSettings`
  - `DailyEntryForm`
  - `TodaySummary`
  - `ProgressChart`
  - `HistoryList`
- Use semantic HTML and keyboard-accessible controls.
- Keep D3 responsible for chart rendering and calculations in shared TypeScript utilities where appropriate; keep React responsible for application state and lifecycle.

### Runtime and build

- Node.js with TypeScript for the development toolchain, scripts, testing, and production build.
- Vite with a PWA plugin or Workbox integration to generate and manage the service worker.
- No backend is required for the offline MVP.

### Browser persistence

- Use IndexedDB for settings and daily entries.
- Put storage behind a repository interface so the domain and UI do not depend directly on IndexedDB.
- Version the IndexedDB schema and provide migrations for future changes.
- Treat the local browser database as the source of truth for this single-user MVP.
- Do not use `localStorage` for the main data store; it is synchronous and less suitable for structured history.

## 7. Data model

### Settings

```text
Settings
- id
- targetCalories
- themeMode             // "light", "dark", or "system"
- chartType             // "line" or "bar"
- updatedAt
```

### Daily entries

```text
DailyEntry
- date                 // unique calendar date, stored as YYYY-MM-DD
- calories
- exerciseMinutes
- targetCalories       // target in effect when this day was saved
- dietPower            // either persisted or calculated consistently on read
- createdAt
- updatedAt
```

The persistence layer should use ISO calendar dates and define the timezone behavior explicitly to avoid entries moving to a neighboring day.

## 8. Local data-access outline

The repository interface should provide the operations the dashboard needs without exposing IndexedDB details:

```text
getSettings()
saveSettings(settings)
listEntries(from, to)
getEntry(date)
saveEntry(entry)
deleteEntry(date)
```

The domain layer must validate dates and numeric values before persistence. The UI should surface validation and storage errors rather than silently substituting defaults.

An unlogged selected day is shown as `Pending`, not as a zero score or a misleading `/100` value.

If cloud sync or accounts are added later, a remote API can implement a second repository and synchronization layer without changing the scoring logic or chart components. Sync is explicitly out of scope for the offline MVP.

## 9. Dashboard and chart behavior

- Default to the current day and a useful recent range, such as the last 30 days.
- Plot one point per recorded day.
- Use the date on the x-axis and diet power from 0 to 100 on the y-axis.
- Make missing days visually distinct from a score of zero; do not invent entries for days without data.
- Provide a tooltip or accessible selected-day panel with:
  - Date
  - Diet power
  - Calories and target
  - Exercise minutes
- Include a small reference line or label at the target score of 100.
- Ensure the chart remains readable on narrow screens and has a text-based history fallback.

## 10. Testing strategy

### Unit tests

- Formula calculations at the sweet spot, at the target, above the target, below the sweet spot, zero exercise, 60 minutes, 90 minutes, and exercise beyond 90 minutes.
- Input validation and date validation.
- Repository operations for creating, updating, reading, and deleting entries.
- Theme preference persistence and system-theme changes.

### Persistence tests

- Settings read/update through the repository.
- Daily entry create/update/read/delete.
- Invalid payloads and duplicate-date behavior.
- Date range queries.
- IndexedDB schema initialization and migration behavior.
- Preventing future dates.
- Deleting an individual entry and clearing all local data.
- Preserving the target snapshot on an existing day when the default target changes.
- Showing the fixed weight-loss target explanation.

### Frontend tests

- Form validation and save states.
- Summary rendering from repository data.
- Empty state when no entries exist.
- Chart rendering with normal, missing, and single-day datasets.

### Manual checks

- Keyboard navigation.
- Mobile layout.
- Clear error states when local storage is unavailable.
- Timezone behavior around midnight.

## 11. Delivery phases

### Phase 1: PWA project foundation

- Create the React/Vite frontend and Node/TypeScript build toolchain.
- Configure shared scripts, TypeScript, linting, and tests.
- Add the PWA manifest, icons, theme metadata, and basic app shell.
- Configure the service worker and production asset caching.

### Phase 2: Core domain and offline persistence

- Implement the versioned IndexedDB settings and daily-entry schema.
- Implement the repository layer.
- Implement the formula as a tested domain function.
- Add domain validation and explicit storage error handling.

### Phase 3: Simple dashboard

- Add target settings.
- Add theme mode settings and initialize the selected theme.
- Add the 200-quote inspiration carousel with accessible controls, subtle transitions, and reduced-motion behavior.
- Add the daily entry form.
- Add today's summary and recent history.
- Connect the frontend to the repository layer.

### Phase 4: D3 progress visualization

- Add the score line chart.
- Add a persisted line/bar chart selector with accessible controls.
- Add responsive sizing, selected points, tooltips or an accessible details panel, and missing-day handling.

### Phase 5: Hardening

- Add loading, empty, validation, and local-storage-error states.
- Add individual-day and all-data deletion with confirmation.
- Add offline-ready/install guidance and a clear local-data notice.
- Test a production build with network access disabled after the initial load.
- Test reload, browser restart, and PWA launch while offline.
- Run unit, persistence, and frontend tests.
- Check responsive and keyboard behavior.
- Document local setup, offline behavior, data storage, formula behavior, and scope limitations.

## 12. Decisions to confirm before implementation

The plan assumes the following defaults unless changed:

1. **Single-user local app:** no login or multi-user support in the MVP.
2. **Persistence:** IndexedDB running in the browser.
3. **Chart range:** last 30 days by default, with a later option to change range.
4. **Scoring weights:** 70% calorie adherence and 30% exercise; exercise remains beneficial beyond 60 minutes but contributes at diminishing rates after 60 and 90 minutes.
5. **Calorie scoring:** the score peaks approximately 100 calories below the target; the target itself remains a strong result, and moving farther above or below the sweet spot gradually reduces the component.
6. **Day handling:** one editable entry per local calendar date; missing days are not scored.
7. **Target setup:** the user supplies the target; the app does not recommend one.
8. **Offline storage:** IndexedDB in the browser; no account, cloud sync, or backend dependency in the MVP.
9. **PWA behavior:** the app is installable and its production shell is cached for offline launch after the first successful load.
10. **Mascot:** a friendly panda wearing a sweatband, used as lightweight visual encouragement.
11. **Theme:** users can choose Light, Dark, or System; System follows the operating system preference.
12. **Chart view:** users can choose a line or bar chart, with the preference stored locally.

These choices can be adjusted before Phase 1, especially the formula and whether the app should remain single-user/local or support accounts.
