# AGENTS.md — rules for anyone extending Tell

The contract for humans and AI agents. `CHARTER.md` says why Tell exists; this file says what
the code must keep true, and where each rule is enforced. Current rules only, each once. The
why goes in a dated `DECISIONS.md` entry; deferred ideas go in `FUTURE.md`.

## Hard do-nots (only an owner decision recorded in DECISIONS.md changes one)

- **No runtime AI, accounts, analytics or third-party network.** The build ships a CSP with
  `connect-src 'self'` (`vite.config.ts`). Lessons are shared only as a file the player
  downloads and someone else adds.
- **No pressure mechanics.** No streaks, penalties, leaderboards, loss-framed nudges, prompts to
  come back or autoplay. Play is allowed when it is honest about the evidence: the chart filling
  in, ranges, guess-then-Slide counts, pass the phone. Everything is a count with a denominator,
  never a score.
- **No diagnosis.** Never describe the person ("you are", "you often"), name a bias or infer a
  trait. Results describe choices; probes cite the record. Contrasts that differ only in wording
  are never shown.
- **Phone only.** Designed and verified at 390×844 and 375×667
  (`tests/journeys.browser.test.ts`). Wider screens show the same centred column.

## The record stays true

- Runs and calls are append-only snapshots of what was shown and answered (`record`, `addCall`
  in `engine.ts`). Results and the Map read the snapshots, never the current content (test
  "keeps past results when the content is later edited").
- `record` refuses a play that isn't what it claims: a Slide's answers must be the halving
  sequence, a Cut drops four, a Spend spends ten and clashes as `clashPairs` says.
- Every count shows its denominator. A pattern shows its rule and an alternative explanation
  (`MapPage.tsx`).
- A repeated choice needs `REPEAT_MIN` times and `REPEAT_SHARE` of its chances; once shown it
  stays, marked "No longer holds" (`patterns`; test "shows a repeated choice only at three times").
- A context change needs the same Slide with and without its condition `CHANGE_GAP` intervals
  apart (test "counts a context change only when…"). Changing a rule changes About in the same commit.
- A verdict (Seems right, Coincidence, Not sure) is a note with the counts at the time; it never
  changes what is shown (test "never changes a pattern because of the player's verdict").
- Anything the app asks the player to record, the Map shows: guesses, ratings, "It depends",
  unopened facts, calls, follow-ups, principles, shared lessons.

## The experiments (`src/domain/content.test.ts` enforces)

- Slides: `{x}` once, in option B only; `{y}` once if and only if there is an alt dial; seven
  ascending steps, each 1.3–3.5× the last; each option gives one different factor and the rising
  option gives the dial's; each trade-off in three contexts; each condition tag on ≥3 Slides.
- Cuts, Spends and Peeks: five items with five different factors; Spend features differ high to
  low; Peek facts differ between options and favour each side at least once.
- Every factor can be priced by a Slide and protected by a Cut.
- No currency symbols (amounts are `{x}`, `{y}`, `{m:N}`), no psychology vocabulary, length
  limits, no near-duplicates. Situations are invented single instances. Review rule: the test
  can't judge meaning, so a person reads every new experiment.
- Append new experiments; never reuse an id for different content; bump `v` when meaning changes.
  Array order is the tie-break when picking, so place new ones deliberately.

## Picking experiments (`engine.ts`; tests under "sets")

- One set a day, `SET_SIZE` experiments plus any "It depends" adds, planned one step at a time and
  stored, so a reload never changes it. An unfinished set lapses at midnight.
- Probe: mechanic by `ROTATION`, then the published tiers (open call, a change seen once,
  untested trade-off, open-ended result, retest after `RETEST_DAYS`, next in list). Stress-test:
  the probe's condition, or a Slide pricing what the probe surfaced. Connect: the same trade-off
  in another context. Every step stores its reason and shows it. Never random.
- Cut items and Peek facts rotate by one per play of that mechanic.
- Never add a "more sets" path or a cap bypass; tests move days with Playwright's clock. The
  60-day simulation (test "plays sixty days in a row") must keep passing when content changes.

## Calls and lessons (`engine.ts`, `validate.ts`; tests under "calls and lessons")

- A lesson holds only kind, went, feature ids, check ids and a count of other misses. The
  player's words never enter a lessons file (test "shares lessons in fixed vocabulary only").
- Imported lessons pass `readLessons`, are de-duplicated by their random lesson id (never your
  own, never one already added; test "counts each shared call once"), and show an item only once
  `POOL_MIN` shared calls report it. Tell's own checklist is labelled as written by Tell.

## Data safety (`store.ts`, `validate.ts`; `store.test.ts`; journey "data that can't be used")

- One validated JSON document in localStorage. Every inbound document (load, restore, lessons)
  passes validation; a refusal names the problem and changes nothing.
- Unreadable, older-schema or newer data is refused with memory and disk untouched. The only ways
  on: download it as it is, restore a valid backup, or an explicit Start fresh (never for newer).
- A failed write is shown, never swallowed, and the state stays in memory.

## Architecture and tests

- `src/domain/` is pure, React-free and takes an explicit `now`. Only `store.ts` persists;
  components change state through `store.update(pureTransition)`.
- Effect bodies are wrapped in braces: Chromium's `scrollTo` returns a Promise.
- `npm test` must pass: unit tests, the content recipe, colour contrast against the shipped
  stylesheet, browser journeys in Chromium and WebKit, and the production build under its CSP,
  offline and through Export → Restore. A missing browser fails, never skips.
- A toggle with `aria-pressed` also shows its state by class. Only `<main>` scrolls; the tab bar
  sits at the bottom; tap targets are at least 44px.
