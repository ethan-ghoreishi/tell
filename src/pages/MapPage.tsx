import { useRef, useState, type ChangeEvent } from 'react';
import { CARDS, KINDS, kind as kindOf } from '../domain/content';
import {
  CHANGE_GAP,
  POOL_MIN,
  REPEAT_MIN,
  WENT,
  addNote,
  addPool,
  addPrinciple,
  chart,
  charted,
  guessRecord,
  latestNote,
  lessonText,
  lessonsFile,
  localDay,
  movesRecord,
  myLessons,
  noticed,
  patterns,
  protectedRecord,
  ratingRecord,
  removePrinciple,
  runResult,
  slideShort,
  tradeoffName,
  type Pattern,
} from '../domain/engine';
import { CONTEXTS, VERDICTS, factorName, type Kind, type Lesson, type Run, type SlideRun, type TellState, type Verdict } from '../domain/types';
import { readLessons } from '../domain/validate';
import { Section } from '../mechanics';
import { store } from '../store/store';
import { download, plural, shortDate } from '../ui';

// Everything here is derived from the run and call snapshots, and every count
// shows its denominator. Factors keep a fixed order, so the map never ranks you.

export default function MapPage({ state }: { state: TellState }) {
  const { runs, currency: c } = state;
  if (runs.length === 0 && state.calls.length === 0 && state.pool.length === 0) {
    return (
      <div className="stack-lg">
        <h1 className="title">Your map</h1>
        <p className="lede">Your map starts with your first experiment. Every result is kept here, with the choices behind it.</p>
        <a className="btn btn-primary btn-block" href="#/">
          Play today’s set
        </a>
      </div>
    );
  }
  const done = charted(runs, CARDS);
  const found = patterns(runs, c);
  const sets = new Set(runs.map((r) => r.session)).size;

  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">Your map</h1>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${(100 * done.done) / done.total}%` }} />
        </div>
        <p className="totals">
          <span className="num">
            {done.done} of {done.total} experiments charted
          </span>
          <span className="num">{plural(sets, 'set')}</span>
          <span className="num">{plural(state.calls.length, 'call')}</span>
        </p>
      </header>

      {found.length > 0 && (
        <Section title="Patterns" id="patterns">
          <p className="small dim">
            A repeat shows once it happened at least {REPEAT_MIN} times and in at least three of every four chances. A change shows when the same
            Slide, with and without one condition, landed at least {CHANGE_GAP} steps apart.
          </p>
          {found.map((p) => (
            <PatternCard key={p.id} state={state} p={p} />
          ))}
        </Section>
      )}

      <TradeOffs state={state} />
      <Protected runs={runs} />
      <Moves runs={runs} />
      <SaidChose state={state} />
      <Calls state={state} />
      <Lessons state={state} />
      <Principles state={state} />
      <Footer state={state} />
    </div>
  );
}

function RunList({ runs, currency }: { runs: Run[]; currency: TellState['currency'] }) {
  return (
    <ul className="results">
      {runs.map((r) => (
        <li key={r.id} className="stack-tight">
          <span className="faint tiny num">
            {shortDate(r.day)} · {r.title}
            {r.mechanic === 'slide' && r.condition ? ` · with ${r.condition.label}` : ''}
          </span>
          <span>{runResult(r, currency).headline}</span>
        </li>
      ))}
    </ul>
  );
}

function PatternCard({ state, p }: { state: TellState; p: Pattern }) {
  const note = latestNote(state, p.id);
  const give = (v: Verdict) => store.update((s) => addNote(s, p.id, v, p.counts, new Date()));
  return (
    <article className="card stack">
      {!p.holds && <p className="eyebrow">No longer holds</p>}
      <p>{p.text}</p>
      <p className="small dim">
        {p.kind === 'change'
          ? 'Could also be: the day, or how the situation read the second time.'
          : p.holds
            ? 'Could also be: the options on offer made it the easy pick.'
            : `It first showed at ${p.first.counts} on ${shortDate(p.first.day)}. It stays here, marked, rather than slipping away.`}
      </p>
      <div className="stack-tight">
        <p className="small" id={`v-${p.id}`}>
          {p.kind === 'change' ? 'Does that difference seem right to you?' : 'Your view'}
        </p>
        <div className="chips" role="group" aria-labelledby={`v-${p.id}`}>
          {(Object.keys(VERDICTS) as Verdict[]).map((v) => (
            <button key={v} className={`chip${note?.verdict === v ? ' on' : ''}`} aria-pressed={note?.verdict === v} onClick={() => give(v)}>
              {VERDICTS[v]}
            </button>
          ))}
        </div>
        {note && (
          <p className="tiny faint">
            Noted {shortDate(note.at)}
            {note.counts ? `, at ${note.counts}` : ''}. A note, not evidence: it never changes what is shown.
          </p>
        )}
      </div>
      <details>
        <summary className="link small">See the {plural(p.runs.length, 'experiment')}</summary>
        <RunList runs={p.runs} currency={state.currency} />
      </details>
    </article>
  );
}

function TradeOffs({ state }: { state: TellState }) {
  const c = state.currency;
  return (
    <Section title="Your numbers" id="numbers">
      <p className="small dim">Each trade-off, priced by Slides in three settings, with and without one condition. A range, never a single number.</p>
      {chart(state.runs, CARDS).map((row) => (
        <div key={row.tradeoff.join()} className="trade stack-tight">
          <h3 className="sub-title">{tradeoffName(row.tradeoff)}</h3>
          <ul className="cells">
            {row.cells
              .filter((cell) => cell.runs.length > 0)
              .map((cell) => (
                <li key={cell.card} className="cell">
                  <details>
                    <summary className="cell-head">
                      <span>
                        {CONTEXTS[cell.context]} <span className="faint tiny">· {cell.title}</span>
                      </span>
                      <span className="small num">{cell.base ? slideShort(cell.base, c) : '—'}</span>
                    </summary>
                    {cell.cond && (
                      <p className="small dim">
                        With {cell.label}: {slideShort(cell.cond, c)}
                      </p>
                    )}
                    <RunList runs={cell.runs} currency={c} />
                  </details>
                </li>
              ))}
            {row.cells.some((cell) => cell.runs.length === 0) && (
              <li className="cell cell-head small faint">
                Not tested yet:{' '}
                {row.cells
                  .filter((cell) => cell.runs.length === 0)
                  .map((cell) => CONTEXTS[cell.context])
                  .join(', ')}
              </li>
            )}
          </ul>
        </div>
      ))}
    </Section>
  );
}

function Protected({ runs }: { runs: Run[] }) {
  const rows = protectedRecord(runs);
  return (
    <Section title="What you protect" id="protect">
      {rows.length === 0 ? (
        <p className="empty">After your first Cut, each factor shows how often it made your final two and how often it went first.</p>
      ) : (
        <ul className="evidence">
          {rows.map((r) => (
            <li key={r.factor}>
              <span>{factorName(r.factor)}</span>
              <span className="small num">
                final two {r.kept} of {r.offered} · first to go {r.first} of {r.offered}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Moves({ runs }: { runs: Run[] }) {
  const rows = movesRecord(runs);
  return (
    <Section title="What moves your lean" id="moves">
      {rows.length === 0 ? (
        <p className="empty">After your first Peek, each kind of fact shows how often opening it moved your lean.</p>
      ) : (
        <ul className="evidence">
          {rows.map((r) => (
            <li key={r.factor}>
              <span>{factorName(r.factor)}</span>
              <span className="small num">
                moved you {r.moved} of {plural(r.opened, 'time')} opened{r.would ? ` · unopened, would have changed it ${r.would}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function SaidChose({ state }: { state: TellState }) {
  const spends = state.runs.filter((r) => r.mechanic === 'spend');
  return (
    <Section title="Said and chose" id="said">
      {spends.length === 0 ? (
        <p className="empty">After your first Spend, your coins sit beside what you chose when they clashed.</p>
      ) : (
        spends.map((r) => {
          const res = runResult(r, state.currency);
          return (
            <details key={r.id} className="card-quiet">
              <summary className="stack-tight">
                <span className="faint tiny">
                  {shortDate(r.day)} · {r.title}
                </span>
                <span>{res.headline}</span>
              </summary>
              <ul className="stack small">
                {res.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </details>
          );
        })
      )}
    </Section>
  );
}

function Calls({ state }: { state: TellState }) {
  const today = localDay(new Date());
  return (
    <Section title="Your calls" id="calls">
      {state.calls.length === 0 ? (
        <p className="empty">
          Real choices you bring to Tell. <a className="link" href="#/decide">Decide something</a>
        </p>
      ) : (
        <ul className="evidence">
          {[...state.calls].reverse().map((call) => (
            <li key={call.id}>
              <a className="link" href={`#/call/${call.id}`}>
                {call.title}
              </a>
              <span className="small dim num">
                {call.follow ? WENT[call.follow.went] : call.due <= today ? 'Due back' : `Due back ${shortDate(call.due)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function KindLessons({ state, k }: { state: TellState; k: Kind }) {
  const n = noticed(state, k.id);
  if (n.mine.calls === 0 && n.shared.calls === 0) return null;
  const check = (id: string) => k.checks.find((x) => x.id === id)?.text ?? id;
  const feature = (id: string) => k.features.find((x) => x.id === id)?.text ?? id;
  return (
    <div className="card-quiet stack">
      <h3 className="sub-title">{k.name}</h3>
      {n.mine.calls > 0 && (
        <div className="stack-tight small">
          <p className="faint tiny">From {plural(n.mine.calls, 'call')} of yours</p>
          {n.mine.missed.map((m) => (
            <p key={m.id}>
              Hadn’t considered: {check(m.id)} ({m.count} of {n.mine.calls})
            </p>
          ))}
          {n.mine.more.map((m) => (
            <p key={m.id}>
              Mattered more than expected: {feature(m.id)} ({m.count} of {n.mine.calls})
            </p>
          ))}
          {n.mine.typed.length > 0 && <p className="dim">Not on Tell’s list yet, in your words: {n.mine.typed.join('; ')}</p>}
        </div>
      )}
      {n.shared.calls > 0 && (
        <div className="stack-tight small">
          <p className="faint tiny">From {plural(n.shared.calls, 'shared call')}</p>
          {n.shared.missed.map((m) => (
            <p key={m.id}>
              Noticed only afterwards: {check(m.id)} ({m.count} of {n.shared.calls})
            </p>
          ))}
          {n.shared.more.map((m) => (
            <p key={m.id}>
              Mattered more than expected: {feature(m.id)} ({m.count} of {n.shared.calls})
            </p>
          ))}
          {n.shared.below > 0 && (
            <p className="dim">
              {plural(n.shared.below, 'item')} reported by fewer than {POOL_MIN} shared calls, not shown yet.
            </p>
          )}
          {n.shared.other > 0 && <p className="dim">{plural(n.shared.other, 'thing')} people missed that isn’t on Tell’s list.</p>}
        </div>
      )}
    </div>
  );
}

function Lessons({ state }: { state: TellState }) {
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const mine = myLessons(state);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const read = readLessons(await file.text());
    if (!read.ok) return setMessage(read.error);
    if (!window.confirm(`Add ${plural(read.lessons.length, 'shared lesson')}?`)) return;
    let result: ReturnType<typeof addPool> = { ok: false, error: '' };
    store.update((s) => {
      result = addPool(s, read.lessons, new Date());
      return result.ok ? result.state : s;
    });
    const r = result as ReturnType<typeof addPool>;
    setMessage(r.ok ? `Added ${plural(r.added, 'new lesson')}${r.skipped ? `; ${r.skipped} ${r.skipped === 1 ? 'was' : 'were'} already here` : ''}.` : r.error);
  }

  return (
    <Section title="Noticed afterwards" id="lessons">
      <p className="small dim">
        What closed calls taught, by kind of call. Shared lessons hold only Tell’s fixed list: no titles, options, notes or dates. A shared item
        shows once {POOL_MIN} shared calls report it.
      </p>
      {KINDS.map((k) => (
        <KindLessons key={k.id} state={state} k={k} />
      ))}
      {state.pool.length > 0 && <p className="small dim num">{plural(state.pool.length, 'shared file')} added.</p>}
      {preview ? (
        <div className="card stack">
          <p className="small">This is everything the file holds:</p>
          <ul className="stack small">
            {mine.map((l: Lesson, i) => (
              <li key={i}>{lessonText(l, kindOf(l.kind))}</li>
            ))}
          </ul>
          <button className="btn btn-primary btn-block" onClick={() => download(`tell-lessons-${localDay(new Date())}.json`, lessonsFile(state))}>
            Download the lessons file
          </button>
          <button className="btn btn-ghost btn-sm btn-block" onClick={() => setPreview(false)}>
            Close
          </button>
        </div>
      ) : (
        <button className="btn btn-block" disabled={mine.length === 0} onClick={() => setPreview(true)}>
          {mine.length ? `Share your lessons (${plural(mine.length, 'call')})` : 'Share your lessons (after your first closed call)'}
        </button>
      )}
      <button className="btn btn-block" onClick={() => input.current?.click()}>
        Add lessons someone shared
      </button>
      <input ref={input} type="file" accept="application/json,.json" hidden aria-label="Lessons file" onChange={onFile} />
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </Section>
  );
}

function Principles({ state }: { state: TellState }) {
  const [text, setText] = useState('');
  return (
    <Section title="Principles you keep" id="principles">
      {state.principles.length === 0 && <p className="empty">Only ones you write. Tell never infers one.</p>}
      <ul className="stack">
        {[...state.principles].reverse().map((p) => (
          <li key={p.id} className="card kept-line stack">
            <blockquote>{p.text}</blockquote>
            <div className="round-head">
              <p className="tiny faint">
                {shortDate(p.at)}
                {p.call ? ` · from “${state.calls.find((c) => c.id === p.call)?.title ?? 'a call'}”` : ''}
              </p>
              <button className="btn btn-ghost btn-sm" onClick={() => store.update((s) => removePrinciple(s, p.id))}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="row">
        <input className="input" value={text} placeholder="When I…, I…" aria-label="A principle" onChange={(e) => setText(e.target.value)} />
        <button
          className="btn"
          disabled={!text.trim()}
          onClick={() => {
            store.update((s) => addPrinciple(s, text, new Date()));
            setText('');
          }}
        >
          Keep
        </button>
      </div>
    </Section>
  );
}

function Footer({ state }: { state: TellState }) {
  const g = guessRecord(state.runs);
  const r = ratingRecord(state);
  const depends = state.runs.filter((x): x is SlideRun => x.mechanic === 'slide' && x.outcome.kind === 'depends').length;
  return (
    <footer className="stack-tight small dim num">
      {g.of > 0 && <p>Your guess landed on your result in {g.matched} of {plural(g.of, 'Slide')}.</p>}
      {depends > 0 && <p>You answered “It depends” {plural(depends, 'time')}.</p>}
      {r.of > 0 && <p>Sets you rated useful or interesting: {r.good} of {r.of}.</p>}
    </footer>
  );
}
