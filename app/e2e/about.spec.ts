// The welcome page and the page's look (D193): #about in both languages with its
// painting, the school's people on it (D294), for whom, its three pictures of the game in
// their order and Play; the start screen before a wizard is made leads to it from the
// header; a button is drawn in the look's moss green; the header has the mark and the
// link; the foot of every screen has the family's link (D338) and the header of every
// screen the link to Kidux OS, as the welcome page's own, each in a window of its own
// (D339); the map's chapters have their cards, a locked one greyed.

import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';

async function picturesShown(page: Page): Promise<void> {
  // The painting and the three pictures of the game, and the school's people (D294).
  await expect(page.locator('.about-screen img:not(.figure)')).toHaveCount(4);
  await expect(page.locator('.about-hero-figures .figure')).toHaveCount(3);
  await expect(page.locator('.about-section .figure')).toHaveCount(7);
  for (const people of await page.locator('.about-screen .figures').all()) {
    await expect(people).toHaveAttribute('aria-hidden', 'true');
  }
  const pictures = page.locator('.about-screen img');
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
    await expect(page.locator('#continue')).toHaveText('Continuar partida');
    await page.goto('/#about');
    await expect(page.locator('#about-play')).toHaveText('Jugar');
    await page.locator('#about-play').click();
    await expect(page).toHaveURL(/#start$/);
  });
});

test.describe('the look', () => {
  test.use({ locale: 'es-ES' });

  test('the start screen before a wizard is made leads to the welcome page from the header', async ({ page }) => {
    await page.goto('/#start');
    await expect(page.locator('#continue')).toHaveText('Iniciar partida');
    await page.locator('#about-link').click();
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

  test('the foot of every screen leads to Kidux, in the language chosen (D338)', async ({ page }) => {
    await seedWizard(page, MARTA);
    for (const screen of ['#start', '#map', '#about', '#settings', '#lesson/how-much', '#story/at-the-gate', '#level/the-gate']) {
      await page.goto(`/${screen}`);
      const family = page.locator('footer #family');
      await expect(family, screen).toHaveText('De la familia Kidux');
      await expect(family, screen).toHaveAttribute('href', 'https://kidux.org/es/');
      // A window of its own: the screen left stays as it is.
      await expect(family, screen).toHaveAttribute('target', '_blank');
      await expect(family, screen).toHaveAttribute('rel', 'noopener');
    }
    await page.goto('/#map');
    await page.locator('#language').selectOption('en');
    await expect(page.locator('footer #family')).toHaveText('Part of the Kidux family');
    await expect(page.locator('footer #family')).toHaveAttribute('href', 'https://kidux.org');
    // The foot is one line: the version and the build at its left, the family at its right.
    const [build, family] = await Promise.all(
      ['footer #build', 'footer #family'].map((part) => page.locator(part).boundingBox()),
    );
    expect(family!.x).toBeGreaterThan(build!.x + build!.width);
    expect(Math.abs(family!.y - build!.y)).toBeLessThan(6);
  });

  test('the header of every screen leads to Kidux OS, beside the welcome page\'s link (D339)', async ({ page }) => {
    await seedWizard(page, MARTA);
    for (const screen of ['#start', '#map', '#about', '#settings', '#lesson/how-much', '#story/at-the-gate', '#level/the-gate']) {
      await page.goto(`/${screen}`);
      const kidux = page.locator('header.top #kidux-link');
      await expect(kidux, screen).toHaveText('Conoce Kidux OS');
      await expect(kidux, screen).toHaveAttribute('href', 'https://kidux.org/es/');
      // A window of its own: the screen left stays as it is.
      await expect(kidux, screen).toHaveAttribute('target', '_blank');
      await expect(kidux, screen).toHaveAttribute('rel', 'noopener');
      // In the header's line, right after the welcome page's link.
      const [about, link] = await Promise.all(
        ['#about-link', '#kidux-link'].map((part) => page.locator(part).boundingBox()),
      );
      expect(link!.x, screen).toBeGreaterThan(about!.x + about!.width);
      expect(Math.abs(link!.y - about!.y), screen).toBeLessThan(6);
    }
    // The welcome page's own link opens a window of its own too.
    await page.goto('/#about');
    const own = page.locator('#about-free a');
    await expect(own).toHaveText('Conoce Kidux');
    await expect(own).toHaveAttribute('target', '_blank');
    await expect(own).toHaveAttribute('rel', 'noopener');
    await page.locator('#language').selectOption('en');
    await expect(page.locator('#kidux-link')).toHaveText('Meet Kidux OS');
    await expect(page.locator('#kidux-link')).toHaveAttribute('href', 'https://kidux.org');
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
