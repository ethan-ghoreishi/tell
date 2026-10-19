import { readFileSync } from 'node:fs';
import type { Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
const options = (page: Page) => page.locator('button.option:not([disabled])');
const heading = (page: Page, name: string) => page.getByRole('heading', { name, exact: true });
const ending = (page: Page) => heading(page, 'What you answered');

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

/**
 * Play whichever episode is open, from its start screen to its ending, in a
 * fixed way: the first option first, then option `second` (0 or 1).
 */
async function playEpisode(page: Page, second: 0 | 1 = 0, shoot?: (name: string) => Promise<void>) {
  await page.getByRole('button', { name: /^(Start|Play it again)$/ }).click();
  await options(page).first().click();
  // The move: tell it apart by what it shows.
  const twist = button(page, 'Continue');
  const widen = page.getByText('Pick any that you would.');
  const cut = page.getByText(/more to drop\.$/);
  const peek = page.getByText('Hidden. Tap to open.').first();
  const slide = page.getByText('Choice 1 of 3');
  await twist.or(widen).or(cut).or(peek).or(slide).first().waitFor();
  if (await slide.isVisible()) {
    await shoot?.('move-slide');
    while (await page.getByText(/^Choice \d of 3$/).isVisible()) {
      const n = await page.getByText(/^Choice \d of 3$/).textContent();
      await options(page).first().click();
      await page.getByText(/^Choice \d of 3$/).filter({ hasNotText: n! }).or(page.getByText('Second answer', { exact: false })).first().waitFor();
    }
  } else if (await widen.isVisible()) {
    await options(page).first().click();
    await shoot?.('move-widen');
    await button(page, 'Continue').click();
  } else if (await cut.isVisible()) {
    while (!(await button(page, 'Done').isVisible())) await options(page).first().click();
    await shoot?.('move-cut');
    await button(page, 'Done').click();
  } else if (await peek.isVisible()) {
    await options(page).first().click();
    await page.getByRole('group', { name: 'Your lean' }).getByRole('button').first().click();
    await shoot?.('move-peek');
    await button(page, 'Choose now').click();
  } else {
    await shoot?.('move-twist');
    await twist.click();
  }
  await page.getByText(/· Second answer$/).waitFor();
  await options(page).nth(second).click();
  const closed = button(page, 'None of them. Done');
  await ending(page).or(closed).first().waitFor();
  if (await closed.isVisible()) await closed.click();
  await ending(page).waitFor();
}

describe.each(CONFIGS)('play in %s (%s, %o)', (engine, scheme, viewport) => {
  it('plays the recommended story, keeps a takeaway, passes the phone without saving, and replays it as a replay', async () => {
    const s = await openApp(engine, app.url, { time: day(1), colorScheme: scheme, viewport });
    const t = tag(viewport);
    try {
      const { page } = s;
      await heading(page, 'See what would make a choice clearer').waitFor();
      await sound(s, `1-home${t}`);

      await page.getByRole('link', { name: 'Start here: Six evenings' }).click();
      await heading(page, 'Six evenings').waitFor();
      await button(page, 'Start').click();
      await sound(s, `2-first${t}`);
      await button(page, 'The app: the most people might use it').click();
      // Focus moves to the change, so it's read first.
      expect(await page.evaluate(() => document.activeElement?.textContent)).toMatch(/^Now suppose that, in this story/);
      await button(page, 'Continue').click();
      await page.getByText('Then where do the evenings go?').waitFor();
      await button(page, 'The stories: they’re closest to done').click();

      await ending(page).waitFor();
      const article = page.locator('article');
      expect(await article.textContent()).toContain('First answer: “The app: the most people might use it”.');
      expect(await page.getByRole('region', { name: 'Possible readings' }).textContent()).toContain('relied, at least in part, on the work reaching people');
      expect(await page.getByRole('region', { name: 'Still unknown' }).textContent()).toContain('How many people any of the three would actually reach.');
      await sound(s, `3-ending${t}`);

      // Worth keeping: one tap to start from a line, then the player's words.
      await page.getByRole('region', { name: 'Worth keeping?' }).getByRole('button').first().click();
      await page.getByLabel('In your words').fill('Check what a choice rests on');
      await button(page, 'Keep it').click();
      await page.getByText('Kept on your map, with this play as its evidence.').waitFor();

      // Pass the phone: their answers sit beside yours and are never saved.
      const before = await page.evaluate(() => localStorage.getItem('tell'));
      await button(page, 'Pass the phone: let someone else play it').click();
      await page.getByText(/Their turn · nothing they answer is saved/).waitFor();
      await options(page).nth(1).click();
      await button(page, 'Continue').click();
      await options(page).nth(1).click();
      await heading(page, 'You and them').waitFor();
      expect(await page.getByRole('region', { name: 'You and them' }).textContent()).toContain('They kept their first answer. Their answers were not saved.');
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe(before);
      await sound(s, `4-together${t}`);

      // Back to the library, which shows what was played; then a replay, marked as one.
      await page.getByRole('link', { name: 'Back to the stories' }).click();
      expect(await page.getByRole('link', { name: /^Six evenings/ }).textContent()).toContain('Played 1 Oct');
      await page.getByRole('link', { name: /^Six evenings/ }).click();
      await page.getByText('You played this on 1 Oct. Playing again adds a replay, shown beside the first. It isn’t a new example.').waitFor();
      await playEpisode(page, 0);
      expect(await page.locator('article .eyebrow').first().textContent()).toBe('Invented story · Purpose · replay 1');
      expect(await page.getByRole('region', { name: 'Earlier plays of this story' }).textContent()).toContain('1 Oct: first “The app: the most people might use it”, then “The stories: they’re closest to done”.');
      expect((await stored(page)).plays.map((p) => p.replay)).toEqual([0, 1]);

      // The map: what was kept, with its evidence; revised and retired without losing either.
      await page.getByRole('link', { name: 'Map', exact: true }).click();
      const kept = page.getByRole('region', { name: 'Worth keeping' }).getByRole('article');
      expect(await kept.textContent()).toContain('From an invented story');
      await kept.getByText('See the evidence').click();
      expect(await kept.textContent()).toContain('Answers to an invented story: hypothetical, not a real choice.');
      await kept.getByRole('button', { name: 'Revise' }).click();
      await kept.getByLabel(/New wording/).fill('Check what a choice rests on before adding to it');
      await kept.getByRole('button', { name: 'Save wording' }).click();
      expect(await kept.textContent()).toContain('revised 1 time');
      await kept.getByText('See the evidence').click();
      expect(await kept.textContent()).toContain('Earlier wordings');
      await sound(s, `5-map${t}`);
      await kept.getByRole('button', { name: 'Retire' }).click();
      await page.getByText('Retired takeaways (1)').click();
      await button(page, 'Bring it back').click();
      expect((await stored(page)).takeaways[0].versions.map((v) => v.text)).toEqual(['Check what a choice rests on', 'Check what a choice rests on before adding to it']);
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe.each(CONFIGS)('a real choice in %s (%s, %o)', (engine, scheme, viewport) => {
  it('keeps a draft through a reload, goes back and forth, saves a summary, and takes follow-ups; later choices offer past examples', async () => {
    const SECRET = 'zebra-secret';
    const s = await openApp(engine, app.url, { time: day(1), colorScheme: scheme, viewport });
    const t = tag(viewport);
    try {
      const { page } = s;
      await page.getByRole('link', { name: 'Bring a choice' }).click();
      await heading(page, 'The choice').waitFor();
      await page.getByLabel('The choice, in a few words').fill(`Open-source my app ${SECRET}`);
      // A draft from the first word: a reload resumes it.
      await page.waitForURL(/#\/choice\/c/);
      await page.reload();
      await heading(page, 'The choice').waitFor();
      expect(await page.getByLabel('The choice, in a few words').inputValue()).toBe(`Open-source my app ${SECRET}`);
      await button(page, 'Others will see it').click();
      await button(page, 'Hard to undo').click();
      await sound(s, `6-choice-start${t}`);
      await button(page, 'Next').click();

      await button(page, /^Whether these are the right options/).click();
      await button(page, /^Something I don’t know, or am assuming/).click();
      await sound(s, `7-choice-unresolved${t}`);
      await button(page, 'Next').click();

      await heading(page, 'Possibilities').waitFor();
      await page.getByLabel('Add option').fill('Open it');
      await button(page, 'Add').click();
      await button(page, 'Keep things as they are').click();
      await page.getByRole('group', { name: 'Which way are you leaning?' }).getByRole('button', { name: 'Open it' }).click();
      await sound(s, `8-choice-options${t}`);
      await button(page, 'Next').click();

      await heading(page, 'Evidence').waitFor();
      await page.getByLabel('Add unknown').fill('Whether anyone would contribute');
      await button(page, 'Add').click();
      await button(page, 'Something I’m assuming').click();
      await page.getByRole('group', { name: 'Would the answer change what you do?' }).getByRole('button', { name: 'Yes' }).click();
      await button(page, 'Ask someone').click();
      // Back keeps everything; then on again.
      await button(page, 'Back').click();
      await heading(page, 'Possibilities').waitFor();
      expect(await page.getByLabel('Option 2').inputValue()).toBe('Keep things as they are');
      await button(page, 'Next').click();
      await button(page, 'Next').click();

      await heading(page, 'Summary').waitFor();
      expect(await page.getByText(/step 5 of 5/).count()).toBe(1); // no past examples step with an empty record
      const clearer = page.getByLabel('What became clearer');
      expect(await clearer.inputValue()).toBe(
        'Options: Open it (leaning); Keep things as they are\nCould change what I do: Whether anyone would contribute (an assumption) (ask someone)',
      );
      await clearer.fill(`${await clearer.inputValue()}\nThe licence matters less than I thought.`);
      await button(page, 'Try something small').click();
      await page.getByLabel('What exactly? (optional)').fill('Open one module first');
      await page.getByLabel(/What do you expect to happen/).fill('Two people send a fix');
      await page.getByLabel(/When might you know/).fill('2026-11-01');
      await sound(s, `9-choice-summary${t}`);
      await button(page, 'Save').click();

      await heading(page, 'What became clearer').waitFor();
      expect(await page.locator('article').textContent()).toContain('You expected: Two people send a fix (you might know by 1 Nov)');
      await page.getByText('Plain text, for your notes or an AI chat').click();
      expect(await page.getByLabel('Plain text').textContent()).toContain(`Choice: Open-source my app ${SECRET}`);
      await button(page, 'Keep a takeaway from this choice').click();
      await page.getByLabel('In your words').fill('Try the smallest open version first');
      await button(page, 'Keep it').click();
      await sound(s, `10-choice-saved${t}`);

      // Follow-up, whenever: too early first, then what happened, with a revised takeaway.
      await button(page, 'Add what happened').click();
      await button(page, 'Too early to say').click();
      await page.getByRole('region', { name: 'What happened' }).getByRole('button', { name: 'Save' }).click();
      await page.getByText(/1 Oct · Too early to say/).waitFor();
      await button(page, 'Add what happened').click();
      await button(page, 'Something happened').click();
      await button(page, 'Not as I expected').click();
      await page.getByLabel('What happened? (optional)').fill('Nobody sent a fix');
      await page.getByLabel('Anything that surprised you? (optional)').fill('People starred it instead');
      await button(page, 'Settled').click();
      await button(page, 'Revise one').click();
      await page.getByRole('group', { name: 'Which one?' }).getByRole('button').first().click();
      await page.getByLabel('In your words').fill('Try the smallest open version first, and ask for help');
      await sound(s, `11-follow-up${t}`);
      await page.getByRole('region', { name: 'What happened' }).getByRole('button', { name: 'Save' }).click();
      await page.getByText(/Something happened · Not as I expected · settled/).waitFor();
      const record = await stored(page);
      expect(record.choices[0].outcomes.map((o) => o.state)).toEqual(['too-early', 'happened']);
      expect(record.takeaways[0].versions).toHaveLength(2);

      // A takeaway of your own, to pick by hand later.
      await page.getByRole('link', { name: 'Map', exact: true }).click();
      await page.getByLabel('A takeaway of your own').fill('Ask one person first');
      await button(page, 'Keep').click();

      // A second choice with the same shape is offered what came of the first, with the reason; it can be turned down.
      await page.getByRole('link', { name: 'Home', exact: true }).click();
      await page.getByRole('link', { name: 'Bring a choice' }).click();
      await page.getByLabel('The choice, in a few words').fill('Publish the zine online');
      await button(page, 'Others will see it').click();
      await button(page, 'Next').click();
      await button(page, /^Whether these are the right options/).click();
      await button(page, 'Next').click();
      await button(page, 'Keep things as they are').click();
      await button(page, 'Next').click();
      await heading(page, 'Past examples').waitFor();
      const offered = page.locator('article.card:visible');
      expect(await offered.count()).toBe(1); // the first choice and the takeaway kept from it are one example
      expect(await offered.textContent()).toContain('Why it appeared: Both have keeping things as they are among the options and others seeing it.');
      expect(await offered.textContent()).toContain('Exception: What happened went differently from expected: People starred it instead');
      await sound(s, `12-examples${t}`);
      await offered.getByRole('button', { name: 'Doesn’t apply' }).click();
      await page.getByText('Pick one yourself (1)').click();
      await offered.getByRole('button', { name: 'Applies here' }).click();
      await page.getByRole('region', { name: 'Your answers' }).waitFor();
      expect(await page.getByRole('region', { name: 'Your answers' }).textContent()).toMatch(/Doesn’t apply.*Applies here/s);
      await button(page, 'Next').click();
      expect(await page.getByLabel('What became clearer').inputValue()).toContain('Applies here: ');
      await button(page, 'Stop here without deciding').click();
      await button(page, 'Save').click();
      await heading(page, 'Past examples you said apply').waitFor();

      // Revising adds a save; discarding a revision keeps what was saved.
      await button(page, 'Revise').click();
      await heading(page, 'Summary').waitFor();
      page.once('dialog', (d) => void d.accept());
      await button(page, 'Discard changes').click();
      await heading(page, 'What became clearer').waitFor();

      await page.getByRole('link', { name: 'Map', exact: true }).click();
      expect(await page.getByRole('region', { name: 'Current choices' }).textContent()).toContain('Publish the zine online');
      await page.getByText('Settled choices (1)').click();
      expect(await page.getByRole('region', { name: 'History' }).textContent()).toContain(`Open-source my app ${SECRET}`);
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe.each<[Engine]>([['chromium'], ['webkit']])('the whole library in %s', (engine) => {
  it('plays every story to its ending, then says so without adding more', async () => {
    const s = await openApp(engine, app.url, { time: day(1), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      const shot = (name: string) => (engine === 'chromium' ? sound(s, name) : Promise.resolve());
      for (let n = 0; n < 12; n++) {
        const link = page.getByRole('link', { name: /^(Start here: |Play )/ });
        await link.click();
        await heading(page, 'Possible readings').or(page.getByRole('button', { name: 'Start' })).first().waitFor();
        await playEpisode(page, (n % 2) as 0 | 1, shot);
        for (const r of ['What you answered', 'Possible readings', 'Still unknown']) expect(await page.getByRole('region', { name: r }).count(), r).toBe(1);
        await page.getByText('About this story', { exact: true }).click();
        expect(await page.locator('details dl').textContent()).toContain('What it can’t show');
        await sound(s);
        await page.getByRole('link', { name: 'Home', exact: true }).click();
      }
      await page.getByText('You’ve played every story here. Replay any of them below, or bring a real choice.').waitFor();
      const plays = (await stored(page)).plays;
      expect(new Set(plays.map((p) => p.episode)).size).toBe(12);
      expect(new Set(plays.map((p) => p.beat.kind))).toEqual(new Set(['twist', 'widen', 'cut', 'peek', 'slide']));
      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe('data that can’t be used, or comes from earlier versions (chromium)', () => {
  it('refuses unreadable data and leaves it untouched until the player chooses', async () => {
    const s = await openApp('chromium', app.url, { time: day(1) });
    try {
      const { page } = s;
      await page.evaluate(() => localStorage.setItem('tell', '{ broken'));
      await page.reload();
      await heading(page, 'Tell couldn’t open your saved data').waitFor();
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe('{ broken');
      page.once('dialog', (d) => void d.accept());
      await button(page, 'Start fresh').click();
      await heading(page, 'See what would make a choice clearer').waitFor();
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBeNull();
    } finally {
      await s.close();
    }
  });

  it('carries the first version’s record into the history, whole, and offers it as a download', async () => {
    const s = await openApp('chromium', app.url, { time: day(1) });
    try {
      const { page } = s;
      const v1 = { schema: 1, answers: [{ card: 'w-01', pick: 'power' }], deal: null, kept: [], disagreed: [], notes: [] };
      await page.evaluate((doc) => localStorage.setItem('tell', doc), JSON.stringify(v1));
      await page.reload();
      await page.getByText('Your record from the first version of Tell was carried over and kept exactly as it was, under History on your map.').waitFor();
      expect((await stored(page)).archive[0].doc).toEqual(v1);
      await page.getByRole('link', { name: 'Map', exact: true }).click();
      await page.getByText('Your record from the first version of Tell', { exact: true }).click();
      await s.shot('13-archive');
      const [file] = await Promise.all([page.waitForEvent('download'), button(page, 'Download it').click()]);
      expect(JSON.parse(readFileSync((await file.path())!, 'utf8'))).toEqual(v1);
    } finally {
      await s.close();
    }
  });
});
