import { describe, expect, it } from 'vitest';
import { EPISODES, START } from './episodes';
import {
  addOutcome,
  answerExample,
  bracket,
  choiceFeatures,
  choiceText,
  createChoice,
  discardDraft,
  draftSummary,
  editChoice,
  emptyState,
  examplePool,
  examples,
  flowSteps,
  isCurrent,
  keep,
  library,
  nextAsk,
  playView,
  recordPlay,
  recordText,
  restore,
  retire,
  revise,
  reviseChoice,
  saveChoice,
  sourceLabel,
  suggestion,
  whyShown,
  wording,
  type OutcomeInput,
  type PlayAnswers,
} from './engine';
import { PART_ORDER, UNSURE, type BeatAnswer, type ChoiceContent, type Episode, type Side, type TellState } from './types';

const on = (d: number, h = 9) => new Date(2026, 9, d, h, 0, 0); // October 2026, local time
const ep = (id: string) => EPISODES.find((e) => e.id === id)!;

/** Answers that fit an episode: the first option, then the first option again ('stay') or the second ('change'). */
function answersFor(e: Episode, style: 'stay' | 'change' = 'stay'): PlayAnswers {
  const o = e.options.map((x) => x.id);
  const b = e.beat;
  let beat: BeatAnswer;
  if (b.kind === 'twist') beat = { kind: 'twist' };
  else if (b.kind === 'widen') beat = { kind: 'widen', picked: [b.items[0].id] };
  else if (b.kind === 'cut') beat = { kind: 'cut', order: b.items.slice(0, -1).map((i) => i.id) };
  else if (b.kind === 'peek') beat = { kind: 'peek', opened: [{ fact: 0, lean: o[0] }, { fact: 1, lean: o[1] }].slice(0, b.opens), wouldHave: [b.facts.length - 1] };
  else {
    const other: Side = b.rises === 'a' ? 'b' : 'a';
    const asked: { step: number; pick: Side }[] = [];
    for (let s = nextAsk(7, b.rises, asked); s !== null; s = nextAsk(7, b.rises, asked)) asked.push({ step: s, pick: s >= 3 ? b.rises : other });
    beat = { kind: 'slide', asked, outcome: { kind: 'switch', at: bracket(7, b.rises, asked).lo } };
  }
  return { first: o[0], beat, final: style === 'stay' ? o[0] : o[1] };
}

const play = (s: TellState, id: string, style: 'stay' | 'change' = 'stay', d = 1) => recordPlay(s, EPISODES, id, answersFor(ep(id), style), on(d));

/** A saved choice built from a few structured answers. */
function choice(s: TellState, id: string, content: Partial<ChoiceContent>, d = 2): TellState {
  return saveChoice(editChoice(createChoice(s, id, on(d)), id, { title: id, ...content }, on(d)), id, on(d));
}

describe('plays', () => {
  it('records every episode as a snapshot of what it showed, and numbers replays', () => {
    let s = emptyState();
    for (const e of EPISODES) s = play(s, e.id);
    s = play(s, START, 'change', 2);
    expect(s.plays).toHaveLength(EPISODES.length + 1);
    expect(s.plays.filter((p) => p.episode === START).map((p) => p.replay)).toEqual([0, 1]);
    for (const p of s.plays) expect(p.shown).not.toHaveProperty('rationale');
  });

  it('refuses answers that are not what the episode asked', () => {
    const s = emptyState();
    const bad = (id: string, change: (a: PlayAnswers) => PlayAnswers) => () => recordPlay(s, EPISODES, id, change(answersFor(ep(id))), on(1));
    expect(bad('pu-projects', (a) => ({ ...a, first: 'nope' }))).toThrow(/first answer/);
    expect(bad('pu-concert', (a) => ({ ...a, beat: { kind: 'cut', order: ['heard'] } }))).toThrow(/drops all but one/);
    expect(bad('ev-mugs', (a) => ({ ...a, beat: { kind: 'peek', opened: [0, 1, 2].map((fact) => ({ fact, lean: 'make' })), wouldHave: [] } }))).toThrow(/at most 2/);
    expect(bad('ev-mugs', (a) => ({ ...a, beat: { kind: 'peek', opened: [{ fact: 0, lean: 'make' }], wouldHave: [0] } }))).toThrow(/left closed/);
    expect(bad('ev-testers', (a) => ({ ...a, beat: { kind: 'slide', asked: [{ step: 0, pick: 'a' }], outcome: { kind: 'switch', at: 0 } } }))).toThrow(/out of order/);
    expect(bad('po-rewrite', (a) => ({ ...a, final: 'tidy' }))).toThrow(/second answer/); // 'tidy' was not picked to consider
    expect(bad('po-rewrite', (a) => ({ ...a, beat: { kind: 'twist' } }))).toThrow(/doesn’t fit/);
    // A twist's new option is on offer the second time only.
    expect(() => recordPlay(s, EPISODES, 'po-album', { first: 'both', beat: { kind: 'twist' }, final: 'both' }, on(1))).toThrow(/first answer/);
    expect(recordPlay(s, EPISODES, 'po-album', { first: UNSURE, beat: { kind: 'twist' }, final: 'both' }, on(1)).plays).toHaveLength(1);
  });

  it('keeps past plays when the content is later edited', () => {
    const content = JSON.parse(JSON.stringify(EPISODES)) as Episode[];
    const s = recordPlay(emptyState(), content, 'ev-cafe', answersFor(content.find((e) => e.id === 'ev-cafe')!), on(1));
    content.find((e) => e.id === 'ev-cafe')!.options[0].text = 'Something else entirely';
    content.find((e) => e.id === 'ev-cafe')!.ending.stayed = ['Rewritten', 'Rewritten'];
    const view = playView(s.plays[0]);
    expect(view.observed[0]).toBe('First answer: “Large framed prints”.');
    expect(view.readings[0]).toMatch(/for its own sake/);
  });

  it('separates what was answered, possible readings and what stays unknown', () => {
    const stay = playView(play(emptyState(), 'pu-concert').plays[0]);
    expect(stay.observed).toEqual([
      'First answer: “The first half, played cleanly”.',
      'Last one standing: “The year’s work ends in a performance”. First to go: “The room hears the piece as it was written”.',
      'Second answer: “The first half, played cleanly”, the same as your first.',
    ]);
    expect(stay.readings).toEqual(ep('pu-concert').ending.stayed);
    expect(stay.unknown).toBe(ep('pu-concert').ending.unknown);
    const change = playView(play(emptyState(), 'pu-concert', 'change').plays[0]);
    expect(change.changed).toBe(true);
    expect(change.readings).toEqual(ep('pu-concert').ending.changed);
  });

  it('says what each move showed', () => {
    const view = (id: string, style: 'stay' | 'change' = 'stay') => playView(play(emptyState(), id, style).plays[0]).observed;
    expect(view('po-rewrite')).toContain('Of the other options, you’d seriously consider “Rewrite only the part that changes most often”.');
    expect(view('po-album')).toContain('A new option appeared: “Both: four with the label, four yourselves later”.');
    expect(view('ev-mugs')).toEqual([
      'First answer: “Make the larger mug”.',
      'You opened who asked and what they do now.',
      'Your lean moved after what they do now.',
      'Of the facts you left closed, you said the craft fair would have changed your answer.',
      'Second answer: “Make the larger mug”, the same as your first.',
    ]);
    // Testers: launch rises; the line sits between 8 and 10, and the story's 11 points to launching.
    expect(view('ev-testers')).toContain('Testers out of 20 who must finish level one for you to launch: between 8 and 10.');
    expect(view('ev-testers')).toContain('The story’s number was 11. By your line, that points to “Launch now”. Your second answer followed it.');
    expect(view('ev-testers', 'change')).toContain('The story’s number was 11. By your line, that points to “Launch now”. Your second answer went the other way.');
    // Writers: Ali rises; the line sits between 3 and 4, and the story's 4 points to Ali.
    expect(view('pr-collaborator')).toContain('The story’s number was 4. By your line, that points to “Work with Ali”. Your second answer went the other way.');
  });
});

describe('the library', () => {
  it('recommends a start, then the next unplayed episode, and says when every one is played', () => {
    let s = emptyState();
    expect(suggestion(s, EPISODES)).toMatchObject({ episode: { id: START }, reason: 'Start here' });
    s = play(s, START);
    expect(suggestion(s, EPISODES)?.episode.id).toBe(EPISODES.find((e) => e.id !== START)!.id);
    for (const e of EPISODES) s = play(s, e.id);
    expect(suggestion(s, EPISODES)).toBeNull();
    // Finite, with no replenishment: replay is the player's choice, and is marked as one.
    s = play(s, 'ev-cafe', 'change', 5);
    expect(library(s, EPISODES).find((x) => x.episode.id === 'ev-cafe')!.plays.map((p) => p.replay)).toEqual([0, 1]);
    expect(suggestion(s, EPISODES)).toBeNull();
  });

  it('has three episodes for each question', () => {
    for (const part of PART_ORDER) expect(EPISODES.filter((e) => e.part === part).length, part).toBe(3);
  });
});

describe('takeaways', () => {
  it('keeps one from a play, revises it without losing the original, and retires and restores it', () => {
    let s = play(emptyState(), 'ev-cafe');
    s = keep(s, 't1', '  Check where a limit came from  ', { kind: 'play', play: s.plays[0].id }, on(1));
    expect(s.takeaways[0]).toMatchObject({ versions: [{ text: 'Check where a limit came from' }], features: ['assumption', 'public'], retired: '' });
    s = revise(s, 't1', 'Check where a limit came from before paying for it', on(3));
    s = revise(s, 't1', 'Check where a limit came from before paying for it', on(4)); // same words: no new version
    expect(s.takeaways[0].versions.map((v) => v.text)).toEqual(['Check where a limit came from', 'Check where a limit came from before paying for it']);
    expect(wording(s.takeaways[0])).toBe('Check where a limit came from before paying for it');
    s = retire(s, 't1', on(5));
    expect(s.takeaways[0].retired).not.toBe('');
    expect(s.plays).toHaveLength(1); // the evidence stays
    s = restore(s, 't1');
    expect(s.takeaways[0].retired).toBe('');
  });

  it('must point at something that exists, and says what kind of record it came from', () => {
    expect(() => keep(emptyState(), 't1', 'x', { kind: 'play', play: 'nope' }, on(1))).toThrow(/exists/);
    expect(() => keep(emptyState(), 't1', '   ', { kind: 'own' }, on(1))).toThrow(/words/);
    let s = play(play(emptyState(), 'ev-cafe'), 'ev-cafe', 'stay', 3);
    s = keep(s, 't1', 'x', { kind: 'play', play: s.plays[1].id }, on(3));
    expect(sourceLabel(s, s.takeaways[0].source)).toBe('From an invented story, “The café wall”, 3 Oct (replay 1)');
    expect(sourceLabel(s, { kind: 'own' })).toBe('Written by you');
  });
});

describe('choices', () => {
  it('saves drafts, resumes where they were, and keeps every save', () => {
    let s = createChoice(emptyState(), 'c1', on(1));
    s = editChoice(s, 'c1', { title: 'Open the app source?', step: 'unresolved' }, on(1));
    expect(s.choices[0]).toMatchObject({ draft: true, step: 'unresolved', saves: [] });
    s = editChoice(s, 'c1', { parts: ['possibilities'], options: [{ id: 'o1', text: 'Open it' }], step: 'possibilities' }, on(1));
    s = saveChoice(s, 'c1', on(1));
    expect(s.choices[0].draft).toBe(false);
    expect(() => editChoice(s, 'c1', { title: 'x' }, on(2))).toThrow(/Revise/);
    s = reviseChoice(s, 'c1', on(2));
    s = editChoice(s, 'c1', { options: [{ id: 'o1', text: 'Open it' }, { id: 'o2', text: 'Keep it closed', shape: 'keep' }] }, on(2));
    s = saveChoice(s, 'c1', on(2));
    expect(s.choices[0].saves.map((x) => x.content.options.length)).toEqual([1, 2]);
  });

  it('discards a draft without touching what was saved', () => {
    let s = createChoice(emptyState(), 'c1', on(1));
    expect(discardDraft(s, 'c1').choices).toHaveLength(0);
    s = saveChoice(editChoice(s, 'c1', { title: 'Saved title' }, on(1)), 'c1', on(1));
    s = editChoice(reviseChoice(s, 'c1', on(2)), 'c1', { title: 'Half-revised' }, on(2));
    s = discardDraft(s, 'c1');
    expect(s.choices[0]).toMatchObject({ draft: false, title: 'Saved title' });
    expect(s.choices[0].saves).toHaveLength(1);
  });

  it('asks only about what feels unresolved, or all four when unsure', () => {
    const c = { ...createChoice(emptyState(), 'c', on(1)).choices[0] };
    expect(flowSteps({ ...c, parts: ['evidence', 'purpose'] }, false)).toEqual(['start', 'unresolved', 'purpose', 'evidence', 'summary']);
    expect(flowSteps({ ...c, unsure: true }, true)).toEqual(['start', 'unresolved', ...PART_ORDER, 'examples', 'summary']);
  });

  it('builds the summary from the player’s own words only', () => {
    const c: ChoiceContent = {
      ...createChoice(emptyState(), 'c', on(1)).choices[0],
      parts: ['purpose', 'possibilities', 'evidence'],
      worth: 'People finish the course',
      options: [
        { id: 'o1', text: 'Charge for it' },
        { id: 'o2', text: 'Wait until spring', shape: 'wait' },
      ],
      unknowns: [
        { id: 'u1', text: 'Whether anyone would pay', kind: 'fact', changes: 'yes', how: 'ask' },
        { id: 'u2', text: 'The venue wants a deposit', kind: 'assumption', changes: 'unsure' },
      ],
    };
    expect(draftSummary(c)).toEqual({
      clearer: 'Worth it if: People finish the course\nOptions: Charge for it; Wait until spring\nCould change what I do: Whether anyone would pay (ask someone)',
      unresolved: 'No lean yet between the options.\nNot sure it would change anything: The venue wants a deposit (an assumption)',
    });
  });

  it('stays current until the player says it’s settled', () => {
    let s = choice(emptyState(), 'c1', { expectation: { text: 'Ten people sign up', by: '' } });
    expect(isCurrent(s.choices[0])).toBe(true);
    s = addOutcome(s, 'c1', 'o1', { state: 'too-early', compared: '', what: '', surprise: '', settled: false, lesson: { kind: 'none' } }, on(9));
    expect(isCurrent(s.choices[0])).toBe(true);
    s = addOutcome(s, 'c1', 'o2', { state: 'happened', compared: 'partly', what: 'Six signed up', surprise: '', settled: true, lesson: { kind: 'none' } }, on(20));
    expect(isCurrent(s.choices[0])).toBe(false);
  });
});

describe('evidence keeps its provenance', () => {
  it('points a takeaway at the save it came from, so revising the choice never rewrites it', () => {
    let s = choice(emptyState(), 'c1', { clearer: 'First wording' });
    s = keep(s, 't1', 'Ask before paying', { kind: 'choice', choice: 'c1', save: 0 }, on(2));
    s = saveChoice(editChoice(reviseChoice(s, 'c1', on(3)), 'c1', { clearer: 'Second wording' }, on(3)), 'c1', on(3));
    const src = s.takeaways[0].source as { choice: string; save: number };
    expect(s.choices[0].saves[src.save].content.clearer).toBe('First wording');
  });

  it('keeps an example’s words as they were offered, after the takeaway is revised or retired', () => {
    let s = play(emptyState(), 'ev-cafe');
    s = keep(s, 't1', 'Check where a limit came from', { kind: 'play', play: s.plays[0].id }, on(1));
    s = choice(s, 'c2', { circumstances: ['public'], unknowns: [{ id: 'u1', text: 'They want frames', kind: 'assumption', changes: 'yes' }] });
    s = reviseChoice(s, 'c2', on(3));
    const [ex] = examples(s, 'c2');
    s = answerExample(s, 'c2', ex, 'applies', false, on(3));
    s = retire(revise(s, 't1', 'Something else', on(4)), 't1', on(4));
    expect(s.choices[0].matches[0]).toMatchObject({ answer: 'applies', shown: expect.stringContaining('“Check where a limit came from”'), why: 'Both have an assumption marked as one and others seeing it.' });
  });
});

describe('outcomes', () => {
  const base = (): TellState => choice(emptyState(), 'c1', { next: { kind: 'trial', text: 'Run one session' }, expectation: { text: 'Eight people come', by: '2026-11-01' } });
  const input = (o: Partial<OutcomeInput>): OutcomeInput => ({ state: 'happened', compared: '', what: '', surprise: '', settled: false, lesson: { kind: 'none' }, ...o });

  it('records too early, plans changed and what happened against the expectation as it stood', () => {
    let s = base();
    s = addOutcome(s, 'c1', 'o1', input({ state: 'too-early' }), on(10));
    s = addOutcome(s, 'c1', 'o2', input({ state: 'happened', compared: 'different', what: 'Three came', surprise: 'The room was the problem' }), on(20));
    s = saveChoice(editChoice(reviseChoice(s, 'c1', on(21)), 'c1', { expectation: { text: 'Changed later', by: '' } }, on(21)), 'c1', on(21));
    s = addOutcome(s, 'c1', 'o3', input({ state: 'plans-changed', settled: true }), on(22));
    expect(s.choices[0].outcomes.map((o) => [o.state, o.expected, o.compared])).toEqual([
      ['too-early', 'Eight people come', ''],
      ['happened', 'Eight people come', 'different'],
      ['plans-changed', 'Changed later', ''],
    ]);
  });

  it('allows no lesson, a new takeaway, or a revised one', () => {
    let s = base();
    s = addOutcome(s, 'c1', 'o1', input({ lesson: { kind: 'kept', id: 't1', text: 'Small rooms fill' } }), on(20));
    expect(s.takeaways[0]).toMatchObject({ source: { kind: 'outcome', choice: 'c1', outcome: 'o1' }, features: ['next-trial'] });
    s = addOutcome(s, 'c1', 'o2', input({ lesson: { kind: 'revised', takeaway: 't1', text: 'Small rooms fill, if the date suits' } }), on(25));
    expect(s.takeaways[0].versions).toHaveLength(2);
    expect(s.choices[0].outcomes.map((o) => [o.lesson, o.takeaway])).toEqual([
      ['kept', 't1'],
      ['revised', 't1'],
    ]);
  });

  it('compares only what happened, only with an expectation, and only on a saved choice', () => {
    expect(() => addOutcome(base(), 'c1', 'o1', input({ state: 'too-early', compared: 'different' }), on(9))).toThrow(/compared/);
    expect(() => addOutcome(choice(emptyState(), 'c1', {}), 'c1', 'o1', input({ compared: 'as-expected' }), on(9))).toThrow(/compared/);
    expect(() => addOutcome(createChoice(emptyState(), 'c1', on(1)), 'c1', 'o1', input({}), on(9))).toThrow(/saved/);
  });
});

describe('past examples', () => {
  const current = (s: TellState, content: Partial<ChoiceContent>) => editChoice(createChoice(s, 'now', on(10)), 'now', { title: 'Now', ...content }, on(10));

  it('offers nothing with an empty record, and says so', () => {
    const s = current(emptyState(), { circumstances: ['deadline'] });
    expect(examplePool(s, 'now')).toEqual([]);
    expect(examples(s, 'now')).toEqual([]);
  });

  it('never matches on broad labels or circumstances alone', () => {
    const broad: Partial<ChoiceContent> = {
      parts: ['priorities', 'evidence'],
      criteria: [{ id: 'k1', text: 'Mine', must: true }],
      unknowns: [{ id: 'u1', text: 'A', kind: 'fact', changes: 'yes' }],
      circumstances: ['deadline', 'public'],
    };
    let s = choice(emptyState(), 'old', broad);
    s = current(s, broad);
    expect(examplePool(s, 'now')[0]).toMatchObject({ shared: ['deadline', 'public'], also: ['must', 'unknown'] });
    expect(examples(s, 'now')).toEqual([]);
  });

  it('matches on shared structure and circumstances, explains why, and shows at most two', () => {
    let s = choice(emptyState(), 'a', { options: [{ id: 'o1', text: 'Wait', shape: 'wait' }], circumstances: ['deadline'] }, 2);
    s = choice(s, 'b', { options: [{ id: 'o1', text: 'Wait', shape: 'wait' }], circumstances: ['deadline', 'others'] }, 3);
    s = choice(s, 'c', { options: [{ id: 'o1', text: 'Wait', shape: 'wait' }], circumstances: ['deadline'] }, 4);
    s = choice(s, 'unrelated', { options: [{ id: 'o1', text: 'Ask', shape: 'ask' }] }, 5);
    s = current(s, { options: [{ id: 'o1', text: 'Hold off', shape: 'wait' }], circumstances: ['deadline', 'others'], criteria: [{ id: 'k1', text: 'x', must: true }] });
    const shown = examples(s, 'now');
    expect(shown.map((e) => e.ref.id)).toEqual(['b', 'c']); // most shared first, then the newest
    expect(whyShown(shown[0])).toBe('Both have waiting among the options, a deadline and others depending on it.');
  });

  it('records accepted, rejected and hand-picked examples, and stops offering what was answered', () => {
    let s = choice(emptyState(), 'a', { options: [{ id: 'o1', text: 'Smaller', shape: 'smaller' }], circumstances: ['undo'] });
    s = keep(s, 'mine', 'Written by me', { kind: 'own' }, on(3));
    s = current(s, { options: [{ id: 'o1', text: 'Pilot', shape: 'smaller' }], circumstances: ['undo'] });
    const [ex] = examples(s, 'now');
    s = answerExample(s, 'now', ex, 'not', false, on(10));
    expect(examples(s, 'now')).toEqual([]);
    const manual = examplePool(s, 'now').find((e) => e.ref.id === 'mine')!;
    expect(manual.shared).toEqual([]); // only reachable by picking it
    s = answerExample(s, 'now', manual, 'applies', true, on(10));
    expect(s.choices.find((c) => c.id === 'now')!.matches.map((m) => [m.ref.id, m.answer, m.manual, m.why])).toEqual([
      ['a', 'not', false, 'Both have a smaller version or a trial among the options and something hard to undo.'],
      ['mine', 'applies', true, ''],
    ]);
  });

  it('treats replays of one story as one example, and never offers a retired takeaway', () => {
    let s = play(emptyState(), 'ev-cafe');
    s = keep(s, 't1', 'First time', { kind: 'play', play: s.plays[0].id }, on(1));
    s = play(s, 'ev-cafe', 'change', 2);
    s = keep(s, 't2', 'Second time', { kind: 'play', play: s.plays[1].id }, on(2));
    s = current(s, { circumstances: ['public'], unknowns: [{ id: 'u1', text: 'x', kind: 'assumption' }] });
    expect(examples(s, 'now').map((e) => [e.ref.id, e.folded])).toEqual([['t2', 1]]);
    s = retire(s, 't2', on(3));
    expect(examples(s, 'now').map((e) => e.ref.id)).toEqual(['t1']);
  });

  it('shows the exceptions: times it applied and things went differently', () => {
    let s = keep(emptyState(), 't1', 'Pilot first', { kind: 'own' }, on(1));
    s = choice(s, 'used', { options: [{ id: 'o1', text: 'Pilot', shape: 'smaller' }], circumstances: ['public'], expectation: { text: 'It works', by: '' } });
    s = editChoice(reviseChoice(s, 'used', on(3)), 'used', {}, on(3));
    s = answerExample(s, 'used', examplePool(s, 'used').find((e) => e.ref.id === 't1')!, 'applies', true, on(3));
    s = saveChoice(s, 'used', on(3));
    s = addOutcome(s, 'used', 'o1', { state: 'happened', compared: 'different', what: '', surprise: 'Nobody came', settled: true, lesson: { kind: 'none' } }, on(8));
    s = current(s, {});
    const t1 = examplePool(s, 'now').find((e) => e.ref.id === 't1')!;
    expect(t1.exceptions).toEqual(['When it applied to “used”, things went differently from expected: Nobody came']);
    const used = examplePool(s, 'now').find((e) => e.ref.id === 'used')!;
    expect(used.exceptions).toEqual(['It went differently from expected: Nobody came']);
  });

  it('shows a choice and a takeaway kept from it as one example, with the choice’s outcome', () => {
    let s = choice(emptyState(), 'src', { options: [{ id: 'o1', text: 'Wait', shape: 'wait' }], circumstances: ['deadline'], expectation: { text: 'Fine', by: '' } });
    s = addOutcome(s, 'src', 'o1', { state: 'happened', compared: 'partly', what: '', surprise: 'Slower', settled: true, lesson: { kind: 'kept', id: 't1', text: 'Waiting costs more than it looks' } }, on(5));
    s = current(s, { options: [{ id: 'o1', text: 'Hold', shape: 'wait' }], circumstances: ['deadline'] });
    expect(examplePool(s, 'now').map((e) => [e.ref.id, e.exceptions])).toEqual([['t1', ['What happened went only partly as expected: Slower']]]);
  });

  it('reads features only from structured answers', () => {
    const c = createChoice(emptyState(), 'c', on(1)).choices[0];
    expect(choiceFeatures({ ...c, title: 'wait, a deadline, trial', situation: 'must ask someone' })).toEqual([]);
    expect(
      choiceFeatures({
        ...c,
        options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b', shape: 'combine' }, { id: 'c', text: 'c' }],
        next: { kind: 'decide', text: '' },
      }),
    ).toEqual(['shape-combine', 'several']);
  });
});

describe('plain text', () => {
  it('exports a choice and the whole record, each kind labelled', () => {
    let s = choice(emptyState(), 'c1', { title: 'Open the source?', clearer: 'Worth it if: others learn from it', next: { kind: 'wait', text: 'Until the tests pass' }, expectation: { text: 'Two people send fixes', by: '2026-12-01' } });
    s = addOutcome(s, 'c1', 'o1', { state: 'happened', compared: 'as-expected', what: 'Two fixes arrived', surprise: '', settled: true, lesson: { kind: 'none' } }, on(30));
    s = play(s, 'ev-cafe');
    const text = choiceText(s.choices[0].saves[0].content, s.choices[0].outcomes);
    expect(text).toContain('Choice: Open the source?');
    expect(text).toContain('What became clearer:\nWorth it if: others learn from it');
    expect(text).toContain('Next move: Wait: Until the tests pass');
    expect(text).toContain('Expectation: Two people send fixes (by 1 Dec)');
    expect(text).toContain('What happened, 30 Oct: Something happened. As I expected. Two fixes arrived.');
    expect(text).toContain('nothing here was generated');
    expect(recordText(s)).toContain('Play (answers to invented stories, not real choices):\n- The café wall, 1 Oct: First answer');
  });
});
