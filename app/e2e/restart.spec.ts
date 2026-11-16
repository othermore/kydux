// Every run starts the level again, quickly, with a spinner (D75); the win card's
// stars are big, each drawn in after the one before.

import { expect, test } from '@playwright/test';
import { seedWizard, skipGuide } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

test('a run shows the level starting again before it plays, and Restart does too', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#level/the-gate');
  await skipGuide(page);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  const note = page.locator('#restart-note');
  await expect(note).toBeHidden();
  await page.locator('.cm-content').click();
  await page.keyboard.insertText('wizard.move_right()');
  await page.locator('#run').click();
  await expect(note).toBeVisible();
  // A spinner, no words on the screen; the words are for a screen reader.
  await expect(note.locator('.restart-spinner')).toHaveCount(1);
  await expect(note).toHaveText('');
  await expect(note).toHaveAttribute('aria-label', 'Starting the level again…');
  await expect(page.locator('#scene')).toHaveAttribute('data-restarting', 'true');
  await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });
  await expect(note).toBeHidden();

  // The stars: one span each, the earned ones marked so.
  const stars = page.locator('.win-card .stars .star');
  await expect(stars).toHaveCount(3);
  await expect(page.locator('.win-card .stars .star.earned')).toHaveCount(3);
  await expect(page.locator('.win-card .stars')).toHaveText('★★★');
  // Each star is drawn in after the one before, and stays.
  await expect(stars.nth(2)).toHaveCSS('opacity', '1');

  await page.locator('#again').click();
  await page.locator('#restart').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-restarting', 'true');
  await expect(page.locator('#scene')).not.toHaveAttribute('data-restarting', /./);
  await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '7,20');
});
