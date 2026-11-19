import { useEffect, useRef, useState } from 'react';
import { ROUNDS } from './content';
import { connections, editIdea, ideaOf, keep, recordPlay, relationWord, type Connection } from './domain/engine';
import { IDEA_KINDS, STATUSES, type Answer, type Round, type Step, type TellState } from './domain/types';
import { StepControl } from './steps';
import { store } from './store/store';
import { CheckIcon, Inline, Rich } from './ui';

// A round: its steps one after another, each with its reveal, then the idea it
// leaves, how that idea connects with others, and where its facts come from.
// Progress is held for the session, so leaving part-way and coming back
// (another tab, a card in the Book) loses nothing; a finished round is
// recorded once, as its ending appears.

interface Progress {
  answers: Record<string, Answer>;
  /** Steps continued past; the ending shows when it reaches the number of steps. */
  at: number;
}
const memory = new Map<string, Progress>();
const fresh = (): Progress => ({ answers: {}, at: 0 });

/** Forget a round's progress, so it starts again from the top. */
export const restart = (id: string) => memory.delete(id);

/** Respect reduced motion when bringing new content into view. */
const smooth = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

export function RoundView({ round, state, onNext, nextLabel, onSkip }: { round: Round; state: TellState; onNext?: () => void; nextLabel?: string; onSkip?: () => void }) {
  const [p, setP] = useState<Progress>(() => memory.get(round.id) ?? fresh());
  const update = (next: Progress) => {
    memory.set(round.id, next);
    setP(next);
  };
  const ended = p.at >= round.steps.length;
  const latest = useRef<HTMLDivElement>(null);
  const lastAt = useRef(p.at);

  // A new step or the ending: bring it into view and put focus on its heading.
  useEffect(() => {
    if (p.at === lastAt.current) return;
    lastAt.current = p.at;
    const el = latest.current;
    if (el) {
      el.scrollIntoView({ behavior: smooth(), block: 'start' });
      el.querySelector<HTMLElement>('[tabindex="-1"]')?.focus({ preventScroll: true });
    }
  }, [p.at]);

  function answer(step: Step, a: Answer) {
    update({ ...p, answers: { ...p.answers, [step.id]: a } });
  }

  function onContinue() {
    const at = p.at + 1;
    if (at === round.steps.length) store.update((s) => recordPlay(s, round, p.answers, new Date()));
    update({ ...p, at });
  }

  const linksToBook = connections(state, ROUNDS, round.id).some((c) => c.kept);
  return (
    <article className="round stack-lg" aria-labelledby={`${round.id}-title`}>
      <header className="round-head stack-tight">
        <div className="round-meta">
          <p className="eyebrow">
            {round.topic} · {round.form}
          </p>
          {onSkip && p.at === 0 && !Object.keys(p.answers).length && (
            <button className="link small skip" onClick={onSkip}>
              Skip
            </button>
          )}
        </div>
        <h1 className="title" id={`${round.id}-title`} tabIndex={-1}>
          {round.title}
        </h1>
        {linksToBook && !ended && (
          <p className="hint small">
            <span className="hint-dot" aria-hidden="true" />
            Connects with an idea in your Book
          </p>
        )}
      </header>
      {round.steps.slice(0, Math.min(p.at + 1, round.steps.length)).map((step, i) => (
        <div key={step.id} ref={i === p.at ? latest : undefined}>
          <StepBlock step={step} answer={p.answers[step.id]} onAnswer={(a) => answer(step, a)} current={i === p.at} last={i === round.steps.length - 1} onContinue={onContinue} />
        </div>
      ))}
      {ended && (
        <div ref={latest}>
          <Ending round={round} state={state} onNext={onNext} nextLabel={nextLabel} />
        </div>
      )}
    </article>
  );
}

function StepBlock({ step, answer, onAnswer, current, last, onContinue }: { step: Step; answer?: Answer; onAnswer: (a: Answer) => void; current: boolean; last: boolean; onContinue: () => void }) {
  const reveal = useRef<HTMLDivElement>(null);
  const answered = answer !== undefined;
  // The reveal takes focus from the option just tapped, which is now disabled.
  useEffect(() => {
    if (answered && current) {
      reveal.current?.scrollIntoView({ behavior: smooth(), block: 'nearest' });
      reveal.current?.focus({ preventScroll: true });
    }
  }, [answered, current]);
  const reply = step.kind === 'choose' && answered ? step.options.find((o) => o.id === answer)?.reply : undefined;
  return (
    <section className="step stack" aria-label={step.prompt.replace(/\*/g, '')}>
      {step.setup && (
        <div className="setup stack-tight">
          <Rich text={step.setup} />
        </div>
      )}
      <h2 className="prompt" tabIndex={-1}>
        <Inline text={step.prompt} />
      </h2>
      <StepControl step={step} answer={answer} onAnswer={onAnswer} />
      {answered && (
        <div className="reveal stack rise" ref={reveal} tabIndex={-1}>
          {reply && (
            <p className="reply">
              <Inline text={reply} />
            </p>
          )}
          <div className="stack-tight">
            <Rich text={step.reveal} />
          </div>
          {step.views && (
            <ul className="views">
              {step.views.map((v) => (
                <li key={v.who} className="view">
                  <p className="view-who">{v.who}</p>
                  <p className="view-text">
                    <Inline text={v.view} />
                  </p>
                </li>
              ))}
            </ul>
          )}
          {current && (
            <button className="btn btn-primary btn-block" onClick={onContinue}>
              {last ? 'Finish' : 'Continue'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Ending({ round, state, onNext, nextLabel }: { round: Round; state: TellState; onNext?: () => void; nextLabel?: string }) {
  const conns = connections(state, ROUNDS, round.id);
  return (
    <section className="ending stack-lg" aria-labelledby={`${round.id}-idea`}>
      <TakeawayCard round={round} state={state} headingId={`${round.id}-idea`} />
      {conns.length > 0 && <Connections conns={conns} title="How it connects" />}
      <Sources round={round} />
      {onNext && (
        <button className="btn btn-primary btn-block" onClick={onNext}>
          {nextLabel ?? 'Next round'}
        </button>
      )}
    </section>
  );
}

/** The idea a round leaves: kept in one tap, or edited first, or left. */
function TakeawayCard({ round, state, headingId }: { round: Round; state: TellState; headingId: string }) {
  const kept = ideaOf(state, round.id);
  const t = round.takeaway;
  const [editing, setEditing] = useState(false);
  return (
    <div className={`takeaway stack${kept ? ' kept' : ''}`}>
      <h2 className="eyebrow" id={headingId} tabIndex={-1}>
        {IDEA_KINDS[t.kind]}
      </h2>
      {editing ? (
        <IdeaEditor
          initial={kept?.text ?? t.text}
          saveLabel={kept ? 'Save' : 'Keep in my Book'}
          onSave={(text) => {
            store.update((s) => (ideaOf(s, round.id) ? editIdea(s, round.id, text, new Date()) : keep(s, round, new Date(), text)));
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <blockquote className="idea-text">
          <p>{kept?.text ?? t.text}</p>
          {t.by && <footer className="idea-by">{t.by}</footer>}
        </blockquote>
      )}
      {!editing &&
        (kept ? (
          <div className="takeaway-actions">
            <p className="kept-note">
              <CheckIcon aria-hidden="true" />
              In your Book
            </p>
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>
              Edit wording
            </button>
          </div>
        ) : (
          <div className="takeaway-actions">
            <button className="btn btn-primary" onClick={() => store.update((s) => keep(s, round, new Date()))}>
              Keep in my Book
            </button>
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>
              Edit first
            </button>
          </div>
        ))}
    </div>
  );
}

export function IdeaEditor({ initial, saveLabel, onSave, onCancel }: { initial: string; saveLabel: string; onSave: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="stack-tight">
      <label className="sr-only" htmlFor="idea-edit">
        Wording of the idea
      </label>
      <textarea id="idea-edit" ref={ref} className="field idea-field" value={text} rows={4} maxLength={600} onChange={(e) => setText(e.target.value)} />
      <div className="takeaway-actions">
        <button className="btn btn-primary" disabled={!text.trim()} onClick={() => onSave(text)}>
          {saveLabel}
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Links between this idea and others. Unplayed rounds are named, never described, so nothing is spoilt. */
export function Connections({ conns, title }: { conns: Connection[]; title: string }) {
  return (
    <section className="stack" aria-label={title}>
      <h2 className="section-title">{title}</h2>
      <ul className="conns">
        {conns.map((c) => (
          <li key={c.other.id} className={`conn${c.kept || c.played ? '' : ' unplayed'}`}>
            <p className="conn-head">
              <span className="rel">{relationWord(c)}</span> <span className="conn-title">{c.other.title}</span>
              {c.kept && <span className="in-book">In my Book</span>}
            </p>
            {c.kept || c.played ? (
              <>
                <blockquote className="conn-idea">{c.kept?.text ?? c.other.takeaway.text}</blockquote>
                <p className="conn-note small">
                  <Inline text={c.note} />
                </p>
                <span className="conn-actions">
                  {c.kept ? (
                    <a className="link small" href={`#/idea/${c.other.id}`}>
                      Open in my Book
                    </a>
                  ) : (
                    <button className="link small" onClick={() => store.update((s) => keep(s, c.other, new Date()))}>
                      Keep this one too
                    </button>
                  )}
                </span>
              </>
            ) : (
              <p className="small dim">
                A round not played yet.{' '}
                <a className="link" href={`#/round/${c.other.id}`}>
                  Play it
                </a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Sources({ round }: { round: Round }) {
  return (
    <details className="disclosure sources">
      <summary>Sources, and how sure they are</summary>
      <div className="stack">
        <ul className="claims">
          {round.claims.map((c, i) => (
            <li key={i} className="claim stack-tight">
              <span className={`status status-${c.status}`}>{STATUSES[c.status]}</span>
              <p className="small">
                <Inline text={c.text} />
              </p>
              <ul className="source-links">
                {c.sources.map((s) => (
                  <li key={s.url}>
                    <a className="link small" href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {round.note && (
          <p className="small dim">
            <Inline text={round.note} />
          </p>
        )}
        <p className="tiny faint">Checked against these sources on {round.checked}.</p>
      </div>
    </details>
  );
}
