import { readFileSync } from 'node:fs';
import type { Page } from 'playwright';
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
const region = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
const ending = (page: Page) => heading(page, 'What you did');
const tab = (page: Page, name: 'Play' | 'Map' | 'About') => page.getByRole('link', { name, exact: true });
const FIXTURE = readFileSync(new URL('./fixtures/tell-2.0.json', import.meta.url), 'utf8');
const FIXTURE_3 = readFileSync(new URL('./fixtures/tell-3.0.json', import.meta.url), 'utf8');
const FIXTURE_31 = readFileSync(new URL('./fixtures/tell-3.1.json', import.meta.url), 'utf8');

/** The checks every screen must pass: nothing sideways, only <main> scrolls, tap targets of 44px, and no word about the player or urging them. */
async function sound(s: Session, name?: string) {
  expect(await overflowsSideways(s.page), name).toBe(false);
  expect(await pageScrolls(s.page), name).toBe(false);
  expect(await smallTargets(s.page), name).toEqual([]);
  const text = await s.page.locator('main').innerText();
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
  it('plays every kind of story, names the moves each path made, keeps them on the map through a replay and a reload, and brings a real choice', async () => {
    const s = await openApp(engine, app.url, { time: day(1), colorScheme: scheme, viewport });
    const t = tag(viewport);
    const { page } = s;
    const did = () => region(page, 'What you did').locator('ul.results');
    try {
      await heading(page, 'Pick a story').waitFor();
      expect(await page.getByRole('link', { name: 'Bring a choice' }).getAttribute('href')).toBe('#/bring');
      await sound(s, `1-home${t}`);

      // Find things out from a budget, then choose with what was found in view.
      await open(page, 'The old oak');
      await sound(s, `2-start${t}`);
      await button(page, /^Have the trunk scanned/).click();
      await page.getByText('About a third of the trunk is hollow.', { exact: false }).waitFor();
      expect(await page.getByText('1 week left to find things out.').isVisible()).toBe(true);
      await sound(s, `3-uncover${t}`);
      await button(page, 'Decide').click();
      await page.getByText('What happens to the oak?').waitFor();
      expect(await page.locator('.condition').textContent()).toContain('About a third of the trunk is hollow.');
      await button(page, /^Leave it, and fence off the path/).click();
      await ending(page).waitFor();
      expect(await page.evaluate(() => document.activeElement?.textContent)).toBe('The old oak');
      // Each step names the moves it made, New the first time; the shape of the step follows.
      expect(await did().textContent()).toBe('Spent 3 of 4 weeks finding out: “Have the trunk scanned”.Look firstNewChose “Leave it, and fence off the path”.Hold it openNewGuardNew');
      expect(await region(page, 'Other ways through').textContent()).toContain('Other moves in this story: Commit.');
      expect(await region(page, 'The shape of it').textContent()).toContain('The four questions, about felling the oak.If you take it, can it be undone?No');
      expect(await region(page, 'What you did').locator('p').first().textContent()).toBe('Moves here are about felling the oak.');
      await sound(s, `4-ending${t}`);

      // Choose, see what follows, choose again.
      await page.getByRole('link', { name: 'Back to the stories' }).click();
      expect(await page.getByRole('link', { name: /The old oak/ }).textContent()).toContain('Played 1 Oct');
      await open(page, 'The new loaf');
      await button(page, /^Put twelve on the shelf on Saturday/).click();
      await page.getByText('By closing time on Saturday, seven of the twelve have gone.', { exact: false }).waitFor();
      await sound(s, `5-follows${t}`);
      await button(page, 'Bake it every Saturday').click();
      await ending(page).waitFor();
      expect(await did().textContent()).toBe('Chose “Put twelve on the shelf on Saturday”.Try it smallNewChose “Bake it every Saturday”.CommitNew');

      // Day by day.
      await open(page, 'The harvest');
      await button(page, 'Wait a day').click();
      await page.getByText('Forecast: five in ten, Thursday or Friday.', { exact: false }).waitFor();
      await button(page, 'Wait a day').click();
      await page.getByText('Forecast: seven in ten', { exact: false }).waitFor();
      await sound(s, `7-days${t}`);
      await button(page, 'Pick today').click();
      await ending(page).waitFor();
      expect(await did().textContent()).toBe('“Pick today” on Wednesday.Wait for itNew');

      // Asking brings only an answer here, and is a move of its own; moves already shown aren't New again.
      await open(page, 'The last of the light');
      await button(page, 'Ask the camera operator about take four').click();
      await page.getByText('On film, you only know on Thursday.', { exact: false }).waitFor();
      expect(await page.locator('button.option').count()).toBe(2);
      await sound(s, `8-ask${t}`);
      await button(page, /^The wide shot of the lighthouse/).click();
      await ending(page).waitFor();
      expect(await did().textContent()).toBe('Asked the camera operator, then chose “The wide shot of the lighthouse”.Look firstCommit');
      expect(await page.getByText('On Thursday the lab will show whether take four', { exact: false }).count()).toBe(1);
      await page.getByText('What’s real in this story').click();
      await page.getByRole('link', { name: 'Wikipedia, “Dailies”' }).waitFor();
      expect(await page.getByText('this story is shot on film', { exact: false }).count()).toBe(1);

      // Asking brings another option, with its own costs.
      await open(page, 'Your uncle’s boat');
      expect(await button(page, /^Lend her to the club/).count()).toBe(0);
      await button(page, 'Ask at the sailing club first').click();
      await page.getByText('beginners are hard on boats', { exact: false }).waitFor();
      await button(page, /^Lend her to the club for the season/).click();
      await ending(page).waitFor();
      expect(await did().textContent()).toBe('Asked at the sailing club, then chose “Lend her to the club for the season”.Make another optionNewHand it overNew');

      // Share something scarce.
      await open(page, 'The last packet');
      await button(page, 'One row more').click();
      await button(page, 'One row more').click();
      expect(await page.getByRole('group', { name: 'The old beans' }).textContent()).toContain('2');
      await sound(s, `9-allocate${t}`);
      await button(page, 'Done').click();
      await ending(page).waitFor();
      expect(await did().textContent()).toBe('The old beans: 2 rows. Your usual vegetables: 8 rows.Try it smallKeep it by usingNew');

      // The map, after a reload: the moves made, by what they deal with, and the shapes that differed.
      await page.reload();
      await tab(page, 'Map').click();
      await heading(page, 'Your map').waitFor();
      const moves = region(page, 'Your moves');
      expect(await moves.locator('summary').allTextContents()).toEqual([
        'Look firstThe old oak, The last of the light',
        'Wait for itThe harvest',
        'Try it smallThe new loaf, The last packet',
        'Hold it openThe old oak',
        'Hand it overYour uncle’s boat',
        'Keep it by usingThe last packet',
        'GuardThe old oak',
        'Make another optionYour uncle’s boat',
        'CommitThe new loaf, The last of the light',
      ]);
      expect(await page.locator('.tag').count()).toBe(0);
      const shapes = region(page, 'The shapes you’ve played');
      expect(await shapes.locator('summary').allTextContents()).toEqual([
        'If you take it, can it be undone?Easily · No',
        'When will you know whether it was right?Before, by checking or asking · In time, by waiting · Only once it’s done',
        'If you wait, what happens?Not much · The chance goes · The risk grows · Better, but riskier',
        'If it goes badly, how bad?Something to get over · Hard to recover from',
      ]);
      expect(await shapes.textContent()).toContain('Easily: The new loaf (Try it small, Commit); The last packet (Try it small, Keep it by using)');
      await sound(s, `10-map${t}`);
      await moves.getByText('Look first').click();
      expect(await moves.textContent()).toContain('The last of the light: Asked the camera operator, then chose “The wide shot of the lighthouse”.');

      // A replay down another path keeps every play, and what was made before stays.
      await page.getByText('Everything you’ve played').click();
      await page.getByRole('link', { name: 'The old oak' }).last().click();
      await page.getByRole('link', { name: 'Play it again' }).click();
      await page.getByText('You played this on 1 Oct. Playing again keeps every play.').waitFor();
      await button(page, 'Decide without finding out').click();
      await button(page, /^Fell it/).click();
      await ending(page).waitFor();
      expect(await page.locator('article .eyebrow').first().textContent()).toBe('A village green · replay 1');
      expect(await did().textContent()).toBe('Decided without spending time finding out.Chose “Fell it”.Commit');
      await tab(page, 'Map').click();
      await heading(page, 'Your map').waitFor();
      expect(await region(page, 'Your moves').locator('summary').allTextContents()).toContain('CommitThe new loaf, The last of the light, The old oak');

      // Bring a choice: four questions in taps, then the moves that fit, by rule.
      await page.getByRole('link', { name: 'Bring a choice' }).click();
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
      await sound(s, `12-question${t}`);
      await next.click();
      await button(page, /^The chance goes/).click();
      await button(page, /^Hard to recover from/).click();
      await heading(page, 'Open-source my app').waitFor();
      const lines = page.locator('details.cell > summary');
      expect(await lines.allTextContents()).toEqual([
        'Find out firstLook first · Try it small',
        'Soften the stepMake it undoable · Split it',
        'Keep it openHold it open · Ask for more time · Hand it over · Keep it by using',
        'Limit the harmGuard · Buy a spare',
        'Find another wayMake another option',
        'Settle itCommit · Rule it out · Set a tripwire',
      ]);
      await sound(s, `13-results${t}`);
      await lines.nth(2).click();
      const opened = page.locator('details.cell[open]');
      expect(await opened.textContent()).toContain('Does someone else set the deadline?');
      expect(await opened.textContent()).toContain('In your play of The old oak: Chose “Leave it, and fence off the path”.');
      expect(await opened.textContent()).toContain('For instance, a week more before answering an offer.');
      await opened.scrollIntoViewIfNeeded();
      await sound(s, `14-line${t}`);

      // Kept only when the player keeps it; then a move can be marked, and a note added.
      expect((await stored(page)).choices).toEqual([]);
      await button(page, 'Keep this choice').click();
      await page.getByText(/^Kept 1 Oct/).waitFor();
      await lines.first().click();
      await button(page, 'I’m trying this').nth(1).click();
      await button(page, 'Trying this').waitFor();
      await page.getByLabel('Notes').fill('One module first, for five friends.');
      await sound(s, `15-kept${t}`);
      await page.reload();
      await heading(page, 'Open-source my app').waitFor();
      expect(await page.getByLabel('Notes').inputValue()).toBe('One module first, for five friends.');
      await tab(page, 'Map').click();
      expect(await region(page, 'Your choices').locator('ul').textContent()).toBe('Open-source my appKept 1 Oct. Trying: Try it small');
      // When a question doesn't describe the choice, Tell says so before the moves; leaving keeps nothing.
      await tab(page, 'Play').click();
      await page.getByRole('link', { name: 'Bring a choice' }).click();
      await button(page, 'Start').click();
      await button(page, /^Easily/).click();
      await button(page, /^Only once it’s done/).click();
      await button(page, 'Next').click();
      await button(page, /^Not much/).click();
      await button(page, 'None of these').click();
      await page.getByText('Some of the questions don’t describe this choice, so these moves cover only part of it.').waitFor();
      await page.getByRole('link', { name: 'Leave without keeping' }).click();
      await heading(page, 'Your map').waitFor();
      expect((await stored(page)).choices).toHaveLength(1);
      await tab(page, 'About').click();
      await heading(page, 'How Tell works').waitFor();
      expect(await page.getByText('Everything stays in this browser: 7 plays and 1 kept choice.').count()).toBe(1);
      await sound(s, `16-about${t}`);

      const state = await stored(page);
      expect(state.plays.map((p) => [p.situation, p.replay])).toEqual([
        ['oak', 0],
        ['loaf', 0],
        ['harvest', 0],
        ['take', 0],
        ['boat', 0],
        ['beans', 0],
        ['oak', 1],
      ]);
      expect(state.choices.map((c) => [c.label, c.shape, c.trying, c.note])).toEqual([
        ['Open-source my app', { undo: 'no', know: ['check', 'after'], wait: 'closes', bad: 'hard' }, ['small'], 'One module first, for five friends.'],
      ]);
      expect(Object.keys(state.seen).sort()).toEqual(['another', 'by-using', 'commit', 'guard', 'hand-over', 'hold', 'look', 'small', 'wait-for-it']);
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
      await page.getByText('Nothing yet.', { exact: false }).waitFor();
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
