import { readFileSync } from 'node:fs';
import type { Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CONNECTIONS } from '../src/domain/situations';
import type { TellState } from '../src/domain/types';
import { PHONE, SMALL_PHONE, openApp, overflowsSideways, pageScrolls, smallTargets, startApp, type Engine, type Session } from './browser';

// The real app in real engines at phone size, driven by role and name.
// Every main journey runs in Chromium and WebKit at both phone sizes.

let app: Awaited<ReturnType<typeof startApp>>;
beforeAll(async () => {
  app = await startApp();
});
afterAll(async () => {
  await app?.close();
});

/** 09:00 on a day from 1 October 2026, London time (BST). */
const day = (d: number) => new Date(Date.UTC(2026, 9, d, 8, 0, 0));
const stored = async (page: Page): Promise<TellState> => JSON.parse((await page.evaluate(() => localStorage.getItem('tell')))!);
const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name, exact: typeof name === 'string' });
const heading = (page: Page, name: string) => page.getByRole('heading', { name, exact: true });
const region = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
const ending = (page: Page) => heading(page, 'What you did');
const tab = (page: Page, name: 'Play' | 'Map' | 'About') => page.getByRole('link', { name, exact: true });
const FIXTURE = readFileSync(new URL('./fixtures/tell-2.0.json', import.meta.url), 'utf8');

/** The checks every screen must pass: nothing sideways, only <main> scrolls, tap targets of 44px. */
async function sound(s: Session, name?: string) {
  expect(await overflowsSideways(s.page), name).toBe(false);
  expect(await pageScrolls(s.page), name).toBe(false);
  expect(await smallTargets(s.page), name).toEqual([]);
  if (name) await s.shot(name);
}

const CONFIGS: [Engine, 'light' | 'dark', typeof PHONE][] = [
  ['chromium', 'light', PHONE],
  ['webkit', 'dark', PHONE],
  ['chromium', 'dark', SMALL_PHONE],
  ['webkit', 'light', SMALL_PHONE],
];
const tag = (v: typeof PHONE) => (v === SMALL_PHONE ? '-small' : '');

async function open(page: Page, title: string) {
  await tab(page, 'Play').click();
  await page.getByRole('link', { name: new RegExp(title) }).click();
  await heading(page, title).waitFor();
}

describe.each(CONFIGS)('play in %s (%s, %o)', (engine, scheme, viewport) => {
  it('plays every kind of situation, finds the connections, replays, and keeps it all through a reload', async () => {
    const s = await openApp(engine, app.url, { time: day(1), colorScheme: scheme, viewport });
    const t = tag(viewport);
    try {
      const { page } = s;
      await heading(page, 'Pick a situation').waitFor();
      await sound(s, `1-home${t}`);

      // Uncover from a budget, then choose with what was found in view.
      await open(page, 'The old oak');
      await sound(s, `2-start${t}`);
      await button(page, /^Have the trunk scanned/).click();
      await page.getByText('About a third of the trunk is hollow.', { exact: false }).waitFor();
      expect(await page.getByText('1 week left to find things out.').isVisible()).toBe(true);
      expect(await button(page, /^Ask the tree surgeon/).isEnabled()).toBe(true);
      await sound(s, `3-uncover${t}`);
      await button(page, 'Decide').click();
      await page.getByText('What happens to the oak?').waitFor();
      expect(await page.locator('.condition').textContent()).toContain('About a third of the trunk is hollow.');
      await button(page, /^Take a third of the weight off the crown/).click();
      await ending(page).waitFor();
      expect(await page.evaluate(() => document.activeElement?.textContent)).toBe('The old oak');
      expect(await region(page, 'What you did').textContent()).toContain('Spent 3 of 4 weeks finding out: “Have the trunk scanned”.');
      // The connection is promised, never named, until both are played.
      await page.getByText('One other situation here shares something with this one.', { exact: false }).waitFor();
      expect(await page.getByText('The new loaf').count()).toBe(0);
      await sound(s, `4-ending${t}`);

      // Choose, see what follows, choose again; the connection appears at its ending.
      await page.getByRole('link', { name: 'Back to the situations' }).click();
      expect(await page.getByRole('link', { name: /The old oak/ }).textContent()).toContain('Played 1 Oct');
      await open(page, 'The new loaf');
      await button(page, /^Put twelve on the shelf on Saturday/).click();
      await page.getByText('By closing time on Saturday, seven of the twelve have gone.', { exact: false }).waitFor();
      await sound(s, `5-follows${t}`);
      await button(page, 'Bake it every Saturday').click();
      await ending(page).waitFor();
      const card = region(page, 'Look first, or keep a way back');
      expect(await card.textContent()).toContain(CONNECTIONS[0].notes['looked+went']);
      expect(await card.textContent()).toContain('The old oak: Spent 3 of 4 weeks finding out.');
      expect(await card.textContent()).toContain('Your answers show what you chose, not why.');
      await card.scrollIntoViewIfNeeded();
      await sound(s, `6-connection${t}`);

      // Day by day.
      await open(page, 'The harvest');
      await button(page, 'Wait a day').click();
      await page.getByText('Forecast: five in ten, Thursday or Friday.', { exact: false }).waitFor();
      await button(page, 'Wait a day').click();
      await page.getByText('Forecast: seven in ten', { exact: false }).waitFor();
      await sound(s, `7-days${t}`);
      await button(page, 'Pick today').click();
      await ending(page).waitFor();
      expect(await region(page, 'What you did').textContent()).toContain('“Pick today” on Wednesday.');

      // Asking brings another option.
      await open(page, 'Your uncle’s boat');
      expect(await button(page, /^Lend her to the club/).count()).toBe(0);
      await button(page, 'Ask at the sailing club first').click();
      await page.getByText('The club secretary says', { exact: false }).waitFor();
      await sound(s, `8-ask${t}`);
      await button(page, /^Lend her to the club for the summer/).click();
      await ending(page).waitFor();

      // Share something scarce.
      await open(page, 'The last packet');
      await button(page, 'One row more').click();
      await button(page, 'One row more').click();
      expect(await page.getByRole('group', { name: 'The old beans' }).textContent()).toContain('2');
      expect(await page.locator('.alloc').last().textContent()).toMatch(/Your usual vegetables.*8$/);
      await sound(s, `9-allocate${t}`);
      await button(page, 'Done').click();
      await ending(page).waitFor();
      expect(await region(page, 'What waiting keeps').textContent()).toContain(CONNECTIONS[2].notes['waited+sowed']);

      // One choice, and news that comes after it.
      await open(page, 'The winter order');
      await button(page, /^The usual order$|^The usual order Plenty/).click();
      await ending(page).waitFor();
      expect(await page.locator('header .scene').textContent()).toMatch(/^November\. The forecast is out/);
      expect(await region(page, 'News in time, and news too late').textContent()).toContain(CONNECTIONS[1].notes['waited+usual']);

      await tab(page, 'Play').click();
      await page.getByText('You’ve played them all.', { exact: false }).waitFor();

      // The map, after a reload: everything kept.
      await page.reload();
      await tab(page, 'Map').click();
      await heading(page, 'Your map').waitFor();
      for (const c of CONNECTIONS) await region(page, c.title).waitFor();
      expect(await region(page, 'What you chose').textContent()).toContain('The old oak');
      await sound(s, `10-map${t}`);

      // A replay is kept beside the first play; connections keep using the first.
      await page.getByRole('link', { name: /The old oak/ }).click();
      await page.getByRole('link', { name: 'Play it again' }).click();
      await page.getByText('You played this on 1 Oct. Playing again keeps both; connections use your first play.').waitFor();
      await button(page, 'Decide without finding out').click();
      await button(page, /^Fell it/).click();
      await ending(page).waitFor();
      expect(await page.locator('article .eyebrow').first().textContent()).toBe('A village green · replay 1');
      expect(await region(page, 'What you did').textContent()).toContain('Before: 1 Oct, Spent 3 of 4 weeks');
      expect(await region(page, 'Look first, or keep a way back').textContent()).toContain('It uses your first play of each.');
      expect(await region(page, 'Look first, or keep a way back').textContent()).toContain(CONNECTIONS[0].notes['looked+went']);

      const state = await stored(page);
      expect(state.plays.map((p) => [p.situation, p.replay])).toEqual([
        ['oak', 0],
        ['loaf', 0],
        ['harvest', 0],
        ['boat', 0],
        ['beans', 0],
        ['lighthouse', 0],
        ['oak', 1],
      ]);
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe.each<[Engine]>([['chromium'], ['webkit']])('data that can’t be used, or comes from earlier versions (%s)', (engine) => {
  it('refuses unreadable data and leaves it untouched until the player chooses', async () => {
    const s = await openApp(engine, app.url, { time: day(1), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      await page.evaluate(() => localStorage.setItem('tell', '{ broken'));
      await page.reload();
      await heading(page, 'Tell couldn’t open your saved data').waitFor();
      await sound(s, 'recovery-small');
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe('{ broken');
      page.once('dialog', (d) => void d.accept());
      await button(page, 'Start fresh').click();
      await heading(page, 'Pick a situation').waitFor();
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBeNull();
    } finally {
      await s.close();
    }
  });

  it('refuses newer data without offering to start fresh', async () => {
    const s = await openApp(engine, app.url, { time: day(1), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      const newer = JSON.stringify({ schema: 9, plays: [], archive: [] });
      await page.evaluate((doc) => localStorage.setItem('tell', doc), newer);
      await page.reload();
      await page.getByText('Update Tell to open it. Your data is waiting, untouched.').waitFor();
      expect(await button(page, 'Start fresh').count()).toBe(0);
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe(newer);
    } finally {
      await s.close();
    }
  });

  it('restores a Tell 2.0 backup only once the player confirms, keeping it whole', async () => {
    const s = await openApp(engine, app.url, { time: day(1), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      await open(page, 'The winter order');
      await button(page, /^Half as much again/).click();
      await ending(page).waitFor();
      const before = await page.evaluate(() => localStorage.getItem('tell'));
      await tab(page, 'About').click();
      const file = new URL('./fixtures/tell-2.0.json', import.meta.url).pathname;
      const message = 'Restore this backup of a record from Tell 2.0 (the choice workshop), to be kept as it was? This replaces what is on this device.';
      // Cancelled: nothing changes.
      const [asked] = await Promise.all([page.waitForEvent('dialog'), page.getByLabel('Backup file').setInputFiles(file)]);
      expect(asked.message()).toBe(message);
      await asked.dismiss();
      expect(await page.getByText('Restored.').count()).toBe(0);
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe(before);
      // Confirmed: the record is kept whole, and this device's plays are replaced.
      page.once('dialog', (d) => void d.accept());
      await page.getByLabel('Backup file').setInputFiles(file);
      await page.getByText('Restored.').waitFor();
      const state = await stored(page);
      expect(state.plays).toEqual([]);
      expect(state.archive.map((a) => a.doc)).toEqual([JSON.parse(FIXTURE)]);
      await page.getByText('Your record from Tell 2.0 (the choice workshop), kept exactly as it was', { exact: false }).waitFor();
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });

  it('keeps a Tell 2.0 record whole, says so, and offers it as a download', async () => {
    const s = await openApp(engine, app.url, { time: day(1), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      await page.evaluate((doc) => localStorage.setItem('tell', doc), FIXTURE);
      await page.reload();
      await page.getByText('Tell has changed. Your record from Tell 2.0 (the choice workshop) is kept exactly as it was, and you can download it from About.').waitFor();
      await sound(s, 'archived-small');
      expect((await stored(page)).archive[0].doc).toEqual(JSON.parse(FIXTURE));
      await tab(page, 'About').click();
      const [file] = await Promise.all([page.waitForEvent('download'), button(page, 'Download it').click()]);
      expect(JSON.parse(readFileSync((await file.path())!, 'utf8'))).toEqual(JSON.parse(FIXTURE));
      // The notice was about this load; the next one opens quietly.
      await page.reload();
      await heading(page, 'How Tell works').waitFor();
      expect(await page.getByText('Tell has changed.', { exact: false }).count()).toBe(0);
    } finally {
      await s.close();
    }
  });
});
