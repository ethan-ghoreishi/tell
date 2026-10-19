# Tell

**Small situations to play, and what connects the choices you make in them.**

Six invented situations, each a small choice somewhere different and two or three minutes long:
an old oak leaning over a school path, a new loaf in an old bakery, a vineyard waiting on a
storm, a lighthouse keeper's winter order, an uncle's wooden boat, a packet of seeds nobody grows
any more. Each is played its own way (finding things out from a budget, comparing plans, waiting
day by day, sharing ten rows, asking and finding another option) and ends when its story does,
with other reasonable ways through.

Some share a shape with another set somewhere quite different. Once both have been played, the
**Map** shows what connects them, what you chose in each, a note for that combination of
choices, and a question to take elsewhere. It shows what you chose, never why, and never
describes you. Whether those connections are useful is the hypothesis Tell exists to test.

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

To read every way through every situation and every connection's notes (the editorial review):

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
  domain/   types (the model), situations (content and connections), engine (plays, endings,
            connections, plain text), validate (the one door), text
  steps.tsx the four controls: choose, uncover, allocate, days
  store/    persistence and data safety
  pages/    Home (the collection), Play (a situation and its ending), Map, About
  styles/   design tokens and components
tests/      review walk, contrast, browser journeys, production build, a real 2.0 document
```

Icons are generated from `public/icon.svg` with `npm run icons`.
