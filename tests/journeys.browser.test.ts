import { readFileSync } from 'node:fs';
import type { Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ROUNDS } from '../src/content';
import { emptyState, keep, recordPlay } from '../src/domain/engine';
import type { TellState } from '../src/domain/types';
import { ANSWERS } from './answers';
import { PHONE, SMALL_PHONE, openApp, overflowsSideways, pageScrolls, smallTargets, startApp, type Engine, type Session } from './browser';
import { DESCRIBES_YOU, PRESSURE } from './wording';

// The real app in real engines at phone size, driven by role and name. The
// main journey runs in Chromium and WebKit at both phone sizes.

let app: Awaited<ReturnType<typeof startApp>>;
beforeAll(async () => {
  app = await startApp();
});
afterAll(async () => {
  await app?.close();
});

/** 09:00 on a day from 1 November 2026, London time. */
const day = (d: number) => new Date(Date.UTC(2026, 10, d, 9, 0, 0));
const stored = async (page: Page): Promise<TellState> => JSON.parse((await page.evaluate(() => localStorage.getItem('tell')))!);
const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name, exact: typeof name === 'string' });
const heading = (page: Page, name: string) => page.getByRole('heading', { name, exact: true });
const tab = (page: Page, name: 'Play' | 'My Book') => page.getByRole('navigation').getByRole('link', { name, exact: true });
/** Screens other than the tabs have one way back, at the top. */
const back = (page: Page) => page.getByRole('banner').getByRole('link');
const FIXTURE_41 = readFileSync(new URL('./fixtures/tell-4.1.json', import.meta.url), 'utf8');

/** Every screen: nothing sideways, only <main> scrolls, 44px targets, and no word about the player or keeping score. */
async function sound(s: Session, name?: string) {
  expect(await overflowsSideways(s.page), name).toBe(false);
  expect(await pageScrolls(s.page), name).toBe(false);
  expect(await smallTargets(s.page), name).toEqual([]);
  const text = await s.page.locator('main').innerText();
  expect(text, name).not.toMatch(DESCRIBES_YOU);
  expect(text, name).not.toMatch(PRESSURE);
  if (name) await s.shot(name);
}

const CONFIGS: [Engine, 'light' | 'dark', typeof PHONE][] = [
  ['chromium', 'light', PHONE],
  ['webkit', 'dark', PHONE],
  ['chromium', 'dark', SMALL_PHONE],
  ['webkit', 'light', SMALL_PHONE],
];
const tag = (v: typeof PHONE) => (v === SMALL_PHONE ? '-small' : '');

describe.each(CONFIGS)('Tell in %s (%s, %o)', (engine, scheme, viewport) => {
  it('opens into a round, keeps ideas, connects them, and plays every kind of step', async () => {
    const s = await openApp(engine, app.url, { time: day(19), colorScheme: scheme, viewport });
    const t = tag(viewport);
    const { page } = s;
    try {
      // First launch: straight into the first round, with Play and My Book below.
      await heading(page, 'Why is the night dark?').waitFor();
      for (const name of ['Play', 'My Book'] as const) expect(await tab(page, name).isVisible()).toBe(true);
      expect(await page.getByText('Science · Puzzle').isVisible()).toBe(true);
      await sound(s, `1-first${t}`);

      // A wrong answer: marked, the right one shown, a reply to that answer, then the reveal.
      await button(page, 'Faraway stars are too faint to see').click();
      await page.getByText('every shell of stars sends us the same amount of light', { exact: false }).waitFor();
      expect(await page.getByRole('img', { name: 'Not this one' }).count()).toBe(1);
      expect(await page.getByRole('img', { name: 'Right' }).count()).toBe(1);
      expect(await button(page, 'Dust between the stars blocks the light').isDisabled()).toBe(true);
      await sound(s, `2-reveal${t}`);
      await button(page, 'Continue').click();
      await button(page, 'Edgar Allan Poe, the writer of macabre tales').click();
      // Nothing is recorded until the round ends.
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBeNull();
      await button(page, 'Finish').click();

      // The ending: the idea, kept in one tap; connections name rounds not played without describing them.
      await page.getByText('A question to keep').waitFor();
      expect((await stored(page)).plays.map((p) => p.round)).toEqual(['night-sky']);
      expect(await page.getByText('A round not played yet.').count()).toBe(2);
      await sound(s, `3-ending${t}`);
      await button(page, 'Keep in my Book').click();
      await page.getByText('In your Book').waitFor();
      expect((await stored(page)).book.map((i) => i.round)).toEqual(['night-sky']);
      // Sources open in place, each claim marked how sure it is.
      await page.getByText('Sources, and how sure they are').click();
      expect(await page.locator('.status').first().textContent()).toBe('Established');
      expect(await page.getByRole('link', { name: 'Wikisource: Eureka: A Prose Poem' }).getAttribute('target')).toBe('_blank');

      // Next round, then skip it: the one after comes up, and it connects with the Book.
      await button(page, 'Next round').click();
      await heading(page, 'The bricked-up windows').waitFor();
      // A new round starts at the top with its title focused, as a new screen does.
      const atTop = () => page.evaluate(() => [document.querySelector('main')!.scrollTop, document.activeElement?.tagName, document.activeElement?.textContent]);
      expect(await atTop()).toEqual([0, 'H1', 'The bricked-up windows']);
      await button(page, 'Skip').click();
      await heading(page, 'Measuring the Earth with a shadow').waitFor();
      expect(await atTop()).toEqual([0, 'H1', 'Measuring the Earth with a shadow']);
      expect((await stored(page)).skipped).toEqual(['windows']);
      expect(await page.getByText('Connects with an idea in your Book').isVisible()).toBe(true);

      // An estimate: nothing to lock in until a guess is made; then the guess beside the answer.
      await button(page, 'The ground between the two cities curves').click();
      // Skip is only offered before a round is begun; the reveal takes focus from the tapped option.
      expect(await button(page, 'Skip').count()).toBe(0);
      expect(await page.evaluate(() => document.activeElement?.className)).toContain('reveal');
      await button(page, 'Continue').click();
      expect(await button(page, 'Lock in').isDisabled()).toBe(true);
      await page.getByRole('slider').fill('300000');
      await button(page, 'More').click();
      await button(page, 'Lock in 310,000 stadia').click();
      await page.getByText('The answer').waitFor();
      expect(await page.locator('.estimate-result').textContent()).toBe('Your guess310,000 stadiaThe answer250,000 stadia');
      await sound(s, `4-estimate${t}`);
      await button(page, 'Finish').click();

      // The connection to the kept idea, in full; this idea kept in the player's own words.
      const conn = page.locator('.conn').filter({ hasText: 'Why is the night dark?' });
      expect(await conn.locator('.rel').textContent()).toBe('Supports');
      expect(await conn.getByText('In my Book', { exact: true }).isVisible()).toBe(true);
      await button(page, 'Edit first').click();
      await page.getByLabel('Wording of the idea').fill('Measure small, reason big.');
      await button(page, 'Keep in my Book').click();
      await page.getByText('In your Book').waitFor();
      await sound(s, `5-connection${t}`);

      // The Book: newest first, connections between kept ideas on each.
      await tab(page, 'My Book').click();
      await heading(page, 'My Book').waitFor();
      const rows = page.locator('.idea-row');
      expect(await rows.locator('.idea-row-text').allTextContents()).toEqual(['Measure small, reason big.', 'If my picture were right, what would I see? And what does it mean that I don’t?']);
      expect(await rows.first().locator('.link-chip').textContent()).toBe('Supports Why is the night dark?');
      await sound(s, `6-book${t}`);
      await rows.first().click();
      await page.getByText('The round put it:', { exact: false }).waitFor();
      expect(await back(page).textContent()).toBe('My Book');
      await sound(s, `7-idea${t}`);
      await button(page, 'Restore original').click();
      await page.getByText('A small, careful measurement and a clear model', { exact: false }).first().waitFor();
      expect((await stored(page)).book[1].edited).toBeUndefined();
      // From an idea back into its round, and back again.
      await page.getByRole('link', { name: 'Play it again' }).click();
      await heading(page, 'Measuring the Earth with a shadow').waitFor();
      expect(await back(page).textContent()).toBe('Back');
      await back(page).click();
      await back(page).click();
      await heading(page, 'My Book').waitFor();

      // Everything persists: after a reload Play offers the next round not yet played or passed over.
      await page.reload();
      await tab(page, 'Play').click();
      await heading(page, 'The ship that was rebuilt').waitFor();
      expect((await stored(page)).book).toHaveLength(2);

      // An order step, from the list of all rounds.
      await page.getByRole('link', { name: 'All rounds' }).click();
      await heading(page, 'All rounds').waitFor();
      expect(await page.locator('.round-row').count()).toBe(ROUNDS.length);
      await sound(s, `8-rounds${t}`);
      await page.getByRole('link', { name: /Closer than it looks/ }).click();
      await heading(page, 'Closer than it looks').waitFor();
      expect(await back(page).textContent()).toBe('All rounds');
      const order = ['The Great Pyramid of Giza is built', 'The last woolly mammoths die out', 'Cleopatra dies', 'Teaching is recorded at Oxford', 'The Aztecs found Tenochtitlan'];
      await page.locator('.pool').getByRole('button', { name: order[1] }).click();
      // A placed item goes back with a tap.
      await page.getByRole('button', { name: `${order[1]}, placed 1. Tap to take it out.` }).click();
      for (const item of order) await page.locator('.pool').getByRole('button', { name: item }).click();
      await sound(s, `9-order${t}`);
      await button(page, 'Check the order').click();
      expect(await page.locator('.order-result li.right').count()).toBe(5);
      await button(page, 'Continue').click();
      await button(page, 'The Moon landing').click();
      await button(page, 'Finish').click();
      await page.getByText('A way to think').waitFor();

      // A quickfire step.
      await back(page).click();
      await page.getByRole('link', { name: /Who really said it\?/ }).click();
      await heading(page, 'Who really said it?').waitFor();
      await page.getByRole('group', { name: '“Let them eat cake”: Marie Antoinette, about the hungry poor of Paris.' }).getByRole('button', { name: 'Holds up' }).click();
      expect(await page.locator('.call-verdict').first().textContent()).toBe(' Doesn’t(your call: Holds up)');
      for (let i = 0; i < 4; i++) await page.locator('.call-buttons').last().getByRole('button').last().click();
      await page.getByText('Only one of the five holds up as told', { exact: false }).waitFor();
      await sound(s, `10-quickfire${t}`);
      await button(page, 'Finish').click();
      await page.getByText('A question to keep').waitFor();
      expect((await stored(page)).plays.map((p) => p.round)).toEqual(['night-sky', 'earth', 'timeline', 'quotes']);

      // About, from Play.
      await back(page).click();
      await back(page).click();
      await page.getByRole('link', { name: 'About' }).click();
      await heading(page, 'About Tell').waitFor();
      await sound(s, `11-about${t}`);
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe.each(['chromium', 'webkit'] as const)('the edges in %s', (engine) => {
  it('says plainly when every round has been played, and offers them again', async () => {
    const s = await openApp(engine, app.url, { time: day(19), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      const all = ROUNDS.reduce((x, r) => recordPlay(x, r, ANSWERS[r.id], day(18)), emptyState());
      await page.evaluate((doc) => localStorage.setItem('tell', doc), JSON.stringify(all));
      await page.reload();
      await heading(page, 'You’ve played every round').waitFor();
      expect(await page.locator('.round-row .tag').filter({ hasText: 'Played' }).count()).toBe(ROUNDS.length);
      await sound(s, 'all-played-small');
      await button(page, 'Play one again, at random').click();
      await page.locator('.round-head h1').waitFor();
      expect(await page.getByRole('heading', { name: 'You’ve played every round' }).count()).toBe(0);
      // The Book, empty, points back to Play.
      await tab(page, 'My Book').click();
      await page.getByText('Each round ends with an idea worth keeping', { exact: false }).waitFor();
      await sound(s, 'book-empty-small');
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });

  it('searches the Book once there is enough in it', async () => {
    const s = await openApp(engine, app.url, { time: day(19), viewport: PHONE });
    try {
      const { page } = s;
      const doc = ROUNDS.slice(0, 6).reduce((x, r) => keep(recordPlay(x, r, ANSWERS[r.id], day(18)), r, day(18)), emptyState());
      await page.evaluate((d) => localStorage.setItem('tell', d), JSON.stringify(doc));
      await page.reload();
      await tab(page, 'My Book').click();
      await page.locator('.idea-row').first().waitFor();
      expect(await page.locator('.idea-row').count()).toBe(6);
      await page.getByLabel('Search my Book').fill('philosophy');
      await expect.poll(() => page.locator('.idea-row').count()).toBe(1);
      expect(await page.locator('.idea-row').textContent()).toContain('The ship that was rebuilt');
      await page.getByLabel('Search my Book').fill('zebra');
      await page.getByText('Nothing in the Book matches “zebra”.').waitFor();
      await sound(s, 'book-search');
    } finally {
      await s.close();
    }
  });
});

describe.each(['chromium', 'webkit'] as const)('data that can’t be used, in %s', (engine) => {
  it('never writes over unreadable data, and starts fresh only when asked', async () => {
    const s = await openApp(engine, app.url, { time: day(19), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      await page.evaluate(() => localStorage.setItem('tell', '{ broken'));
      await page.reload();
      await heading(page, 'Tell couldn’t open your saved data').waitFor();
      await sound(s, 'recovery-small');
      const [file] = await Promise.all([page.waitForEvent('download'), button(page, 'Download the saved data as it is').click()]);
      expect(readFileSync((await file.path())!, 'utf8')).toBe('{ broken');
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe('{ broken');
      page.once('dialog', (d) => void d.accept());
      await button(page, 'Start fresh').click();
      await heading(page, 'Why is the night dark?').waitFor();
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBeNull();
    } finally {
      await s.close();
    }
  });

  it('refuses newer data without offering to start fresh', async () => {
    const s = await openApp(engine, app.url, { time: day(19), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      const newer = JSON.stringify({ schema: 99, plays: [], book: [], skipped: [], archive: [] });
      await page.evaluate((doc) => localStorage.setItem('tell', doc), newer);
      await page.reload();
      await page.getByText('Update Tell to open it. Your data is waiting, untouched.').waitFor();
      expect(await button(page, 'Start fresh').count()).toBe(0);
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe(newer);
    } finally {
      await s.close();
    }
  });

  it('keeps a Tell 4.1 record whole, says so, and offers it as JSON and plain text', async () => {
    const s = await openApp(engine, app.url, { time: day(19), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      await page.evaluate((doc) => localStorage.setItem('tell', doc), FIXTURE_41);
      await page.reload();
      await page.getByText('Tell has become a new game. Your record from Tell 4 is kept exactly as it was, and you can download it from About.').waitFor();
      await heading(page, 'Why is the night dark?').waitFor();
      await sound(s, 'archived-small');
      const state = await stored(page);
      expect(state.archive.map((a) => a.schema)).toEqual([5, 6]);
      expect(state.archive[1].doc).toEqual(JSON.parse(FIXTURE_41));
      await page.getByRole('status').getByRole('link', { name: 'About' }).click();
      await heading(page, 'About Tell').waitFor();
      const record = page.locator('.card-quiet').filter({ hasText: 'Tell 4,' });
      const [json] = await Promise.all([page.waitForEvent('download'), record.getByRole('button', { name: 'Download it', exact: true }).click()]);
      expect(JSON.parse(readFileSync((await json.path())!, 'utf8'))).toEqual(JSON.parse(FIXTURE_41));
      const [text] = await Promise.all([page.waitForEvent('download'), record.getByRole('button', { name: 'Download it as plain text' }).click()]);
      expect(readFileSync((await text.path())!, 'utf8')).toContain('Move flat this spring');
      // The notice was about this load; the next one opens quietly.
      await page.reload();
      await heading(page, 'About Tell').waitFor();
      expect(await page.getByText('Tell has become a new game.', { exact: false }).count()).toBe(0);
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });

  it('restores a backup only once the player confirms', async () => {
    const s = await openApp(engine, app.url, { time: day(19), viewport: PHONE });
    try {
      const { page } = s;
      await button(page, 'The universe hasn’t existed for ever').click();
      await button(page, 'Continue').click();
      await button(page, 'Edgar Allan Poe, the writer of macabre tales').click();
      await button(page, 'Finish').click();
      await button(page, 'Keep in my Book').click();
      const before = await page.evaluate(() => localStorage.getItem('tell'));
      await page.getByRole('link', { name: 'About' }).click();
      const file = new URL('./fixtures/tell-4.1.json', import.meta.url).pathname;
      const [asked] = await Promise.all([page.waitForEvent('dialog'), page.getByLabel('Backup file').setInputFiles(file)]);
      expect(asked.message()).toBe('Restore this backup of a record from Tell 4, to be kept as it was? This replaces what is on this device.');
      await asked.dismiss();
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe(before);
      page.once('dialog', (d) => void d.accept());
      await page.getByLabel('Backup file').setInputFiles(file);
      await page.getByText('Restored.').waitFor();
      expect((await stored(page)).book).toEqual([]);
    } finally {
      await s.close();
    }
  });
});
