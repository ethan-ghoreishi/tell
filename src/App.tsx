import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { PART_ORDER, earlierName, type Part } from './domain/types';
import About, { RestoreButton } from './pages/About';
import { ChoicePage, NewChoice } from './pages/Choice';
import { EpisodePage, PlayPage } from './pages/Episode';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import { store, useTell, type Snapshot } from './store/store';
import { InfoIcon, MapIcon, MarkIcon, PlayIcon, download } from './ui';

const TABS = [
  { route: 'home', href: '#/', label: 'Home', Icon: PlayIcon },
  { route: 'map', href: '#/map', label: 'Map', Icon: MapIcon },
  { route: 'about', href: '#/about', label: 'About', Icon: InfoIcon },
] as const;

/** Hash routing: no server rewrites, works offline from any path. */
function useRoute() {
  const read = () => location.hash.replace(/^#\/?/, '') || 'home';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export default function App() {
  const snapshot = useTell();
  const route = useRoute();
  const main = useRef<HTMLElement>(null);
  // Only <main> scrolls; every page opens at the top.
  // Braces matter: Chromium's scrollTo now returns a Promise, which React would take for a cleanup.
  useEffect(() => {
    main.current?.scrollTo(0, 0);
  }, [route]);

  if (snapshot.status === 'refused') return <Recovery snapshot={snapshot} />;
  const { state, saveError, migrated } = snapshot;
  const [page, ...rest] = route.split('/');
  const arg = rest.join('/');
  // A saved choice lives on the Map; a draft is still being brought from Home.
  const saved = page === 'choice' && state.choices.some((c) => c.id === arg && !c.draft);
  const tab = page === 'map' || saved ? 'map' : page === 'about' ? 'about' : 'home';

  return (
    <div className="app">
      {/* The nav comes first for assistive tech; CSS places it at the bottom. */}
      <nav className="tabbar" aria-label="Primary">
        {TABS.map(({ route: r, href, label, Icon }) => (
          <a key={r} className="tab" href={href} aria-current={tab === r ? 'page' : undefined}>
            <Icon />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <header className="app-header">
        <a className="wordmark" href="#/">
          <MarkIcon className="mark" />
          Tell
        </a>
      </header>
      <main className="main" ref={main}>
        <div className="main-inner stack-lg">
          {saveError && (
            <p className="notice" role="alert">
              {saveError}
            </p>
          )}
          {migrated && (
            <p className="notice" role="status">
              Your record from {earlierName(migrated)} was carried over and kept exactly as it was, under History on your map.
            </p>
          )}
          <UpdateNotice />
          {page === 'map' ? (
            <MapPage state={state} />
          ) : page === 'about' ? (
            <About state={state} />
          ) : page === 'episode' ? (
            <EpisodePage key={arg} state={state} id={arg} />
          ) : page === 'play' ? (
            <PlayPage key={arg} state={state} id={arg} />
          ) : page === 'choose' ? (
            <NewChoice key={route} state={state} part={PART_ORDER.includes(rest[0] as Part) ? (rest[0] as Part) : undefined} prompt={rest[1] ? safeDecode(rest.slice(1).join('/')) : undefined} />
          ) : page === 'choice' ? (
            <ChoicePage key={arg} state={state} id={arg} />
          ) : (
            <Home state={state} />
          )}
        </div>
      </main>
    </div>
  );
}

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return '';
  }
};

/** The service worker never reloads the app by itself; it asks. */
function UpdateNotice() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className="notice round-head" role="status">
      <span>A new version of Tell is ready.</span>
      <span className="chips">
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
        <div className="main-inner stack-lg" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
          <h1 className="title">Tell couldn’t open your saved data</h1>
          <p>
            The reason: {snapshot.reason}. Nothing has been changed or deleted.
          </p>
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
