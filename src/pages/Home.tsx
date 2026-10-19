import { EPISODES } from '../domain/episodes';
import { library, suggestion } from '../domain/engine';
import { PARTS, PART_ORDER, type TellState } from '../domain/types';
import { Section } from '../mechanics';
import { shortDate } from '../ui';

// The two ways in: a real choice, or a story to think through. The library is
// finite and shown whole; nothing is locked, scheduled or replenished.

export default function Home({ state }: { state: TellState }) {
  const drafts = state.choices.filter((c) => c.draft);
  const next = suggestion(state, EPISODES);
  const shelf = library(state, EPISODES);

  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">See what would make a choice clearer</h1>
        <p className="lede">Bring a choice you keep circling, or play a short story to think one through. Tell helps you examine a choice; it doesn’t make it.</p>
      </header>

      {drafts.map((c) => (
        <a key={c.id} className="card due" href={`#/choice/${c.id}`}>
          <span className="eyebrow">{c.saves.length ? 'Revising' : 'Draft'}</span>
          <span className="section-title">{c.title || 'Untitled choice'}</span>
          <span className="small dim">Continue where you left off.</span>
        </a>
      ))}

      <section className="card stack" aria-labelledby="bring">
        <h2 className="section-title" id="bring">
          Bring a choice
        </h2>
        <p className="small dim">Before more research, revision or deliberation: look at what feels unresolved, and what would actually help.</p>
        <a className="btn btn-primary btn-block" href="#/choose">
          Bring a choice
        </a>
      </section>

      <section className="card-quiet stack" aria-labelledby="play">
        <h2 className="section-title" id="play">
          Play a story
        </h2>
        {next ? (
          <>
            <p className="small dim">
              {next.reason === 'Start here' ? 'A good first one' : 'One you haven’t played'}: <strong>{next.episode.title}</strong>, {next.episode.project.toLowerCase()}. About
              three minutes.
            </p>
            <a className="btn btn-block" href={`#/episode/${next.episode.id}`}>
              {next.reason === 'Start here' ? `Start here: ${next.episode.title}` : `Play ${next.episode.title}`}
            </a>
          </>
        ) : (
          <p className="small dim">You’ve played every story here. Replay any of them below, or bring a real choice.</p>
        )}
      </section>

      <div className="stack-lg">
        <p className="small dim">Twelve invented stories, three for each question. Play them in any order, as often as you like.</p>
        {PART_ORDER.map((part) => (
          <Section key={part} title={PARTS[part].name} id={`part-${part}`}>
            <p className="small dim">{PARTS[part].question}</p>
            <ul className="cells">
              {shelf
                .filter((x) => x.episode.part === part)
                .map(({ episode: e, plays }) => (
                  <li key={e.id} className="cell">
                    <a className="cell-head shelf" href={`#/episode/${e.id}`}>
                      <span>
                        {e.title} <span className="faint tiny">· {e.project}</span>
                      </span>
                      <span className="small dim num">
                        {plays.length ? `Played ${shortDate(plays[0].day)}${plays.length > 1 ? ` · ${plays.length - 1} more` : ''}` : 'Not played'}
                      </span>
                    </a>
                  </li>
                ))}
            </ul>
          </Section>
        ))}
      </div>
    </div>
  );
}
