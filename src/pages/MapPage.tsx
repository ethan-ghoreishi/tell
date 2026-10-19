import { useState } from 'react';
import { COMPARED, OUTCOME_STATES, isCurrent, keep, playView, restore, retire, revise, sourceLabel, wording } from '../domain/engine';
import { NEXT, earlierName, type Choice, type Takeaway, type TellState } from '../domain/types';
import { Section } from '../mechanics';
import { store } from '../store/store';
import { download, plural, randomId, shortDate } from '../ui';

// What the player chose to keep and the choices still open come first; the
// full record sits underneath. Four kinds of record are labelled apart: Play
// (invented stories), real choices, kept takeaways and reported outcomes.

const KIND: Record<Takeaway['source']['kind'], string> = {
  play: 'From an invented story',
  choice: 'From a real choice',
  outcome: 'From what happened',
  own: 'Written by you',
  earlier: 'From an earlier version of Tell',
};

export default function MapPage({ state }: { state: TellState }) {
  const current = state.choices.filter(isCurrent);
  const settled = state.choices.filter((c) => !isCurrent(c));
  const active = state.takeaways.filter((t) => !t.retired);
  const retired = state.takeaways.filter((t) => t.retired);
  const empty = !state.plays.length && !state.choices.length && !state.takeaways.length && !state.archive.length;

  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">Your map</h1>
        <p className="lede">
          {empty
            ? 'Nothing yet. Play a story or bring a choice: what you answer is kept here, with where it came from.'
            : 'Your open choices and what you chose to keep. Everything you answered is underneath.'}
        </p>
      </header>

      <Section title="Current choices" id="current">
        {current.length === 0 ? (
          <p className="empty">
            None open. <a className="link" href="#/choose">Bring a choice</a>
          </p>
        ) : (
          <ul className="cells">
            {current.map((c) => (
              <li key={c.id} className="cell">
                <a className="cell-head shelf" href={`#/choice/${c.id}`}>
                  <span>{(c.saves.at(-1)?.content.title ?? c.title) || 'Untitled choice'}</span>
                  <span className="small dim">{status(c)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Worth keeping" id="kept">
        {active.length === 0 && <p className="empty">Only what you choose to keep, from a story, a choice or what happened. Tell never infers one.</p>}
        {active.map((t) => (
          <Kept key={t.id} state={state} t={t} />
        ))}
        <OwnTakeaway />
      </Section>

      {!empty && (
        <Section title="History" id="history">
          <Plays state={state} />
          {settled.length > 0 && (
            <details className="card-quiet">
              <summary className="link small">Settled choices ({settled.length})</summary>
              <ul className="results">
                {settled.map((c) => (
                  <li key={c.id}>
                    <a className="link" href={`#/choice/${c.id}`}>
                      {c.saves.at(-1)!.content.title}
                    </a>{' '}
                    <span className="small dim">{status(c)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {retired.length > 0 && (
            <details className="card-quiet">
              <summary className="link small">Retired takeaways ({retired.length})</summary>
              <ul className="stack">
                {retired.map((t) => (
                  <li key={t.id} className="stack-tight">
                    <span className="faint tiny">
                      Retired {shortDate(t.retired)} · {sourceLabel(state, t.source)}
                    </span>
                    <span>{wording(t)}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => store.update((s) => restore(s, t.id))}>
                      Bring it back
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {state.archive.map((a) => (
            <details key={`${a.schema}-${a.at}`} className="card-quiet">
              <summary className="link small">Your record from {earlierName(a.schema)}</summary>
              <p className="small dim">
                Carried over on {shortDate(a.at)} and kept exactly as it was
                {Object.entries(a.doc)
                  .filter(([, v]) => Array.isArray(v) && v.length)
                  .map(([k, v]) => `, ${plural((v as unknown[]).length, k.replace(/s$/, ''))}`)
                  .join('')}
                . This version doesn’t read its answers: it asked different questions.
              </p>
              <button className="btn btn-block" onClick={() => download(`tell-${a.schema}-record.json`, JSON.stringify(a.doc, null, 2))}>
                Download it
              </button>
            </details>
          ))}
        </Section>
      )}
    </div>
  );
}

function status(c: Choice): string {
  if (c.draft) return c.saves.length ? 'Revising' : 'Draft';
  const o = c.outcomes.at(-1);
  if (o) return `${OUTCOME_STATES[o.state]}${o.compared ? `, ${COMPARED[o.compared].toLowerCase()}` : ''} · ${shortDate(o.at)}`;
  const s = c.saves.at(-1)!;
  return s.content.next ? `${NEXT[s.content.next.kind]} · ${shortDate(s.at)}` : `Saved ${shortDate(s.at)}`;
}

function Kept({ state, t }: { state: TellState; t: Takeaway }) {
  const [editing, setEditing] = useState<string | null>(null);
  const applied = state.choices.filter((c) => c.saves.at(-1)?.content.matches.some((m) => m.ref.kind === 'takeaway' && m.ref.id === t.id && m.answer === 'applies'));
  return (
    <article className="card stack">
      <p className="eyebrow">{KIND[t.source.kind]}</p>
      {editing === null ? (
        <blockquote className="kept-line">{wording(t)}</blockquote>
      ) : (
        <label className="field">
          <span className="small">New wording (the earlier one stays in its history)</span>
          <textarea className="input textarea" rows={2} value={editing} onChange={(e) => setEditing(e.target.value)} />
        </label>
      )}
      <p className="tiny faint">
        {sourceLabel(state, t.source)}. Kept {shortDate(t.at)}
        {t.versions.length > 1 ? `, revised ${plural(t.versions.length - 1, 'time')}` : ''}.
      </p>
      {applied.length > 0 && <p className="small dim">You said it applied to {applied.map((c) => `“${c.saves.at(-1)!.content.title}”`).join(', ')}.</p>}
      <details>
        <summary className="link small">See the evidence</summary>
        <Evidence state={state} t={t} />
      </details>
      {editing === null ? (
        <div className="outs">
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(wording(t))}>
            Revise
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => store.update((s) => retire(s, t.id, new Date()))}>
            Retire
          </button>
        </div>
      ) : (
        <div className="row">
          <button
            className="btn btn-primary"
            disabled={!editing.trim()}
            onClick={() => {
              store.update((s) => revise(s, t.id, editing, new Date()));
              setEditing(null);
            }}
          >
            Save wording
          </button>
          <button className="btn btn-ghost" onClick={() => setEditing(null)}>
            Cancel
          </button>
        </div>
      )}
    </article>
  );
}

/** The record a takeaway came from, as it was. */
function Evidence({ state, t }: { state: TellState; t: Takeaway }) {
  const s = t.source;
  const earlier = t.versions.length > 1 && (
    <div className="stack-tight">
      <p className="faint tiny">Earlier wordings</p>
      <ul className="results small">
        {t.versions.slice(0, -1).map((v) => (
          <li key={v.at}>
            {shortDate(v.at)}: {v.text}
          </li>
        ))}
      </ul>
    </div>
  );
  if (s.kind === 'play') {
    const p = state.plays.find((x) => x.id === s.play)!;
    return (
      <div className="stack">
        <p className="small dim">Answers to an invented story: hypothetical, not a real choice.</p>
        <ul className="results small">
          {playView(p).observed.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <a className="link small" href={`#/play/${p.id}`}>
          Open that play
        </a>
        {earlier}
      </div>
    );
  }
  if (s.kind === 'choice' || s.kind === 'outcome') {
    const c = state.choices.find((x) => x.id === s.choice)!;
    const save = s.kind === 'choice' ? c.saves[s.save] : undefined;
    const o = s.kind === 'outcome' ? c.outcomes.find((x) => x.id === s.outcome) : undefined;
    return (
      <div className="stack">
        {save && (
          <>
            <p className="small dim">What you said about a real choice, as saved on {shortDate(save.at)}:</p>
            <p className="pre small">{save.content.clearer || save.content.title}</p>
          </>
        )}
        {o && (
          <>
            <p className="small dim">What you reported on {shortDate(o.at)}:</p>
            <p className="small">
              {[OUTCOME_STATES[o.state], o.compared && COMPARED[o.compared], o.what, o.surprise && `Surprise: ${o.surprise}`].filter(Boolean).join('. ')}.
            </p>
          </>
        )}
        <a className="link small" href={`#/choice/${c.id}`}>
          Open that choice
        </a>
        {earlier}
      </div>
    );
  }
  return (
    <div className="stack">
      <p className="small dim">{s.kind === 'earlier' ? `A principle you wrote in ${earlierName(s.schema)}; its full record is in History.` : 'Written by you, without a story or choice attached.'}</p>
      {earlier}
    </div>
  );
}

function OwnTakeaway() {
  const [text, setText] = useState('');
  return (
    <div className="row">
      <input className="input" value={text} placeholder="Something worth keeping, in your words" aria-label="A takeaway of your own" onChange={(e) => setText(e.target.value)} />
      <button
        className="btn"
        disabled={!text.trim()}
        onClick={() => {
          store.update((s) => keep(s, `t${randomId()}`, text, { kind: 'own' }, new Date()));
          setText('');
        }}
      >
        Keep
      </button>
    </div>
  );
}

function Plays({ state }: { state: TellState }) {
  if (!state.plays.length) return null;
  const stories = [...new Set(state.plays.map((p) => p.episode))];
  return (
    <details className="card-quiet">
      <summary className="link small">Play: answers to invented stories ({plural(state.plays.length, 'play')})</summary>
      <ul className="results">
        {stories.map((id) => {
          const plays = state.plays.filter((p) => p.episode === id);
          return (
            <li key={id} className="stack-tight">
              <span>{plays[0].shown.title}</span>
              <span className="small">
                {plays.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && ' · '}
                    <a className="link" href={`#/play/${p.id}`}>
                      {shortDate(p.day)}
                      {p.replay ? ` (replay ${p.replay})` : ''}
                    </a>
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
