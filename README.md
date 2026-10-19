# Tell

**Tell never asks you the hard question. It asks small, easy choices and shows what they add up to.**

Tell is a phone app of small choice experiments. Each day it deals a set of three: a **Slide**
(one amount changes until you switch), a **Cut** (drop one of five good things at a time), a
**Spend** (ten coins, then choose where they clash) or a **Peek** (open a few hidden facts and see
which ones move you). Each set probes something your map doesn't know yet, stress-tests it with
one condition changed, and connects it to the same trade-off elsewhere. Every experiment says why
it was chosen.

Bring a real call to **Decide** and the same experiments run on your own options: what matters,
what would switch you, which unknowns are worth finding out, and a brief for your own AI. Two
weeks later Tell asks how it went.

The **Map** keeps it all: your numbers for each trade-off, what you protect, what moves your
lean, said against chose, patterns with their rules, your calls, lessons from closed calls
(shareable as a file of Tell's fixed vocabulary only) and the principles you keep.

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
  domain/   types, content (experiments and kinds of call), engine (picking, mechanics,
            results, patterns, calls, lessons), validation, text
  mechanics.tsx  the four experiments as screens
  store/    persistence and data safety
  pages/    Today, Decide (and a call's page), Map, About
  styles/   design tokens and components
tests/      contrast check and browser journeys
```

Icons are generated from `public/icon.svg` with `npm run icons`.
