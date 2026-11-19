# AGENTS.md — rules for anyone extending Tell

The contract for humans and AI agents. `CHARTER.md` says why Tell exists; this file says what
the code must keep true, and where each rule is enforced. Current rules only, each once. The
why goes in a dated `DECISIONS.md` entry; deferred ideas go in `FUTURE.md`; how content is made
is in `CONTENT.md`.

## Hard do-nots (only an owner decision recorded in DECISIONS.md changes one)

- **No runtime AI, accounts, analytics or third-party network.** The build ships a CSP with
  `connect-src 'self'` (`vite.config.ts`, checked by `tests/pwa.browser.test.ts`). Nothing is
  shared except files the player downloads. Sources open as links; nothing is fetched.
- **No pressure.** No streaks, scores, tallies of right answers, points, levels, notifications,
  reminders, daily locks, expiry, autoplay or counts of what's left. A round with a right answer
  shows it, once, for that question; nothing adds answers up. (`PRESSURE` in `tests/wording.ts`,
  applied to every screen in the journeys and to all content.)
- **No inference about the player.** Never describe the person, infer a trait, belief or
  preference from their answers, or turn plays into a statement about them. Plays decide only
  which round Play offers next and which connections can be shown. (`DESCRIBES_YOU` in
  `tests/wording.ts`; `src/domain/engine.ts`.)
- **No invented authority.** Every factual claim in a round is sourced and marked how sure it
  is; a saying is attributed only with a source; nothing invented passes as traditional wisdom.
  (`src/content/content.test.ts`; the review in `CONTENT.md`.)
- **Phone first.** Designed and verified at 390×844 and 375×667 in Chromium and WebKit
  (`tests/journeys.browser.test.ts`). Wider screens show the same centred column.

## Two areas (`src/App.tsx`, `src/pages/`)

- **Play** opens straight into a playable round: the first in the collection's order not yet
  played or skipped (`nextUp`). Skipped rounds come back once the rest are played. When all are
  played, Play says so plainly and offers any round again. "All rounds" lists every round, with
  Played and In my Book tags and no count of what's left.
- **My Book** holds kept ideas, newest first, with search from five ideas up. Each idea opens to
  its words (editable; the original is kept and restorable), its round (playable again), its
  connections and its sources. The Book downloads as plain text.
- A round opened from a list, an idea, the list of rounds and About take the whole screen, with
  one way back at the top to the screen they came from. Leaving a round part-way asks nothing and
  loses nothing for the session (`src/round.tsx`); a round is recorded only when it ends.

## Rounds (`src/content/`, `src/domain/types.ts`; `content.test.ts`)

- A round is one to three steps, each a `choose`, `estimate`, `order` or `quickfire`, with a
  setup, a prompt and a reveal (optionally views: serious answers side by side). Then one
  takeaway (a question, a way to think, a saying or an insight), links, and claims with sources.
  Add a step kind only when a round genuinely needs it.
- A step has a right answer only when one exists. Dilemmas and questions of interpretation have
  none; their reveal shows how people have answered.
- An estimate starts with no value (the slider's minimum is never the answer); an order step is
  shown in a fixed scramble that is never the answer.
- **Links** are written by hand on one end only: `{ to, how, note }`, where `how` is supports,
  challenges, qualifies or reinterprets, read "this round's idea <how> that one's". The note
  must read well from either end. Every round has at least one connection; the third round
  links to the first, so a first run meets a connection early.
- A link to a round not yet played names it and the relation, never its note or idea.
- Claims carry a status (established, disputed, interpretation, tradition or legend,
  hypothetical) and at least one https source. A round says what it invents or simplifies
  (`note`) and when it was checked (`checked`).
- Text is plain: paragraphs split by a blank line, `*emphasis*` for titles of works, typographic
  quotes only. Every round fits in a few minutes (word limit in the test).
- Never reuse a round id for different content; bump `v` when meaning changes; never remove a
  round (a kept idea names it). Order in `src/content/index.ts` is the first-run order.

## Records and data safety (`store.ts`, `validate.ts`; `store.test.ts`; journey "data that can't be used")

- One validated JSON document in localStorage (schema 7): plays (round, version, time, answers),
  the Book (each idea's text, the round's original wording, title and kind, so it keeps its
  meaning if content changes), skipped rounds, and an archive. Content is never stored.
- Every inbound document (load, restore) passes `validateState`; a refusal names the problem and
  changes nothing. Unreadable data, and data from a newer schema, is refused with memory and disk
  untouched. The only ways on: download it as it is, restore a valid backup, or an explicit Start
  fresh (never for newer data).
- A document from an earlier Tell (schemas 1–6) is kept whole in `archive`, with anything it had
  archived lifted beside it, downloadable from About (Tell 4's also as plain text). Nothing in it
  is reread. Tested against real 2.0, 3.0, 3.1 and 4.1 documents (`tests/fixtures`). From schema 7
  on, a newer schema migrates plays and the Book rather than archiving them.
- A failed write is shown, never swallowed, and the state stays in memory. An unchanged state
  isn't rewritten.

## Architecture and tests

- `src/domain/` is pure, React-free and takes an explicit `now`. Only `store.ts` persists;
  components change state through `store.update(pureTransition)`.
- Effect bodies are wrapped in braces: Chromium's `scrollTo` returns a Promise.
- `npm test` must pass: unit tests, the content checks, colour contrast against the shipped
  stylesheet, browser journeys in Chromium and WebKit at both phone sizes, and the production
  build under its CSP, offline (Chromium) and through Export → Restore (both engines). A missing
  browser fails, never skips.
- Every journey screen is checked for sideways overflow (the page and `<main>`), page scrolling
  (only `<main>` scrolls), controls under 44px and the wording rules. A new round shown in place
  starts at the top with its title focused.
