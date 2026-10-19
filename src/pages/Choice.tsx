import { useEffect, useState, type ReactNode } from 'react';
import {
  ANSWERS,
  COMPARED,
  OUTCOME_STATES,
  addOutcome,
  answerExample,
  choiceText,
  createChoice,
  discardDraft,
  draftSummary,
  editChoice,
  emptyContent,
  examplePool,
  examples,
  flowSteps,
  freshId,
  keep,
  reviseChoice,
  saveChoice,
  sourceLabel,
  whyShown,
  wording,
  type Example,
  type OutcomeInput,
} from '../domain/engine';
import { lower, plural } from '../domain/text';
import {
  CHANGES,
  CIRCUMSTANCES,
  HOW,
  NEXT,
  PARTS,
  PART_ORDER,
  SHAPES,
  type Changes,
  type Choice,
  type ChoiceContent,
  type Circumstance,
  type FlowStep,
  type How,
  type Match,
  type NextKind,
  type Outcome,
  type Part,
  type Shape,
  type TellState,
} from '../domain/types';
import { Chips, Section, useFocus } from '../mechanics';
import { store } from '../store/store';
import { copy, randomId, shortDate } from '../ui';
import { Missing } from './Episode';

// Bring a choice: a title, what feels unresolved, then only the parts that
// help. Every answer is saved as a draft as it is typed, so an interruption
// loses nothing; Back and "Change what to look at" are always there. Tell
// keeps the player's words as written and never interprets them.

const STEP_NAME: Record<FlowStep, string> = {
  start: 'The choice',
  unresolved: 'What feels unresolved',
  purpose: PARTS.purpose.name,
  possibilities: PARTS.possibilities.name,
  priorities: PARTS.priorities.name,
  evidence: PARTS.evidence.name,
  examples: 'Past examples',
  summary: 'Summary',
};

/** A new choice: nothing is stored until the first word, then it is a draft. */
export function NewChoice({ state, part, prompt }: { state: TellState; part?: Part; prompt?: string }) {
  const [id] = useState(() => `c${randomId()}`);
  const init: Partial<ChoiceContent> = part ? { parts: [part], prompt: prompt ?? '' } : {};
  // Same place in the tree as the flow, so the first word never remounts it.
  const saved = state.choices.find((c) => c.id === id && !c.draft);
  return saved ? <ChoiceView state={state} c={saved} /> : <ChoiceFlow state={state} id={id} init={init} />;
}

export function ChoicePage({ state, id }: { state: TellState; id: string }) {
  const c = state.choices.find((x) => x.id === id);
  if (!c) return <Missing what="That choice" />;
  return c.draft ? <ChoiceFlow state={state} id={id} init={{}} /> : <ChoiceView state={state} c={c} />;
}

function ChoiceFlow({ state, id, init }: { state: TellState; id: string; init: Partial<ChoiceContent> }) {
  const stored = state.choices.find((x) => x.id === id);
  const c: ChoiceContent & { step: FlowStep } = stored ?? { ...emptyContent(), ...init, step: 'start' };
  const pool = stored ? examplePool(state, id) : [];
  const hasPool = state.takeaways.some((t) => !t.retired) || state.choices.some((x) => x.id !== id && x.saves.length > 0);
  const steps = flowSteps(c, hasPool);
  const step = steps.includes(c.step) ? c.step : 'unresolved';
  const at = steps.indexOf(step);
  const ref = useFocus<HTMLHeadingElement>(step);

  const update = (patch: Partial<ChoiceContent> & { step?: FlowStep }) => {
    const now = new Date();
    store.update((s) => (s.choices.some((x) => x.id === id) ? editChoice(s, id, patch, now) : editChoice(createChoice(s, id, now, init), id, patch, now)));
    // The draft has an address from its first word, so a reload resumes it.
    if (!stored) history.replaceState(null, '', `#/choice/${id}`);
  };
  const go = (to: FlowStep) => update({ step: to });

  // The summary starts from the player's own words; after that it is theirs to edit.
  const needsSummary = step === 'summary' && !c.clearer && !c.unresolved;
  useEffect(() => {
    if (needsSummary) update(draftSummary(c));
  }, [needsSummary]);

  const nav = (next: ReactNode) => (
    <div className="stack">
      {next}
      <div className="outs">
        {at > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => go(steps[at - 1])}>
            Back
          </button>
        )}
        {at > 1 && step !== 'summary' && (
          <button className="btn btn-ghost btn-sm" onClick={() => go('summary')}>
            Skip to the summary
          </button>
        )}
        {at > 1 && (
          <button className="btn btn-ghost btn-sm" onClick={() => go('unresolved')}>
            Change what to look at
          </button>
        )}
      </div>
    </div>
  );
  const nextButton = (disabled = false, label = 'Next') => (
    <button className="btn btn-primary btn-block" disabled={disabled} onClick={() => go(steps[at + 1])}>
      {label}
    </button>
  );

  return (
    <article className="stack-lg">
      <header className="stack-tight">
        <p className="small dim num">
          {stored?.saves.length ? 'Revising' : 'Bring a choice'} · step {at + 1} of {steps.length}
        </p>
        <h1 className="title" ref={ref} tabIndex={-1}>
          {STEP_NAME[step]}
        </h1>
        {at > 0 && c.title && <p className="small dim">{c.title}</p>}
      </header>

      {step === 'start' && (
        <>
          <label className="field">
            <span className="small">The choice, in a few words</span>
            <input className="input" value={c.title} placeholder="Whether to open-source my app" onChange={(e) => update({ title: e.target.value })} />
          </label>
          <label className="field">
            <span className="small">Anything else about it (optional)</span>
            <textarea className="input textarea" rows={3} value={c.situation} onChange={(e) => update({ situation: e.target.value })} />
          </label>
          <Chips<Circumstance>
            label="Anything about the situation? (optional)"
            id="circ"
            options={Object.entries(CIRCUMSTANCES) as [Circumstance, string][]}
            value={c.circumstances}
            onPick={(k) => update({ circumstances: toggle(c.circumstances, k) })}
          />
          <p className="tiny faint">Tell keeps your words as you write them. It doesn’t read or interpret them, and nothing leaves this device.</p>
          {nav(nextButton(!c.title.trim()))}
        </>
      )}

      {step === 'unresolved' && (
        <>
          {c.prompt && (
            <p className="condition">
              <span className="faint tiny">A question from a story:</span> {c.prompt}
            </p>
          )}
          <p className="dim">Pick what feels unresolved. You can change this at any point.</p>
          <div className="options">
            {PART_ORDER.map((p) => {
              const on = !c.unsure && c.parts.includes(p);
              return (
                <button key={p} className={`option${on ? ' on' : ''}`} aria-pressed={on} onClick={() => update({ unsure: false, parts: toggle(c.unsure ? [] : c.parts, p) })}>
                  <strong className="option-title">{PARTS[p].unresolved}</strong>
                  <span className="small dim option-line">{PARTS[p].name}</span>
                </button>
              );
            })}
            <button className={`option${c.unsure ? ' on' : ''}`} aria-pressed={c.unsure} onClick={() => update({ unsure: !c.unsure, parts: [] })}>
              <strong className="option-title">Not sure</strong>
              <span className="small dim option-line">Look at all four briefly; skip any that don’t help.</span>
            </button>
          </div>
          {nav(nextButton(!c.unsure && c.parts.length === 0))}
        </>
      )}

      {step === 'purpose' && (
        <>
          <Prompted c={c} part="purpose" />
          <label className="field">
            <span className="small">{PARTS.purpose.question} If it went the way you hope, what would be true afterwards?</span>
            <textarea className="input textarea" rows={3} value={c.worth} onChange={(e) => update({ worth: e.target.value })} />
          </label>
          <label className="field">
            <span className="small">What would make it not worth it, even if it “worked”? (optional)</span>
            <textarea className="input textarea" rows={2} value={c.notWorth} onChange={(e) => update({ notWorth: e.target.value })} />
          </label>
          {nav(nextButton())}
        </>
      )}

      {step === 'possibilities' && (
        <>
          <Prompted c={c} part="possibilities" />
          <Options c={c} update={update} />
          {nav(nextButton())}
        </>
      )}

      {step === 'priorities' && (
        <>
          <Prompted c={c} part="priorities" />
          <Priorities c={c} update={update} />
          {nav(nextButton())}
        </>
      )}

      {step === 'evidence' && (
        <>
          <Prompted c={c} part="evidence" />
          <Unknowns c={c} update={update} />
          {nav(nextButton())}
        </>
      )}

      {step === 'examples' && (
        <>
          <Examples state={state} id={id} c={c} pool={pool} />
          {nav(nextButton())}
        </>
      )}

      {step === 'summary' && (
        <>
          <Summary c={c} update={update} />
          {nav(
            <>
              <button
                className="btn btn-primary btn-block"
                disabled={!c.title.trim()}
                onClick={() => {
                  store.update((s) => saveChoice(s, id, new Date()));
                  location.hash = `#/choice/${id}`;
                }}
              >
                Save
              </button>
              {stored && (
                <button
                  className="btn btn-ghost btn-block"
                  onClick={() => {
                    const ask = stored.saves.length ? 'Discard these changes? The last saved version stays.' : 'Discard this draft? It hasn’t been saved.';
                    if (!window.confirm(ask)) return;
                    store.update((s) => discardDraft(s, id));
                    location.hash = stored.saves.length ? `#/choice/${id}` : '#/';
                  }}
                >
                  {stored.saves.length ? 'Discard changes' : 'Discard this draft'}
                </button>
              )}
            </>,
          )}
        </>
      )}
    </article>
  );
}

const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

type Update = (patch: Partial<ChoiceContent>) => void;

function Prompted({ c, part }: { c: ChoiceContent; part: Part }) {
  if (!c.prompt || !c.parts.includes(part)) return null;
  return (
    <p className="condition">
      <span className="faint tiny">A question from a story:</span> {c.prompt}
    </p>
  );
}

/** A list the player writes: each line editable and removable, plus a field to add one. */
function Editable<T extends { id: string; text: string }>(props: {
  items: T[];
  label: string;
  placeholder: string;
  onChange: (items: T[]) => void;
  make: (id: string, text: string) => T;
  prefix: string;
  extra?: (item: T) => ReactNode;
}) {
  const { items, label, placeholder, onChange, make, prefix, extra } = props;
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return;
    onChange([...items, make(freshId(prefix, items), text.trim())]);
    setText('');
  };
  return (
    <div className="stack">
      {items.map((item, i) => (
        <div key={item.id} className="card-quiet stack-tight">
          <div className="row">
            <input
              className="input"
              aria-label={`${label} ${i + 1}`}
              value={item.text}
              onChange={(e) => onChange(items.map((x) => (x.id === item.id ? { ...x, text: e.target.value } : x)))}
            />
            <button className="btn btn-ghost btn-sm" aria-label={`Remove ${item.text || `${label} ${i + 1}`}`} onClick={() => onChange(items.filter((x) => x.id !== item.id))}>
              Remove
            </button>
          </div>
          {extra?.(item)}
        </div>
      ))}
      <div className="row">
        <input className="input" aria-label={`Add ${lower(label)}`} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn" disabled={!text.trim()} onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

function Options({ c, update }: { c: ChoiceContent; update: Update }) {
  const has = (k: Shape) => c.options.some((o) => o.shape === k);
  const setOptions = (options: ChoiceContent['options']) => {
    const ids = new Set(options.map((o) => o.id));
    update({ options, lean: ids.has(c.lean) ? c.lean : '', ruledOut: c.ruledOut.filter((x) => ids.has(x)) });
  };
  return (
    <>
      <p className="question">What are the options?</p>
      <p className="small dim">One is fine: a choice can be whether or not to do one thing.</p>
      <Editable items={c.options} label="Option" placeholder="An option, in your words" prefix="o" make={(id, text) => ({ id, text })} onChange={setOptions} />
      <Chips<Shape>
        label="Options people often leave out. Add any that are real here, then put them in your words:"
        id="shapes"
        options={Object.entries(SHAPES) as [Shape, string][]}
        value={c.options.flatMap((o) => (o.shape ? [o.shape] : []))}
        onPick={(k) => setOptions(has(k) ? c.options.filter((o) => o.shape !== k) : [...c.options, { id: freshId('o', c.options), text: SHAPES[k], shape: k }])}
      />
      {c.options.length > 1 && (
        <Chips
          label="Which way are you leaning?"
          id="lean"
          options={[...c.options.map((o) => [o.id, o.text || 'Untitled'] as [string, string]), ['', 'No lean yet']]}
          value={c.lean}
          onPick={(lean) => update({ lean })}
        />
      )}
    </>
  );
}

function Priorities({ c, update }: { c: ChoiceContent; update: Update }) {
  const musts = c.criteria.filter((x) => x.must);
  return (
    <>
      <p className="question">What matters here?</p>
      <p className="small dim">Your own words. Mark a must-have when it’s a line you won’t cross; everything else can be traded.</p>
      <Editable
        items={c.criteria}
        label="What matters"
        placeholder="Something that matters here"
        prefix="k"
        make={(id, text) => ({ id, text, must: false })}
        onChange={(criteria) => update({ criteria, top: criteria.some((x) => x.id === c.top) ? c.top : '' })}
        extra={(k) => (
          <button
            className={`chip${k.must ? ' on' : ''}`}
            aria-pressed={k.must}
            onClick={() => update({ criteria: c.criteria.map((x) => (x.id === k.id ? { ...x, must: !x.must } : x)) })}
          >
            Must-have
          </button>
        )}
      />
      {c.criteria.length > 1 && (
        <Chips
          label="When they pull against each other, which matters most right now? (optional)"
          id="top"
          options={[...c.criteria.map((x) => [x.id, x.text || 'Untitled'] as [string, string]), ['', 'Can’t say']]}
          value={c.top}
          onPick={(top) => update({ top })}
        />
      )}
      {musts.length > 0 && c.options.length > 0 && (
        <Chips
          label="Does a must-have rule any option out?"
          id="ruled"
          options={c.options.map((o) => [o.id, o.text || 'Untitled'] as [string, string])}
          value={c.ruledOut}
          onPick={(o) => update({ ruledOut: toggle(c.ruledOut, o) })}
        />
      )}
    </>
  );
}

function Unknowns({ c, update }: { c: ChoiceContent; update: Update }) {
  const set = (id: string, patch: Partial<ChoiceContent['unknowns'][number]>) => update({ unknowns: c.unknowns.map((u) => (u.id === id ? { ...u, ...patch } : u)) });
  return (
    <>
      <p className="question">What don’t you know, or are you assuming?</p>
      <p className="small dim">Then, for each: would the answer change what you do? Some unknowns matter; some are only interesting.</p>
      <Editable
        items={c.unknowns}
        label="Unknown"
        placeholder="Something you don’t know"
        prefix="u"
        make={(id, text) => ({ id, text, kind: 'fact' as const })}
        onChange={(unknowns) => update({ unknowns })}
        extra={(u) => (
          <div className="stack">
            <Chips
              label="Is it…"
              id={`kind-${u.id}`}
              options={[
                ['fact', 'Something I don’t know'],
                ['assumption', 'Something I’m assuming'],
              ]}
              value={u.kind}
              onPick={(kind) => set(u.id, { kind })}
            />
            <Chips<Changes> label="Would the answer change what you do?" id={`ch-${u.id}`} options={Object.entries(CHANGES) as [Changes, string][]} value={u.changes} onPick={(changes) => set(u.id, { changes, ...(changes === 'yes' ? {} : { how: undefined }) })} />
            {u.changes === 'yes' && <Chips<How> label="How could you find out?" id={`how-${u.id}`} options={Object.entries(HOW) as [How, string][]} value={u.how} onPick={(how) => set(u.id, { how })} />}
          </div>
        )}
      />
    </>
  );
}

const SOURCE_KIND = (state: TellState, e: Example) => {
  if (e.ref.kind === 'choice') return 'A real choice of yours';
  const t = state.takeaways.find((x) => x.id === e.ref.id);
  return t?.source.kind === 'play' ? 'Kept from an invented story' : 'Something you kept';
};

function ExampleCard({ state, id, e, answer }: { state: TellState; id: string; e: Example; answer?: Match['answer'] }) {
  const why = whyShown(e);
  return (
    <article className="card stack">
      <p className="eyebrow">{SOURCE_KIND(state, e)}</p>
      <p>{e.shown}</p>
      {why && <p className="small dim">Why it appeared: {why}</p>}
      {e.folded > 0 && <p className="small dim">From {plural(e.folded + 1, 'play')} of the same story, shown once: replays aren’t separate examples.</p>}
      {e.exceptions.map((x) => (
        <p key={x} className="small">
          Exception: {x}
        </p>
      ))}
      <Chips<Match['answer']>
        label="Does it apply here?"
        id={`ap-${e.ref.id}`}
        options={Object.entries(ANSWERS) as [Match['answer'], string][]}
        value={answer}
        onPick={(a) => store.update((s) => answerExample(s, id, e, a, !why, new Date()))}
      />
    </article>
  );
}

function Examples({ state, id, c, pool }: { state: TellState; id: string; c: ChoiceContent; pool: Example[] }) {
  const offered = examples(state, id);
  const answered = c.matches;
  const key = (r: Example['ref']) => `${r.kind}:${r.id}`;
  const taken = new Set([...answered.map((m) => key(m.ref)), ...offered.map((e) => key(e.ref))]);
  const unanswered = pool.filter((e) => !taken.has(key(e.ref)));
  return (
    <>
      <p className="small dim">
        Tell compares the shape of choices: the kinds of option, how an unknown could be found out, assumptions and the circumstances you marked. It never
        reads your words, and a shared question alone is never enough. At most two appear; whether one applies is your call.
      </p>
      {offered.map((e) => (
        <ExampleCard key={`${e.ref.kind}:${e.ref.id}`} state={state} id={id} e={e} />
      ))}
      {offered.length === 0 && <p className="notice">Nothing in your record shares this choice’s structure closely enough to offer. That’s a fine answer too.</p>}
      {answered.length > 0 && (
        <Section title="Your answers" id="answered">
          <ul className="results">
            {answered.map((m) => (
              <li key={`${m.ref.kind}:${m.ref.id}`} className="stack-tight">
                <span className="faint tiny">
                  {ANSWERS[m.answer]}
                  {m.manual ? ' · picked by you' : ''}
                </span>
                <span>{m.shown}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {unanswered.length > 0 && (
        <details className="card-quiet">
          <summary className="link small">Pick one yourself ({unanswered.length})</summary>
          <div className="stack">
            {unanswered.map((e) => (
              <ExampleCard key={`${e.ref.kind}:${e.ref.id}`} state={state} id={id} e={{ ...e, shared: [], also: [] }} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}

const ACTING: NextKind[] = ['decide', 'trial', 'find-out', 'wait'];

function Summary({ c, update }: { c: ChoiceContent; update: Update }) {
  return (
    <>
      <p className="small dim">Built from your own answers. Edit anything; it’s your summary.</p>
      <label className="field">
        <span className="small">What became clearer</span>
        <textarea className="input textarea" rows={5} value={c.clearer} onChange={(e) => update({ clearer: e.target.value })} />
      </label>
      <label className="field">
        <span className="small">Still unresolved</span>
        <textarea className="input textarea" rows={3} value={c.unresolved} onChange={(e) => update({ unresolved: e.target.value })} />
      </label>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => {
          if (window.confirm('Replace both boxes with a summary rebuilt from your answers?')) update(draftSummary(c));
        }}
      >
        Rebuild from my answers
      </button>
      <Chips<NextKind>
        label="A next move (optional)"
        id="next"
        options={Object.entries(NEXT) as [NextKind, string][]}
        value={c.next?.kind}
        onPick={(kind) => update({ next: c.next?.kind === kind ? null : { kind, text: c.next?.text ?? '' }, ...(ACTING.includes(kind) ? {} : { expectation: null }) })}
      />
      {c.next && (
        <label className="field">
          <span className="small">{c.next.kind === 'stop' ? 'Anything to note? (optional)' : 'What exactly? (optional)'}</span>
          <input className="input" value={c.next.text} onChange={(e) => update({ next: { ...c.next!, text: e.target.value } })} />
        </label>
      )}
      {c.next && ACTING.includes(c.next.kind) && (
        <div className="card-quiet stack">
          <label className="field">
            <span className="small">What do you expect to happen? Something you could check later.</span>
            <textarea className="input textarea" rows={2} value={c.expectation?.text ?? ''} onChange={(e) => update({ expectation: { text: e.target.value, by: c.expectation?.by ?? '' } })} />
          </label>
          <label className="field">
            <span className="small">When might you know? (optional; Tell won’t remind you)</span>
            <input className="input" type="date" value={c.expectation?.by ?? ''} onChange={(e) => update({ expectation: { text: c.expectation?.text ?? '', by: e.target.value } })} />
          </label>
        </div>
      )}
    </>
  );
}

const Para = ({ text }: { text: string }) => <p className="pre">{text}</p>;

/** A saved choice: its latest save, what happened, and the history underneath. */
function ChoiceView({ state, c }: { state: TellState; c: Choice }) {
  const s = c.saves.at(-1)!.content;
  const [copied, setCopied] = useState<string | null>(null);
  const [keeping, setKeeping] = useState<string | null>(null);
  const text = choiceText(s, c.outcomes);
  const applied = s.matches.filter((m) => m.answer === 'applies');
  const fromThis = state.takeaways.filter((t) => (t.source.kind === 'choice' || t.source.kind === 'outcome') && t.source.choice === c.id);

  return (
    <article className="stack-xl">
      <header className="stack">
        <p className="eyebrow">
          Your choice · saved {shortDate(c.saves.at(-1)!.at)}
          {c.saves.length > 1 ? ` · ${plural(c.saves.length, 'save')}` : ''}
        </p>
        <h1 className="title">{s.title}</h1>
        {s.situation && <Para text={s.situation} />}
      </header>

      {s.clearer.trim() && (
        <Section title="What became clearer" id="clearer">
          <Para text={s.clearer} />
        </Section>
      )}
      {s.unresolved.trim() && (
        <Section title="Still unresolved" id="unresolved">
          <Para text={s.unresolved} />
        </Section>
      )}
      {s.next && (
        <Section title="Next move" id="nextmove">
          <p>
            {NEXT[s.next.kind]}
            {s.next.text.trim() ? `: ${s.next.text.trim()}` : ''}
          </p>
          {s.expectation?.text.trim() && (
            <p className="small dim">
              You expected: {s.expectation.text.trim()}
              {s.expectation.by ? ` (you might know by ${shortDate(s.expectation.by)})` : ''}
            </p>
          )}
        </Section>
      )}
      {applied.length > 0 && (
        <Section title="Past examples you said apply" id="applied">
          <ul className="results">
            {applied.map((m) => (
              <li key={`${m.ref.kind}:${m.ref.id}`}>{m.shown}</li>
            ))}
          </ul>
        </Section>
      )}

      <div className="stack">
        <button
          className="btn btn-block"
          onClick={() => {
            store.update((x) => reviseChoice(x, c.id, new Date()));
          }}
        >
          Revise
        </button>
        <details className="card-quiet">
          <summary className="link small">Plain text, for your notes or an AI chat</summary>
          <pre className="brief" aria-label="Plain text">
            {text}
          </pre>
          <button className="btn btn-block" onClick={() => copy(text).then((ok) => setCopied(ok ? 'Copied.' : 'Select the text above to copy it.'))}>
            Copy the text
          </button>
          {copied && (
            <p className="small dim" role="status">
              {copied}
            </p>
          )}
        </details>
      </div>

      <Section title="Worth keeping?" id="keepchoice">
        {fromThis.map((t) => (
          <p key={t.id} className="kept-line">
            <span className="small faint">Kept:</span> {wording(t)}
          </p>
        ))}
        {keeping === null ? (
          <button className="btn btn-ghost btn-block" onClick={() => setKeeping('')}>
            Keep a takeaway from this choice
          </button>
        ) : (
          <div className="stack">
            <label className="field">
              <span className="small">In your words</span>
              <textarea className="input textarea" rows={2} value={keeping} onChange={(e) => setKeeping(e.target.value)} />
            </label>
            <div className="row">
              <button
                className="btn btn-primary"
                disabled={!keeping.trim()}
                onClick={() => {
                  store.update((x) => keep(x, `t${randomId()}`, keeping, { kind: 'choice', choice: c.id, save: c.saves.length - 1 }, new Date()));
                  setKeeping(null);
                }}
              >
                Keep it
              </button>
              <button className="btn btn-ghost" onClick={() => setKeeping(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>

      <Section title="What happened" id="happened">
        {c.outcomes.length === 0 && <p className="small dim">Whenever you like, add what happened. There’s no due date, and “too early to say” is a fine answer.</p>}
        <ul className="results">
          {c.outcomes.map((o) => (
            <li key={o.id} className="stack-tight">
              <span className="faint tiny">
                {shortDate(o.at)} · {OUTCOME_STATES[o.state]}
                {o.compared ? ` · ${COMPARED[o.compared]}` : ''}
                {o.settled ? ' · settled' : ''}
              </span>
              {o.expected && o.compared && <span className="small dim">Expected: {o.expected}</span>}
              {o.what && <span>{o.what}</span>}
              {o.surprise && <span className="small">Surprise: {o.surprise}</span>}
              <span className="small dim">{o.lesson === 'none' ? 'No lesson kept.' : o.lesson === 'kept' ? 'Kept a takeaway.' : 'Revised a takeaway.'}</span>
            </li>
          ))}
        </ul>
        <OutcomeForm state={state} c={c} />
      </Section>

      <details className="card-quiet">
        <summary className="link small">Your answers{c.saves.length > 1 ? ' and earlier saves' : ''}</summary>
        <Answers c={s} />
        {c.saves.slice(0, -1).map((x, i) => (
          <div key={x.at} className="stack-tight">
            <p className="faint tiny">
              Save {i + 1}, {shortDate(x.at)}
            </p>
            <Para text={x.content.clearer || '(no summary)'} />
          </div>
        ))}
      </details>
    </article>
  );
}

/** Every statement in a save, in the player's words. */
function Answers({ c }: { c: ChoiceContent }) {
  const rows: [string, string][] = [];
  if (c.circumstances.length) rows.push(['Circumstances', c.circumstances.map((k) => CIRCUMSTANCES[k]).join(', ')]);
  rows.push(['Looked at', c.unsure ? 'All four (not sure)' : c.parts.map((p) => PARTS[p].name).join(', ') || '—']);
  if (c.worth) rows.push(['Worth it if', c.worth]);
  if (c.notWorth) rows.push(['Not worth it if', c.notWorth]);
  for (const o of c.options) rows.push(['Option', `${o.text}${c.lean === o.id ? ' (leaning)' : ''}${c.ruledOut.includes(o.id) ? ' (ruled out)' : ''}`]);
  for (const k of c.criteria) rows.push([k.must ? 'Must-have' : 'Matters', `${k.text}${c.top === k.id ? ' (most, right now)' : ''}`]);
  for (const u of c.unknowns) rows.push([u.kind === 'assumption' ? 'Assuming' : 'Don’t know', `${u.text}${u.changes ? `. Would change it: ${lower(CHANGES[u.changes])}` : ''}${u.how ? `. ${HOW[u.how]}` : ''}`]);
  for (const m of c.matches) rows.push([`Example: ${lower(ANSWERS[m.answer])}`, m.shown]);
  return (
    <ul className="evidence">
      {rows.map(([k, v], i) => (
        <li key={i}>
          <span className="faint">{k}</span>
          <span>{v}</span>
        </li>
      ))}
    </ul>
  );
}

function OutcomeForm({ state, c }: { state: TellState; c: Choice }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Outcome['state'] | null>(null);
  const [compared, setCompared] = useState<Outcome['compared']>('');
  const [what, setWhat] = useState('');
  const [surprise, setSurprise] = useState('');
  const [settled, setSettled] = useState(false);
  const [lesson, setLesson] = useState<'none' | 'kept' | 'revised'>('none');
  const [lessonText, setLessonText] = useState('');
  const [target, setTarget] = useState('');
  const expected = c.saves.at(-1)!.content.expectation?.text.trim() ?? '';
  const candidates = state.takeaways.filter((t) => !t.retired);
  if (!open) {
    return (
      <button className="btn btn-block" onClick={() => setOpen(true)}>
        Add what happened
      </button>
    );
  }
  const ready = kind && (lesson === 'none' || (lessonText.trim() && (lesson === 'kept' || target)));
  return (
    <div className="card stack">
      <Chips<Outcome['state']>
        label="Where is it now?"
        id="ostate"
        options={Object.entries(OUTCOME_STATES) as [Outcome['state'], string][]}
        value={kind}
        onPick={(k) => {
          setKind(k);
          if (k !== 'happened') setCompared('');
        }}
      />
      {kind === 'happened' && expected && (
        <Chips<Exclude<Outcome['compared'], ''>>
          label={`You expected: “${expected}”. Compared with that?`}
          id="ocompared"
          options={Object.entries(COMPARED) as [Exclude<Outcome['compared'], ''>, string][]}
          value={compared || null}
          onPick={(v) => setCompared(compared === v ? '' : v)}
        />
      )}
      {kind && kind !== 'too-early' && (
        <label className="field">
          <span className="small">What happened? (optional)</span>
          <textarea className="input textarea" rows={2} value={what} onChange={(e) => setWhat(e.target.value)} />
        </label>
      )}
      <label className="field">
        <span className="small">Anything that surprised you? (optional)</span>
        <input className="input" value={surprise} onChange={(e) => setSurprise(e.target.value)} />
      </label>
      <Chips
        label="Is the choice settled?"
        id="osettled"
        options={[
          ['open', 'Still open'],
          ['settled', 'Settled'],
        ]}
        value={settled ? 'settled' : 'open'}
        onPick={(v) => setSettled(v === 'settled')}
      />
      <Chips
        label="Anything worth keeping? (optional)"
        id="olesson"
        options={[['none', 'No lesson'], ['kept', 'Keep a new takeaway'], ...(candidates.length ? [['revised', 'Revise one'] as [string, string]] : [])] as [typeof lesson, string][]}
        value={lesson}
        onPick={(v) => setLesson(v)}
      />
      {lesson === 'revised' && (
        <Chips
          label="Which one?"
          id="otarget"
          options={candidates.map((t) => [t.id, wording(t)] as [string, string])}
          value={target}
          onPick={(id) => {
            setTarget(id);
            setLessonText(wording(candidates.find((t) => t.id === id)!));
          }}
        />
      )}
      {lesson !== 'none' && (
        <label className="field">
          <span className="small">In your words</span>
          <textarea className="input textarea" rows={2} value={lessonText} onChange={(e) => setLessonText(e.target.value)} />
        </label>
      )}
      {lesson === 'revised' && target && <p className="tiny faint">{sourceLabel(state, candidates.find((t) => t.id === target)!.source)}. The earlier wording stays in its history.</p>}
      <p className="tiny faint">No score: a good outcome doesn’t prove the reasoning was good, and a bad one doesn’t prove it was poor.</p>
      <div className="row">
        <button
          className="btn btn-primary"
          disabled={!ready}
          onClick={() => {
            const l: OutcomeInput['lesson'] = lesson === 'kept' ? { kind: 'kept', id: `t${randomId()}`, text: lessonText } : lesson === 'revised' ? { kind: 'revised', takeaway: target, text: lessonText } : { kind: 'none' };
            store.update((s) => addOutcome(s, c.id, `out${randomId()}`, { state: kind!, compared, what, surprise, settled, lesson: l }, new Date()));
            setOpen(false);
            setKind(null);
            setCompared('');
            setWhat('');
            setSurprise('');
            setLesson('none');
            setLessonText('');
          }}
        >
          Save
        </button>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
