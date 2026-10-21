import { readFileSync } from 'node:fs';
import type { Locator, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TellState } from '../src/domain/types';
import { PHONE, SMALL_PHONE, openApp, overflowsSideways, pageScrolls, smallTargets, startApp, type Engine, type Session } from './browser';
import { ADVICE, DESCRIBES_YOU } from './wording';

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
const region = (page: Page | Locator, name: string) => page.getByRole('region', { name, exact: true });
const ending = (page: Page) => heading(page, 'What you did');
const tab = (page: Page, name: 'Play' | 'Bring a choice' | 'Map' | 'About') => page.getByRole('link', { name, exact: true });
const FIXTURE = readFileSync(new URL('./fixtures/tell-2.0.json', import.meta.url), 'utf8');
const FIXTURE_3 = readFileSync(new URL('./fixtures/tell-3.0.json', import.meta.url), 'utf8');
const FIXTURE_31 = readFileSync(new URL('./fixtures/tell-3.1.json', import.meta.url), 'utf8');

/** The checks every screen must pass: nothing sideways, only <main> scrolls, tap targets of 44px, and no word about the player or urging them, in the page or an open card. */
async function sound(s: Session, name?: string) {
  expect(await overflowsSideways(s.page), name).toBe(false);
  expect(await pageScrolls(s.page), name).toBe(false);
  expect(await smallTargets(s.page), name).toEqual([]);
  const card = s.page.locator('dialog[open]');
  const text = (await s.page.locator('main').innerText()) + ((await card.count()) ? await card.innerText() : '');
  expect(text, name).not.toMatch(DESCRIBES_YOU);
  expect(text, name).not.toMatch(ADVICE);
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
  it('plays every kind of story with its moves in view, a variant beside its story, the map of moves, and a real choice', async () => {
    const s = await openApp(engine, app.url, { time: day(1), colorScheme: scheme, viewport });
    const t = tag(viewport);
    const { page } = s;
    const did = () => region(page, 'What you did').locator('ul.results');
    const pills = (where = did()) => where.locator('.move-name').allTextContents();
    const card = () => page.getByRole('dialog');
    const close = async () => {
      await button(page, 'Close').click();
      await card().waitFor({ state: 'hidden' });
    };
    try {
      await heading(page, 'Pick a story').waitFor();
      for (const name of ['Play', 'Bring a choice', 'Map', 'About'] as const) expect(await tab(page, name).isVisible()).toBe(true);
      await sound(s, `1-home${t}`);

      // The shape of the step is there from the start; each question opens its card.
      await open(page, 'The old oak');
      const shape = page.getByRole('group', { name: 'The step: felling the oak' });
      expect(await shape.getByRole('button').allTextContents()).toEqual(['UndoNo', 'Know whenCheck first, once done', 'If you waitRisk grows', 'If it goes badlyHard to recover']);
      await sound(s, `2-start${t}`);
      await button(page, 'If you wait: Risk grows').click();
      await heading(page, 'If you wait, what happens?').waitFor();
      expect(await card().locator('li.on').textContent()).toBe('The risk growsLike a leak in the roof.');
      expect(await card().textContent()).toContain('Waiting is worth its cost only if something useful arrives while you wait.');
      await sound(s, `2-question${t}`);
      await close();

      // Finding out from a budget: the move it makes shows before deciding.
      await button(page, /^Have the trunk scanned/).click();
      await page.getByText('About a third of the trunk is hollow.', { exact: false }).waitFor();
      expect(await page.getByText('1 week left to find things out.').isVisible()).toBe(true);
      expect(await button(page, /^Decide/).textContent()).toBe('DecideLook first');
      await sound(s, `3-uncover${t}`);
      await button(page, /^Decide/).click();
      await page.getByText('What happens to the oak?').waitFor();
      expect(await page.locator('.condition').textContent()).toContain('About a third of the trunk is hollow.');
      // Every option shows the moves it makes before it's chosen.
      expect(await page.locator('button.option .moves').allTextContents()).toEqual(['Commit', 'Guard', 'Hold it openGuard']);
      await button(page, /^Leave it, and fence off the path/).click();
      await ending(page).waitFor();
      expect(await page.evaluate(() => document.activeElement?.textContent)).toBe('The old oak');
      // Each step names its moves, New the first time, with what it cost and risked here.
      expect(await did().textContent()).toBe(
        'Spent 3 of 4 weeks finding out: “Have the trunk scanned”.Look firstNewCost: weeks closer to the storms. Risk: facts that still don’t settle it.' +
          'Chose “Leave it, and fence off the path”.Hold it openNewGuardNewCost: a longer walk to school while it stands. Risk: the oak coming down inside the fence.',
      );
      expect(await region(page, 'Other ways through').textContent()).toContain('Other moves in this story:Commit');
      await sound(s, `4-ending${t}`);
      // A move opens its card: what it is, the answers it fits, where the player made it, and the stories with it.
      await region(page, 'What you did').getByRole('button', { name: /^Guard/ }).click();
      await heading(page, 'Guard').waitFor();
      expect(await card().textContent()).toContain('Fits a step withIf it goes badlyHard to recover');
      expect(await card().textContent()).toContain('The old oak: Chose “Leave it, and fence off the path”.');
      expect(await region(card(), 'Stories with it').textContent()).toBe('Stories with itThe old oak');
      await sound(s, `4-card${t}`);
      await close();

      // Choose, see what follows, choose again.
      await page.getByRole('link', { name: 'Back to the stories' }).click();
      expect(await page.getByRole('link', { name: /The old oak/ }).textContent()).toContain('Played 1 Oct');
      await open(page, 'The new loaf');
      await button(page, /^Put twelve on the shelf on Saturday/).click();
      await page.getByText('By closing time on Saturday, seven of the twelve have gone.', { exact: false }).waitFor();
      await sound(s, `5-follows${t}`);
      await button(page, /^Bake it every Saturday/).click();
      await ending(page).waitFor();
      expect(await pills()).toEqual(['Try it smallNew', 'CommitNew']);

      // Day by day: what picking today would make changes as the days pass.
      await open(page, 'The harvest');
      await button(page, 'Wait a day').click();
      await page.getByText('Forecast: five in ten, Thursday or Friday.', { exact: false }).waitFor();
      expect(await page.locator('.live').textContent()).toMatch(/^If you pick today:\s*Commit$/);
      await button(page, 'Wait a day').click();
      await page.getByText('Forecast: seven in ten', { exact: false }).waitFor();
      expect(await page.locator('.live').textContent()).toMatch(/^If you pick today:\s*Wait for it$/);
      await sound(s, `6-days${t}`);
      await button(page, 'Pick today').click();
      await ending(page).waitFor();
      expect(await did().textContent()).toBe('“Pick today” on Wednesday.Wait for itNewCost: Thursday’s extra sweetness. Risk: a storm two days early.');

      // One fact changed: the variant, offered at the ending with the answer it changes, then both plays side by side.
      const whatIf = region(page, 'What if the forecasts stopped after Monday?');
      expect(await whatIf.getByRole('button', { name: 'Know when: Once done, was News comes' }).count()).toBe(1);
      await whatIf.getByRole('link', { name: 'Play it that way' }).click();
      await heading(page, 'The harvest, without forecasts').waitFor();
      expect(await button(page, 'Know when: Once done, was News comes').count()).toBe(1);
      expect(await page.locator('button.option .moves').allTextContents()).toEqual(['Commit', 'Split it', 'Set a tripwire']);
      await sound(s, `7-variant${t}`);
      await button(page, /^Pick half today, the rest on Thursday/).click();
      await ending(page).waitFor();
      expect(await region(page, 'Both ways').textContent()).toBe(
        'Both waysWhen will you know whether it was right?' +
          'The harvestNews comes“Pick today” on Wednesday.Wait for it' +
          'The harvest, without forecastsOnce doneChose “Pick half today, the rest on Thursday”.Split it' +
          'Finding out first is worth something only if it could change the step, and comes before the step must be taken.',
      );
      await sound(s, `7-both${t}`);

      // Asking brings only an answer here, and is a move of its own; moves already shown aren't New again.
      await open(page, 'The last of the light');
      expect(await button(page, /^Ask the camera operator/).textContent()).toBe('Ask the camera operator about take fourLook first');
      await button(page, /^Ask the camera operator/).click();
      await page.getByText('On film, you only know on Thursday.', { exact: false }).waitFor();
      expect(await page.locator('button.option').count()).toBe(2);
      await sound(s, `8-ask${t}`);
      await button(page, /^The wide shot of the lighthouse/).click();
      await ending(page).waitFor();
      expect(await pills()).toEqual(['Look first', 'Commit']);
      expect(await page.getByText('On Thursday the lab will show whether take four', { exact: false }).count()).toBe(1);
      expect(await heading(page, 'What if a second camera had filmed the scene from the side?').count()).toBe(1);
      await page.getByText('What’s real in this story').click();
      await page.getByRole('link', { name: 'Wikipedia, “Dailies”' }).waitFor();
      expect(await page.getByText('this story is shot on film', { exact: false }).count()).toBe(1);

      // Asking brings another option, with its own costs.
      await open(page, 'Your uncle’s boat');
      expect(await button(page, /^Lend her to the club/).count()).toBe(0);
      await button(page, /^Ask at the sailing club first/).click();
      await page.getByText('beginners are hard on boats', { exact: false }).waitFor();
      await button(page, /^Lend her to the club for the season/).click();
      await ending(page).waitFor();
      expect(await pills()).toEqual(['Make another optionNew', 'Hand it overNew']);

      // Share something scarce: the moves change as the rows do.
      await open(page, 'The last packet');
      expect(await page.locator('.live').textContent()).toBe('No move: holding off.');
      await button(page, 'One row more').click();
      await button(page, 'One row more').click();
      expect(await page.getByRole('group', { name: 'The old beans', exact: true }).textContent()).toContain('2');
      expect(await pills(page.locator('.live'))).toEqual(['Try it small', 'Keep it by using']);
      for (let i = 0; i < 3; i++) await button(page, 'One row more').click();
      expect(await pills(page.locator('.live'))).toEqual(['Split it', 'Keep it by using']);
      for (let i = 0; i < 3; i++) await button(page, 'One row fewer').click();
      await sound(s, `9-allocate${t}`);
      await button(page, 'Done').click();
      await ending(page).waitFor();
      expect(await pills()).toEqual(['Try it small', 'Keep it by usingNew']);

      // The map, after a reload: every move, by what it deals with, the same for everyone; under each, where the player made it.
      await page.reload();
      await tab(page, 'Map').click();
      await heading(page, 'Your map').waitFor();
      const moves = region(page, 'Moves');
      expect(await moves.getByRole('button').allTextContents()).toEqual([
        'Look firstIn The old oak, The last of the light',
        'Wait for itIn The harvest',
        'Try it smallIn The new loaf, The last packet',
        'Make it undoableLike renting before buying',
        'Split itIn The harvest, without forecasts',
        'Hold it openIn The old oak',
        'Ask for more timeLike a week more before answering an offer',
        'Hand it overIn Your uncle’s boat',
        'Keep it by usingIn The last packet',
        'GuardIn The old oak',
        'Buy a spareLike a backup copy, kept somewhere else',
        'Make another optionIn Your uncle’s boat',
        'CommitIn The new loaf, The last of the light',
        'Rule it outLike telling the buyer no, and meaning it',
        'Set a tripwireLike a rule that if it isn’t paying by March, it stops',
      ]);
      expect(await page.locator('.tag').count()).toBe(0);
      expect(await region(page, 'Both ways').getByRole('link').allTextContents()).toEqual(['The harvest', 'The harvest, without forecasts']);
      await sound(s, `10-map${t}`);
      await moves.getByRole('button', { name: /^Look first/ }).click();
      expect(await card().textContent()).toContain('The last of the light: Asked the camera operator, then chose “The wide shot of the lighthouse”.');
      await close();

      // A replay down another path keeps every play, and what was made before stays.
      await page.getByText('Everything you’ve played').click();
      await page.getByRole('link', { name: 'The old oak' }).last().click();
      await page.getByRole('link', { name: 'Play it again' }).click();
      await page.getByText('You played this on 1 Oct. Playing again keeps every play.').waitFor();
      await button(page, 'Decide without finding out').click();
      await button(page, /^Fell it/).click();
      await ending(page).waitFor();
      expect(await page.locator('article .eyebrow').first().textContent()).toBe('A village green · replay 1');
      expect(await did().textContent()).toBe(
        'Decided without spending time finding out.Cost: no time at all. Risk: acting on a lean and some fungus alone.Chose “Fell it”.CommitCost: a two-hundred-year-old tree. Risk: felling a tree that would have stood for decades.',
      );
      await tab(page, 'Map').click();
      await heading(page, 'Your map').waitFor();
      expect(await region(page, 'Moves').getByRole('button').allTextContents()).toContain('CommitIn The new loaf, The last of the light, The old oak');

      // Bring a choice: four questions in taps, the shape building as they're answered, then the moves that fit, by rule.
      await tab(page, 'Bring a choice').click();
      await heading(page, 'Bring a choice').waitFor();
      // A long word the player types wraps rather than running off the screen.
      await page.getByLabel('The step, in a few words, if you like').fill('Supercalifragilisticexpialidociousrewriteofeverything');
      await button(page, 'Start').click();
      await sound(s);
      await button(page, 'Back').click();
      await page.getByLabel('The step, in a few words, if you like').fill('Open-source my app');
      await sound(s, `11-bring${t}`);
      await button(page, 'Start').click();
      await heading(page, 'If you take it, can it be undone?').waitFor();
      // An everyday moment for every answer; the steps of stories the player has played as well.
      expect(await button(page, /^Easily/).textContent()).toBe('EasilyLike moving a meeting; as in putting the new bread on sale and sowing the old beans.');
      await button(page, /^No\b/).click();
      await heading(page, 'When will you know whether it was right?').waitFor();
      const next = button(page, 'Next');
      expect(await next.isDisabled()).toBe(true);
      await button(page, /^Before, by checking or asking/).click();
      await button(page, /^Only once it’s done/).click();
      // Not sure stands alone, and any other answer clears it.
      await button(page, 'Not sure').click();
      expect(await page.locator('button[aria-pressed="true"]').allTextContents()).toEqual(['Not sure']);
      await button(page, /^Before, by checking or asking/).click();
      await button(page, /^Only once it’s done/).click();
      expect(await page.locator('button[aria-pressed="true"]').count()).toBe(2);
      expect(await button(page, 'Undo: No').count()).toBe(1);
      expect(await button(page, 'Know when: Check first, once done').count()).toBe(1);
      await sound(s, `12-question${t}`);
      await next.click();
      await button(page, /^The chance goes/).click();
      await button(page, /^Hard to recover from/).click();
      await heading(page, 'Open-source my app').waitFor();
      const fits = region(page, 'Moves that fit what you said');
      const rows = fits.getByRole('button');
      expect(await fits.locator('h3').allTextContents()).toEqual(['Find out first', 'Soften the step', 'Keep it open', 'Limit the harm', 'Find another way', 'Settle it']);
      expect(await rows.count()).toBe(14);
      expect(await rows.first().textContent()).toBe('Look firstChecking or asking before the step.Because you said there’s something to check or ask first.');
      expect(await rows.nth(1).textContent()).toBe('Try it smallCould part of it go first, and be stopped?Because you said it will only show once it’s done.');
      await sound(s, `13-results${t}`);
      // An answer changes from its cell, and the moves follow it.
      await button(page, 'If it goes badly: Hard to recover').click();
      await heading(page, 'If it goes badly, how bad?').waitFor();
      await button(page, /^Something to get over/).click();
      await heading(page, 'Open-source my app').waitFor();
      expect(await rows.count()).toBe(12);
      await button(page, 'If it goes badly: Get over it').click();
      await button(page, /^Hard to recover from/).click();
      await heading(page, 'Open-source my app').waitFor();
      expect(await rows.count()).toBe(14);
      // A row opens the move's card: its price, its limit, an example, and the player's own where there is one.
      await rows.filter({ hasText: 'Ask for more time' }).click();
      await heading(page, 'Ask for more time').waitFor();
      expect(await card().textContent()).toContain('Does someone else set the deadline?');
      expect(await card().textContent()).toContain('For instanceA week more before answering an offer.');
      expect(await card().getByText('Stories with it').count()).toBe(0);
      await sound(s, `14-card${t}`);
      await close();
      await rows.filter({ hasText: 'Hold it open' }).click();
      expect(await card().textContent()).toContain('The old oak: Chose “Leave it, and fence off the path”.');
      await close();

      // Kept only when the player keeps it; then a move can be marked from its card, and a note added.
      expect((await stored(page)).choices).toEqual([]);
      await button(page, 'Keep this choice').click();
      await page.getByText(/^Kept 1 Oct/).waitFor();
      await rows.filter({ hasText: 'Try it small' }).click();
      await button(page, 'I’m trying this').click();
      await button(page, 'Trying this').waitFor();
      await close();
      expect(await rows.filter({ hasText: 'Try it small' }).locator('.tag').textContent()).toBe('Trying');
      await page.getByLabel('Notes').fill('One module first, for five friends.');
      await sound(s, `15-kept${t}`);
      await page.reload();
      await heading(page, 'Open-source my app').waitFor();
      expect(await page.getByLabel('Notes').inputValue()).toBe('One module first, for five friends.');
      await tab(page, 'Bring a choice').click();
      expect(await region(page, 'Your choices').locator('ul').textContent()).toBe('Open-source my appKept 1 Oct. Trying: Try it small');
      // When a question doesn't describe the choice, Tell says so before the moves; leaving keeps nothing.
      await button(page, 'Start').click();
      await button(page, /^Easily/).click();
      await button(page, /^Only once it’s done/).click();
      await button(page, 'Next').click();
      await button(page, /^Not much/).click();
      await button(page, 'None of these').click();
      await page.getByText('Some of the questions don’t describe this choice, so these moves cover only part of it.').waitFor();
      await button(page, 'Leave without keeping').click();
      await heading(page, 'Bring a choice').waitFor();
      expect((await stored(page)).choices).toHaveLength(1);
      await tab(page, 'About').click();
      await heading(page, 'How Tell works').waitFor();
      expect(await page.getByText('Everything stays in this browser: 8 plays and 1 kept choice.').count()).toBe(1);
      await sound(s, `16-about${t}`);

      const state = await stored(page);
      expect(state.plays.map((p) => [p.situation, p.replay])).toEqual([
        ['oak', 0],
        ['loaf', 0],
        ['harvest', 0],
        ['harvest-blind', 0],
        ['take', 0],
        ['boat', 0],
        ['beans', 0],
        ['oak', 1],
      ]);
      expect(state.choices.map((c) => [c.label, c.shape, c.trying, c.note])).toEqual([
        ['Open-source my app', { undo: 'no', know: ['check', 'after'], wait: 'closes', bad: 'hard' }, ['small'], 'One module first, for five friends.'],
      ]);
      expect(Object.keys(state.seen).sort()).toEqual(['another', 'by-using', 'commit', 'guard', 'hand-over', 'hold', 'look', 'small', 'split', 'wait-for-it']);
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
      await heading(page, 'Pick a story').waitFor();
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
      await open(page, 'The last of the light');
      await button(page, /^Another take of the scene/).click();
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

  it.each([
    ['3.0', 4, FIXTURE_3],
    ['3.1', 5, FIXTURE_31],
  ] as const)('keeps a Tell %s record whole too, and starts afresh', async (version, schema, fixture) => {
    const s = await openApp(engine, app.url, { time: day(1), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      await page.evaluate((doc) => localStorage.setItem('tell', doc), fixture);
      await page.reload();
      await page.getByText(`Tell has changed. Your record from Tell ${version} is kept exactly as it was, and you can download it from About.`).waitFor();
      const state = await stored(page);
      expect(state.plays).toEqual([]);
      expect(state.choices).toEqual([]);
      expect(state.archive.map((a) => [a.schema, a.doc])).toEqual([[schema, JSON.parse(fixture)]]);
      await tab(page, 'Map').click();
      await heading(page, 'Your map').waitFor();
      expect(await region(page, 'Moves').getByText(/^In /).count()).toBe(0);
    } finally {
      await s.close();
    }
  });

  it('refuses records from a newer version of the language, untouched, without offering to start fresh', async () => {
    const s = await openApp(engine, app.url, { time: day(1), viewport: SMALL_PHONE });
    try {
      const { page } = s;
      await open(page, 'The last of the light');
      await button(page, /^Another take of the scene/).click();
      await ending(page).waitFor();
      const newer = await page.evaluate(() => {
        const doc = JSON.parse(localStorage.getItem('tell')!);
        doc.plays[0].language = 2;
        localStorage.setItem('tell', JSON.stringify(doc));
        return localStorage.getItem('tell');
      });
      await page.reload();
      await page.getByText('Update Tell to open it. Your data is waiting, untouched.').waitFor();
      expect(await button(page, 'Start fresh').count()).toBe(0);
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe(newer);
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
