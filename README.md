# Simple Diet

Simple Diet is an offline-first React and TypeScript Progressive Web App for tracking two daily signals:

- Calories eaten
- Exercise minutes

It combines them into a motivating **diet power** score and shows progress in a D3 chart. The app is intentionally lightweight: there are no meal databases, accounts, social features, or cloud services.

## Features

- Daily calorie and exercise check-ins
- User-defined weight-loss calorie target
- Diet power score from 0 to 100
- Daily calorie and exercise component scores from 0 to 100
- Line and bar chart views
- Recent-day history with individual deletion
- Delete-all-data option
- Future dates blocked
- Historical target value saved with each day
- Animated panda mascot with score-based states
- Contemporary and public-domain inspiration quote carousel
- Light, dark, and system themes
- Installable PWA
- Fully usable offline after the first successful load
- IndexedDB browser persistence

## Formula

The score is a simple motivational heuristic, not a medical measurement.

### Calories

The calorie sweet spot is approximately 100 calories below the daily target. A 100-calorie
full-score buffer below that sweet spot avoids penalizing a modestly lower intake:

```text
sweetSpot = max(0, targetCalories - 100)
fullScoreStart = max(0, sweetSpot - 100)
distanceFromFullScoreRange =
  calories < fullScoreStart ? fullScoreStart - calories :
  calories > sweetSpot ? calories - sweetSpot : 0
calorieScore = max(0, 1 - distanceFromFullScoreRange / targetCalories)
```

For example, with a 2,000-calorie target, 1,800–1,900 calories receives 100/100. The score
gradually decreases below 1,800 or above 1,900.

### Exercise

Exercise uses a diminishing-returns curve that reaches the maximum exercise score at 140
minutes:

```text
exerciseScore = min(100, round(100 × √(exerciseMinutes / 140)))
```

Exercise after 140 minutes is shown as bonus time but does not increase the exercise score above 100. The combined score gives calories 70% of the weight and exercise 30%. The result is bounded
from 0 to 100.
The dashboard also shows the individual calorie and exercise scores for the selected day.

The app shows gentle warnings for:

- Fewer than 1,000 calories
- Fewer than 15 minutes of exercise

These warnings do not block saving and are not medical advice.

## Development

### Requirements

- Node.js 20 or newer
- npm

### Install dependencies

```powershell
npm install
```

### Start the development server

```powershell
npm run dev
```

### Validate and build

```powershell
npm run build
```

The production output is generated in `dist/`.

### Format source files

Prettier is configured for TypeScript, TSX, CSS, JSON, Markdown, HTML, and YAML:

```powershell
npm run format
```

To check formatting without changing files:

```powershell
npm run format:check
```

### Preview the production build

```powershell
npm run preview
```

To test offline behavior, load the production preview once, then disable network access and reload the app.

## Data and privacy

Daily entries and settings are stored in IndexedDB in the current browser. The MVP has:

- No backend
- No login
- No cloud synchronization
- No automatic backup

Clearing browser site data or using another browser/device will not carry the entries across. Use the in-app delete controls carefully because deleted local data cannot be recovered.

## Deployment

### Vercel

The repository includes [vercel.json](./vercel.json) for single-page-app rewrites.

Use these Vercel settings:

```text
Build command:   npm run build
Output directory: dist
```

Vercel can usually detect these settings automatically.

### GitHub Pages

The repository includes a GitHub Actions workflow at [.github/workflows/deploy-pages.yml](./.github/workflows/deploy-pages.yml).

To enable deployment:

1. Push the repository to GitHub.
2. In the repository, open **Settings → Pages**.
3. Set the source to **GitHub Actions**.
4. Push to the `main` branch or run the workflow manually.

The workflow sets `VITE_BASE_PATH` to the repository name so assets work on a project Pages URL.

## Project structure

```text
src/
  App.tsx                 Main dashboard and interactions
  ProgressChart.tsx       D3 line and bar charts
  PandaMascot.tsx         Score-based mascot states
  QuoteCarousel.tsx       Inspiration carousel
  contemporaryQuotes.ts   Supplied contemporary quote set
  quotes.ts               Public-domain inspiration set
  domain.ts               Scoring and validation rules
  db.ts                   IndexedDB persistence
  styles.css              Application styles and animations
public/
  panda.svg               PWA mascot asset
vite.config.ts            Vite and PWA configuration
```

## Scope and safety

Simple Diet is a personal tracking and motivation tool. It does not calculate individualized calorie needs, diagnose conditions, or replace advice from a qualified health professional. Users should choose targets responsibly and seek professional guidance when appropriate.
