import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type BrowserContext, expect, type Page } from '@playwright/test';

/** The screen's guide skipped (D68): the first level opens it before its start card,
 * the first time it is played (D258). */
export async function skipGuide(page: Page): Promise<void> {
  await page.locator('#guide-skip').click();
  await expect(page.locator('.guide')).toHaveCount(0);
}

/** The key that turns the tips off (ui/waiting.ts), read once as the page opens. */
export const TIPS_OFF = 'kydux.tips-off';

export interface SeededWizard {
  name: string;
  gender: 'girl' | 'boy';
  look: string;
}

export const MARTA: SeededWizard = { name: 'Marta', gender: 'girl', look: 'teal' };

/** Gives the page a progress document holding a wizard (D36) before the game
 * loads, unless the game has kept its games already (D70): the game makes the
 * document its first saved game, and a reload keeps what the game wrote. */
/** A page opened under ?debug, which draws the select of a level's ways that the child
 * never sees (D204), with the tester's panel and buttons kept out of the pictures. */
export async function gotoTesting(page: Page, hash: string): Promise<void> {
  await page.goto(`/?debug${hash}`);
  await page.addStyleTag({ content: '.debug-box, .debug-legend, #debug-solution { display: none !important; }' });
}

export async function seedWizard(
  target: Page | BrowserContext,
  wizard: SeededWizard = MARTA,
  { tips = false }: { tips?: boolean } = {},
): Promise<void> {
  const document = JSON.stringify({ version: 1, wizard });
  await target.addInitScript(
    ({ kept, off, key }) => {
      if (!localStorage.getItem('kydux.games') && !localStorage.getItem('kydux.progress')) {
        localStorage.setItem('kydux.progress', kept);
      }
      // A slow load would hold the screen for a tip's ten seconds (D214): every spec but
      // the one on waiting turns the tips off, with a key no setting shows.
      if (off) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
    },
    { kept: document, off: !tips, key: TIPS_OFF },
  );
}


/** The wizard's acts (data-acting on the scene: `pickup`, `win`) recorded as
 * they start, so that a test checks an act played even after it ended: a slow
 * runner may finish a short act before the test looks. Called once the scene is
 * on the page; the acts seen are read with actsSeen. */
export async function watchActs(page: Page): Promise<void> {
  await page.locator('#scene').evaluate((scene) => {
    const seen: string[] = [];
    (window as unknown as { kyduxActs: string[] }).kyduxActs = seen;
    new MutationObserver(() => {
      const act = scene.getAttribute('data-acting');
      if (act && seen.at(-1) !== act) seen.push(act);
    }).observe(scene, { attributes: true, attributeFilter: ['data-acting'] });
  });
}

/** The acts the wizard has played since watchActs, in order. */
export function actsSeen(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { kyduxActs?: string[] }).kyduxActs ?? []);
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

/** A level's words in a language, as content/ has them, for a test that checks
 * what the page shows without copying the words into the test. */
export function levelText(id: string, lang: 'en' | 'es'): {
  title: string;
  goals: string[];
  starting_code: string;
  hints: string[];
  intro?: string;
  outro?: string;
} {
  const path = fileURLToPath(new URL(`../../content/levels/${id}/text.${lang}.json`, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** A text as the page shows it: Markdown's backticks and stars gone. */
export function shown(text: string): string {
  return text.replace(/[`*]/g, '');
}
