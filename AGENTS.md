# AGENTS.md — rules for anyone extending Tell

The contract for humans and AI agents. `CHARTER.md` says why Tell exists; this file says what
the code must keep true, and where each rule is enforced. Current rules only, each once. The
why goes in a dated `DECISIONS.md` entry; deferred ideas go in `FUTURE.md`.

## Hard do-nots (only an owner decision recorded in DECISIONS.md changes one)

- **No runtime AI, accounts, analytics or third-party network.** The build ships a CSP with
  `connect-src 'self'` (`vite.config.ts`). Nothing is shared except files the player downloads.
  Links to sources open in the browser; nothing is fetched.
- **No pressure.** No streaks, scores, penalties, leaderboards, notifications, reminders, due
  dates, completion meters, counts of what's left to find or of what's new, loss-framed nudges,
  autoplay, daily locks, expiry or artificial replenishment. Plays and replays start only when
  the player chooses.
- **No diagnosis.** Never describe the person ("you are", "you tend", "you prefer"), name a bias,
  infer a trait, motive, stable preference or cause, or turn answers into a recommendation. Never
  aggregate across connections ("you often…"). No psychometrics; no claims of clinical,
  psychological or scientifically validated benefit.
- **Tell doesn't choose.** No story has a right answer, no text rewards one, and no ending makes
  one right in hindsight.
- **Phone first.** Designed and verified at 390×844 and 375×667 in Chromium and WebKit
  (`tests/journeys.browser.test.ts`). Wider screens show the same centred column.

## Stories (`SITUATIONS` in `src/domain/situations.ts`; `situations.test.ts`)

- A small, finite collection. Adding one is a content release, never something the app does by
  itself. Repair or replace weak material before adding more. Append; never reuse an id for
  different content; bump `v` when meaning changes, here and in every connection side naming it.
- A story is a setup, what isn't known (`uncertain`), one or more steps, and an ending. Steps are
  `choose` (optionally with words that follow from an earlier answer, or an ask that brings an
  answer or another option), `uncover` (facts from a budget that can't buy them all), `allocate`
  (something scarce) and `days` (act or wait as news arrives). Add a kind only when a story
  needs it.
- **Every answer is a move** (`MOVES` in `types.ts`): action, uncertainty, future options, and its
  consequences as what it costs and what it risks. No move is free.
- No two stories share an arrangement of steps, and every kind is used.
- Every path reaches an ending written for it, and `others` shows more than one reasonable way
  through in a sentence or two. Asking or looking never guarantees a reward: what it returns
  informs without settling, or brings an option with its own costs.
- A story that rests on real-world facts lists them in `real`, each with at least one reliable
  source (https), and says what it invents. Facts are checked before they ship.
- Word limits, no psychology vocabulary, no sentences describing the player, no verdict words,
  no currency symbols (`situations.test.ts`).

## Connections (`CONNECTIONS` in `situations.ts`; `engine.ts`: `discoveries`)

- Written by hand, never computed from words. Each side names exactly which answers it fits
  (`when`) and what it claims the model says about them (`claims`); the test checks the claims.
- **No flattening:** a side may group answers only if the model describes them identically.
- **At most one connection for any two ways through two stories** (`tests/review.test.ts` walks
  every combination). Combinations with nothing true and useful to say get nothing; the review
  printout lists them so each omission is deliberate.
- `says` leads: one or two sentences about the moves, never the player. `breaks` says where the
  comparison stops holding; `question` is one to carry to a real choice. The player's choices
  are fixed sentences from the record, shown on request.
- Every story is reachable by at least two connections, so the Map can grow with play.
- A discovery is anchored to the earliest moment both sides fitted; later plays add examples but
  never change it. Only plays at the version a connection names count. "New" is a word, shown
  until the connection has been seen (`seen`, stored with its first sighting).
- Review rule: tests can't judge whether a story is interesting or a connection useful. A person
  reads every path and every combination before content ships:
  `REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts`.

## Records and data safety (`store.ts`, `validate.ts`; `store.test.ts`; journey "data that can't be used")

- One validated JSON document in localStorage: plays, `seen` and an archive. A play snapshots
  the story it showed, including every option's move, so a future Bring a choice can draw on what
  was possible, what was unknown and what was chosen. Discoveries are derived, never stored.
  Nothing the player answered is rewritten.
- `answersProblem` is the one check of a play's answers, used by `recordPlay` and on load.
- Every inbound document (load, restore) passes `validateState`; a refusal names the problem and
  changes nothing. Unreadable or newer data is refused with memory and disk untouched. The only
  ways on: download it as it is, restore a valid backup, or an explicit Start fresh (never for
  newer data).
- A document from an earlier Tell (schemas 1–4) is kept whole in `archive`, downloadable from
  About; nothing in it is reread (tested against real 2.0 and 3.0 documents, `tests/fixtures`).
- A failed write is shown, never swallowed, and the state stays in memory.

## Architecture and tests

- `src/domain/` is pure, React-free and takes an explicit `now`. Only `store.ts` persists;
  components change state through `store.update(pureTransition)`.
- Effect bodies are wrapped in braces: Chromium's `scrollTo` returns a Promise.
- `npm test` must pass: unit tests, the content and model checks, the review walk, colour
  contrast against the shipped stylesheet, browser journeys in Chromium and WebKit at both phone
  sizes, and the production build under its CSP, offline (Chromium) and through Export → Restore
  (both engines). A missing browser fails, never skips.
- Every journey screen is checked for sideways overflow, page scrolling (only `<main>` scrolls)
  and controls under 44px. The tab bar sits at the bottom.
