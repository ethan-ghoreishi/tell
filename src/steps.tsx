import { useState } from 'react';
import { amount, scrambled } from './domain/engine';
import type { Answer, Step } from './domain/types';
import { CheckIcon, CrossIcon, Inline, plain } from './ui';

// The four ways a step is played: pick one, set a number, put things in
// order, make a quick series of calls. Each shows the control until it's
// answered, then the answer as given beside the right one, where there is one.

type Props<K extends Step['kind']> = { step: Extract<Step, { kind: K }>; answer?: Answer; onAnswer: (a: Answer) => void };

export function StepControl({ step, answer, onAnswer }: { step: Step; answer?: Answer; onAnswer: (a: Answer) => void }) {
  if (step.kind === 'choose') return <Choose step={step} answer={answer} onAnswer={onAnswer} />;
  if (step.kind === 'estimate') return <Estimate step={step} answer={answer} onAnswer={onAnswer} />;
  if (step.kind === 'order') return <Order step={step} answer={answer} onAnswer={onAnswer} />;
  return <Quickfire step={step} answer={answer} onAnswer={onAnswer} />;
}

/** ✓ or ✗ with words for assistive tech; nothing when a question has no right answer. */
const Mark = ({ right }: { right: boolean }) =>
  right ? <CheckIcon className="mark mark-right" role="img" aria-hidden={false} aria-label="Right" /> : <CrossIcon className="mark mark-wrong" role="img" aria-hidden={false} aria-label="Not this one" />;

function Choose({ step, answer, onAnswer }: Props<'choose'>) {
  const done = answer !== undefined;
  return (
    <div className="options" role="group" aria-label={plain(step.prompt)}>
      {step.options.map((o) => {
        const picked = answer === o.id;
        const right = !!step.answer && o.id === step.answer;
        const cls = ['option', picked && 'picked', done && right && 'right', done && picked && step.answer && !right && 'wrong'].filter(Boolean).join(' ');
        return (
          <button key={o.id} className={cls} disabled={done} aria-pressed={done ? picked : undefined} onClick={() => onAnswer(o.id)}>
            <span className="option-text">
              <Inline text={o.text} />
            </span>
            {done && step.answer && (picked || right) && <Mark right={right} />}
            {done && picked && !step.answer && <span className="option-tag">Your answer</span>}
          </button>
        );
      })}
    </div>
  );
}

function Estimate({ step, answer, onAnswer }: Props<'estimate'>) {
  // No value until the player moves the slider: a starting value would be a hint.
  const [value, setValue] = useState<number | null>(null);
  const fmt = (n: number) => amount(n, step.unit);
  if (typeof answer === 'number') {
    const at = (n: number) => `${((n - step.min) / (step.max - step.min)) * 100}%`;
    return (
      <div className="estimate done">
        <div className="scale" aria-hidden="true">
          <span className="scale-mark guess" style={{ left: at(answer) }} />
          <span className="scale-mark truth" style={{ left: at(step.answer) }} />
        </div>
        <dl className="estimate-result">
          <div>
            <dt>Your guess</dt>
            <dd className="num">{fmt(answer)}</dd>
          </div>
          <div>
            <dt>The answer</dt>
            <dd className="num">{fmt(step.answer)}</dd>
          </div>
        </dl>
      </div>
    );
  }
  const v = value ?? step.min;
  const nudge = (d: number) => setValue(Math.min(step.max, Math.max(step.min, v + d)));
  return (
    <div className="estimate">
      <output className={`readout num${value === null ? ' unset' : ''}`} htmlFor={`${step.id}-range`} aria-live="polite">
        {value === null ? 'Slide to guess' : fmt(value)}
      </output>
      <div className="estimate-row">
        <button className="btn btn-icon" aria-label="Less" onClick={() => nudge(-step.step)} disabled={value === null || v <= step.min}>
          −
        </button>
        <input
          id={`${step.id}-range`}
          className="range"
          type="range"
          min={step.min}
          max={step.max}
          step={step.step}
          value={v}
          aria-label={plain(step.prompt)}
          aria-valuetext={value === null ? 'No guess yet' : fmt(v)}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <button className="btn btn-icon" aria-label="More" onClick={() => nudge(step.step)} disabled={v >= step.max}>
          +
        </button>
      </div>
      <button className="btn btn-primary btn-block" disabled={value === null} onClick={() => value !== null && onAnswer(value)}>
        {value === null ? 'Lock in' : `Lock in ${fmt(value)}`}
      </button>
    </div>
  );
}

function Order({ step, answer, onAnswer }: Props<'order'>) {
  const [placed, setPlaced] = useState<string[]>([]);
  const byId = (id: string) => step.items.find((i) => i.id === id)!;
  if (Array.isArray(answer)) {
    const mine = answer as string[];
    return (
      <ol className="order-result">
        {step.items.map((item, i) => {
          const right = mine[i] === item.id;
          return (
            <li key={item.id} className={right ? 'right' : undefined}>
              <span className="order-n num">{i + 1}</span>
              <span className="order-body">
                <span className="order-text">
                  <Inline text={item.text} />
                </span>
                <span className="order-detail">
                  <Inline text={item.detail} />
                  {!right && <> · you put it {ordinal(mine.indexOf(item.id) + 1)}</>}
                </span>
              </span>
              <Mark right={right} />
            </li>
          );
        })}
      </ol>
    );
  }
  const pool = scrambled(step.items).filter((i) => !placed.includes(i.id));
  return (
    <div className="order">
      <ol className="slots" aria-label={`Your order, ${step.first.toLowerCase()} first`}>
        {step.items.map((_, i) => {
          const id = placed[i];
          return (
            <li key={i} className={id ? 'slot filled' : 'slot'}>
              <span className="order-n num">{i + 1}</span>
              {id ? (
                <button className="slot-item" aria-label={`${plain(byId(id).text)}, placed ${i + 1}. Tap to take it out.`} onClick={() => setPlaced((p) => p.filter((x) => x !== id))}>
                  <Inline text={byId(id).text} />
                </button>
              ) : (
                <span className="slot-empty">{i === placed.length ? 'Tap an item below' : ''}</span>
              )}
              {!id && (i === 0 || i === step.items.length - 1) && <span className="slot-end">{i === 0 ? step.first : step.last}</span>}
            </li>
          );
        })}
      </ol>
      {pool.length > 0 ? (
        <div className="pool" role="group" aria-label="Items to place">
          {pool.map((i) => (
            <button key={i.id} className="option" onClick={() => setPlaced((p) => [...p, i.id])}>
              <span className="option-text">
                <Inline text={i.text} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <button className="btn btn-primary btn-block" onClick={() => onAnswer(placed)}>
          Check the order
        </button>
      )}
    </div>
  );
}

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

function Quickfire({ step, answer, onAnswer }: Props<'quickfire'>) {
  const [calls, setCalls] = useState<number[]>([]);
  const given = Array.isArray(answer) ? (answer as number[]) : calls;
  const call = (n: number) => {
    const next = [...calls, n];
    setCalls(next);
    if (next.length === step.items.length) onAnswer(next);
  };
  return (
    <ol className="calls">
      {step.items.slice(0, given.length + 1).map((item, i) => {
        const mine = given[i];
        return (
          <li key={item.id} className="call rise">
            <p className="call-text">
              <Inline text={item.text} />
            </p>
            {mine === undefined ? (
              <div className="call-buttons" role="group" aria-label={plain(item.text)}>
                {step.labels.map((label, n) => (
                  <button key={label} className="btn" onClick={() => call(n)}>
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <p className="call-verdict">
                  {item.answer === undefined ? (
                    <>Your call: {step.labels[mine]}</>
                  ) : mine === item.answer ? (
                    <>
                      <Mark right /> {step.labels[mine]}
                    </>
                  ) : (
                    <>
                      <Mark right={false} /> {step.labels[item.answer]}
                      <span className="call-answer">(your call: {step.labels[mine]})</span>
                    </>
                  )}
                </p>
                <p className="call-note small">
                  <Inline text={item.note} />
                </p>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
