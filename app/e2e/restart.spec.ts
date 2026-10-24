// Every run starts the level again, and says so (D75); the win card's stars
// are big, each drawn in after the one before.

import { expect, test } from '@playwright/test';
import { seedWizard, skipGuide } from './helpers';

test.use({ locale: 'en-US' });

test('a run shows the level starting again before it plays, and Restart does too', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#level/the-gate');
  await page.locator('#start').click();
  await skipGuide(page);
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  const note = page.locator('#restart-note');
  await expect(note).toBeHidden();
  await page.locator('.cm-content').click();
  await page.keyboard.insertText('wizard.move_right()');
  await page.locator('#run').click();
  await expect(note).toBeVisible();
  await expect(note).toHaveText('Starting the level again…');
  await expect(page.locator('#scene')).toHaveAttribute('data-restarting', 'true');
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
  await expect(note).toBeHidden();

  // The stars: one span each, the earned ones marked so.
  const stars = page.locator('.win-card .stars .star');
  await expect(stars).toHaveCount(3);
  await expect(page.locator('.win-card .stars .star.earned')).toHaveCount(3);
  await expect(page.locator('.win-card .stars')).toHaveText('★★★');

  await page.locator('#again').click();
  await page.locator('#restart').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-restarting', 'true');
  await expect(page.locator('#scene')).not.toHaveAttribute('data-restarting', /./);
  await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '7,20');
});
