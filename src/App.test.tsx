import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { clearAllData, saveEntry } from './db';
import { today } from './domain';
import type { DailyEntry } from './types';

describe('App score breakdown', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('shows component scores and Bonus Bamboo for a saved day', async () => {
    const savedEntry: DailyEntry = {
      date: today(),
      calories: 1800,
      exerciseMinutes: 180,
      targetCalories: 2000,
      dietPower: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveEntry(savedEntry);

    render(<App />);

    expect(await screen.findByText('Calories')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.getByText('+40 Bonus Bamboo')).toBeInTheDocument();
    expect(screen.getAllByText('100', { selector: 'strong' })).toHaveLength(3);
  });

  it('saves a new day from the check-in form and displays its scores', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('How did you move today?');
    await user.type(screen.getAllByPlaceholderText('e.g. 2000')[0], '1800');
    await user.type(screen.getByPlaceholderText('e.g. 30'), '140');
    await user.click(screen.getByRole('button', { name: 'Save day' }));

    await waitFor(() => {
      expect(screen.getByText('This day is in the books.')).toBeInTheDocument();
    });
    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    await expect(screen.findByText('Updated locally — nice work.')).resolves.toBeInTheDocument();
  });
});
