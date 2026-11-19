import { useState } from 'react';
import { ROUNDS, roundById } from '../content';
import { bookOrder, bookText, connections, editIdea, ideaOf, lastPlay, relationWord, removeIdea, search } from '../domain/engine';
import { IDEA_KINDS, type Idea, type TellState } from '../domain/types';
import { Connections, IdeaEditor, Sources } from '../round';
import { store } from '../store/store';
import { download, localDay } from '../ui';

// My Book: the ideas kept from rounds, newest first, each with where it came
// from and how it connects with the others kept. It asks for nothing: no
// writing, no filing, no counts. Search appears once there's enough to search.

const SEARCH_FROM = 5;
const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function BookPage({ state }: { state: TellState }) {
  const [query, setQuery] = useState('');
  const ideas = search(bookOrder(state), ROUNDS, query);
  if (!state.book.length)
    return (
      <div className="stack-lg">
        <h1 className="title page-title" tabIndex={-1}>
          My Book
        </h1>
        <div className="empty stack">
          <p className="lede">Each round ends with an idea worth keeping: a question, a way to think, a saying. Keep one and it lands here, with where it came from and how it connects to others you keep.</p>
          <a className="btn btn-primary btn-block" href="#/">
            Play a round
          </a>
        </div>
      </div>
    );
  return (
    <div className="stack-lg">
      <h1 className="title page-title" tabIndex={-1}>
        My Book
      </h1>
      {state.book.length >= SEARCH_FROM && (
        <div className="search">
          <label className="sr-only" htmlFor="book-search">
            Search my Book
          </label>
          <input id="book-search" className="field" type="search" placeholder="Search ideas, rounds, topics" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      )}
      {ideas.length ? (
        <ul className="ideas">
          {ideas.map((i) => (
            <IdeaRow key={i.round} idea={i} state={state} />
          ))}
        </ul>
      ) : (
        <p className="dim" role="status">
          Nothing in the Book matches “{query.trim()}”.
        </p>
      )}
      <button className="btn btn-ghost btn-block" onClick={() => download(`tell-book-${localDay(new Date())}.txt`, bookText(state, ROUNDS), 'text/plain')}>
        Download my Book as text
      </button>
    </div>
  );
}

function IdeaRow({ idea, state }: { idea: Idea; state: TellState }) {
  const round = roundById(idea.round);
  const linked = connections(state, ROUNDS, idea.round).filter((c) => c.kept);
  return (
    <li>
      <a className="idea-row" href={`#/idea/${idea.round}`}>
        <span className="eyebrow">{IDEA_KINDS[idea.kind]}</span>
        <span className="idea-row-text">{idea.text}</span>
        <span className="small dim">
          {idea.title}
          {round && ` · ${round.topic}`}
        </span>
        {linked.length > 0 && (
          <span className="links-line small">
            {linked.map((c) => (
              <span key={c.other.id} className="link-chip">
                <span className="rel">{relationWord(c)}</span> {c.other.title}
              </span>
            ))}
          </span>
        )}
      </a>
    </li>
  );
}

export function IdeaPage({ state, id }: { state: TellState; id: string }) {
  const idea = ideaOf(state, id);
  const round = roundById(id);
  const [editing, setEditing] = useState(false);
  if (!idea)
    return (
      <div className="stack">
        <h1 className="title" tabIndex={-1}>
          Not in your Book
        </h1>
        <p className="dim">This idea isn’t kept, or was removed.</p>
        {round && (
          <a className="link" href={`#/round/${id}`}>
            Play “{round.title}”
          </a>
        )}
      </div>
    );
  const played = lastPlay(state, id);
  const conns = connections(state, ROUNDS, id);
  return (
    <div className="stack-xl">
      <section className="takeaway kept stack" aria-labelledby="idea-kind">
        <h1 className="eyebrow" id="idea-kind" tabIndex={-1}>
          {IDEA_KINDS[idea.kind]}
        </h1>
        {editing ? (
          <IdeaEditor
            initial={idea.text}
            saveLabel="Save"
            onSave={(text) => {
              store.update((s) => editIdea(s, id, text, new Date()));
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <blockquote className="idea-text">
            <p>{idea.text}</p>
            {idea.by && <footer className="idea-by">{idea.by}</footer>}
          </blockquote>
        )}
        {!editing && (
          <div className="takeaway-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>
              Edit wording
            </button>
            {idea.edited && (
              <button className="btn btn-ghost" onClick={() => store.update((s) => editIdea(s, id, idea.original, new Date()))}>
                Restore original
              </button>
            )}
          </div>
        )}
        {idea.edited && !editing && <p className="small dim">The round put it: “{idea.original}”</p>}
      </section>

      <section className="stack" aria-labelledby="idea-from">
        <h2 className="section-title" id="idea-from">
          From the round
        </h2>
        <div className="from stack-tight">
          <p className="row-title">{idea.title}</p>
          {round && (
            <p className="small dim">
              {round.topic} · {round.form}. {round.hook}
            </p>
          )}
          <p className="small dim">
            Kept {date.format(new Date(idea.at))}
            {played && played.at.slice(0, 10) !== idea.at.slice(0, 10) && `, last played ${date.format(new Date(played.at))}`}.
          </p>
        </div>
        {round ? (
          <a className="btn btn-block" href={`#/round/${id}`}>
            Play it again
          </a>
        ) : (
          <p className="small dim">This round is no longer in Tell; the idea stays as you kept it.</p>
        )}
      </section>

      {conns.length > 0 && <Connections conns={conns} title="Connections" />}
      {round && <Sources round={round} />}

      <button
        className="btn btn-ghost btn-block"
        onClick={() => {
          if (window.confirm('Remove this idea from your Book? Playing the round again lets you keep it again.')) {
            store.update((s) => removeIdea(s, id));
            location.hash = '#/book';
          }
        }}
      >
        Remove from my Book
      </button>
    </div>
  );
}
