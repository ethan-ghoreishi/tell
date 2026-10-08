# Tell

**A few minutes of play. A clearer view of how you see.**

Tell is a phone app of short games. Each day it deals four rounds: a scene from the world or from
your own work, and a few ways of explaining it. You tap the one you'd look into first, or the
one closest to your experience. A short reveal shows what that angle sees and misses, and what
your answer just added to your map.

The map is the point. It keeps every answer, with the rounds behind every number. Each angle
is shown as picked out of offered. Matched world and work scenes sit side by side, and paired
choices show both answers when a choice returns with one detail changed. Lines you keep stay
too. Nothing to memorise, nothing lost.

Why it exists and what it refuses: [CHARTER.md](CHARTER.md). Rules for changing it:
[AGENTS.md](AGENTS.md). The dated why: [DECISIONS.md](DECISIONS.md). Not yet built:
[FUTURE.md](FUTURE.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:5291
npm test           # unit tests, contrast, and browser journeys (Chromium + WebKit)
npm run build      # type-check and build the PWA into dist/
npm run preview    # serve the build on http://localhost:4291
```

The browser journeys need Playwright's Chromium and WebKit (`npx playwright install chromium webkit`).
They fail, rather than skip, if a browser is missing.

## How it's built

| Concern | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite, hand-written CSS (`src/styles/global.css`) |
| PWA | `vite-plugin-pwa`, prompts before updating, CSP `connect-src 'self'` |
| Data | One validated JSON document in localStorage, export and restore |
| Logic | Pure domain in `src/domain/` with an explicit clock |
| Tests | Vitest, plus Playwright driven as a library at phone sizes |

```
src/
  domain/   types, the deck (content), engine (dealing, counting, the gate), validation
  store/    persistence and data safety
  pages/    Play, Map, About
  styles/   design tokens and components
tests/      contrast check and browser journeys
```

Icons are generated from `public/icon.svg` with `npm run icons`.
