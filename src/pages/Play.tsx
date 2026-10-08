import { useEffect, useRef, useState, type RefObject } from 'react';
import { DECK, PAIRS } from '../domain/deck';
import {
  ROUNDS_PER_DAY,
  answer,
  currentRound,
  deal,
  deposit,
  matchedPairs,
  pairResults,
  pickedLens,
  todaysDeal,
  toggleDisagree,
  toggleKeep,
} from '../domain/engine';
import { AREAS, OUTS, OUTS_FOR, lensName, type Answer, type Area, type Card, type Deal, type TellState } from '../domain/types';
import { store } from '../store/store';
import { AddedIcon, KeepIcon, longDate, plural, useNow } from '../ui';

type Choice = Area | 'mix';
const CHOICES: { id: Choice; label: string }[] = [
  { id: 'mix', label: 'Mix' },
  { id: 'world', label: 'The world' },
  { id: 'work', label: 'Work & projects' },
];

export default function Play({ state }: { state: TellState }) {
  const now = useNow();
  // The round whose reveal is showing; cleared by Next.
  const [revealing, setRevealing] = useState<string | null>(null);
  const today = todaysDeal(state, now);

  function pick(card: Card, option: string) {
    const at = new Date();
    try {
      if (state.answers.length === 0) navigator.storage?.persist?.().catch(() => undefined);
      store.update((s) => answer(s, DECK, card.id, option, at));
      setRevealing(card.id);
    } catch {
      // The day rolled over mid-round; the next render shows the new day.
      setRevealing(null);
    }
  }

  if (!today) return <Home state={state} now={now} />;
  if (revealing && today.cards.some((c) => c.id === revealing) && state.answers.some((a) => a.card === revealing)) {
    const last = today.cards.every((c) => state.answers.some((a) => a.card === c.id));
    return <Reveal state={state} cardId={revealing} last={last} onNext={() => setRevealing(null)} />;
  }
  const round = currentRound(state, DECK, now);
  if (!round) return <Done state={state} today={today} />;
  return <Round key={round.card.id} card={round.card} order={round.order} index={round.index} total={today.cards.length} onPick={pick} />;
}

function Home({ state, now }: { state: TellState; now: Date }) {
  const [area, setArea] = useState<Choice>(state.deal?.area ?? 'mix');
  const ready = deal(state, DECK, now, area, () => 0).cards.length;
  const start = () => store.update((s) => ({ ...s, deal: deal(s, DECK, new Date(), area) }));

  return (
    <div className="stack-lg">
      <header className="stack">
        <p className="eyebrow">{longDate(now)}</p>
        <h1 className="title">Today’s set</h1>
        <p className="lede">
          {ROUNDS_PER_DAY} short rounds, a few minutes, then it ends. Every answer is added to your map.
        </p>
      </header>

      <div className="stack">
        <p className="small dim" id="where">
          Where to play
        </p>
        <div className="segments" role="group" aria-labelledby="where">
          {CHOICES.map((c) => (
            <button key={c.id} className={`segment${area === c.id ? ' on' : ''}`} aria-pressed={area === c.id} onClick={() => setArea(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {ready > 0 ? (
        <button className="btn btn-primary btn-block" onClick={start}>
          {ready < ROUNDS_PER_DAY ? `Start (${ready} ready)` : 'Start'}
        </button>
      ) : (
        <p className="notice">
          No rounds are ready {area === 'mix' ? 'today' : `in ${AREAS[area].name} today`}. Some may be waiting a day or two to come back;
          new rounds arrive with updates.
        </p>
      )}

      {state.answers.length > 0 && <SoFar state={state} />}
    </div>
  );
}

function SoFar({ state }: { state: TellState }) {
  const matched = matchedPairs(state.answers).length;
  return (
    <section className="card-quiet stack">
      <p className="eyebrow">Your map so far</p>
      <p className="totals">
        <span className="num">{plural(state.answers.length, 'round')}</span>
        <span className="num">{plural(state.kept.length, 'line')} kept</span>
        <span className="num">{plural(matched, 'matched pair')}</span>
      </p>
      <a className="link" href="#/map">
        See your map
      </a>
    </section>
  );
}

function Round(props: { card: Card; order: string[]; index: number; total: number; onPick: (card: Card, option: string) => void }) {
  const { card, order, index, total, onPick } = props;
  const sceneRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    sceneRef.current?.focus({ preventScroll: true });
  }, []);
  const options = order.flatMap((id) => card.options.filter((o) => o.id === id));
  const question = card.kind === 'switch' ? null : AREAS[card.area].question;

  return (
    <article className="stack-lg">
      <div className="round-head">
        <p className="small dim num">
          Round {index + 1} of {total}
        </p>
        <Dots done={index} total={total} />
        <p className="small dim">{AREAS[card.area].name}</p>
      </div>

      <div className="card stack">
        <p className="eyebrow">Invented scene</p>
        <p className="scene" ref={sceneRef} tabIndex={-1}>
          {card.scene}
        </p>
      </div>

      <div className="stack">
        {question && <p className="question">{question}</p>}
        <div className="options">
          {options.map((o) => (
            <button key={o.id} className="option" onClick={() => onPick(card, o.id)}>
              {o.text}
            </button>
          ))}
        </div>
        {OUTS_FOR[card.kind].length > 0 && (
          <div className="outs">
            {OUTS_FOR[card.kind].map((out) => (
              <button key={out} className="btn btn-ghost btn-sm" onClick={() => onPick(card, out)}>
                {OUTS[out]}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Dots({ done, total }: { done: number; total: number }) {
  return (
    <span className="dots" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`dot${i < done ? ' done' : ''}`} />
      ))}
    </span>
  );
}

function Reveal({ state, cardId, last, onNext }: { state: TellState; cardId: string; last: boolean; onNext: () => void }) {
  const a = state.answers.find((x) => x.card === cardId)!;
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
  }, []);
  const added = deposit(state, cardId);

  return (
    <article className="stack-lg reveal" aria-live="polite">
      <p className="eyebrow">{a.title}</p>
      {a.kind === 'switch' ? <ChoiceReveal state={state} a={a} headRef={headRef} /> : <LensReveal a={a} headRef={headRef} />}

      <div className="added">
        <AddedIcon />
        <div className="stack">
          {added.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      {a.kind !== 'switch' && <KeepLine state={state} a={a} />}

      <div className="stack">
        <button className="btn btn-primary btn-block" onClick={onNext}>
          {last ? 'Finish' : 'Next round'}
        </button>
        {a.kind !== 'switch' && <Disagree state={state} cardId={cardId} />}
      </div>
    </article>
  );
}

type HeadRef = RefObject<HTMLHeadingElement | null>;

function LensReveal({ a, headRef }: { a: Answer; headRef: HeadRef }) {
  const card = DECK.find((c) => c.id === a.card);
  const lens = pickedLens(a);
  const option = card?.kind !== 'switch' ? card?.options.find((o) => o.id === a.pick) : undefined;
  const others = a.shown.filter((s) => s.id !== a.pick && s.lens).map((s) => lensName(s.lens!));

  if (!lens || !option) {
    // A way out: show every angle that was on offer, so nothing is hidden.
    const offered = card?.kind !== 'switch' ? a.shown.flatMap((s) => card?.options.filter((o) => o.id === s.id) ?? []) : [];
    return (
      <div className="stack">
        <h1 className="title" ref={headRef} tabIndex={-1}>
          You chose “{a.pickText}”
        </h1>
        <p className="dim">Each option was a different angle:</p>
        <ul className="stack">
          {offered.map((o) => (
            <li key={o.id} className="small">
              <strong>{lensName(o.lens)}</strong>
              <span className="dim"> · {o.text}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="stack">
      <p className="dim">{a.kind === 'decode' ? 'You looked first at' : 'Closest to your experience'}</p>
      <h1 className="picked" ref={headRef} tabIndex={-1}>
        {lensName(lens)}
      </h1>
      <dl className="sees">
        <dt>Sees</dt>
        <dd>{option.sees}</dd>
        <dt>Misses</dt>
        <dd>{option.misses}</dd>
      </dl>
      <p className="small dim">Other angles here: {others.join(' · ')}</p>
    </div>
  );
}

function ChoiceReveal({ state, a, headRef }: { state: TellState; a: Answer; headRef: HeadRef }) {
  const result = a.variant === 'b' ? pairResults(state.answers, PAIRS).find((r) => r.pair.id === a.pair) : undefined;
  if (!result?.second) {
    return (
      <h1 className="title" ref={headRef} tabIndex={-1}>
        You chose: {a.pickText}
      </h1>
    );
  }
  return (
    <div className="stack">
      <h1 className="title" ref={headRef} tabIndex={-1}>
        {result.changed ? 'Your answer changed' : 'Your answer stayed the same'}
      </h1>
      <p>
        This choice first came up on {longDate(result.first.day)}. Only one thing differed: {result.pair.changed}.
      </p>
      <div className="then-now">
        <div>
          <p className="eyebrow">Then</p>
          <p>{result.first.pickText}</p>
        </div>
        <div>
          <p className="eyebrow">Now</p>
          <p>{result.second.pickText}</p>
        </div>
      </div>
      <p className="dim">{result.pair.note}</p>
    </div>
  );
}

function KeepLine({ state, a }: { state: TellState; a: Answer }) {
  const card = DECK.find((c) => c.id === a.card);
  if (!card || card.kind === 'switch') return null;
  const kept = state.kept.some((k) => k.card === a.card);
  return (
    <figure className="line">
      <blockquote>{card.line}</blockquote>
      <button
        className={`keep${kept ? ' on' : ''}`}
        aria-pressed={kept}
        onClick={() => store.update((s) => toggleKeep(s, DECK, a.card, new Date()))}
      >
        <KeepIcon filled={kept} />
        {kept ? 'Kept' : 'Keep'}
      </button>
    </figure>
  );
}

function Disagree({ state, cardId }: { state: TellState; cardId: string }) {
  const on = state.disagreed.some((d) => d.card === cardId);
  return (
    <button
      className={`btn btn-ghost btn-sm btn-block${on ? ' on' : ''}`}
      aria-pressed={on}
      onClick={() => store.update((s) => toggleDisagree(s, cardId, new Date()))}
    >
      {on ? 'Noted: you see this differently' : 'I see this differently'}
    </button>
  );
}

function Done({ state, today }: { state: TellState; today: Deal }) {
  const answered = today.cards.flatMap((c) => state.answers.filter((a) => a.card === c.id));
  return (
    <div className="stack-lg reveal">
      <header className="stack">
        <p className="eyebrow">{longDate(today.day)}</p>
        <h1 className="title">That’s today’s set</h1>
        <p className="lede">Your next set is ready tomorrow.</p>
      </header>
      <section className="card stack">
        <h2 className="section-title">What it added</h2>
        <ul className="evidence">
          {answered.map((a) => {
            const lens = pickedLens(a);
            return (
              <li key={a.card}>
                <span>{a.title}</span>
                <span className="pick-mark">{lens ? lensName(lens) : a.pickText}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <a className="btn btn-primary btn-block" href="#/map">
        See your map
      </a>
    </div>
  );
}
