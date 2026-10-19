# AGENTS.md — rules for anyone extending Tell

The contract for humans and AI agents. `CHARTER.md` says why Tell exists; this file says what
the code must keep true, and where each rule is enforced. Current rules only, each once. The
why goes in a dated `DECISIONS.md` entry; deferred ideas go in `FUTURE.md`.

## Hard do-nots (only an owner decision recorded in DECISIONS.md changes one)

- **No runtime AI, accounts, analytics or third-party network.** The build ships a CSP with
  `connect-src 'self'` (`vite.config.ts`). Nothing is shared except files the player downloads.
- **No pressure.** No streaks, scores, penalties, leaderboards, notifications, reminders, due
  dates, completion meters, loss-framed nudges, autoplay, daily locks, expiry or artificial
  replenishment. Plays, replays and follow-ups start only when the player chooses.
- **No diagnosis.** Never describe the person ("you are", "you tend"), name a bias, infer a trait
  or turn past answers into a recommendation. Readings are about the answers to one story.
  No personality testing; no claims of clinical, psychological or scientifically validated benefit.
- **Tell doesn't choose, and doesn't pretend to read.** It never recommends an option and never
  interprets free text: the player's words are kept as written and only structured answers
  (taps) are compared.
- **Phone first.** Designed and verified at 390×844 and 375×667 in Chromium and WebKit
  (`tests/journeys.browser.test.ts`). Wider screens show the same centred column.

## Four kinds of record, kept apart and true

- Plays (answers to invented stories), choices (what the player said about a real choice),
  takeaways (what the player chose to keep) and outcomes (what the player reported happened)
  are separate records, labelled as such wherever they appear (`types.ts`, `MapPage.tsx`).
- Every record is a snapshot with its date and source. A play copies the episode it showed; a
  choice appends a save each time it is saved; a takeaway points at the play, save or outcome it
  came from; a match keeps the example's words as offered (tests under "evidence keeps its
  provenance" and "keeps past plays when the content is later edited").
- Revising a choice adds a save; revising a takeaway adds a wording; retiring moves it to
  history. Nothing that was answered is rewritten (`engine.ts`: `saveChoice`, `revise`, `retire`).
- `recordPlay` refuses answers that aren't what the episode asked (options on offer, a Cut that
  drops all but one, at most `opens` facts, a Slide that is the halving it claims).
- A replay is numbered and shown with the first play; it is never a separate example.
- Pass the phone keeps nothing of the guest's (journey "passes the phone without saving").

## Episodes (`src/domain/episodes.ts`; `episodes.test.ts` enforces the shape)

- Twelve, three per question (Purpose, Possibilities, Priorities, Evidence), and `START` names
  the recommended first. The library is finite: adding an episode is a content release, never
  something the app does by itself.
- One shape: setup, first answer (with "Not sure"), one move (twist, widen, Cut, Peek or Slide),
  second answer, ending. The ending separates what was answered (fixed sentences filled from the
  record, `playView`), possible readings (at least two each way, the second starting "Or"), and
  what stays unknown.
- Invented facts are marked "In this story" (or "Suppose"). No psychology vocabulary, no
  sentences that describe the player, no currency symbols, length limits, no near-duplicates.
- No concealed philosophy: across the library, no move (asking, testing, widening, waiting) is the
  intended answer; readings defend staying as well as changing.
- Every episode carries a rationale (distinction, plausible alternatives, limits, real-choice
  relevance), shown in the app. Review rule: the test can't judge meaning, so a person reads every
  new or changed episode against its rationale.
- Append new episodes; never reuse an id for different content; bump `v` when meaning changes.

## Real choices (`pages/Choice.tsx`, `engine.ts`)

- A title is enough to start. The player picks what feels unresolved, or "Not sure" for all four;
  only those parts are asked (`flowSteps`). Back, "Change what to look at" and "Skip to the
  summary" are always there; stopping without deciding is a valid ending.
- A draft is saved as it is typed and resumes after a reload. The summary is built from the
  player's own words (`draftSummary`) and is theirs to edit. An expectation is asked for when the
  next move is to act or test.
- Past examples (`examples`): at most `MATCH_MAX`; only with at least `MATCH_MIN` shared specific
  features, at least one structural; the backbone question never counts and "common" features are
  shown but never count. Each says why it appeared and shows its exceptions; the player says
  whether it applies, picks one, or uses none. Changing the rule changes About in the same commit.
- Follow-up is voluntary and has no due date: too early, plans changed, or what happened against
  the expectation as it stood; settled or still open; no lesson, a new takeaway or a revision.

## Data safety (`store.ts`, `validate.ts`; `store.test.ts`; journey "data that can't be used")

- One validated JSON document in localStorage. Every inbound document (load, restore) passes
  `validateState`; a refusal names the problem and changes nothing.
- Unreadable or newer data is refused with memory and disk untouched. The only ways on: download
  it as it is, restore a valid backup, or an explicit Start fresh (never for newer data).
- Older Tell documents are migrated only after the result validates; the original is kept whole
  in `archive`, downloadable from the Map.
- A failed write is shown, never swallowed, and the state stays in memory.

## Architecture and tests

- `src/domain/` is pure, React-free and takes an explicit `now`. Only `store.ts` persists;
  components change state through `store.update(pureTransition)`.
- Effect bodies are wrapped in braces: Chromium's `scrollTo` returns a Promise.
- `npm test` must pass: unit tests, the episode checks, colour contrast against the shipped
  stylesheet, browser journeys in Chromium and WebKit at both phone sizes, and the production
  build under its CSP, offline (Chromium) and through Export → Restore (both engines). A missing
  browser fails, never skips.
- Every journey screen is checked for sideways overflow, page scrolling (only `<main>` scrolls)
  and controls under 44px. A toggle with `aria-pressed` also shows its state by class. The tab
  bar sits at the bottom.
