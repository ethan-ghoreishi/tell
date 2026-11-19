import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ROUNDS, roundById } from './content';
import { nextUp } from './domain/engine';
import { earlierName } from './domain/types';
import About, { RestoreButton } from './pages/About';
import { BookPage, IdeaPage } from './pages/Book';
import { PlayTab, RoundPage, RoundsPage } from './pages/Play';
import { store, useTell, type Snapshot } from './store/store';
import { BackIcon, BookIcon, PlayIcon, download } from './ui';

// Two tabs, Play and My Book. A round opened from a list, an idea, the list of
// rounds and About take the whole screen, with one way back at the top: to the
// screen they were opened from.

const TABS = [
  { route: '', label: 'Play', Icon: PlayIcon },
  { route: 'book', label: 'My Book', Icon: BookIcon },
] as const;
const isTab = (route: string) => route === '' || route === 'book';

/** Hash routing: no server rewrites, works offline from any path. */
function useRoute() {
  const read = () => location.hash.replace(/^#\/?/, '');
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

/** Where the way back leads: the screen before this one, since the last tab. */
function useTrail(route: string) {
  const trail = useRef<string[]>([]);
  const t = trail.current;
  if (isTab(route)) trail.current = [route];
  else if (t.at(-2) === route) t.pop();
  else if (t.at(-1) !== route) t.push(route);
  return trail.current.at(-2) ?? '';
}

function backLabel(target: string) {
  if (target === '') return 'Play';
  if (target === 'book') return 'My Book';
  if (target === 'rounds') return 'All rounds';
  if (target.startsWith('round/')) return roundById(target.slice(6))?.title ?? 'Back';
  return 'Back';
}

export default function App() {
  const snapshot = useTell();
  const route = useRoute();
  const back = useTrail(route);
  const main = useRef<HTMLElement>(null);
  const [page, ...rest] = route.split('/');
  const arg = rest.join('/');
  const focused = !isTab(route);
  // The round Play shows. It changes only when the player moves on, so a
  // finished round's ending stays put while it's being read.
  const [current, setCurrent] = useState<string | null>(() => (snapshot.status === 'ready' ? (nextUp(snapshot.state, ROUNDS)?.id ?? null) : null));

  // Only <main> scrolls; every screen opens at the top.
  // Braces matter: Chromium's scrollTo returns a Promise, which React would take for a cleanup.
  useEffect(() => {
    main.current?.scrollTo(0, 0);
    main.current?.querySelector<HTMLElement>('h1[tabindex="-1"]')?.focus({ preventScroll: true });
  }, [route]);

  if (snapshot.status === 'refused') return <Recovery snapshot={snapshot} />;
  const { state, saveError, archived } = snapshot;
  const tab = page === 'book' ? 'book' : '';

  return (
    <div className={`app${focused ? ' focused' : ''}`}>
      {focused ? (
        <header className="topbar">
          <a className="back" href={`#/${back}`}>
            <BackIcon />
            <span className="back-label">{backLabel(back)}</span>
          </a>
        </header>
      ) : (
        // The nav comes first for assistive tech; CSS places it at the bottom.
        <nav className="tabbar" aria-label="Primary">
          {TABS.map(({ route: r, label, Icon }) => (
            <a key={r} className="tab" href={`#/${r}`} aria-current={tab === r ? 'page' : undefined}>
              <Icon />
              <span>{label}</span>
            </a>
          ))}
        </nav>
      )}
      <main className="main" ref={main}>
        <div className="main-inner stack-lg">
          {saveError && (
            <p className="notice" role="alert">
              {saveError}
            </p>
          )}
          {archived && (
            <p className="notice" role="status">
              Tell has become a new game. Your record from {earlierName(archived)} is kept exactly as it was, and you can download it from{' '}
              <a className="link" href="#/about">
                About
              </a>
              .
            </p>
          )}
          <UpdateNotice />
          {page === 'book' ? (
            <BookPage state={state} />
          ) : page === 'idea' ? (
            <IdeaPage key={arg} state={state} id={arg} />
          ) : page === 'round' ? (
            <RoundPage key={arg} state={state} id={arg} />
          ) : page === 'rounds' ? (
            <RoundsPage state={state} />
          ) : page === 'about' ? (
            <About state={state} />
          ) : (
            <PlayTab state={state} current={current ?? nextUp(state, ROUNDS)?.id ?? null} setCurrent={setCurrent} />
          )}
        </div>
      </main>
    </div>
  );
}

/** The service worker never reloads the app by itself; it asks. */
function UpdateNotice() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className="notice notice-row" role="status">
      <span>A new version of Tell is ready.</span>
      <span className="notice-actions">
        <button className="link" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
        <button className="link" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
      </span>
    </div>
  );
}

/**
 * Saved data that can't be trusted is never overwritten. The only ways on:
 * download it as it is, restore a valid backup, or deliberately start fresh.
 */
function Recovery({ snapshot }: { snapshot: Extract<Snapshot, { status: 'refused' }> }) {
  return (
    <div className="app">
      <main className="main">
        <div className="main-inner stack-lg">
          <h1 className="title">Tell couldn’t open your saved data</h1>
          <p>The reason: {snapshot.reason}. Nothing has been changed or deleted.</p>
          {snapshot.newer && <p className="dim">Update Tell to open it. Your data is waiting, untouched.</p>}
          {snapshot.raw && (
            <button className="btn btn-block" onClick={() => download('tell-saved-data.txt', snapshot.raw, 'text/plain')}>
              Download the saved data as it is
            </button>
          )}
          <RestoreButton />
          {!snapshot.newer && (
            <button
              className="btn btn-ghost btn-block"
              onClick={() => {
                if (window.confirm('Start fresh? This deletes the unreadable data on this device. Download it first if you might need it.')) {
                  store.erase();
                }
              }}
            >
              Start fresh
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
