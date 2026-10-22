import { library } from '../domain/engine';
import { STORIES, variantOf } from '../domain/situations';
import type { TellState } from '../domain/types';
import { InfoIcon, MarkIcon, shortDate } from '../ui';

// The collection, shown whole: nothing is locked, scheduled or replenished.
// Stories are listed in a fixed order; nothing is ranked or recommended. A
// story's variant is reached from its ending, and from its tile here once
// the story is played.

export default function Home({ state }: { state: TellState }) {
  const shelf = library(state, STORIES);
  return (
    <div className="stack-xl">
      <header className="stack">
        <div className="masthead">
          <span className="wordmark">
            <MarkIcon className="mark" />
            Tell
          </span>
          <a className="icon-btn" href="#/about" aria-label="About">
            <InfoIcon />
          </a>
        </div>
        <h1 className="title">Pick a story</h1>
        <p className="lede">Small choices in unfamiliar places, two or three minutes each.</p>
      </header>
      <ul className="stack">
        {shelf.map(({ situation: s, plays }) => {
          const variant = variantOf(s.id);
          return (
            <li key={s.id} className="card story">
              <a className="tile" href={`#/situation/${s.id}`}>
                <span className="eyebrow">{s.place}</span>
                <span className="tile-title">{s.title}</span>
                <span className="small dim">{s.hook}</span>
                {plays.length > 0 && (
                  <span className="tiny faint num">
                    Played {shortDate(plays[0].day)}
                    {plays.length > 1 ? `, and ${plays.length - 1} more ${plays.length > 2 ? 'times' : 'time'}` : ''}
                  </span>
                )}
              </a>
              {plays.length > 0 && variant && (
                <a className="variant" href={`#/situation/${variant.id}`}>
                  {variant.whatIf}
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {shelf.every((x) => x.plays.length) && <p className="small dim">You’ve played them all. Any of them again, whenever you like.</p>}
    </div>
  );
}
