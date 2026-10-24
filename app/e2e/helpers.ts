import type { BrowserContext, Page } from '@playwright/test';

export interface SeededWizard {
  name: string;
  gender: 'girl' | 'boy';
  look: string;
}

export const MARTA: SeededWizard = { name: 'Marta', gender: 'girl', look: 'teal' };

/** Gives the page a progress document holding a wizard (D36) before the game
 * loads, unless one is kept already: a reload or a reset keeps what the game wrote. */
export async function seedWizard(target: Page | BrowserContext, wizard: SeededWizard = MARTA): Promise<void> {
  const document = JSON.stringify({ version: 1, wizard });
  await target.addInitScript((kept) => {
    if (!localStorage.getItem('kydux.progress')) localStorage.setItem('kydux.progress', kept);
  }, document);
}
