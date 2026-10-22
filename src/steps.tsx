import { useEffect, useRef, useState, type ReactNode } from 'react';
import { bandOf, offered, spent } from './domain/engine';
import { plural } from './domain/text';
import type { Band, Step, StepAnswer, Unit } from './domain/types';
import { MoveButtons } from './lens';

// The controls a situation is played with: pick one, find things out from a
// budget, share something scarce, act or wait day by day. Each reports its
// answer; the engine checks and records the play. Every option shows the
// moves it makes before it's chosen, and a number's moves change as it does.

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

export const Section = ({ title, children, id }: { title: string; children: ReactNode; id: string }) => (
  <section className="stack" aria-labelledby={id}>
    <h2 className="section-title" id={id}>
      {title}
    </h2>
    {children}
  </section>
);

const amount = (n: number, unit: Unit) => plural(n, unit[0], unit[1]);

/** The moves a number makes. */
const movesAt = (bands: Band[], n: number) => bandOf(bands, n).moves;

/**
 * An option: the whole card picks it. Its moves sit on it as pills, each
 * opening its card without picking: the pick is one button stretched over
 * the card, and the pills are buttons laid above it.
 */
function Pick({ title, line, moves = [], onPick, kind, disabled }: { title: string; line?: string; moves?: string[]; onPick: () => void; kind?: string; disabled?: boolean }) {
  return (
    <div className={`option${kind ? ` ${kind}` : ''}${disabled ? ' off' : ''}`}>
      <button className="pick" disabled={disabled} onClick={onPick}>
        <span className="option-title">{title}</span>
        {line && <span className="option-line small dim">{line}</span>}
      </button>
      <MoveButtons ids={moves} />
    </div>
  );
}

/** `onMove` says a step has moved on inside itself (the next day), so the story can fold away. */
export function StepPlay({ step, before, onAnswer, onMove }: { step: Step; before?: string; onAnswer: (a: StepAnswer) => void; onMove: () => void }) {
  if (step.kind === 'choose') return <Choose step={step} before={before} onAnswer={onAnswer} />;
  if (step.kind === 'uncover') return <Uncover step={step} onAnswer={onAnswer} />;
  if (step.kind === 'allocate') return <Allocate step={step} onAnswer={onAnswer} />;
  return <Days step={step} onAnswer={onAnswer} onMove={onMove} />;
}

function Choose({ step, before, onAnswer }: { step: Extract<Step, { kind: 'choose' }>; before?: string; onAnswer: (a: StepAnswer) => void }) {
  const [asked, setAsked] = useState(false);
  const ref = useFocus<HTMLParagraphElement>(before ?? step.id);
  const told = useRef<HTMLParagraphElement>(null);
  // The answer to asking is read next, where it appears: before the options it may have added to.
  useEffect(() => {
    if (asked) told.current?.focus();
  }, [asked]);
  return (
    <div className="stack-lg">
      {before && (
        <p className="scene" ref={ref} tabIndex={-1}>
          {before}
        </p>
      )}
      <div className="stack">
        {asked && (
          <p className="condition reveal" ref={told} tabIndex={-1}>
            {step.ask!.answer}
          </p>
        )}
        <p className="question" ref={before ? undefined : ref} tabIndex={-1}>
          {step.prompt}
        </p>
        <div className="options">
          {offered(step, asked).map((o) => (
            <Pick key={o.id} title={o.text} line={o.detail} moves={o.moves} kind={o.id === step.ask?.adds?.id ? 'new' : undefined} onPick={() => onAnswer({ kind: 'choose', pick: o.id, asked })} />
          ))}
          {step.ask && !asked && <Pick title={step.ask.label} moves={step.ask.moves} kind="ask" onPick={() => setAsked(true)} />}
        </div>
      </div>
    </div>
  );
}

function Uncover({ step, onAnswer }: { step: Extract<Step, { kind: 'uncover' }>; onAnswer: (a: StepAnswer) => void }) {
  const [opened, setOpened] = useState<string[]>([]);
  const ref = useFocus<HTMLParagraphElement>(step.id);
  const left = step.budget - spent(step, opened);
  return (
    <div className="stack">
      <p className="question" ref={ref} tabIndex={-1}>
        {step.prompt}
      </p>
      <p className="small dim num" aria-live="polite">
        {left ? `${amount(left, step.unit)} left to find things out.` : 'That’s all the time there is.'}
      </p>
      <div className="options">
        {step.facts.map((f) =>
          opened.includes(f.id) ? (
            <div key={f.id} className="found reveal">
              <span className="found-label small dim">{f.label}</span>
              <span>{f.text}</span>
            </div>
          ) : (
            <Pick
              key={f.id}
              title={f.label}
              line={f.cost > left ? `Takes ${amount(f.cost, step.unit)}: not enough left` : `Takes ${amount(f.cost, step.unit)}`}
              disabled={f.cost > left}
              onPick={() => setOpened([...opened, f.id])}
            />
          ),
        )}
      </div>
      <div className="options decide">
        <Pick title={opened.length ? 'Decide' : 'Decide without finding out'} moves={movesAt(step.bands, spent(step, opened))} onPick={() => onAnswer({ kind: 'uncover', opened })} />
      </div>
    </div>
  );
}

function Allocate({ step, onAnswer }: { step: Extract<Step, { kind: 'allocate' }>; onAnswer: (a: StepAnswer) => void }) {
  const rest = step.items.at(-1)!;
  const [amounts, setAmounts] = useState<Record<string, number>>(() => Object.fromEntries(step.items.map((i) => [i.id, i === rest ? step.total : 0])));
  const ref = useFocus<HTMLParagraphElement>(step.id);
  const change = (id: string, by: number) => setAmounts((a) => (a[rest.id] - by < 0 || a[id] + by < 0 ? a : { ...a, [id]: a[id] + by, [rest.id]: a[rest.id] - by }));
  // The plot, drawn: each unit coloured by the item it went to.
  const cells = step.items.flatMap((i, k) => Array.from({ length: amounts[i.id] }, () => k));
  const moves = movesAt(step.bands, amounts[step.measure]);
  return (
    <div className="stack">
      <p className="question" ref={ref} tabIndex={-1}>
        {step.prompt}
      </p>
      <div className="plot" aria-hidden="true">
        {cells.map((k, n) => (
          <span key={n} className={`plot-cell${k === 0 ? ' first' : ''}`} />
        ))}
      </div>
      <p className="live small dim" aria-live="polite">
        {moves.length ? <MoveButtons ids={moves} /> : 'No move: holding off.'}
      </p>
      <div className="options">
        {step.items.map((i) => (
          <div key={i.id} className="option alloc">
            <span>
              <span className="option-title">{i.text}</span>
              {i.detail && <span className="option-line small dim">{i.detail}</span>}
            </span>
            {i === rest ? (
              <span className="alloc-n num">{amounts[i.id]}</span>
            ) : (
              <span className="stepper" role="group" aria-label={i.text}>
                <button className="step-btn" aria-label={`One ${step.unit[0]} fewer`} disabled={amounts[i.id] === 0} onClick={() => change(i.id, -1)}>
                  −
                </button>
                <span className="alloc-n num" aria-live="polite">
                  {amounts[i.id]}
                </span>
                <button className="step-btn" aria-label={`One ${step.unit[0]} more`} disabled={amounts[rest.id] === 0} onClick={() => change(i.id, 1)}>
                  +
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
      <button className="btn btn-block" onClick={() => onAnswer({ kind: 'allocate', amounts })}>
        Done
      </button>
    </div>
  );
}

function Days({ step, onAnswer, onMove }: { step: Extract<Step, { kind: 'days' }>; onAnswer: (a: StepAnswer) => void; onMove: () => void }) {
  const [day, setDay] = useState(0);
  const ref = useFocus<HTMLParagraphElement>(day);
  const last = day === step.days.length - 1;
  const today = movesAt(step.bands, day);
  return (
    <div className="stack-lg">
      <ol className="days" aria-label="Days">
        {step.days.map((d, i) => (
          <li key={d.label} className={i < day ? 'past' : i === day ? 'now' : undefined} aria-current={i === day ? 'step' : undefined}>
            {d.label.slice(0, 3)}
          </li>
        ))}
      </ol>
      <div className="card stack-tight reveal" key={day}>
        <p className="eyebrow" ref={ref} tabIndex={-1}>
          {step.days[day].label}
        </p>
        <p>{step.days[day].text}</p>
      </div>
      {/* Acting today completes a move made over the days: said as a consequence, not a label on the button. */}
      <p className="live small dim" aria-live="polite">
        If you {step.act.toLowerCase()}:&nbsp;{today.length ? <MoveButtons ids={today} /> : 'no move.'}
      </p>
      <div className="options">
        <Pick title={step.act} onPick={() => onAnswer({ kind: 'days', day })} />
        <Pick
          title={last ? step.last : step.wait}
          moves={last ? movesAt(step.bands, step.days.length) : []}
          onPick={() => {
            if (last) return onAnswer({ kind: 'days', day: step.days.length });
            setDay(day + 1);
            onMove();
          }}
        />
      </div>
    </div>
  );
}
