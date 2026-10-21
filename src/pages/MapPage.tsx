import { examples, pairs, playView } from '../domain/engine';
import { LANGUAGE_MOVES, STRATEGIES } from '../domain/language';
import type { TellState } from '../domain/types';
import { useCard } from '../lens';
import { Section } from '../steps';
import { shortDate } from '../ui';
import { PairView } from './Play';

// The map of the language, with the player's plays on it: every move, by
// what it deals with, each opening its card; under each, the stories where
// the player made it, or an everyday instance where they haven't. A move
// reads the same either way: nothing here is counted, completed or ranked.
// Then each story played both ways, side by side, and everything played.

export default function MapPage({ state }: { state: TellState }) {
  const open = useCard();
  const made = new Map(examples(state).map((e) => [e.id as string, [...new Set(e.examples.map((x) => x.play.shown.title))]]));
  const both = pairs(state);
  const plays = [...state.plays].reverse();

  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">Your map</h1>
        <p className="lede">Every move, by what it deals with, and where you’ve made each. Tap one to open it.</p>
      </header>

      {both.length > 0 && (
        <Section title="Both ways" id="both">
          {both.map((pair) => (
            <PairView key={pair.variant.id} pair={pair} />
          ))}
        </Section>
      )}

      <Section title="Moves" id="moves">
        {STRATEGIES.map((s) => (
          <div key={s.id} className="stack-tight">
            <h3 className="eyebrow">{s.name}</h3>
            <ul className="cells">
              {LANGUAGE_MOVES.filter((m) => m.strategy === s.id).map((m) => (
                <li key={m.id} className="cell">
                  <button className="row" onClick={() => open({ kind: 'move', id: m.id })}>
                    <span className="option-title">{m.name}</span>
                    <span className="small dim">{made.has(m.id) ? `In ${made.get(m.id)!.join(', ')}` : `Like ${m.like}`}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      {plays.length > 0 && (
        <details className="card-quiet">
          <summary className="link small">Everything you’ve played</summary>
          <ul className="results small">
            {plays.map((p) => (
              <li key={p.id}>
                <a className="link" href={`#/play/${p.id}`}>
                  {p.shown.title}
                </a>{' '}
                <span className="dim">
                  {shortDate(p.day)}
                  {p.replay ? `, replay ${p.replay}` : ''}
                </span>
                <br />
                {playView(p)
                  .did.map((d) => d.line)
                  .join(' ')}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
