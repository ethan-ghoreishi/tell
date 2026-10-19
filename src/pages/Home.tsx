import { library } from '../domain/engine';
import { SITUATIONS } from '../domain/situations';
import type { TellState } from '../domain/types';
import { shortDate } from '../ui';

// The collection, shown whole: nothing is locked, scheduled or replenished.
// The order keeps situations that share something apart.

export default function Home({ state }: { state: TellState }) {
  const shelf = library(state, SITUATIONS);
  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">Pick a situation</h1>
        <p className="lede">Each is a small choice somewhere different, two or three minutes long. Some have more in common than they seem.</p>
      </header>
      <ul className="stack">
        {shelf.map(({ situation: s, plays }) => (
          <li key={s.id}>
            <a className="card tile" href={`#/situation/${s.id}`}>
              <span className="eyebrow">{s.place}</span>
              <span className="section-title">{s.title}</span>
              <span className="small dim">{s.hook}</span>
              {plays.length > 0 && (
                <span className="tiny faint num">
                  Played {shortDate(plays[0].day)}
                  {plays.length > 1 ? `, and ${plays.length - 1} more ${plays.length > 2 ? 'times' : 'time'}` : ''}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
      {shelf.every((x) => x.plays.length) && <p className="small dim">You’ve played them all. Any of them again, whenever you like; your map shows what connects them.</p>}
    </div>
  );
}
