# Tell

**A game of ideas that stay with you.**

Short rounds, a few minutes each: why the night sky is dark, a ship rebuilt plank by plank, a rat
bounty in 1902 Hanoi, a piece of music with no notes, a pasture shared for five centuries, a word
Captain Cook's crew wrote down. Each round asks something (pick an answer, make a guess, put
things in order, make quick calls) and then shows what happened, what is true, or how people
have argued about it. Some questions have right answers; some don't.

Each round leaves one idea worth keeping. Keep it in a tap, in its words or yours, and it goes
into **My Book**, where ideas show how they connect: one supports, challenges, qualifies or
reinterprets another. Every fact names its sources and says how sure it is.

No accounts, analytics or AI. No scores or streaks. Everything stays on your device.

Why it exists: [CHARTER.md](CHARTER.md). Rules for changing it: [AGENTS.md](AGENTS.md). How
rounds are researched and checked: [CONTENT.md](CONTENT.md). The dated why:
[DECISIONS.md](DECISIONS.md). Not yet built: [FUTURE.md](FUTURE.md).

## Run it

```bash
npm install
npm run dev        # http://tell.localhost:5291
npm test           # unit and content checks, contrast, browser journeys (Chromium + WebKit), production build
npm run build      # type-check and build the PWA into dist/
npm run preview    # serve the build on http://tell.localhost:4291
```

The browser journeys need Playwright's Chromium and WebKit (`npx playwright install chromium webkit`).
They fail, rather than skip, if a browser is missing. Use a `*.localhost` origin of its own in a
browser you also use for other local apps: storage is per origin.

The content review (spoils every round; for whoever checks the facts):

```bash
REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: the full test suite, then the build, then
GitHub Pages (switched on by the repository variable `DEPLOY_PAGES=true`):
https://ethan-ghoreishi.github.io/tell/. The build uses relative paths and hash routing, so it
runs from any static host or sub-path. An installed copy asks before updating.

## How it's built

| Concern | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite, hand-written CSS (`src/styles/global.css`) |
| PWA | `vite-plugin-pwa`, prompts before updating, CSP `connect-src 'self'` |
| Content | Typed rounds in `src/content/`, one file per pack, checked by `content.test.ts` |
| Data | One validated JSON document in localStorage; backup, restore, plain text |
| Logic | Pure domain in `src/domain/` with an explicit clock |
| Tests | Vitest, plus Playwright driven as a library at phone sizes |

```
src/
  content/  the rounds (pack-1.ts), their order (index.ts), and the checks on them
  domain/   types, engine (next round, plays, the Book, connections, search, plain text),
            validate (the one door), archive (earlier records as text)
  round.tsx a round: steps, reveals, the idea, connections, sources
  steps.tsx the four step controls: choose, estimate, order, quickfire
  store/    persistence and data safety
  pages/    Play (the round in play, all rounds), Book (ideas, an idea), About
  styles/   design tokens and components
tests/      journeys, production build, contrast, wording rules, review dump, real records
            from Tell 2.0, 3.0, 3.1 and 4.1
```

Icons are generated from `public/icon.svg` with `npm run icons`.
