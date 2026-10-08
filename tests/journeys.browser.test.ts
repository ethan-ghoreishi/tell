import type { Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DECK, PAIRS } from '../src/domain/deck';
import { matchedPairs, observations, pairResults } from '../src/domain/engine';
import { OUTS, type Card, type Out, type TellState } from '../src/domain/types';
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

/** 09:00 on a day in October 2026, London time (BST). */
const day = (d: number) => new Date(`2026-10-${String(d).padStart(2, '0')}T09:00:00+01:00`);

async function answerRound(page: Page, choose: (card: Card) => string): Promise<Card> {
  const scene = (await page.locator('.scene').textContent())!.trim();
  const card = DECK.find((c) => c.scene === scene);
  if (!card) throw new Error(`No card has the scene on screen: ${scene}`);
  const id = choose(card);
  const text = card.options.find((o) => o.id === id)?.text ?? OUTS[id as Out];
  await page.getByRole('button', { name: text, exact: true }).click();
  await page.locator('.reveal').waitFor();
  return card;
}

const finished = (page: Page) => page.getByRole('heading', { name: 'That’s today’s set' });

/** Start today's set in an area and answer every round; calls `after` on each reveal. */
async function playSet(page: Page, choose: (card: Card) => string, area: string, after?: (card: Card) => Promise<void>) {
  await page.getByRole('button', { name: area, exact: true }).click();
  await page.getByRole('button', { name: /^Start/ }).click();
  for (;;) {
    await page.locator('.scene').waitFor();
    const card = await answerRound(page, choose);
    await after?.(card);
    await page.getByRole('button', { name: /^(Next round|Finish)$/ }).click();
    await page.locator('.scene').or(finished(page)).first().waitFor();
    if (await finished(page).isVisible()) return;
  }
}

async function nextDay(page: Page, d: number) {
  await page.clock.setSystemTime(day(d));
  await page.goto(page.url().replace(/#.*$/, '#/'));
  await page.reload();
  await page.getByRole('heading', { name: 'Today’s set' }).waitFor();
}

/** Sum the "k of n" figures in one area's record. */
async function areaTotals(page: Page, area: string) {
  const figures = await page.getByRole('region', { name: area, exact: true }).locator('.lens-summary .num').allTextContents();
  return figures.reduce(
    (t, f) => {
      const [k, n] = f.split(' of ').map(Number);
      return { picked: t.picked + k, offered: t.offered + n };
    },
    { picked: 0, offered: 0 },
  );
}

const firstOption = (c: Card) => c.options[0].id;

describe.each<[Engine, 'light' | 'dark', typeof PHONE]>([
  ['chromium', 'light', PHONE],
  ['webkit', 'dark', PHONE],
  ['chromium', 'light', SMALL_PHONE],
])('core loop in %s (%s, %o)', (engine, scheme, viewport) => {
  it('plays a set, keeps a line, survives a reload and shows the counts with denominators', async () => {
    const s: Session = await openApp(engine, app.url, { time: day(1), colorScheme: scheme, viewport });
    const small = viewport === SMALL_PHONE ? '-small' : '';
    try {
      const { page } = s;
      await page.getByRole('heading', { name: 'Today’s set' }).waitFor();
      expect(await overflowsSideways(page)).toBe(false);
      await s.shot(`1-home${small}`);

      await page.getByRole('button', { name: 'Start' }).click();
      await page.getByText('Round 1 of 4').waitFor();
      expect(await overflowsSideways(page)).toBe(false);
      await s.shot(`2-round${small}`);

      const first = await answerRound(page, firstOption);
      expect(await page.locator('.added').textContent()).toMatch(/has been offered 1 time and picked 1\./);
      await page.getByRole('button', { name: 'Keep' }).click();
      expect(await page.getByRole('button', { name: 'Kept' }).getAttribute('aria-pressed')).toBe('true');
      await page.getByRole('button', { name: 'I see this differently' }).click();
      expect(await page.getByRole('button', { name: /^Noted/ }).getAttribute('aria-pressed')).toBe('true');
      expect(await overflowsSideways(page)).toBe(false);
      await s.shot(`3-reveal${small}`);

      // A reload keeps the answer and the kept line; play resumes at round 2.
      await page.reload();
      await page.getByText('Round 2 of 4').waitFor();
      for (let i = 2; i <= 4; i++) {
        await answerRound(page, firstOption);
        await page.getByRole('button', { name: /^(Next round|Finish)$/ }).click();
      }
      await finished(page).waitFor();
      expect(await page.locator('.evidence li').count()).toBe(4);
      await s.shot(`4-done${small}`);

      await page.getByRole('link', { name: 'See your map' }).click();
      await page.getByRole('heading', { name: 'Your map' }).waitFor();
      const totals = await page.locator('.totals').textContent();
      expect(totals).toContain('4 rounds since');
      expect(totals).toContain('1 line kept');
      expect(first.kind !== 'switch' && (await page.getByText(first.line).isVisible())).toBe(true);
      // Day one deals two world rounds: four angles offered in each, one picked in each.
      expect(await areaTotals(page, 'The world')).toEqual({ picked: 2, offered: 8 });
      expect(await areaTotals(page, 'Work & projects')).toEqual({ picked: 2, offered: 8 });
      // What the app asked you to record, it shows.
      expect(await page.getByRole('region', { name: 'The world', exact: true }).textContent()).toContain(
        'You saw 1 of these 2 rounds differently',
      );
      expect(await overflowsSideways(page)).toBe(false);
      await s.shot(`5-map${small}`);

      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe('accumulation over the whole deck (chromium)', () => {
  it('builds matched pairs, paired choices and call-outs that stay once shown, and files a verdict as a note', async () => {
    const s = await openApp('chromium', app.url, { time: day(1) });
    try {
      const { page } = s;
      // The world: always lean on Incentives. Your own work: lean on Identity
      // until it is picked five times, then avoid it, so its call-out clears and
      // later falls back under the bar. The workshop answer changes when it returns.
      let identityPicks = 0;
      const choose = (c: Card) => {
        if (c.kind === 'switch') return c.id === 's-workshop-b' ? 'stay' : c.options[0].id;
        if (c.area === 'world') return (c.options.find((o) => o.lens === 'incentives') ?? c.options[0]).id;
        const identity = c.options.find((o) => o.lens === 'identity');
        if (identity && identityPicks < 5) {
          identityPicks += 1;
          return identity.id;
        }
        return c.options.find((o) => o.lens !== 'identity')!.id;
      };
      const shootPairs = async (c: Card) => {
        if (c.id === 's-workshop-b') await s.shot('6-pair-reveal');
      };
      const stored = async (): Promise<TellState> => JSON.parse((await page.evaluate(() => localStorage.getItem('tell')))!);

      await page.getByRole('heading', { name: 'Today’s set' }).waitFor();
      await playSet(page, choose, 'Mix');
      for (let d = 2; d <= 40 && (await stored()).answers.length < DECK.length; d++) {
        await nextDay(page, d);
        const preferred = d === 2 ? 'Mix' : d % 2 ? 'Work & projects' : 'The world';
        for (const area of [preferred, 'Mix']) {
          await page.getByRole('button', { name: area, exact: true }).click();
          if ((await page.getByRole('button', { name: /^Start/ }).count()) === 0) continue;
          await playSet(page, choose, area, shootPairs);
          break;
        }
      }
      const state = await stored();
      expect(state.answers).toHaveLength(DECK.length);

      await page.getByRole('link', { name: 'Map', exact: true }).click();
      await page.getByRole('heading', { name: 'Your map' }).waitFor();
      const explore = page.getByRole('region', { name: 'Something to explore' });

      // A call-out that still clears, with a verdict filed against its counts.
      const world = observations(state.answers).find((o) => o.id === 'lean:world:incentives')!;
      expect(world.clears).toBe(true);
      const worldCard = explore.getByRole('article').filter({ hasText: 'you looked first at Incentives' });
      expect(await worldCard.textContent()).toContain(`in ${world.chosen} of the ${world.offered} rounds where it was offered`);
      await worldCard.getByRole('button', { name: 'Partly' }).click();
      expect(await worldCard.getByRole('button', { name: 'Partly' }).getAttribute('aria-pressed')).toBe('true');
      expect(await worldCard.textContent()).toContain(`at ${world.counts}. A note, not evidence`);

      // A call-out that cleared and later fell back stays, marked, with both counts.
      const work = observations(state.answers).find((o) => o.id === 'lean:work:identity')!;
      expect(work).toMatchObject({ clears: false, first: { counts: '5 of 5' } });
      const workCard = explore.getByRole('article').filter({ hasText: 'Identity felt closest' });
      expect(await workCard.textContent()).toContain('No longer clears the bar');
      expect(await workCard.textContent()).toContain(`It cleared the bar at 5 of 5`);
      expect(await workCard.textContent()).toContain(`Now at ${work.counts}`);

      const matched = page.getByRole('region', { name: 'The world vs me', exact: true });
      expect(await matched.textContent()).toContain(`${matchedPairs(state.answers).length} matched pairs answered on both sides`);

      const done = pairResults(state.answers, PAIRS).filter((r) => r.second);
      expect(done).toHaveLength(PAIRS.length);
      const pairs = page.getByRole('region', { name: 'Paired choices' });
      expect(await pairs.textContent()).toContain(`Your answer changed in ${done.filter((r) => r.changed).length} of ${done.length} pairs.`);

      await explore.screenshot({ path: `${SHOTS}/chromium-light-7-call-outs.png`, animations: 'disabled' });
      // Only <main> scrolls, so a tall viewport is how the whole map fits one picture.
      await page.setViewportSize({ width: PHONE.width, height: 9000 });
      await s.shot('8-map-after-the-deck');

      expect(s.errors).toEqual([]);
    } finally {
      await s.close();
    }
  });
});

describe('unreadable data (chromium)', () => {
  it('is refused and left untouched until the player chooses what to do', async () => {
    const s = await openApp('chromium', app.url, { time: day(1) });
    try {
      const { page } = s;
      await page.evaluate(() => localStorage.setItem('tell', '{ broken'));
      await page.reload();
      await page.getByRole('heading', { name: 'Tell couldn’t open your saved data' }).waitFor();
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBe('{ broken');
      await s.shot('10-recovery');

      page.once('dialog', (d) => void d.accept());
      await page.getByRole('button', { name: 'Start fresh' }).click();
      await page.getByRole('heading', { name: 'Today’s set' }).waitFor();
      expect(await page.evaluate(() => localStorage.getItem('tell'))).toBeNull();
    } finally {
      await s.close();
    }
  });
});
