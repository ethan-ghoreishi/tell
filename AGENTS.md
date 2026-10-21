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
  count, summarise or compare the player's moves into a statement ("you often…"). No
  psychometrics; no claims of clinical, psychological or scientifically validated benefit.
- **Tell doesn't choose.** No story has a right answer, no text rewards one, and no ending makes
  one right in hindsight. No move is ranked, urged or picked from the player's history.
- **Phone first.** Designed and verified at 390×844 and 375×667 in Chromium and WebKit
  (`tests/journeys.browser.test.ts`). Wider screens show the same centred column.

## The language (`src/domain/language.ts`; `language.test.ts`)

- Four questions, six strategies, fifteen moves, written once and the same for everyone. Each
  move has one strategy; a strategy that answers a question holds only moves that read it.
- **The answers alone decide which moves show** (`results` takes nothing else; the test keeps
  the same answers giving the same moves whatever the record holds). The player's plays only
  lend examples.
- Fixed order, never ranked. Settling it, and another option, are always there.
- Every shown move says why: derived from the answers ("Because you said …"), a condition for
  Not sure ("If …"), or "Always possible." Nothing is argued.
- **Not sure** means could be: moves that need that answer show, conditionally. **None of
  these** means doesn't apply: they don't. When some answers are None of these, a notice before
  the moves says they cover only part of the choice (`PARTLY`); when all are, that the questions
  don't describe it (`OUTSIDE`). The scope (`SCOPE`) is shown before the questions and after the
  moves.
- Where the four questions can't read a move's condition, the move asks it as a question
  (`asks`), never claims it. Principles say when a move is worth something ("…only if…"),
  never what to do.
- Every move has a price (`costs`) and a limit (`breaks`). Every move starts as a proposal;
  `PILOT.md` says how one becomes established.
- Bump `LANGUAGE` when a meaning changes. Never reuse or remove a move or answer id without a
  mapping for the records that name it: plays and kept choices record the version they used.
- Wording rules (`tests/wording.ts`) cover every string: no psychology vocabulary, nothing about
  the player, no verdicts, no advice words, no currency symbols. The journeys apply them to every
  screen as shown.

## Stories (`SITUATIONS` in `src/domain/situations.ts`; `situations.test.ts`)

- A small, finite collection. Adding one is a content release, never something the app does by
  itself. Repair or replace weak material before adding more. Append; never reuse an id for
  different content; bump `v` when meaning or tags change.
- A story is a setup, what isn't known (`uncertain`), the step it turns on (`turnsOn`) with that
  step's shape (`shape`, four definite answers), one or more steps, and an ending. Steps are
  `choose` (optionally with words that follow from an earlier answer, or an ask that brings an
  answer or another option), `uncover`, `allocate` and `days`. Add a kind only when a story
  needs it.
- **Every answer names its moves** and what it costs and risks in the story's terms. Every
  option offered, and every ask, names at least one move; only holding off with nothing done
  (not looking first, the seed left in a drawer) may name none. No answer is free.
- No two stories share an arrangement of steps or a shape; every kind is used; between them the
  stories give every question at least two different answers to live.
- Every path reaches an ending written for it, and `others` shows more than one reasonable way
  through. Asking or looking never guarantees a reward. An ending names each step's moves and says
  which step they're about (`turnsOn`): settling moves mean nothing without it.
- A story that rests on real-world facts lists them in `real`, each with at least one reliable
  source (https), and says what it invents. Facts are checked before they ship.
- Review rule: tests can't judge whether a story is interesting or a move well named. A person
  reads the language and every path before content ships:
  `REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts`. The file also shows which
  moves and answers no story shows yet, and what Bring a choice shows for the reference choices
  (`tests/fixtures/reference-choices.json`, one coder, not evidence).

## The Map and Bring a choice (`src/pages/MapPage.tsx`, `src/pages/Bring.tsx`; journeys)

- The Map lists: kept choices; the moves the player has made, by strategy, each with every play
  that made it; and, only for questions the played stories answered differently, those stories
  side by side with their moves. Never counted, summarised or compared in words.
- "New" is a word on an ending, shown until that move has been shown as new (`seen`, stored with
  its first sighting). Everything on the Map is derived from snapshots, never stored.
- Bring a choice is taps: an optional label, four questions, the moves. Nothing is stored
  unless the player keeps it. Tell never reads the label or the note.

## Records and data safety (`store.ts`, `validate.ts`; `store.test.ts`; journey "data that can't be used")

- One validated JSON document in localStorage (schema 6): plays, kept choices, `seen` and an
  archive. A play snapshots the story it showed, tags included, and records the language
  version. A kept choice snapshots the answers and the moves it showed (names, reasons, prices,
  limits), what the player marks as being tried, and their note; the example under each move is
  drawn from the record when it's opened, so it can become the player's own. Lists are derived,
  never stored.
  Nothing the player answered is rewritten.
- `answersProblem` is the one check of a play's answers and `shapeProblem` of four answers, each
  used when recording and on load.
- Every inbound document (load, restore) passes `validateState`; a refusal names the problem and
  changes nothing. Unreadable data, and data from a newer schema or a newer language, is refused
  with memory and disk untouched. The only ways on: download it as it is, restore a valid backup,
  or an explicit Start fresh (never for newer data).
- A document from an earlier Tell (schemas 1–5) is kept whole in `archive`, downloadable from
  About; nothing in it is reread (tested against real 2.0, 3.0 and 3.1 documents,
  `tests/fixtures`). From schema 6 on, a newer schema migrates plays and kept choices rather than
  archiving them.
- A failed write is shown, never swallowed, and the state stays in memory. An unchanged state
  isn't rewritten.

## Architecture and tests

- `src/domain/` is pure, React-free and takes an explicit `now`. Only `store.ts` persists;
  components change state through `store.update(pureTransition)`.
- Effect bodies are wrapped in braces: Chromium's `scrollTo` returns a Promise.
- `npm test` must pass: unit tests, the language, content and model checks, the review walk,
  colour contrast against the shipped stylesheet, browser journeys in Chromium and WebKit at both
  phone sizes, and the production build under its CSP, offline (Chromium) and through Export →
  Restore (both engines). A missing browser fails, never skips.
- Every journey screen is checked for sideways overflow (the page and `<main>`), page scrolling
  (only `<main>` scrolls), controls under 44px and the wording rules. The tab bar sits at the
  bottom.
