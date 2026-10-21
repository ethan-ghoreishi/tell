# Tell

**Short stories to play, the moves they teach, and a way to bring a real choice.**

Six small worlds, each a choice somewhere unfamiliar and two or three minutes long: an old oak
leaning over a school path, a new loaf in an old bakery, a vineyard waiting on a storm, a film
set losing its light, an uncle's wooden boat, a packet of seeds nobody grows any more. Each is
played its own way (finding things out from a budget, comparing plans, waiting day by day,
sharing ten rows, asking someone) and ends when its story does, with other reasonable ways
through. Stories that borrow from a real field say what's real, with sources, and what's
invented.

Every option in them is a **move** in a small language for choices under uncertainty: look first,
try it small, hold it open, buy a spare, rule it out and ten more, each with its price and the
point where it breaks. The moves show on the options as you choose, under the **shape** of the step
the story turns on, four cells: can it be undone, when will you know, what waiting does, how bad it
could get. Each ending says what your moves cost and risked there. Three stories can be played
again with **one fact changed** (the harvest without forecasts, the boat with no deadline, the film
with a second camera), and the two plays sit side by side. Tap any move or cell for its card.

The **Map** is the language with your plays on it: every move, and where you made each. It shows
what you chose, never why, and never describes you.

**Bring a choice** asks those four questions about a real step you're unsure of, in taps, and
shows the moves that fit, by rule, each with the question it puts: the same answers always show
the same moves, nothing is ranked, and settling it is always there. Keep the choice if you like,
mark what you're trying, add a note. Tell never reads what you type.

No accounts, analytics or AI. Everything stays on your device.

Nobody but its builder has used 4.1 yet: whether people read a choice the same way, and whether
the moves help, is for the pilot to show ([PILOT.md](PILOT.md)).

Why it exists: [CHARTER.md](CHARTER.md). Rules for changing it: [AGENTS.md](AGENTS.md). The
dated why: [DECISIONS.md](DECISIONS.md). Not yet built: [FUTURE.md](FUTURE.md).

## Run it

```bash
npm install
npm run dev        # http://tell.localhost:5291
npm test           # unit, language, content and review tests, contrast, browser journeys (Chromium + WebKit), production build
npm run build      # type-check and build the PWA into dist/
npm run preview    # serve the build on http://tell.localhost:4291
```

The browser journeys need Playwright's Chromium and WebKit (`npx playwright install chromium webkit`).
They fail, rather than skip, if a browser is missing. Use `tell.localhost` rather than `localhost`
in a browser you also use for other local apps: storage is per origin.

To read the language, every way through every story with the moves it names, and what Bring a
choice shows for the reference choices (the editorial review):

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
  domain/   language (four questions, fifteen moves, the rules), situations (stories and
            sources), engine (plays, kept choices, what the record holds, plain text),
            validate (the one door), types, text
  steps.tsx the four controls: choose, uncover, allocate, days, each showing its moves
  lens.tsx  what every screen shares: a move's pill, a shape's four cells, and the card each opens
  store/    persistence and data safety
  pages/    Home (the collection), Play (a story, its ending, a story beside its variant), Map
            (the language and your plays), Bring (a real choice, and kept ones), About
  styles/   design tokens and components
tests/      review walk, wording rules, contrast, browser journeys, production build, real 2.0,
            3.0 and 3.1 documents, the reference choices
```

Icons are generated from `public/icon.svg` with `npm run icons`.
