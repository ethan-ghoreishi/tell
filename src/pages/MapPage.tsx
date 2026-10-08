import { DECK, PAIRS } from '../domain/deck';
import {
  ANGLES_CHECKED,
  addNote,
  latestNote,
  lensRecord,
  matchedPairs,
  observations,
  outRecord,
  pairResults,
  pickedLens,
  toggleKeep,
  type MatchedPair,
  type Observation,
} from '../domain/engine';
import { AREAS, VERDICTS, lensName, type Answer, type Area, type TellState, type Verdict } from '../domain/types';
import { store } from '../store/store';
import { plural, shortDate } from '../ui';

// Everything here is derived from the answer log, and every number shows its
// denominator. Angles keep a fixed order so the map never ranks you.

export default function MapPage({ state }: { state: TellState }) {
  const { answers } = state;
  if (answers.length === 0) {
    return (
      <div className="stack-lg">
        <h1 className="title">Your map</h1>
        <p className="lede">Your map starts with your first round. Each answer is added here, with the rounds behind every number.</p>
        <a className="btn btn-primary btn-block" href="#/">
          Play today’s set
        </a>
      </div>
    );
  }
  const matched = matchedPairs(answers);
  const pairs = pairResults(answers, PAIRS).filter((r) => r.second);
  const notable = observations(answers);
  const disagreed = new Set(state.disagreed.map((d) => d.card));

  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">Your map</h1>
        <p className="totals">
          <span className="num">
            {plural(answers.length, 'round')} since {shortDate(answers[0].day)}
          </span>
          <span className="num">{plural(state.kept.length, 'line')} kept</span>
          <span className="num">{plural(matched.length, 'matched pair')}</span>
          <span className="num">{plural(pairs.length, 'paired choice')}</span>
        </p>
      </header>

      {notable.length > 0 && (
        <section className="stack" aria-labelledby="explore">
          <h2 className="section-title" id="explore">
            Something to explore
          </h2>
          {notable.map((o) => (
            <ObservationCard key={o.id} state={state} o={o} disagreed={disagreed} />
          ))}
        </section>
      )}

      {(Object.keys(AREAS) as Area[]).map((area) => (
        <AreaRecord key={area} answers={answers} area={area} disagreed={disagreed} />
      ))}

      <Matched matched={matched} />
      <Pairs answers={answers} />
      <KeptLines state={state} />
    </div>
  );
}

function ObservationCard({ state, o, disagreed }: { state: TellState; o: Observation; disagreed: Set<string> }) {
  const name = lensName(o.lens);
  const note = latestNote(state, o.id);
  const statement =
    o.area === 'world'
      ? `In ${AREAS.world.name}, you looked first at ${name} in ${o.chosen} of the ${o.offered} rounds where it was offered.`
      : `In ${AREAS.work.name}, ${name} felt closest to your experience in ${o.chosen} of the ${o.offered} rounds where it was offered.`;
  const give = (verdict: Verdict) => store.update((s) => addNote(s, o.id, verdict, o.counts, new Date()));

  return (
    <article className="card stack">
      <p>{statement}</p>
      <p className="small dim">
        Shown because picking at random among four angles would do this less than 1 time in 20, even allowing for the {ANGLES_CHECKED}{' '}
        angles Tell checks. Could also be: these scenes made {name} the most convincing option.
      </p>
      <div className="stack">
        <p className="small" id={`view-${o.id}`}>
          Your view
        </p>
        <div className="chips" role="group" aria-labelledby={`view-${o.id}`}>
          {(Object.keys(VERDICTS) as Verdict[]).map((v) => (
            <button key={v} className={`chip${note?.verdict === v ? ' on' : ''}`} aria-pressed={note?.verdict === v} onClick={() => give(v)}>
              {VERDICTS[v]}
            </button>
          ))}
        </div>
        {note && (
          <p className="tiny faint">
            Noted {shortDate(note.at)}, at {note.counts}. A note, not evidence: it never changes the counts.
          </p>
        )}
      </div>
      <details>
        <summary className="link small">See the {o.offered} rounds</summary>
        <RoundList rounds={o.rounds} lens={o.lens} disagreed={disagreed} />
      </details>
    </article>
  );
}

function AreaRecord({ answers, area, disagreed }: { answers: Answer[]; area: Area; disagreed: Set<string> }) {
  const rounds = answers.filter((a) => a.area === area && a.kind !== 'switch');
  const rows = lensRecord(answers, area);
  const outs = outRecord(answers, area);
  const differently = rounds.filter((a) => disagreed.has(a.card)).length;
  return (
    <section className="stack" aria-labelledby={`area-${area}`}>
      <div>
        <h2 className="section-title" id={`area-${area}`}>
          {AREAS[area].name}
        </h2>
        <p className="small dim">
          {rounds.length === 0
            ? 'No rounds here yet.'
            : `${AREAS[area].record}, across ${plural(rounds.length, 'round')}. Each angle: picked, of the times it was offered.`}
        </p>
      </div>
      {rounds.length > 0 && (
        <div className="lens-rows">
          {rows.map((r) =>
            r.offered === 0 ? (
              <div key={r.lens} className="lens-row">
                <div className="lens-summary">
                  <span>{lensName(r.lens)}</span>
                  <span className="small faint lens-none">Not offered yet</span>
                </div>
              </div>
            ) : (
              <details key={r.lens} className="lens-row">
                <summary className="lens-summary">
                  <span>{lensName(r.lens)}</span>
                  <span className="bar" aria-hidden="true">
                    <span style={{ width: `${(100 * r.chosen) / r.offered}%` }} />
                  </span>
                  <span className="small num">
                    {r.chosen} of {r.offered}
                  </span>
                </summary>
                <RoundList rounds={r.rounds} lens={r.lens} disagreed={disagreed} />
              </details>
            ),
          )}
        </div>
      )}
      {outs.length > 0 && (
        <p className="small dim num">Answered without picking an angle: {outs.map((o) => `${o.label} ${o.count}`).join(' · ')}</p>
      )}
      {differently > 0 && (
        <p className="small dim num">
          You saw {differently} of these {plural(rounds.length, 'round')} differently from every option on offer.
        </p>
      )}
    </section>
  );
}

/** The rounds behind a number: each scene, when, what you picked there, and whether you saw it differently. */
function RoundList({ rounds, lens, disagreed }: { rounds: Answer[]; lens?: Answer['shown'][number]['lens']; disagreed: Set<string> }) {
  return (
    <ul className="evidence">
      {rounds.map((a) => {
        const picked = pickedLens(a);
        return (
          <li key={a.card}>
            <span>
              {a.title} <span className="faint num">· {shortDate(a.day)}</span>
              {disagreed.has(a.card) && <span className="faint"> · you saw it differently</span>}
            </span>
            <span className={picked === lens ? 'pick-mark' : 'faint'}>{picked ? lensName(picked) : a.pickText}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Matched({ matched }: { matched: MatchedPair[] }) {
  const both = matched.filter((m) => m.worldLens && m.workLens);
  const same = both.filter((m) => m.worldLens === m.workLens).length;
  const label = (lens: MatchedPair['worldLens'], a: Answer) => (lens ? lensName(lens) : a.pickText);
  return (
    <section className="stack" aria-labelledby="matched">
      <div>
        <h2 className="section-title" id="matched">
          The world vs me
        </h2>
        <p className="small dim">Matched scenes offer the same four angles: one about the world, one about your own work.</p>
      </div>
      {matched.length === 0 ? (
        <p className="empty">Once you’ve answered both scenes of a matched pair, they appear here side by side.</p>
      ) : (
        <>
          <p className="small num">
            {plural(matched.length, 'matched pair')} answered on both sides. Same angle on both sides in {same} of the {both.length}{' '}
            where both sides picked one.
          </p>
          <div className="stack">
            {matched.map((m) => (
              <div key={m.world.card} className="then-now">
                {[
                  ['The world', m.world, m.worldLens] as const,
                  ['You', m.work, m.workLens] as const,
                ].map(([side, a, lens]) => (
                  <div key={side} className="stack-tight">
                    <p className="eyebrow">{side}</p>
                    <p className="tiny dim">{a.title}</p>
                    <p>
                      <strong>{label(lens, a)}</strong>
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Pairs({ answers }: { answers: Answer[] }) {
  const done = pairResults(answers, PAIRS).filter((r) => r.second);
  return (
    <section className="stack" aria-labelledby="pairs">
      <div>
        <h2 className="section-title" id="pairs">
          Paired choices
        </h2>
        <p className="small dim">Some choices come back on a later day with one detail changed. Both answers sit here side by side.</p>
      </div>
      {done.length === 0 ? (
        <p className="empty">None completed yet.</p>
      ) : (
        <>
          <p className="small num">
            Your answer changed in {done.filter((r) => r.changed).length} of {plural(done.length, 'pair')}.
          </p>
          {done.map((r) => (
            <article key={r.pair.id} className="card-quiet stack">
              <div>
                <p className="eyebrow">{r.pair.kind === 'trade-off' ? 'Trade-off' : 'Consistency'}</p>
                <h3 className="section-title">{r.pair.title}</h3>
              </div>
              <p className="small dim">Only one thing differed: {r.pair.changed}.</p>
              <div className="then-now">
                <div>
                  <p className="eyebrow num">{shortDate(r.first.day)}</p>
                  <p>{r.first.pickText}</p>
                </div>
                <div>
                  <p className="eyebrow num">{shortDate(r.second!.day)}</p>
                  <p>{r.second!.pickText}</p>
                </div>
              </div>
              <p className="small">{r.changed ? 'Your answer changed.' : 'Your answer stayed the same.'}</p>
            </article>
          ))}
        </>
      )}
    </section>
  );
}

function KeptLines({ state }: { state: TellState }) {
  const kept = [...state.kept].reverse();
  return (
    <section className="stack" aria-labelledby="kept">
      <h2 className="section-title" id="kept">
        Lines you kept
      </h2>
      {kept.length === 0 ? (
        <p className="empty">Tap Keep under a round’s closing line and it stays here. Nothing to memorise.</p>
      ) : (
        <ul className="stack">
          {kept.map((k) => (
            <li key={k.card} className="card kept-line stack">
              <blockquote>{k.line}</blockquote>
              <div className="round-head">
                <p className="tiny faint">
                  {AREAS[k.area].name} · {k.title} · {shortDate(k.at)}
                </p>
                <button className="btn btn-ghost btn-sm" onClick={() => store.update((s) => toggleKeep(s, DECK, k.card, new Date()))}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
