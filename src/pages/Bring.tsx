import { useState } from 'react';
import { playedWith, recordChoice, removeChoice, setNote, shownFor } from '../domain/engine';
import { NONE, NOT_SURE, OUTSIDE, PARTLY, QUESTIONS, SCOPE, outside, partly, type QuestionId, type Shape } from '../domain/language';
import { list } from '../domain/text';
import type { ShownLine, TellState } from '../domain/types';
import { ShapeCells, useCard } from '../lens';
import { Section, useFocus } from '../steps';
import { store } from '../store/store';
import { shortDate } from '../ui';
import { Missing } from './Play';

// Bring a choice: four questions about a step the player is unsure about,
// answered in taps, the shape building as they go, and the moves that fit
// those answers, by rule, one row each: the question the move puts, and why
// it fits. The answers are all that decide which moves show; the player's
// plays only lend examples, inside each move's card. Nothing is kept unless
// the player keeps it, and Tell never reads the label or the note.

const ESCAPES: { id: string; text: string }[] = [
  { id: NOT_SURE, text: 'Not sure' },
  { id: NONE, text: 'None of these' },
];

const index = (q: QuestionId) => QUESTIONS.findIndex((x) => x.id === q);

export function BringPage({ state }: { state: TellState }) {
  const [label, setLabel] = useState('');
  const [at, setAt] = useState(-1);
  const [shape, setShape] = useState<Partial<Shape>>({});
  // Opened from the results to change one answer: go back to them after it.
  const [back, setBack] = useState(false);
  const ref = useFocus<HTMLHeadingElement>(at);
  const onward = () => {
    setAt(back ? QUESTIONS.length : at + 1);
    setBack(false);
  };

  if (at === -1) {
    return (
      <article className="stack-xl">
        <div className="stack-lg">
          <header className="stack">
            <h1 className="title" ref={ref} tabIndex={-1}>
              Bring a choice
            </h1>
            <p>Think of a step you’re unsure about taking. In the questions, “it” means that step, and “waiting” means not taking it yet.</p>
          </header>
          <div className="field-group">
            <label className="small" htmlFor="step">
              The step, in a few words, if you like
            </label>
            <input id="step" className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Open-source my app" maxLength={120} aria-describedby="step-note" />
            <span id="step-note" className="tiny faint">
              It stays on this device. Tell never reads it.
            </span>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => setAt(0)}>
            Start
          </button>
          <p className="small dim">{SCOPE}</p>
        </div>
        {state.choices.length > 0 && (
          <Section title="Your choices" id="choices">
            <ul className="group">
              {[...state.choices].reverse().map((c) => (
                <li key={c.id}>
                  <a className="row" href={`#/choice/${c.id}`}>
                    <span className="row-title">{c.label || 'A choice'}</span>
                    <span className="small dim">
                      Kept {shortDate(c.day)}
                      {c.trying.length > 0 && `. Trying: ${c.trying.map((id) => c.shown.flatMap((l) => l.moves).find((m) => m.id === id)?.name ?? id).join(', ')}`}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </article>
    );
  }

  if (at < QUESTIONS.length) {
    const q = QUESTIONS[at];
    const now = q.multi ? (shape.know ?? []) : shape[q.id] ? [shape[q.id] as string] : [];
    const pick = (a: string) => {
      if (!q.multi) {
        setShape({ ...shape, [q.id]: a });
        return onward();
      }
      // Not sure and None of these stand alone; any other answer clears them.
      const escape = a === NOT_SURE || a === NONE;
      const next = now.includes(a) ? now.filter((x) => x !== a) : escape ? [a] : [...now.filter((x) => x !== NOT_SURE && x !== NONE), a];
      setShape({ ...shape, know: next });
    };
    return (
      <article className="stack-lg">
        <header className="stack">
          <p className="eyebrow">{label.trim() || 'Bring a choice'}</p>
          <ShapeCells shape={shape} current={q.id} onCell={(x) => (index(x) < at || shape[x]?.length ? setAt(index(x)) : undefined)} />
          <h1 className="title" ref={ref} tabIndex={-1}>
            {q.ask}
          </h1>
          {q.multi && <p className="small dim">Tap all that fit.</p>}
        </header>
        <div className="options" role="group" aria-label={q.ask}>
          {q.answers.map((a) => {
            // Two played steps at most: an anchor, not a list of everything played.
            const stories = playedWith(state, q.id, a.id).slice(0, 2);
            return (
              <button key={a.id} className={`option${now.includes(a.id) ? ' on' : ''}`} aria-pressed={now.includes(a.id)} onClick={() => pick(a.id)}>
                <span className="option-title">{a.text}</span>
                <span className="option-line small dim">
                  Like {a.like}
                  {stories.length ? `; as in ${list(stories)}` : ''}.
                </span>
              </button>
            );
          })}
          <div className="escapes">
            {ESCAPES.map((a) => (
              <button key={a.id} className={`option escape${now.includes(a.id) ? ' on' : ''}`} aria-pressed={now.includes(a.id)} onClick={() => pick(a.id)}>
                {a.text}
              </button>
            ))}
          </div>
        </div>
        {q.multi && (
          <button className="btn btn-primary btn-block" disabled={!now.length} onClick={onward}>
            Next
          </button>
        )}
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            setAt(back ? QUESTIONS.length : at - 1);
            setBack(false);
          }}
        >
          Back
        </button>
      </article>
    );
  }

  const done = shape as Shape;
  const keep = () => {
    let id = '';
    store.update((s) => {
      const after = recordChoice(s, label, done, new Date());
      id = after.choices.at(-1)!.id;
      return after;
    });
    location.hash = `#/choice/${id}`;
  };
  return (
    <article className="stack-xl reveal">
      <header className="stack">
        <p className="eyebrow">Bring a choice</p>
        <h1 className="title" ref={ref} tabIndex={-1}>
          {label.trim() || 'Your choice'}
        </h1>
        <ShapeCells
          shape={done}
          label="Your answers. Tap one to change it."
          onCell={(x) => {
            setBack(true);
            setAt(index(x));
          }}
        />
      </header>
      <Results lines={shownFor(done)} shape={done} />
      <div className="stack">
        <button className="btn btn-block" onClick={keep}>
          Keep this choice
        </button>
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            setAt(-1);
            setShape({});
            setLabel('');
          }}
        >
          Leave without keeping
        </button>
      </div>
    </article>
  );
}

/** A kept choice, read from its own snapshot: the moves as they were shown, what the player is trying, and their note. */
export function ChoicePage({ state, id }: { state: TellState; id: string }) {
  const c = state.choices.find((x) => x.id === id);
  const ref = useFocus<HTMLHeadingElement>(id);
  if (!c) return <Missing what="That choice" />;
  return (
    <article className="stack-xl">
      <header className="stack">
        <p className="eyebrow">Kept {shortDate(c.day)}</p>
        <h1 className="title" ref={ref} tabIndex={-1}>
          {c.label || 'A choice'}
        </h1>
        <ShapeCells shape={c.shape} label="Your answers" />
      </header>
      <Results lines={c.shown} shape={c.shape} trying={c.trying} choice={c.id} />
      <div className="field-group">
        <label className="section-title" htmlFor="note">
          Notes
        </label>
        <textarea id="note" className="field" rows={5} value={c.note} onChange={(e) => store.update((s) => setNote(s, c.id, e.target.value))} aria-describedby="note-note" />
        <span id="note-note" className="tiny faint">
          For you: what you’re trying, what happened. It stays on this device. Tell never reads it.
        </span>
      </div>
      <div className="stack">
        <a className="btn btn-block" href="#/bring">
          Back to your choices
        </a>
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            if (window.confirm('Remove this choice from this device? This can’t be undone.')) {
              store.update((s) => removeChoice(s, c.id));
              location.hash = '#/bring';
            }
          }}
        >
          Remove this choice
        </button>
      </div>
    </article>
  );
}

/**
 * The moves that fit, by what each deals with, in a fixed order: one row per
 * move, with the question it puts (or what it is) and why it fits. A row opens
 * the move's card: its price, its limit, an example (the player's own, from a
 * story, when they have one), and, for a kept choice, whether they're trying it.
 */
function Results({ lines, shape, trying, choice }: { lines: ShownLine[]; shape: Shape; trying?: string[]; choice?: string }) {
  const open = useCard();
  return (
    <section className="stack-lg" aria-labelledby="moves">
      <div className="stack">
        <h2 className="section-title" id="moves">
          Moves that fit what you said
        </h2>
        {outside(shape) && <p className="notice">{OUTSIDE}</p>}
        {partly(shape) && <p className="notice">{PARTLY}</p>}
        <p className="small dim">Always in this order. None is ranked.</p>
      </div>
      {lines.map((l) => (
        <div key={l.strategy} className="stack-tight">
          <h3 className="eyebrow group-head">{l.name}</h3>
          <ul className="group">
            {l.moves.map((m) => (
              <li key={m.id}>
                <button className="row" onClick={() => open({ kind: 'move', id: m.id, shown: m, choice })}>
                  <span className="row-head">
                    <span className="row-title">{m.name}</span>
                    {trying?.includes(m.id) && <span className="tag">Trying</span>}
                  </span>
                  <span>{m.asks ?? m.is}</span>
                  <span className="small dim">{m.because}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="small dim">{SCOPE}</p>
    </section>
  );
}
