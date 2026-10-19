import { useEffect, useRef, useState, type ReactNode } from 'react';
import { COINS, PEEKS, bracket, clashPairs, nextAsk, type Play } from './domain/engine';
import { interval, plural } from './domain/text';
import type { Currency, Dial, Lean, Side, SlideOutcome } from './domain/types';

// The four mechanics as screens. Each reports what was shown and answered;
// the engine checks it and snapshots the run. Shared by Play and Decide.

/** Marks an amount so it can be shown as the value that changes. */
export const mark = (s: string) => `\u0001${s}\u0002`;

/** Text with marked amounts drawn as amounts. */
export function Amounts({ text }: { text: string }) {
  return (
    <>
      {text.split(/\u0001(.*?)\u0002/).map((part, i) =>
        i % 2 ? (
          <strong key={i} className="amount">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Focus a heading or scene when a new screen appears, without scrolling. */
function useFocus<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [dep]);
  return ref;
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

// ---- Slide ------------------------------------------------------------------

export interface SlideTexts {
  scene: string;
  condition?: string;
  a: string;
  b: string;
}

export function SlidePlay(props: {
  /** Texts with the step's value marked; null before a value is shown. */
  texts: (step: number | null) => SlideTexts;
  dial: Pick<Dial, 'unit' | 'steps' | 'rises' | 'measure'>;
  currency: Currency;
  guess?: boolean;
  /** What "It depends" can test; absent when it isn't offered. */
  depends?: { on: 'alt' | 'condition' | 'else'; label: string }[];
  eyebrow?: string;
  onDone: (play: Extract<Play, { mechanic: 'slide' }>) => void;
}) {
  const { texts, dial, currency, depends, onDone, eyebrow = 'Invented situation' } = props;
  const [guess, setGuess] = useState<number | undefined | null>(props.guess ? null : undefined);
  const [asked, setAsked] = useState<{ step: number; pick: Side }[]>([]);
  const [menu, setMenu] = useState(false);
  const step = nextAsk(dial.steps.length, dial.rises, asked);
  const sceneRef = useFocus<HTMLParagraphElement>(`${guess}-${asked.length}-${menu}`);
  const finish = (outcome: SlideOutcome) => onDone({ mechanic: 'slide', ...(typeof guess === 'number' ? { guess } : {}), asked, outcome });

  function pick(side: Side) {
    const next = [...asked, { step: step!, pick: side }];
    if (nextAsk(dial.steps.length, dial.rises, next) === null) {
      onDone({ mechanic: 'slide', ...(typeof guess === 'number' ? { guess } : {}), asked: next, outcome: { kind: 'switch', at: bracket(dial.steps.length, dial.rises, next).lo } });
    } else setAsked(next);
  }

  const t = texts(guess === null ? null : step);
  const scene = (
    <div className="card stack">
      <p className="eyebrow">{eyebrow}</p>
      <p className="scene" ref={sceneRef} tabIndex={-1}>
        <Amounts text={t.scene} />
      </p>
      {t.condition && (
        <p className="condition">
          <Amounts text={t.condition} />
        </p>
      )}
    </div>
  );

  if (guess === null) {
    return (
      <div className="stack-lg">
        {scene}
        <ul className="stack choice-preview">
          <li>
            <Amounts text={t.a} />
          </li>
          <li>
            <Amounts text={t.b} />
          </li>
        </ul>
        <div className="stack">
          <div className="stack-tight">
            <p className="question">Guess first: where will you switch?</p>
            <p className="small dim">{dial.measure}</p>
          </div>
          <div className="chips" role="group" aria-label="Your guess">
            {Array.from({ length: dial.steps.length + 1 }, (_, i) => (
              <button key={i} className="chip" onClick={() => setGuess(i)}>
                {interval(dial.steps, dial.unit, i, currency)}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setGuess(undefined)}>
            Skip the guess
          </button>
        </div>
      </div>
    );
  }

  if (menu && depends) {
    return (
      <div className="stack-lg">
        {scene}
        <div className="stack">
          <p className="question" ref={sceneRef} tabIndex={-1}>
            It depends on what?
          </p>
          <div className="options">
            {depends.map((d) => (
              <button key={d.on} className="option" onClick={() => finish({ kind: 'depends', at: step!, on: d.on })}>
                {d.label.charAt(0).toUpperCase() + d.label.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm btn-block" onClick={() => setMenu(false)}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const total = Math.ceil(Math.log2(dial.steps.length + 1));
  return (
    <div className="stack-lg">
      <div className="round-head">
        <p className="small dim num">
          Choice {asked.length + 1} of {total}
        </p>
        <Dots done={asked.length} total={total} />
      </div>
      {scene}
      <div className="stack">
        <p className="question">Which do you choose?</p>
        <div className="options">
          {(['a', 'b'] as Side[]).map((side) => (
            <button key={side} className="option" onClick={() => pick(side)}>
              <Amounts text={t[side]} />
            </button>
          ))}
        </div>
        <div className="outs">
          <button className="btn btn-ghost btn-sm" onClick={() => finish({ kind: 'close', at: step! })}>
            Too close to call
          </button>
          {depends && (
            <button className="btn btn-ghost btn-sm" onClick={() => setMenu(true)}>
              It depends
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Cut --------------------------------------------------------------------

export function CutPlay({
  scene,
  items,
  eyebrow = 'Invented situation',
  onDone,
}: {
  scene: string;
  items: { id: string; text: string }[];
  eyebrow?: string;
  onDone: (order: string[]) => void;
}) {
  const [order, setOrder] = useState<string[]>([]);
  const ref = useFocus<HTMLParagraphElement>(0);
  const left = items.length - 1 - order.length;
  return (
    <div className="stack-lg">
      <div className="card stack">
        <p className="eyebrow">{eyebrow}</p>
        <p className="scene" ref={ref} tabIndex={-1}>
          {scene}
        </p>
      </div>
      <div className="stack">
        <p className="question">{left > 0 ? `Drop one at a time until one is left. ${left} more to drop.` : 'That’s the one you kept.'}</p>
        <div className="options">
          {items.map((i) => {
            const n = order.indexOf(i.id);
            return (
              <button key={i.id} className={`option${n >= 0 ? ' dropped' : ''}`} disabled={n >= 0 || left === 0} onClick={() => setOrder([...order, i.id])}>
                {n >= 0 && <span className="drop-n num">{n + 1}</span>}
                {i.text}
              </button>
            );
          })}
        </div>
        <div className="outs">
          {order.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setOrder(order.slice(0, -1))}>
              Undo
            </button>
          )}
        </div>
        {left === 0 && (
          <button className="btn btn-primary btn-block" onClick={() => onDone(order)}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Spend ------------------------------------------------------------------

export function SpendPlay({
  scene,
  features,
  onDone,
}: {
  scene: string;
  features: { id: string; label: string; high: string; low: string }[];
  onDone: (play: Extract<Play, { mechanic: 'spend' }>) => void;
}) {
  const [coins, setCoins] = useState(() => features.map(() => 0));
  const [clashes, setClashes] = useState<{ a: number; b: number; pick: number }[] | null>(null);
  const ref = useFocus<HTMLParagraphElement>(clashes?.length ?? -1);
  const left = COINS - coins.reduce((a, b) => a + b, 0);
  const add = (i: number, d: number) => setCoins(coins.map((c, j) => (j === i ? c + d : c)));

  if (!clashes) {
    return (
      <div className="stack-lg">
        <div className="card stack">
          <p className="eyebrow">Invented situation</p>
          <p className="scene" ref={ref} tabIndex={-1}>
            {scene}
          </p>
        </div>
        <div className="stack">
          <p className="question num">{left ? `${plural(left, 'coin')} left to spend.` : 'All 10 coins spent.'}</p>
          <ul className="coin-rows">
            {features.map((f, i) => (
              <li key={f.id} className="coin-row">
                <span>{f.label}</span>
                <span className="stepper">
                  <button className="step-btn" aria-label={`Take a coin from ${f.label}`} disabled={coins[i] === 0} onClick={() => add(i, -1)}>
                    −
                  </button>
                  <span className="num coin-count" aria-label={`${f.label}: ${plural(coins[i], 'coin')}`}>
                    {coins[i]}
                  </span>
                  <button className="step-btn" aria-label={`Add a coin to ${f.label}`} disabled={left === 0} onClick={() => add(i, 1)}>
                    +
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <button className="btn btn-primary btn-block" disabled={left > 0} onClick={() => setClashes([])}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  const pairs = clashPairs(coins);
  const k = clashes.length;
  const pair = pairs[k];
  const option = (high: number, low: number) => [features[high].high, features[low].low];
  // Alternate which side comes first, so position can't favour the stated order.
  const shown = k % 2 ? [{ pick: pair.b, lines: option(pair.b, pair.a) }, { pick: pair.a, lines: option(pair.a, pair.b) }] : [{ pick: pair.a, lines: option(pair.a, pair.b) }, { pick: pair.b, lines: option(pair.b, pair.a) }];
  return (
    <div className="stack-lg">
      <div className="round-head">
        <p className="small dim num">
          Clash {k + 1} of {pairs.length}
        </p>
        <Dots done={k} total={pairs.length} />
      </div>
      <p className="question" ref={ref} tabIndex={-1}>
        Which would you rather have? Everything else is the same.
      </p>
      <div className="options">
        {shown.map((s) => (
          <button
            key={s.pick}
            className="option"
            onClick={() => {
              const next = [...clashes, { ...pair, pick: s.pick }];
              if (next.length === pairs.length) onDone({ mechanic: 'spend', coins, clashes: next });
              else setClashes(next);
            }}
          >
            {s.lines.map((l) => (
              <span key={l} className="option-line">
                {l}
              </span>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Peek -------------------------------------------------------------------

export function PeekPlay({
  scene,
  a,
  b,
  facts,
  onDone,
}: {
  scene: string;
  a: string;
  b: string;
  facts: { id: string; label: string; a: string; b: string }[];
  onDone: (play: Extract<Play, { mechanic: 'peek' }>) => void;
}) {
  const [before, setBefore] = useState<Lean | null>(null);
  const [opened, setOpened] = useState<{ fact: number; lean: Lean | null }[]>([]);
  const [pick, setPick] = useState<Side | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [would, setWould] = useState<number[]>([]);
  const ref = useFocus<HTMLHeadingElement>(`${before}-${opened.length}-${choosing}-${pick}`);
  const name = { a, b };
  const pending = opened.at(-1)?.lean === null;
  const leanButtons = (onLean: (l: Lean) => void) => (
    <div className="chips" role="group" aria-label="Your lean">
      {(['a', 'b', 'none'] as Lean[]).map((l) => (
        <button key={l} className="chip" onClick={() => onLean(l)}>
          {l === 'none' ? 'No lean yet' : name[l]}
        </button>
      ))}
    </div>
  );
  const factTable = (i: number) => (
    <span className="fact-values">
      <span>
        <span className="faint tiny">{a}</span> {facts[i].a}
      </span>
      <span>
        <span className="faint tiny">{b}</span> {facts[i].b}
      </span>
    </span>
  );
  const situation = (
    <div className="card stack">
      <p className="eyebrow">Invented situation</p>
      <p className="scene">{scene}</p>
    </div>
  );

  if (before === null) {
    return (
      <div className="stack-lg">
        {situation}
        <div className="stack">
          <p className="question" ref={ref} tabIndex={-1}>
            From that alone, which way do you lean?
          </p>
          {leanButtons(setBefore)}
        </div>
      </div>
    );
  }

  if (pick) {
    const unopened = facts.map((_, i) => i).filter((i) => !opened.some((o) => o.fact === i));
    return (
      <div className="stack-lg">
        <p className="question" ref={ref} tabIndex={-1}>
          Here’s what you didn’t open. Would any of these have changed your pick of {name[pick]}?
        </p>
        <div className="options">
          {unopened.map((i) => {
            const on = would.includes(i);
            return (
              <button key={i} className={`option fact${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setWould(on ? would.filter((x) => x !== i) : [...would, i])}>
                <strong className="option-title">{facts[i].label}</strong>
                {factTable(i)}
              </button>
            );
          })}
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={() => onDone({ mechanic: 'peek', before, opened: opened.map((o) => ({ fact: o.fact, lean: o.lean! })), pick, wouldHave: would })}
        >
          {would.length ? 'Done' : 'None of them. Done'}
        </button>
      </div>
    );
  }

  if (choosing) {
    return (
      <div className="stack-lg">
        {situation}
        <p className="question" ref={ref} tabIndex={-1}>
          Your pick?
        </p>
        <div className="options">
          {(['a', 'b'] as Side[]).map((s) => (
            <button key={s} className="option" onClick={() => setPick(s)}>
              {name[s]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const leftToOpen = PEEKS - opened.length;
  return (
    <div className="stack-lg">
      {situation}
      <div className="stack">
        <p className="question" ref={ref} tabIndex={-1}>
          {pending ? 'Your lean now?' : leftToOpen ? `Open up to ${plural(leftToOpen, 'more fact')}, one at a time.` : 'That’s all your peeks.'}
        </p>
        {pending && leanButtons((l) => setOpened(opened.map((o, i) => (i === opened.length - 1 ? { ...o, lean: l } : o))))}
        <div className="options">
          {facts.map((f, i) => {
            const o = opened.find((x) => x.fact === i);
            return (
              <button key={f.id} className={`option fact${o ? ' open' : ''}`} disabled={!!o || pending || leftToOpen === 0} onClick={() => setOpened([...opened, { fact: i, lean: null }])}>
                <strong className="option-title">{f.label}</strong>
                {o ? factTable(i) : <span className="faint small">Hidden</span>}
              </button>
            );
          })}
        </div>
        {!pending && (
          <button className="btn btn-primary btn-block" onClick={() => setChoosing(true)}>
            Choose now
          </button>
        )}
      </div>
    </div>
  );
}

export const Section = ({ title, children, id }: { title: string; children: ReactNode; id: string }) => (
  <section className="stack" aria-labelledby={id}>
    <h2 className="section-title" id={id}>
      {title}
    </h2>
    {children}
  </section>
);
