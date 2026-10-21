import { useState } from 'react';
import { examples, recordChoice, removeChoice, setNote, setTrying, shownFor } from '../domain/engine';
import { NONE, NOT_SURE, OUTSIDE, PARTLY, QUESTIONS, SCOPE, outside, partly, type Shape } from '../domain/language';
import type { ShownLine, TellState } from '../domain/types';
import { useFocus } from '../steps';
import { store } from '../store/store';
import { shortDate } from '../ui';
import { Missing, ShapeList } from './Play';

// Bring a choice: four questions about a step the player is unsure about,
// answered in taps, and the moves that fit those answers, by rule. The answers
// are all that decide which moves show; the player's plays only lend examples.
// Nothing is kept unless the player keeps it, and Tell never reads the label
// or the note.

const ESCAPES: { id: string; text: string; like?: string }[] = [
  { id: NOT_SURE, text: 'Not sure' },
  { id: NONE, text: 'None of these' },
];

export function BringPage({ state }: { state: TellState }) {
  const [label, setLabel] = useState('');
  const [at, setAt] = useState(-1);
  const [shape, setShape] = useState<Partial<Shape>>({});
  const ref = useFocus<HTMLHeadingElement>(at);

  if (at === -1) {
    return (
      <article className="stack-lg">
        <header className="stack">
          <p className="eyebrow">Your map</p>
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
        <p className="small dim">{SCOPE}</p>
        <button className="btn btn-primary btn-block" onClick={() => setAt(0)}>
          Start
        </button>
      </article>
    );
  }

  if (at < QUESTIONS.length) {
    const q = QUESTIONS[at];
    const now = q.multi ? (shape.know ?? []) : shape[q.id] ? [shape[q.id] as string] : [];
    const pick = (a: string) => {
      if (!q.multi) {
        setShape({ ...shape, [q.id]: a });
        return setAt(at + 1);
      }
      // Not sure and None of these stand alone; any other answer clears them.
      const escape = a === NOT_SURE || a === NONE;
      const next = now.includes(a) ? now.filter((x) => x !== a) : escape ? [a] : [...now.filter((x) => x !== NOT_SURE && x !== NONE), a];
      setShape({ ...shape, know: next });
    };
    return (
      <article className="stack-lg">
        <header className="stack-tight">
          <p className="eyebrow">{label.trim() || 'Bring a choice'}</p>
          <h1 className="title" ref={ref} tabIndex={-1}>
            {q.ask}
          </h1>
          {q.multi && <p className="small dim">Tap all that fit.</p>}
        </header>
        <div className="options" role="group" aria-label={q.ask}>
          {[...q.answers, ...ESCAPES].map((a: { id: string; text: string; like?: string }) => (
            <button key={a.id} className={`option${now.includes(a.id) ? ' on' : ''}${a.id === NOT_SURE ? ' escape' : ''}`} aria-pressed={now.includes(a.id)} onClick={() => pick(a.id)}>
              <span className="option-title">{a.text}</span>
              {a.like && <span className="option-line small dim">Like {a.like}.</span>}
            </button>
          ))}
        </div>
        {q.multi && (
          <button className="btn btn-primary btn-block" disabled={!now.length} onClick={() => setAt(at + 1)}>
            Next
          </button>
        )}
        <button className="btn btn-ghost btn-block" onClick={() => setAt(at - 1)}>
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
        <Answers shape={done} />
      </header>
      <Results lines={shownFor(done)} state={state} shape={done} />
      <div className="stack">
        <button className="btn btn-block" onClick={keep}>
          Keep this choice
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => setAt(0)}>
          Change the answers
        </button>
        <a className="btn btn-ghost btn-block" href="#/map">
          Leave without keeping
        </a>
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
        <Answers shape={c.shape} />
      </header>
      <Results lines={c.shown} state={state} shape={c.shape} trying={c.trying} onTry={(move, on) => store.update((s) => setTrying(s, c.id, move, on))} />
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
        <a className="btn btn-block" href="#/map">
          Back to your map
        </a>
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            if (window.confirm('Remove this choice from this device? This can’t be undone.')) {
              store.update((s) => removeChoice(s, c.id));
              location.hash = '#/map';
            }
          }}
        >
          Remove this choice
        </button>
      </div>
    </article>
  );
}

/** The four answers, folded: the player just gave them, and the moves come first. */
const Answers = ({ shape }: { shape: Shape }) => (
  <details className="card-quiet">
    <summary className="link small">Your four answers</summary>
    <ShapeList shape={shape} />
  </details>
);

/**
 * One line per strategy, in a fixed order, each opening to its moves: the
 * question each move puts, why it fits, what it costs, where it breaks, and an
 * example, the player's own from a story when they have one. Never ranked.
 */
function Results({ lines, state, shape, trying, onTry }: { lines: ShownLine[]; state: TellState; shape: Shape; trying?: string[]; onTry?: (move: string, on: boolean) => void }) {
  const mine = new Map(examples(state).map((e) => [e.id as string, e.examples[0]]));
  return (
    <section className="stack" aria-labelledby="moves">
      <h2 className="section-title" id="moves">
        Moves that fit what you said
      </h2>
      {outside(shape) && <p className="notice">{OUTSIDE}</p>}
      {partly(shape) && <p className="notice">{PARTLY}</p>}
      <p className="small dim">By what each deals with, always in this order. None is ranked, and none is a recommendation.</p>
      <div className="cells">
        {lines.map((l) => (
          <details key={l.strategy} className="cell">
            <summary className="stack-tight strategy">
              <span className="option-title">{l.name}</span>
              <span className="small dim">{l.moves.map((m) => m.name).join(' · ')}</span>
            </summary>
            <div className="stack-lg strategy-body">
              {l.moves.map((m) => {
                const own = mine.get(m.id);
                const on = !!trying?.includes(m.id);
                return (
                  <div key={m.id} className="stack-tight">
                    <h3 className="option-title">{m.name}</h3>
                    {m.asks && <p>{m.asks}</p>}
                    <p className="small">{m.is}</p>
                    <p className="small dim">{m.because}</p>
                    <p className="small dim">Costs: {m.costs}</p>
                    <p className="small dim">Breaks: {m.breaks}</p>
                    <p className="small dim">{own ? `In your play of ${own.play.shown.title}: ${own.line}` : `For instance, ${m.like}.`}</p>
                    {onTry && (
                      <button className={`btn btn-block${on ? ' on' : ''}`} aria-pressed={on} onClick={() => onTry(m.id, !on)}>
                        {on ? 'Trying this' : 'I’m trying this'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
      <p className="small dim">{SCOPE}</p>
    </section>
  );
}
