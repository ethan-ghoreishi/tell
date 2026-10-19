import { found, library, playView } from '../domain/engine';
import { CONNECTIONS, SITUATIONS } from '../domain/situations';
import type { TellState } from '../domain/types';
import { Section } from '../steps';
import { shortDate } from '../ui';
import { ConnectionCard } from './Play';

// Connections first, and only those whose situations have both been played;
// then everything that was chosen, each with its source. Nothing to approve,
// sort or maintain.

export default function MapPage({ state }: { state: TellState }) {
  const connections = found(state, CONNECTIONS);
  const played = library(state, SITUATIONS).filter((x) => x.plays.length);

  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">Your map</h1>
        <p className="lede">
          {played.length ? 'What connects the situations you’ve played, and what you chose in each.' : 'Nothing yet. Play a situation, and what you choose shows up here.'}
        </p>
      </header>

      <Section title="Connections" id="connections">
        {connections.length === 0 && (
          <p className="empty">None yet. A connection appears once you’ve played two situations that share something. Not every two do.</p>
        )}
        {connections.map((f) => (
          <ConnectionCard key={f.connection.id} f={f} />
        ))}
      </Section>

      {played.length > 0 && (
        <Section title="What you chose" id="chose">
          <ul className="cells">
            {played.map(({ situation: s, plays }) => (
              <li key={s.id} className="cell stack-tight">
                <a className="cell-head shelf" href={`#/play/${plays[0].id}`}>
                  <span className="section-title">{s.title}</span>
                  <span className="small dim num">{shortDate(plays[0].day)}</span>
                </a>
                <p className="small dim">{playView(plays[0]).did.join(' ')}</p>
                {plays.length > 1 && (
                  <p className="small replays">
                    {plays.slice(1).map((p) => (
                      <a key={p.id} className="link" href={`#/play/${p.id}`}>
                        Replay {p.replay}, {shortDate(p.day)}
                      </a>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
