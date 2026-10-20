import { discoveries, playView } from '../domain/engine';
import { CONNECTIONS } from '../domain/situations';
import type { TellState } from '../domain/types';
import { shortDate } from '../ui';
import { DiscoveryCard, useFresh } from './Play';

// The distinctions your choices have turned up, newest first: each a heading
// and a sentence or two, with the choices and limits behind a tap. Everything
// played sits underneath, folded away. Nothing to approve, sort or maintain.

export default function MapPage({ state }: { state: TellState }) {
  const found = discoveries(state, CONNECTIONS);
  const fresh = useFresh(state, found);
  const plays = [...state.plays].reverse();

  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">Your map</h1>
        <p className="lede">
          {found.length
            ? 'Distinctions your choices have turned up, newest first.'
            : 'Nothing yet. When two of your choices, in different stories, turn up the same distinction, it appears here. Not every pair does.'}
        </p>
      </header>

      {found.length > 0 && (
        <div className="stack-lg">
          {found.map((d) => (
            <DiscoveryCard key={d.connection.id} d={d} fresh={fresh.has(d.connection.id)} />
          ))}
        </div>
      )}

      {plays.length > 0 && (
        <details className="card-quiet">
          <summary className="link small">Everything you’ve played ({plays.length})</summary>
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
                {playView(p).did.join(' ')}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
