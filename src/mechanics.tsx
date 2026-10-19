import { useEffect, useRef, useState, type ReactNode } from 'react';
import { bracket, nextAsk } from './domain/engine';
import type { Side, SlideOutcome } from './domain/types';

// Moves shared by episodes: Slide and Cut, kept from Tell 2's experiments.
// Each reports what was shown and answered; the engine checks and records it.

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

/** When a new screen appears inside a page: back to the top, and focus its heading or question. */
export function useFocus<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    // Braces matter: Chromium's scrollTo returns a Promise, which React would take for a cleanup.
    ref.current?.closest('main')?.scrollTo(0, 0);
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

/** One value changes, halving the gap with each choice, until the answer switches. */
export function SlidePlay(props: {
  /** The line with the step's value marked, and the two options. */
  texts: (step: number) => { scene: string; a: string; b: string };
  steps: number[];
  rises: Side;
  onDone: (result: { asked: { step: number; pick: Side }[]; outcome: SlideOutcome }) => void;
}) {
  const { texts, steps, rises, onDone } = props;
  const [asked, setAsked] = useState<{ step: number; pick: Side }[]>([]);
  const step = nextAsk(steps.length, rises, asked)!;
  const ref = useFocus<HTMLParagraphElement>(asked.length);
  const total = Math.ceil(Math.log2(steps.length + 1));
  const t = texts(step);

  function pick(side: Side) {
    const next = [...asked, { step, pick: side }];
    if (nextAsk(steps.length, rises, next) === null) onDone({ asked: next, outcome: { kind: 'switch', at: bracket(steps.length, rises, next).lo } });
    else setAsked(next);
  }

  return (
    <div className="stack-lg">
      <div className="round-head">
        <p className="small dim num">
          Choice {asked.length + 1} of {total}
        </p>
        <Dots done={asked.length} total={total} />
      </div>
      <p className="scene" ref={ref} tabIndex={-1}>
        <Amounts text={t.scene} />
      </p>
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
          <button className="btn btn-ghost btn-sm" onClick={() => onDone({ asked, outcome: { kind: 'close', at: step } })}>
            Too close to call
          </button>
        </div>
      </div>
    </div>
  );
}

/** Good things dropped one at a time until one is left. */
export function CutPlay({ prompt, items, onDone }: { prompt: string; items: { id: string; text: string }[]; onDone: (order: string[]) => void }) {
  const [order, setOrder] = useState<string[]>([]);
  const ref = useFocus<HTMLParagraphElement>(0);
  const left = items.length - 1 - order.length;
  return (
    <div className="stack">
      <p className="question" ref={ref} tabIndex={-1}>
        {prompt}
      </p>
      <p className="small dim num" aria-live="polite">
        {left > 0 ? `${left} more to drop.` : 'That’s the one left.'}
      </p>
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

/** A row of toggle chips: the state shows by class as well as aria-pressed. */
export function Chips<T extends string>({ label, id, options, value, onPick }: { label: string; id: string; options: [T, string][]; value: T | T[] | null | undefined; onPick: (v: T) => void }) {
  const on = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div className="stack-tight">
      <p className="small" id={id}>
        {label}
      </p>
      <div className="chips" role="group" aria-labelledby={id}>
        {options.map(([v, text]) => (
          <button key={v} className={`chip${on(v) ? ' on' : ''}`} aria-pressed={on(v)} onClick={() => onPick(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
