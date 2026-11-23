// The welcome page and the page's look (D193): #about in both languages with its
// painting, for whom, its three pictures of the game in their order and Play; the start
// screen before a wizard is made shows what Kydux is; a button is drawn in the look's
// moss green; the header has the mark and the link; the map's chapters have their cards,
// a locked one greyed.

import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';

async function picturesShown(page: Page): Promise<void> {
  const pictures = page.locator('.about-screen img');
  await expect(pictures).toHaveCount(4);
  for (const picture of await pictures.all()) {
    await picture.scrollIntoViewIfNeeded();
    await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
}

for (const [locale, title, play, parts] of [
  ['es-ES', 'Qué es Kydux', 'Empieza a jugar', ['El juego.', 'La historia.', 'Las lecciones.']],
  ['en-US', 'What Kydux is', 'Start playing', ['The game.', 'The story.', 'The lessons.']],
] as const) {
  test.describe(`the welcome page in ${locale}`, () => {
    test.use({ locale, viewport: { width: 1280, height: 800 } });

    test('a first visit opens on it: its painting, what Kydux is, its three pictures, and Start playing begins the story', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/#about$/);
      await expect(page.locator('#about-what h3')).toHaveText(title);
      await expect(page.locator('#about-play')).toHaveText(play);
      // How it is played: the game first, then its story, then its lessons (D193).
      await expect(page.locator('#about-how figcaption strong')).toHaveText([...parts]);
      await expect(page.locator('#about-who p')).toContainText(locale === 'es-ES' ? 'a partir de ocho años' : 'from eight years old');
      await picturesShown(page);
      await page.screenshot({ path: `e2e/shots/about-${locale}.png`, fullPage: true });
      await expect(page.locator('#about-play-end')).toHaveText(play);
      await page.locator('#about-play').click();
      await expect(page).toHaveURL(/#story\/the-letter$/);
    });
  });
}

test.describe('the welcome page for a child who has played', () => {
  test.use({ locale: 'es-ES' });

  test('a wizard made: the page opens on the start screen, and the welcome\'s button goes back to it', async ({ page }) => {
    await seedWizard(page, MARTA);
    await page.goto('/');
    await expect(page.locator('#continue')).toHaveText('Continuar: Ante la puerta');
    await page.goto('/#about');
    await expect(page.locator('#about-play')).toHaveText('Jugar');
    await page.locator('#about-play').click();
    await expect(page).toHaveURL(/#start$/);
  });
});

test.describe('the look', () => {
  test.use({ locale: 'es-ES' });

  test('the start screen before a wizard is made says what Kydux is, with a link to the rest', async ({ page }) => {
    await page.goto('/#start');
    await expect(page.locator('#start-welcome h3')).toHaveText('Qué es Kydux');
    await page.locator('#start-about').click();
    await expect(page).toHaveURL(/#about$/);
  });

  test('a button is drawn in moss green, and the header has the mark and the link', async ({ page }) => {
    await page.goto('/#about');
    const moss = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--moss)';
      document.body.append(probe);
      return getComputedStyle(probe).color;
    });
    await expect(page.locator('#about-play')).toHaveCSS('background-color', moss);
    await expect(page.locator('#home svg.mark')).toBeVisible();
    await expect(page.locator('#about-link')).toHaveAttribute('href', '#about');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /favicon\.svg$/);
  });

  test("the map's chapters have their cards, a chapter not reached greyed", async ({ page }) => {
    await seedWizard(page, MARTA);
    await page.goto('/#map');
    const cards = page.locator('.map-chapter .chapter-card');
    await expect(cards).toHaveCount(5);
    await expect(cards.first()).toHaveCSS('background-image', /chapters\/01-arrival\/card\.webp/);
    await expect(page.locator('.map-chapter').first()).not.toHaveAttribute('data-locked', 'true');
    await expect(page.locator('.map-chapter').nth(3)).toHaveAttribute('data-locked', 'true');
  });
});
