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
