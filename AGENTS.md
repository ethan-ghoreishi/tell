# AGENTS.md — rules for anyone extending Tell

The contract for humans and AI agents. `CHARTER.md` says why Tell exists; this file says what
the code must keep true, and where each rule is enforced. Current rules only, each once. The
why goes in a dated `DECISIONS.md` entry; deferred ideas go in `FUTURE.md`.

## Hard do-nots (only an owner decision recorded in DECISIONS.md changes one)

- **No runtime AI, accounts, analytics or third-party network.** The build ships a CSP with
  `connect-src 'self'` (`vite.config.ts`). Nothing is shared except files the player downloads.
- **No pressure.** No streaks, scores, penalties, leaderboards, notifications, reminders, due
  dates, completion meters or counts of what's left to find, loss-framed nudges, autoplay, daily
  locks, expiry or artificial replenishment. Plays and replays start only when the player chooses.
- **No diagnosis.** Never describe the person ("you are", "you tend", "you prefer"), name a bias,
  infer a trait, motive or stable preference, or turn answers into a recommendation. No
  psychometrics; no claims of clinical, psychological or scientifically validated benefit.
- **Tell doesn't choose.** No situation has a right answer, and no text rewards one.
- **Phone first.** Designed and verified at 390×844 and 375×667 in Chromium and WebKit
  (`tests/journeys.browser.test.ts`). Wider screens show the same centred column.

## Situations (`src/domain/situations.ts`; `situations.test.ts` enforces the shape)

- A small, finite collection. Adding one is a content release, never something the app does by
  itself. Append; never reuse an id for different content; bump `v` when meaning changes, and
  bump the connection's side to match.
- A situation is a setup, one or more steps, and an ending. Steps are `choose` (optionally with
  words that follow from an earlier answer, or an option found by asking), `uncover` (facts from a
  budget that can't buy them all), `allocate` (something scarce, the last item taking the rest)
  and `days` (act or wait as news arrives). Add a kind only when a situation needs it.
- No formula: no two situations share the same arrangement of steps, and every kind is used.
- Every path reaches an ending written for it (`closing`, keyed by an answer), and `others` shows
  more than one reasonable way through. Endings never reveal an outcome that makes one answer
  right in hindsight; where the story must reveal news, every answer keeps a cost and a case.
- Each situation declares its `structure` on the model (`MODEL` in `types.ts`).
- Word limits, no psychology vocabulary, no sentences describing the player, no verdict words,
  no currency symbols (`situations.test.ts`).
- Review rule: tests can't judge whether a situation is interesting or a connection useful. A
  person reads every path and every combination before content ships:
  `REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts`.

## Connections (`CONNECTIONS` in `situations.ts`; `engine.ts`: `found`)

- Authored, never computed from words. Each joins two situations that differ on the model field
  it names (`on`); the test checks the difference. Each situation joins at most one connection.
- A connection appears only once both situations have been played at the version it was written
  for, and uses the first play of each. Until then an ending says one exists, never which. The
  two are never adjacent in the collection.
- It shows what connects them, what each play chose (fixed sentences from the record), the note
  written for that combination of classes, and a question. Every combination has a note
  (test), and no note may read as endorsing a combination.
- What the answers can't show is a fixed sentence in code (`limitLine`), not content.

## Records and data safety (`store.ts`, `validate.ts`; `store.test.ts`; journey "data that can't be used")

- One validated JSON document in localStorage: plays and an archive. A play snapshots the
  situation it showed, so nothing shown later depends on today's content. Connections are
  derived, never stored. Nothing the player answered is rewritten.
- `answersProblem` is the one check of a play's answers, used by `recordPlay` and on load.
- Every inbound document (load, restore) passes `validateState`; a refusal names the problem and
  changes nothing. Unreadable or newer data is refused with memory and disk untouched. The only
  ways on: download it as it is, restore a valid backup, or an explicit Start fresh (never for
  newer data).
- A document from an earlier Tell (schemas 1–3) is kept whole in `archive`, downloadable from
  About; nothing in it is reread (tested against a real 2.0 document, `tests/fixtures`).
- A failed write is shown, never swallowed, and the state stays in memory.

## Architecture and tests

- `src/domain/` is pure, React-free and takes an explicit `now`. Only `store.ts` persists;
  components change state through `store.update(pureTransition)`.
- Effect bodies are wrapped in braces: Chromium's `scrollTo` returns a Promise.
- `npm test` must pass: unit tests, the content checks, the review walk, colour contrast against
  the shipped stylesheet, browser journeys in Chromium and WebKit at both phone sizes, and the
  production build under its CSP, offline (Chromium) and through Export → Restore (both engines).
  A missing browser fails, never skips.
- Every journey screen is checked for sideways overflow, page scrolling (only `<main>` scrolls)
  and controls under 44px. The tab bar sits at the bottom.
