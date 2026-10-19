# Tell

**See what would make a choice clearer.**

Tell is a playful choice workshop for people making creative work and independent projects. Two
ways in:

- **Bring a choice** you keep circling. Give it a title, pick what feels unresolved (or "Not
  sure"), and Tell walks you through only those parts of four questions: **Purpose** (what would
  make it worthwhile?), **Possibilities** (are these the right options?), **Priorities** (what
  matters when good things conflict?) and **Evidence** (what could change what you'd do?). It ends
  with an editable summary of what became clearer, what's still open and an optional next move,
  with an expectation you can compare against later. Drafts save as you type.
- **Play a story**: twelve short invented stories, three per question, each with a first answer,
  one twist or reveal (a Cut, a Peek, a Slide, more options, or a change of context), a second
  answer and an ending that keeps what you answered apart from what it might mean and what stays
  unknown.

The **Map** puts your current choices and the takeaways you chose to keep first, with the full
history underneath: every play, save and outcome, labelled by kind, with its evidence. During a
real choice, Tell may offer up to two past examples that share its structure, saying why each
appeared; you decide whether it applies.

Tell never chooses for you, never reads meaning into your words, and never scores, reminds or
nudges. Everything stays on your device.

Why it exists and its method: [CHARTER.md](CHARTER.md). Rules for changing it:
[AGENTS.md](AGENTS.md). The dated why: [DECISIONS.md](DECISIONS.md). Not yet built:
[FUTURE.md](FUTURE.md). How to pilot it: [PILOT.md](PILOT.md).

## Run it

```bash
npm install
npm run dev        # http://tell.localhost:5291
npm test           # unit tests, episode checks, contrast, browser journeys (Chromium + WebKit), production build
npm run build      # type-check and build the PWA into dist/
npm run preview    # serve the build on http://tell.localhost:4291
```

The browser journeys need Playwright's Chromium and WebKit (`npx playwright install chromium webkit`).
They fail, rather than skip, if a browser is missing. Use `tell.localhost` rather than `localhost`
in a browser you also use for other local apps: storage is per origin.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: the full test suite, then the build. Publishing
to GitHub Pages is switched on by the repository variable `DEPLOY_PAGES=true`, once Pages is available
for the repository (GitHub's plan doesn't include Pages for a private repository). The build uses
relative paths and hash routing, so it runs from any static host or sub-path.

## How it's built

| Concern | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite, hand-written CSS (`src/styles/global.css`) |
| PWA | `vite-plugin-pwa`, prompts before updating, CSP `connect-src 'self'` |
| Data | One validated JSON document in localStorage; export, restore, plain text |
| Logic | Pure domain in `src/domain/` with an explicit clock |
| Tests | Vitest, plus Playwright driven as a library at phone sizes |

```
src/
  domain/   types, episodes (content and rationale), engine (plays, choices, takeaways,
            outcomes, matching, text), validate (the one door, and migration), text
  mechanics.tsx  Slide and Cut, shared by episodes
  store/    persistence and data safety
  pages/    Home, Episode (play, ending, pass the phone), Choice (flow, saved view, follow-up),
            Map, About
  styles/   design tokens and components
tests/      contrast check, browser journeys, production build
```

Icons are generated from `public/icon.svg` with `npm run icons`.
