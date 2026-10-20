# Tell

**Short stories to play, and the distinctions your choices turn up.**

Six small worlds, each a choice somewhere unfamiliar and two or three minutes long: an old oak
leaning over a school path, a new loaf in an old bakery, a vineyard waiting on a storm, a film
set losing its light, an uncle's wooden boat, a packet of seeds nobody grows any more. Each is
played its own way (finding things out from a budget, comparing plans, waiting day by day,
sharing ten rows, asking someone) and ends when its story does, with other reasonable ways
through. Stories that borrow from a real field say what's real, with sources, and what's
invented.

Now and then two of your choices, in different stories, turn up a distinction worth keeping:
felling the oak and shelving the loaf meet differently from fencing the oak and shelving it. The
**Map** keeps those, newest first, a heading and a sentence or two each, with your choices and
where the comparison breaks a tap away. It shows what you chose, never why, and never describes
you. Replays can add to it; nothing found is ever rewritten.

Underneath, every answer in every story is a move: whether it can be taken back, what it does
about what isn't known, what it leaves possible, and what it costs and risks. That model, from
decision analysis, keeps connections honest, and keeps what a future Bring a choice would draw
on.

No accounts, analytics or AI. Everything stays on your device.

Why it exists: [CHARTER.md](CHARTER.md). Rules for changing it: [AGENTS.md](AGENTS.md). The
dated why: [DECISIONS.md](DECISIONS.md). Not yet built: [FUTURE.md](FUTURE.md). How to pilot it:
[PILOT.md](PILOT.md).

## Run it

```bash
npm install
npm run dev        # http://tell.localhost:5291
npm test           # unit, content and review tests, contrast, browser journeys (Chromium + WebKit), production build
npm run build      # type-check and build the PWA into dist/
npm run preview    # serve the build on http://tell.localhost:4291
```

The browser journeys need Playwright's Chromium and WebKit (`npx playwright install chromium webkit`).
They fail, rather than skip, if a browser is missing. Use `tell.localhost` rather than `localhost`
in a browser you also use for other local apps: storage is per origin.

To read every way through every story, and every combination of two with the connection it
would show (the editorial review):

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
| Data | One validated JSON document in localStorage; backup, restore, plain text |
| Logic | Pure domain in `src/domain/` with an explicit clock |
| Tests | Vitest, plus Playwright driven as a library at phone sizes |

```
src/
  domain/   types (the model of moves), situations (stories, sources and connections), engine
            (plays, endings, discoveries, plain text), validate (the one door), text
  steps.tsx the four controls: choose, uncover, allocate, days
  store/    persistence and data safety
  pages/    Home (the collection), Play (a story, its ending, discovery cards), Map, About
  styles/   design tokens and components
tests/      review walk, contrast, browser journeys, production build, real 2.0 and 3.0 documents
```

Icons are generated from `public/icon.svg` with `npm run icons`.
