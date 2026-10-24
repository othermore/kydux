import { type BrowserContext, expect, type Page } from '@playwright/test';

/** The screen's guide skipped (D68): the first level opens it after its start card,
 * the first time it is played. */
export async function skipGuide(page: Page): Promise<void> {
  await page.locator('#guide-skip').click();
  await expect(page.locator('.guide')).toHaveCount(0);
}

export interface SeededWizard {
  name: string;
  gender: 'girl' | 'boy';
  look: string;
}

export const MARTA: SeededWizard = { name: 'Marta', gender: 'girl', look: 'teal' };

/** Gives the page a progress document holding a wizard (D36) before the game
 * loads, unless the game has kept its games already (D70): the game makes the
 * document its first saved game, and a reload keeps what the game wrote. */
export async function seedWizard(target: Page | BrowserContext, wizard: SeededWizard = MARTA): Promise<void> {
  const document = JSON.stringify({ version: 1, wizard });
  await target.addInitScript((kept) => {
    if (!localStorage.getItem('kydux.games') && !localStorage.getItem('kydux.progress')) {
      localStorage.setItem('kydux.progress', kept);
    }
  }, document);
}

/** What a story says at its step (D74): the voice's band, or what a figure says,
 * which the screen gives a screen reader beside the bubble. */
export function storySaid(page: Page) {
  return page.locator('.story-said');
}

/** A story's steps gone through: Next pressed `times` times, each step played. */
export async function storyNext(page: Page, times = 1): Promise<void> {
  for (let turn = 0; turn < times; turn += 1) {
    const before = await page.locator('#story-step').textContent();
    await page.locator('#story-next').click();
    await expect(page.locator('#story-step')).not.toHaveText(before ?? '');
  }
}

/** A story read to its end, and Go on pressed. */
export async function finishStory(page: Page): Promise<void> {
  await expect(page.locator('.story-screen')).toBeVisible();
  while ((await page.locator('#story-next').count()) > 0) await storyNext(page);
  await page.locator('#story-go-on').click();
}
