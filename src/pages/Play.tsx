import { useEffect, useRef, useState } from 'react';
import { ROUNDS, roundById } from '../content';
import { hasPlayed, ideaOf, nextUp, skip } from '../domain/engine';
import type { TellState } from '../domain/types';
import { restart, RoundView } from '../round';
import { store } from '../store/store';
import { InfoIcon } from '../ui';

// Play opens straight into a round: the next one in the collection, playable
// where it stands. Moving on is one tap; passing over a round is one tap; when
// every round has been played, Play says so plainly and offers them all again.

export function PlayTab({ state, current, setCurrent }: { state: TellState; current: string | null; setCurrent: (id: string | null) => void }) {
  const round = current ? roundById(current) : undefined;
  const next = () => {
    // Read the store, not the render's state: a pass-over has just been recorded.
    const snap = store.get();
    const after = nextUp(snap.status === 'ready' ? snap.state : state, ROUNDS, current ?? undefined);
    if (after) restart(after.id);
    setCurrent(after?.id ?? null);
  };
  const others = ROUNDS.some((r) => r.id !== current && !hasPlayed(state, r.id));
  // A new round in place (next, skip, at random) starts at the top, its title focused, as a new screen does.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    toTop();
  }, [current]);
  return (
    <div className="stack-lg">
      <header className="masthead">
        <span className="wordmark">Tell</span>
        <span className="masthead-actions">
          <a className="masthead-link" href="#/rounds">
            All rounds
          </a>
          <a className="icon-btn" href="#/about" aria-label="About">
            <InfoIcon />
          </a>
        </span>
      </header>
      {/* For a first visit, until the first round is over and moved on from. */}
      {(state.plays.length === 0 || (state.plays.length === 1 && state.plays[0].round === current)) && <p className="intro">Short rounds of puzzles, true stories and thought experiments. Keep the ideas worth keeping; over time they start to connect.</p>}
      {round ? (
        <RoundView
          key={round.id}
          round={round}
          state={state}
          onNext={next}
          nextLabel={others ? 'Next round' : 'Done'}
          onSkip={
            others && !hasPlayed(state, round.id)
              ? () => {
                  store.update((s) => skip(s, round.id));
                  next();
                }
              : undefined
          }
        />
      ) : (
        <AllPlayed state={state} onPick={(id) => setCurrent(id)} />
      )}
    </div>
  );
}

function AllPlayed({ state, onPick }: { state: TellState; onPick: (id: string) => void }) {
  return (
    <section className="stack-lg" aria-labelledby="all-played">
      <div className="stack">
        <h1 className="title" id="all-played" tabIndex={-1}>
          You’ve played every round
        </h1>
        <p className="lede">New rounds arrive with updates to Tell. Any round can be played again, and your Book keeps what you kept.</p>
      </div>
      <button
        className="btn btn-primary btn-block"
        onClick={() => {
          const r = ROUNDS[Math.floor(Math.random() * ROUNDS.length)];
          restart(r.id);
          onPick(r.id);
        }}
      >
        Play one again, at random
      </button>
      <a className="btn btn-block" href="#/book">
        Open my Book
      </a>
      <RoundList state={state} />
    </section>
  );
}

/** Every round in the collection, played or not, with no count of what's left. */
function RoundList({ state }: { state: TellState }) {
  return (
    <ul className="rounds">
      {ROUNDS.map((r) => (
        <li key={r.id}>
          <a className="round-row" href={`#/round/${r.id}`}>
            <span className="eyebrow">
              {r.topic} · {r.form}
            </span>
            <span className="row-title">{r.title}</span>
            <span className="small dim">{r.hook}</span>
            {(hasPlayed(state, r.id) || ideaOf(state, r.id)) && (
              <span className="tags">
                {hasPlayed(state, r.id) && <span className="tag">Played</span>}
                {ideaOf(state, r.id) && <span className="tag">In my Book</span>}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function RoundsPage({ state }: { state: TellState }) {
  return (
    <div className="stack-lg">
      <header className="stack">
        <h1 className="title" tabIndex={-1}>
          All rounds
        </h1>
        <p className="lede">Play any of them, in any order, as often as you like.</p>
      </header>
      <RoundList state={state} />
    </div>
  );
}

function toTop() {
  const main = document.querySelector('main');
  main?.scrollTo(0, 0);
  main?.querySelector<HTMLElement>('h1[tabindex="-1"]')?.focus({ preventScroll: true });
}

/** A round opened from the list, the Book or a connection. */
export function RoundPage({ state, id }: { state: TellState; id: string }) {
  const round = roundById(id);
  const [run, setRun] = useState(0);
  if (!round)
    return (
      <div className="stack">
        <h1 className="title">This round isn’t in Tell any more</h1>
        <a className="link" href="#/rounds">
          See all rounds
        </a>
      </div>
    );
  return (
    <RoundView
      key={`${round.id}-${run}`}
      round={round}
      state={state}
      nextLabel="Play it again"
      onNext={() => {
        restart(round.id);
        setRun((n) => n + 1);
        requestAnimationFrame(toTop);
      }}
    />
  );
}
