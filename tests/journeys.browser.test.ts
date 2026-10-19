import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TellState } from '../src/domain/types';
import { PHONE, SHOTS, SMALL_PHONE, openApp, overflowsSideways, startApp, type Engine, type Session } from './browser';

// The real app in real engines at phone size, driven by role and name. Days
// pass through Playwright's clock: no test hooks exist in the app.

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
const options = (page: Page) => page.locator('button.option:not([disabled])');
const done = (page: Page) => page.getByRole('heading', { name: 'That’s today’s set' });

/** Answer every choice of a Slide with the same side, until its result shows. */
async function slide(page: Page, side: 0 | 1) {
  if (await button(page, 'Skip the guess').isVisible()) await page.locator('[aria-label="Your guess"] button').first().click();
  while (!(await page.locator('.reveal').isVisible())) {
    await options(page).nth(side).click();
    await page.locator('.reveal').or(page.getByText(/^Choice \d of 3$/)).first().waitFor();
  }
}

/** Play whatever the current experiment is, in a fixed way, until its result shows. */
async function playOne(page: Page) {
  const head = (await page.locator('header .small.dim').first().textContent())!;
  if (head.endsWith('Slide')) return slide(page, 0);
  if (head.endsWith('Cut')) {
    for (let i = 0; i < 4; i++) await options(page).first().click();
    return button(page, 'Done').click();
  }
  if (head.endsWith('Spend')) {
    const labels = await page.locator('.coin-row > span:first-child').allTextContents();
    for (const [i, n] of [4, 3, 2, 1].entries()) for (let k = 0; k < n; k++) await button(page, `Add a coin to ${labels[i]}`).click();
    await button(page, 'Continue').click();
    for (let i = 0; i < 4; i++) {
      await options(page).first().click();
      await page.locator('.reveal').or(page.getByText(/^Clash \d of 4$/)).first().waitFor();
    }
    return;
  }
  // Peek: lean A, open one fact, lean B, choose B, mark nothing.
  const lean = page.getByRole('group', { name: 'Your lean' }).getByRole('button');
  await lean.first().click();
  await options(page).first().click();
  await lean.nth(1).click();
  await button(page, 'Choose now').click();
  await options(page).nth(1).click();
  await button(page, 'None of them. Done').click();
}

async function playSet(page: Page, each?: (n: number) => Promise<void>) {
  await button(page, 'Start today’s set').click();
  for (let n = 1; ; n++) {
    await playOne(page);
    await page.locator('.reveal').waitFor();
    await each?.(n);
    const next = button(page, /^(Next experiment|See today’s results)$/);
    const last = (await next.textContent()) === 'See today’s results';
    await next.click();
    if (last) return done(page).waitFor();
  }
}

async function nextDay(page: Page, d: number) {
  await page.clock.setSystemTime(day(d));
  await page.goto(page.url().replace(/#.*$/, '#/'));
  await page.reload();
  await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
}

describe.each<[Engine, 'light' | 'dark', typeof PHONE]>([
  ['chromium', 'light', PHONE],
  ['webkit', 'dark', PHONE],
  ['chromium', 'light', SMALL_PHONE],
])('core loop in %s (%s, %o)', (engine, scheme, viewport) => {
  it('plays a set of three, survives a reload, finds a change and keeps it on the map', async () => {
    const s: Session = await openApp(engine, app.url, { time: day(1), colorScheme: scheme, viewport });
    const small = viewport === SMALL_PHONE ? '-small' : '';
    try {
      const { page } = s;
      await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
      expect(await overflowsSideways(page)).toBe(false);
      await s.shot(`1-home${small}`);

      await button(page, 'Start today’s set').click();
      await page.getByText('You haven’t tested money for time yet.').waitFor();
      await s.shot(`2-guess${small}`);
      await page.locator('[aria-label="Your guess"] button').nth(3).click();
      await page.getByText('Choice 1 of 3').waitFor();
      expect(await overflowsSideways(page)).toBe(false);
      await s.shot(`3-slide${small}`);
      // Always the corner shop: the saving never moves the answer within the range tested.
      for (let i = 0; i < 3; i++) await options(page).first().click();
      await page.getByRole('heading', { name: 'How much cheaper the supermarket has to be: more than £60.' }).waitFor();
      expect(await page.locator('.reveal').textContent()).toContain('Within the range tested, the amount didn’t move your answer.');
      expect(await page.locator('.reveal').textContent()).toContain('You guessed between £4 and £8.');
      await s.shot(`4-result${small}`);

      // Pass the phone: someone else plays the same Slide, side by side, and nothing of theirs is saved.
      await button(page, 'Pass the phone: let someone else try this one').click();
      await page.getByText('Their answers are never saved.').waitFor();
      for (let i = 0; i < 3; i++) await options(page).nth(1).click();
      expect(await page.locator('.then-now').textContent()).toBe('Youmore than £60Them£1 or less');
      expect((await stored(page)).runs).toHaveLength(1);

      // A reload keeps the result; the set resumes at the stress-test, with its condition.
      await page.reload();
      await page.getByText('Experiment 2 of 3 · Stress-test · Slide').waitFor();
      await page.getByText('Friends are coming round in an hour.').waitFor();
      await slide(page, 1); // always the supermarket: it switches at the smallest saving
      await page.getByRole('heading', { name: 'How much cheaper the supermarket has to be: £1 or less.' }).waitFor();
      await button(page, 'Next experiment').click();
      await page.getByText('The same trade-off in travel instead of home.').waitFor();
      await slide(page, 0);
      await button(page, 'See today’s results').click();
      await done(page).waitFor();
      expect(await page.getByRole('region', { name: 'New on your map' }).textContent()).toContain(
        'How much cheaper the supermarket has to be: more than £60. With friends due in an hour: £1 or less.',
      );
      await button(page, 'Useful').click();
      expect(await button(page, 'Useful').getAttribute('aria-pressed')).toBe('true');
      expect(await overflowsSideways(page)).toBe(false);
      await s.shot(`5-done${small}`);
      // One set a day: tomorrow's is ready tomorrow.
      expect(await button(page, 'Start today’s set').count()).toBe(0);

      await page.getByRole('link', { name: 'See your map' }).first().click();
      await page.getByRole('heading', { name: 'Your map' }).waitFor();
      expect(await page.locator('.totals').first().textContent()).toContain('3 of 70 experiments charted');
      const pattern = page.getByRole('region', { name: 'Patterns' }).getByRole('article');
      await pattern.getByRole('button', { name: 'Seems right' }).click();
      expect(await pattern.getByRole('button', { name: 'Seems right' }).getAttribute('aria-pressed')).toBe('true');
      expect(await pattern.textContent()).toContain('A note, not evidence');
      expect(await page.getByRole('region', { name: 'Your numbers' }).textContent()).toContain('Not tested yet: Buying');
      expect(await page.locator('footer').textContent()).toContain('Sets you rated useful or interesting: 1 of 1.');
      expect(await overflowsSideways(page)).toBe(false);
      await s.shot(`6-map${small}`);
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe('every mechanic, over a week (chromium)', () => {
  it('rotates Slide, Cut, Peek and Spend, explains each pick, and adds them up with denominators', async () => {
    const s = await openApp('chromium', app.url, { time: day(1) });
    try {
      const { page } = s;
      await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
      const shoot = (d: number) => async (n: number) => {
        if (n === 1 && [2, 4, 6].includes(d)) await s.shot(`7-day${d}-probe-result`);
      };
      for (let d = 1; d <= 6; d++) {
        if (d > 1) await nextDay(page, d);
        await playSet(page, shoot(d));
      }
      const state = await stored(page);
      expect(state.runs.filter((r) => r.role === 'probe').map((r) => r.mechanic)).toEqual(['slide', 'cut', 'slide', 'peek', 'slide', 'spend']);
      expect(state.runs.every((r) => r.title)).toBe(true);

      await page.getByRole('link', { name: 'Map', exact: true }).click();
      await page.getByRole('heading', { name: 'Your map' }).waitFor();
      expect(await page.getByRole('region', { name: 'What you protect' }).textContent()).toMatch(/final two \d of 1 · first to go \d of 1/);
      expect(await page.getByRole('region', { name: 'What moves your lean' }).textContent()).toMatch(/moved you \d of 1 time opened/);
      expect(await page.getByRole('region', { name: 'Said and chose' }).textContent()).toMatch(/agreed in \d of \d clash/);
      await page.setViewportSize({ width: PHONE.width, height: 6000 });
      await s.shot('8-map-after-a-week');
      await page.setViewportSize(PHONE);

      await page.getByRole('link', { name: 'About', exact: true }).click();
      await page.getByRole('heading', { name: 'How Tell picks the next experiment' }).waitFor();
      expect(await page.getByRole('region', { name: 'How Tell picks the next experiment' }).textContent()).toContain('Slide, Cut, Slide, Peek, Slide, Spend');
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe('a real call (chromium)', () => {
  it('runs a decision through the mechanics, comes back due, and shares lessons without any of your words', async () => {
    const SECRET = 'zebra-secret';
    const s = await openApp('chromium', app.url, { time: day(1) });
    try {
      const { page } = s;
      await page.getByRole('link', { name: 'Decide something' }).click();
      await page.getByLabel('In a few words').fill(`Which laptop ${SECRET}`);
      await page.getByRole('button', { name: /^Buying something/ }).click();
      await page.getByLabel('Option A').fill(`Air ${SECRET}`);
      await page.getByLabel('Option B').fill('Pro');
      await button(page, 'Next').click();
      // Swap one default for your own words.
      await button(page, 'Easy to return or resell').click();
      await page.getByLabel('Something else that matters').fill(`Fan noise ${SECRET}`);
      await button(page, 'Quality').click();
      await button(page, 'Add it').click();
      await page.getByText('Five picked.').waitFor();
      await s.shot('9-decide-matters');
      await button(page, 'Next').click();
      for (let i = 0; i < 4; i++) await options(page).first().click();
      await button(page, 'Done').click();
      await button(page, `Air ${SECRET}`).click();
      await page.getByText('Would you still pick').waitFor();
      for (let i = 0; i < 3; i++) await options(page).first().click();
      await button(page, /^The return window/).click();
      await page.getByText('If it turned out in favour of Pro, would you switch?').waitFor();
      await button(page, 'Yes').click();
      await button(page, 'Next').click();
      await page.getByText('Could change your pick, so worth finding out: the return window.').waitFor();
      await s.shot('10-decide-summary');
      await button(page, 'Save the call').click();
      await page.getByRole('heading', { name: 'A brief for your AI' }).waitFor();
      expect(await page.getByLabel('Brief').textContent()).toContain(`A decision I’m making: Which laptop ${SECRET} (buying something).`);
      expect(await overflowsSideways(page)).toBe(false);

      // Two weeks on, it comes back due, and the next set prices what the call protects.
      await nextDay(page, 15);
      await page.getByRole('link', { name: /Due back/ }).click();
      await button(page, 'Pro').click();
      await button(page, 'Worse than expected').click();
      await page.getByRole('group', { name: 'The price: how much did it matter?' }).getByRole('button', { name: 'More' }).click();
      await button(page, 'Running costs after you buy').click();
      await page.getByLabel('Something else you hadn’t considered').fill(`Strap ${SECRET}`);
      await page.getByLabel('A principle worth keeping (optional)').fill(`Test the fans ${SECRET}`);
      await button(page, 'Close the call').click();
      await page.getByRole('heading', { name: 'How it went' }).waitFor();
      await s.shot('11-call-closed');

      await page.getByRole('link', { name: 'Map', exact: true }).click();
      const lessons = page.getByRole('region', { name: 'Noticed afterwards' });
      expect(await lessons.textContent()).toContain('Hadn’t considered: Running costs after you buy (1 of 1)');
      expect(await lessons.textContent()).toContain(`Not on Tell’s list yet, in your words: Strap ${SECRET}`);
      await lessons.getByRole('button', { name: /^Share your lessons/ }).click();
      expect(await lessons.locator('.card').textContent()).toBe(
        'This is everything the file holds:Buying something: went worse than expected; mattered more: the price; hadn’t considered: running costs after you buy; 1 other thing not on Tell’s list.Download the lessons fileClose',
      );
      const [file] = await Promise.all([page.waitForEvent('download'), button(page, 'Download the lessons file').click()]);
      const shared = readFileSync((await file.path())!, 'utf8');
      expect(shared).not.toContain(SECRET);
      expect(JSON.parse(shared).lessons).toHaveLength(1);

      // Someone else's file goes through the same door; items show only once three shared calls report them.
      const theirs = join(SHOTS, 'their-lessons.json');
      const lesson = (id: string) => ({ id, kind: 'buying', went: 'expected', mattered: [], missed: ['size'], other: 0 });
      writeFileSync(theirs, JSON.stringify({ tell: 'lessons', v: 1, lessons: [lesson('t1'), lesson('t2'), lesson('t3')] }));
      page.once('dialog', (d) => void d.accept());
      await page.getByLabel('Lessons file').setInputFiles(theirs);
      await lessons.getByText('Added 3 new lessons.').waitFor();
      expect(await lessons.textContent()).toContain('Noticed only afterwards: Size and weight in daily use (3 of 3)');
      expect(await page.getByRole('region', { name: 'Principles you keep' }).textContent()).toContain(`Test the fans ${SECRET}`);
      await page.setViewportSize({ width: PHONE.width, height: 5000 });
      await s.shot('12-map-lessons');
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe('data that can’t be used (chromium)', () => {
  it('refuses unreadable data and leaves it untouched until the player chooses', async () => {
    const s = await openApp('chromium', app.url, { time: day(1) });
    try {
      const { page } = s;
      await page.evaluate(() => localStorage.setItem('tell', '{ broken'));
      await page.reload();
      await page.getByRole('heading', { name: 'Tell couldn’t open your saved data' }).waitFor();
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe('{ broken');
      page.once('dialog', (d) => void d.accept());
      await button(page, 'Start fresh').click();
      await page.getByRole('heading', { name: 'Today', exact: true }).waitFor();
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBeNull();
    } finally {
      await s.close();
    }
  });

  it('refuses the first version’s record, offers it as a download, and changes nothing', async () => {
    const s = await openApp('chromium', app.url, { time: day(1) });
    try {
      const { page } = s;
      const v1 = JSON.stringify({ schema: 1, answers: [], deal: null, kept: [], disagreed: [], notes: [] });
      await page.evaluate((doc) => localStorage.setItem('tell', doc), v1);
      await page.reload();
      await page.getByText(/first version of Tell, whose rounds were retired/).waitFor();
      await s.shot('13-recovery-v1');
      const [file] = await Promise.all([page.waitForEvent('download'), button(page, 'Download the saved data as it is').click()]);
      expect(readFileSync((await file.path())!, 'utf8')).toBe(v1);
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe(v1);
    } finally {
      await s.close();
    }
  });
});
