import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { earlierName } from './domain/types';
import About, { RestoreButton } from './pages/About';
import { BringPage, ChoicePage } from './pages/Bring';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import { PlayPage, SituationPage } from './pages/Play';
import { CardHost } from './lens';
import { store, useTell, type Snapshot } from './store/store';
import { BackIcon, BringIcon, MapIcon, PlayIcon, download } from './ui';

const TABS = [
  { route: 'home', href: '#/', label: 'Play', Icon: PlayIcon },
  { route: 'bring', href: '#/bring', label: 'Bring a choice', Icon: BringIcon },
  { route: 'map', href: '#/map', label: 'Map', Icon: MapIcon },
] as const;

/** A story, its ending and About take the whole screen, with a way back to the tab they were opened from instead of the tabs. */
const FOCUSED = ['situation', 'play', 'about'];
const BACK: Record<string, string> = { bring: 'Bring a choice', choice: 'Bring a choice', map: 'Map' };

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
  const [page, ...rest] = route.split('/');
  const arg = rest.join('/');
  const focused = FOCUSED.includes(page);
  // The tab page a focused screen was opened from, for its way back.
  const from = useRef('#/');
  // Only <main> scrolls; every page opens at the top.
  // Braces matter: Chromium's scrollTo now returns a Promise, which React would take for a cleanup.
  useEffect(() => {
    main.current?.scrollTo(0, 0);
    if (!focused) from.current = `#/${route === 'home' ? '' : route}`;
  }, [route, focused]);

  if (snapshot.status === 'refused') return <Recovery snapshot={snapshot} />;
  const { state, saveError, archived } = snapshot;
  const tab = page === 'bring' || page === 'choice' ? 'bring' : page === 'map' ? 'map' : 'home';

  return (
    <CardHost state={state} links={page !== 'situation' && page !== 'bring'}>
      <div className={`app${focused ? ' focused' : ''}`}>
        {focused ? (
          <header className="topbar">
            <a className="back" href={from.current}>
              <BackIcon />
              {BACK[from.current.slice(2).split('/')[0]] ?? 'Stories'}
            </a>
          </header>
        ) : (
          // The nav comes first for assistive tech; CSS places it at the bottom.
          <nav className="tabbar" aria-label="Primary">
            {TABS.map(({ route: r, href, label, Icon }) => (
              <a key={r} className="tab" href={href} aria-current={tab === r ? 'page' : undefined}>
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
                Tell has changed. Your record from {earlierName(archived)} is kept exactly as it was, and you can download it from{' '}
                <a className="link" href="#/about">
                  About
                </a>
                .
              </p>
            )}
            <UpdateNotice />
            {page === 'map' ? (
              <MapPage state={state} />
            ) : page === 'bring' ? (
              <BringPage state={state} />
            ) : page === 'choice' ? (
              <ChoicePage key={arg} state={state} id={arg} />
            ) : page === 'about' ? (
              <About state={state} />
            ) : page === 'situation' ? (
              <SituationPage key={arg} state={state} id={arg} />
            ) : page === 'play' ? (
              <PlayPage key={arg} state={state} id={arg} />
            ) : (
              <Home state={state} />
            )}
          </div>
        </main>
      </div>
    </CardHost>
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
