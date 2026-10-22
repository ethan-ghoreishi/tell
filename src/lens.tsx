import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { examples, playedWith, setTrying, storyMoves } from './domain/engine';
import { QUESTIONS, STRATEGIES, answersTo, languageMove, question, shortText, type LanguageMove, type QuestionId, type Shape } from './domain/language';
import { SITUATIONS } from './domain/situations';
import { capital, list } from './domain/text';
import type { ShownMove, TellState } from './domain/types';
import { store } from './store/store';
import { CheckIcon, CloseIcon } from './ui';

// What every screen shares, so a move and a shape look and behave the same in
// a story, at its ending, on the map and for a real choice: a move as a named
// pill, a step's shape as four cells in one tile, and one card for each,
// opened over whatever screen it was tapped on. Every pill and every cell
// opens its card, an option's pills included. A card is an overlay, never a
// page: a story in progress, and a choice not yet kept, hold their answers in
// the page, and leaving would lose them, so there a card names what it would
// otherwise link to.

export type Card =
  /** `shown` is the move as a result or kept choice showed it; `choice`, the kept choice it was opened from. */
  | { kind: 'move'; id: string; shown?: ShownMove; choice?: string }
  | { kind: 'question'; id: QuestionId; shape?: Partial<Shape> };

const Open = createContext<(c: Card) => void>(() => undefined);
export const useCard = () => useContext(Open);

export const moveName = (id: string) => languageMove(id)?.name ?? id;

/** Moves, named, each opening its card; New the first time an ending shows one. */
export function MoveButtons({ ids, fresh }: { ids: string[]; fresh?: Set<string> }) {
  const open = useCard();
  if (!ids.length) return null;
  return (
    <span className="moves">
      {ids.map((id) => (
        <button key={id} className="move-btn" onClick={() => open({ kind: 'move', id })}>
          <span className="move-name">
            {moveName(id)}
            {fresh?.has(id) && <span className="tag">New</span>}
          </span>
        </button>
      ))}
    </span>
  );
}

const given = (shape: Partial<Shape>, q: QuestionId) => (q === 'know' ? (shape.know ?? []) : shape[q] ? [shape[q] as string] : []);

/** "Can it be undone? No", "If you wait: Risk grows". */
const read = (label: string, value: string) => `${label}${label.endsWith('?') ? '' : ':'} ${value}`;

/**
 * A step's shape: the four questions as the cells of one tile, each opening
 * its card (or `onCell`). A cell that differs from `was`, the story this one
 * varies, says what it was. Unanswered cells show a dash.
 */
export function ShapeCells({ shape, label, was, current, onCell }: { shape: Partial<Shape>; label?: string; was?: Shape; current?: QuestionId; onCell?: (q: QuestionId) => void }) {
  const open = useCard();
  return (
    <div className="shape" role="group" aria-label={label ?? 'The shape of the step'}>
      {label && (
        <p className="shape-head" aria-hidden="true">
          {label}
        </p>
      )}
      <div className="shape-grid">
        {QUESTIONS.map((q) => {
          const has = given(shape, q.id).length > 0;
          const value = has ? shortText(shape as Shape, q.id) : '—';
          const before = was && has && answersTo(was, q.id).join() !== given(shape, q.id).join() ? shortText(was, q.id) : '';
          return (
            <button
              key={q.id}
              className={`cell-q${before ? ' changed' : ''}${current === q.id ? ' current' : ''}`}
              aria-label={`${read(q.short, value)}${before ? `, was ${before}` : ''}`}
              onClick={() => (onCell ? onCell(q.id) : open({ kind: 'question', id: q.id, shape }))}
            >
              <span className="cell-label">{q.short}</span>
              <span className="cell-value">{value}</span>
              {before && <span className="cell-was">Was: {before}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Hosts the one card that can be open. Following a link from it closes it; with `links` off, it names instead of linking. */
export function CardHost({ state, links, children }: { state: TellState; links: boolean; children: ReactNode }) {
  const [card, setCard] = useState<Card | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (card && !d.open) d.showModal();
    if (!card && d.open) d.close();
    if (card) {
      d.scrollTo(0, 0);
      d.querySelector<HTMLElement>('#card-title')?.focus();
    }
  }, [card]);
  useEffect(() => {
    const close = () => setCard(null);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, []);
  return (
    <Open.Provider value={setCard}>
      {children}
      <dialog
        ref={ref}
        className="sheet"
        aria-labelledby="card-title"
        onClose={() => setCard(null)}
        onClick={(e) => {
          // A tap on the backdrop, outside the card, closes it.
          if (e.target === e.currentTarget) setCard(null);
        }}
      >
        {card && (
          <div className="sheet-inner">
            <button className="sheet-close" aria-label="Close" onClick={() => setCard(null)}>
              <CloseIcon />
            </button>
            <div className="stack-lg">
              {card.kind === 'move' ? <MoveCard state={state} card={card} links={links} /> : <QuestionCard state={state} card={card} />}
            </div>
          </div>
        )}
      </dialog>
    </Open.Provider>
  );
}

/** Which answers a move needs, as cells: the rule that decides when Bring a choice shows it. */
function Fits({ m }: { m: LanguageMove }) {
  const needs = Object.entries(m.fits) as [QuestionId, string[]][];
  if (!needs.length) return <p className="small dim">Fits any step: always possible.</p>;
  return (
    <div className="shape">
      <p className="shape-head">Fits a step with</p>
      <div className={`shape-grid${needs.length === 1 ? ' one' : ''}`}>
        {needs.map(([q, as]) => (
          <span key={q} className="cell-q">
            <span className="cell-label">{question(q).short}</span>
            <span className="cell-value">{as.map((a, i) => question(q).answers.find((x) => x.id === a)!.short.replace(/^./, (c) => (i ? c.toLowerCase() : c))).join(' or ')}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * A move's card: what it is, the answers it fits and when that's worth
 * something, its price and its limit; then where the player has made it,
 * which kept choices showed it, and the stories that offer it.
 */
function MoveCard({ state, card, links }: { state: TellState; card: Extract<Card, { kind: 'move' }>; links: boolean }) {
  const m = languageMove(card.id);
  // A result or kept choice reads in its own words; the rest is today's language.
  const w = card.shown ?? m;
  if (!w) return null;
  const strategy = STRATEGIES.find((s) => s.id === m?.strategy);
  const principle = strategy?.about ? question(strategy.about).principle : '';
  const mine = examples(state).find((e) => e.id === card.id)?.examples ?? [];
  const kept = state.choices.filter((c) => c.shown.some((l) => l.moves.some((x) => x.id === card.id)));
  const stories = SITUATIONS.filter((s) => storyMoves(s).includes(card.id as never));
  const choice = state.choices.find((c) => c.id === card.choice);
  const trying = !!choice?.trying.includes(card.id);
  return (
    <>
      <header className="stack-tight card-head">
        {strategy && <p className="eyebrow">{strategy.name}</p>}
        <h2 className="title" id="card-title" tabIndex={-1}>
          {w.name}
        </h2>
      </header>
      <div className="stack">
        {w.asks && <p className="question">{w.asks}</p>}
        <p>{w.is}</p>
      </div>
      <dl className="facts">
        <div>
          <dt>Costs</dt>
          <dd>{w.costs}</dd>
        </div>
        <div>
          <dt>Breaks</dt>
          <dd>{w.breaks}</dd>
        </div>
        <div>
          <dt>For instance</dt>
          <dd>{capital(w.like)}.</dd>
        </div>
      </dl>
      {choice && (
        <button className={`btn btn-block${trying ? ' on' : ''}`} aria-pressed={trying} onClick={() => store.update((s) => setTrying(s, choice.id, card.id, !trying))}>
          {trying && <CheckIcon className="btn-icon" />}
          {trying ? 'Trying this' : 'I’m trying this'}
        </button>
      )}
      {m && (
        <div className="stack">
          <Fits m={m} />
          {principle && <p className="small dim">{principle}</p>}
        </div>
      )}
      {mine.length > 0 && (
        <section className="stack-tight small" aria-labelledby="card-mine">
          <h3 className="eyebrow" id="card-mine">
            Where you made it
          </h3>
          <ul className="results">
            {mine.map((e) => (
              <li key={`${e.play.id}-${e.line}`}>
                {links ? (
                  <a className="link" href={`#/play/${e.play.id}`}>
                    {e.play.shown.title}
                  </a>
                ) : (
                  <strong>{e.play.shown.title}</strong>
                )}
                : {e.line}
              </li>
            ))}
          </ul>
        </section>
      )}
      {kept.length > 0 && (
        <section className="stack-tight small" aria-labelledby="card-kept">
          <h3 className="eyebrow" id="card-kept">
            In your choices
          </h3>
          <ul className="results">
            {kept.map((c) => (
              <li key={c.id}>
                {links ? (
                  <a className="link" href={`#/choice/${c.id}`}>
                    {c.label || 'A choice'}
                  </a>
                ) : (
                  <strong>{c.label || 'A choice'}</strong>
                )}
                {c.trying.includes(card.id) ? ': trying it' : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
      {stories.length > 0 && (
        <section className="stack-tight small" aria-labelledby="card-stories">
          <h3 className="eyebrow" id="card-stories">
            Stories with it
          </h3>
          <ul className="replays">
            {stories.map((s) => (
              <li key={s.id}>
                {links ? (
                  <a className="link" href={`#/situation/${s.id}`}>
                    {s.title}
                  </a>
                ) : (
                  <strong>{s.title}</strong>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** A question's card: its answers, each with an everyday moment and the played stories that had it, and when the moves it calls for are worth something. */
function QuestionCard({ state, card }: { state: TellState; card: Extract<Card, { kind: 'question' }> }) {
  const q = question(card.id);
  const on = card.shape ? given(card.shape, q.id) : [];
  return (
    <>
      <header className="card-head">
        <h2 className="title" id="card-title" tabIndex={-1}>
          {q.ask}
        </h2>
      </header>
      <ul className="answers">
        {q.answers.map((a) => {
          const stories = playedWith(state, q.id, a.id);
          const here = on.includes(a.id);
          return (
            <li key={a.id} className={here ? 'on' : undefined} aria-current={here || undefined}>
              <span className="answer-text">
                {a.text}
                {here && <CheckIcon className="answer-check" />}
              </span>
              <span className="small dim">
                Like {a.like}
                {stories.length ? `; as in ${list(stories)}` : ''}.
              </span>
            </li>
          );
        })}
      </ul>
      <p className="small dim">{q.principle}</p>
    </>
  );
}
