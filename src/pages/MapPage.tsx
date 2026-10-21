import { examples, lived, playView } from '../domain/engine';
import { LANGUAGE_MOVES, QUESTIONS, STRATEGIES, answerText, languageMove } from '../domain/language';
import type { Play, TellState } from '../domain/types';
import { Section } from '../steps';
import { shortDate } from '../ui';
import { moveName } from './Play';

// Your library: a way to bring a real choice, the choices you kept, the moves
// you've made in the stories, and the shapes you've played them in. Listed,
// never counted, summarised or compared, and never used to choose what Bring
// a choice shows. Everything played sits underneath, folded away.

const playName = (p: Play) => `${p.shown.title}${p.replay ? `, replay ${p.replay}` : ''}`;

const lede = (played: boolean, kept: boolean) =>
  played && kept
    ? 'The moves you’ve made in the stories, and the choices you’ve kept.'
    : played
      ? 'The moves you’ve made in the stories.'
      : kept
        ? 'The choices you’ve kept. The moves you make in the stories will be kept here too.'
        : 'Nothing yet. The moves you make in the stories are kept here.';

export default function MapPage({ state }: { state: TellState }) {
  const made = examples(state);
  const shapes = lived(state);
  const plays = [...state.plays].reverse();

  return (
    <div className="stack-xl">
      <header className="stack">
        <h1 className="title">Your map</h1>
        <p className="lede">{lede(plays.length > 0, state.choices.length > 0)}</p>
      </header>

      <section className="card stack" aria-labelledby="bring">
        <h2 className="section-title" id="bring">
          Bring a choice
        </h2>
        <p className="small dim">Four questions about a step you’re unsure about taking, and the moves that fit it, whether or not you’ve played.</p>
        <a className="btn btn-primary btn-block" href="#/bring">
          Bring a choice
        </a>
      </section>

      {state.choices.length > 0 && (
        <Section title="Your choices" id="choices">
          <ul className="results">
            {[...state.choices].reverse().map((c) => (
              <li key={c.id} className="stack-tight">
                <a className="link" href={`#/choice/${c.id}`}>
                  {c.label || 'A choice'}
                </a>
                <span className="small dim">
                  Kept {shortDate(c.day)}
                  {c.trying.length > 0 && `. Trying: ${c.trying.map((id) => c.shown.flatMap((l) => l.moves).find((m) => m.id === id)?.name ?? id).join(', ')}`}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {made.length > 0 && (
        <Section title="Your moves" id="moves">
          {STRATEGIES.map((s) => {
            const here = made.filter((m) => LANGUAGE_MOVES.find((x) => x.id === m.id)!.strategy === s.id);
            if (!here.length) return null;
            return (
              <div key={s.id} className="stack-tight">
                <h3 className="eyebrow">{s.name}</h3>
                <div className="cells">
                  {here.map(({ id, examples: ex }) => {
                    const m = languageMove(id)!;
                    return (
                      <details key={id} className="cell">
                        <summary className="stack-tight strategy">
                          <span className="option-title">{m.name}</span>
                          <span className="small dim">{[...new Set(ex.map((e) => e.play.shown.title))].join(', ')}</span>
                        </summary>
                        <div className="stack-tight strategy-body small">
                          <p>{m.is}</p>
                          <p className="dim">Breaks: {m.breaks}</p>
                          <ul className="stack-tight">
                            {ex.map((e) => (
                              <li key={`${e.play.id}-${e.line}`}>
                                <a className="link" href={`#/play/${e.play.id}`}>
                                  {playName(e.play)}
                                </a>
                                : {e.line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {shapes.length > 0 && (
        <Section title="The shapes you’ve played" id="shapes">
          <p className="small dim">Each story turns on one step. Where those steps answer a question differently, the stories sit side by side here, with the moves you made in each.</p>
          <div className="cells">
            {shapes.map(({ q, answers }) => {
              const question = QUESTIONS.find((x) => x.id === q)!;
              return (
                <details key={q} className="cell">
                  <summary className="stack-tight strategy">
                    <span className="option-title">{question.ask}</span>
                    <span className="small dim">{answers.map((a) => answerText(q, a.id)).join(' · ')}</span>
                  </summary>
                  <div className="stack-tight strategy-body small">
                    <ul className="stack-tight">
                      {answers.map((a) => (
                        <li key={a.id}>
                          <span className="dim">{answerText(q, a.id)}:</span>{' '}
                          {a.plays
                            .map((p) => {
                              const moves = playView(p).did.flatMap((d) => d.moves);
                              return `${playName(p)}${moves.length ? ` (${moves.map(moveName).join(', ')})` : ''}`;
                            })
                            .join('; ')}
                        </li>
                      ))}
                    </ul>
                    <p className="dim">{question.principle}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </Section>
      )}

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
