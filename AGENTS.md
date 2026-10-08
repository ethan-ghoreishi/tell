# AGENTS.md — rules for anyone extending Tell

The contract for humans and AI agents. `CHARTER.md` says why Tell exists; this file says what
the code must keep true, and where each rule is enforced. Current rules only, each once. The
why goes in a dated `DECISIONS.md` entry; deferred ideas go in `FUTURE.md`.

## Hard do-nots (only an owner decision recorded in DECISIONS.md changes one)

- **No runtime AI, accounts, analytics or third-party network.** The build ships a CSP with
  `connect-src 'self'` (`vite.config.ts`).
- **No gamification.** No streaks, points, badges, levels, scores or confetti. Progress is
  neutral counts with denominators.
- **No diagnosis.** Never name a bias or a trait for the player. Angles are editorial labels for
  kinds of explanation. Paired-choice copy describes what changed and asks; it never concludes.
- **Phone only.** Designed and verified at 390×844 and 375×667
  (`tests/journeys.browser.test.ts`). Wider screens show the same centred column; there is no
  desktop layout.

## The record stays true

- Answers are append-only snapshots: what was shown (order, and each option's lens), the pick,
  the time and local day, and twin or pair links. Every number derives from `state.answers`,
  never from the current deck (`engine.ts`; test "keeps past denominators when the deck is
  later edited").
- Every count shows its denominator ("k of n"). A call-out states its counts, its rule and an
  alternative explanation (`MapPage.tsx`).
- Observations come only from `clearsGate`: at least `MIN_OFFERS` offers, and the binomial tail
  against 1-in-4 chance, multiplied by the number of angles checked, below 0.05 (`engine.ts`,
  `engine.test.ts`). Changing the gate is an owner decision, and About's wording changes in the
  same commit.
- A call-out never vanishes. Once an angle has cleared the bar, `observations` keeps it; if later
  rounds bring it under, it is marked "No longer clears the bar" with both counts. Derived from
  the log, never stored (test "stays once shown").
- Anything the app asks the player to record, the Map shows: kept lines, verdict notes, and
  rounds marked "I see this differently" (`MapPage.tsx`; core journey).
- A verdict (Fits, Partly, Doesn't fit, Not sure) is a note saved with the counts at the time.
  It never changes counts or what is shown (`addNote`; test "is never changed by the player's
  verdict").
- World-versus-me comparisons only through deck twins answered on both sides, shown side by
  side, never as percentages (`matchedPairs`).
- The first half of a paired choice never mentions pairing (`deposit`; test).

## The deck (`src/domain/deck.test.ts` enforces)

- Every lens round offers exactly four distinct angles; option ids never collide with the ways
  out (`else`, `unknown`, `notme`).
- Twins are reciprocal, cross areas and offer the same four angles.
- Each angle is offered equally often per area (within one).
- Pair halves share identical answers in the same order, the second scene is a minimal edit of
  the first (word-level diff), and the second half comes later in the array.
- A consistency pair changes only what carries no information about the outcome (wording,
  framing, money already lost or spent). Anything that could legitimately matter is a
  trade-off pair. Review rule: the test can't judge meaning.
- Every scene of your own offers at least one plainly practical explanation (setting, routine,
  what the body can take), and sees/misses never moralise. Review rule.
- New cards are appended, never inserted, so earlier deals and their tests stay put.
- Scenes are invented and labelled as such: no statistics, no real events.
- Never reuse a card id for different content. Bump `v` when a card's meaning changes; past
  answers keep their snapshot either way.

## Dealing (`deal` in `engine.ts`; tests under "dealing")

- Four rounds a day, dealt once per local calendar day with each round's option order stored,
  so a reload never changes the set.
- Order: second halves of pairs at least two days after the first; then matched scenes whose
  twin is answered; then fresh rounds, balancing the two areas. Linked rounds never share a
  day. Unanswered rounds return to the pool.
- The day's set has a clear end. Never add a "more rounds" path or a cap bypass; tests move days
  with Playwright's clock.

## Data safety (`store.ts`, `validate.ts`; `store.test.ts`; journey "unreadable data")

- One validated JSON document in localStorage. Every inbound document (load, restore,
  recovery) passes `validateState`; a refusal names the problem and changes nothing.
- Unreadable or newer data is refused with memory and disk untouched. The only ways on are:
  download it as it is, restore a valid backup, or an explicit Start fresh (never offered for
  newer data).
- A failed write is shown, never swallowed, and the state stays in memory.
- Restore reads the file with `store.inspect`, confirms what it holds, then replaces.

## Architecture and tests

- `src/domain/` is pure, React-free and takes an explicit `now`. Only `store.ts` persists;
  components change state through `store.update(pureTransition)`.
- Effect bodies are wrapped in braces: Chromium's `scrollTo` returns a Promise, which React
  would take for a cleanup.
- `npm test` must pass: unit tests, colour contrast against the shipped stylesheet
  (`tests/contrast.test.ts`), browser journeys in Chromium and WebKit driving the real app
  through Playwright as a library, and the production build checked under its CSP, offline
  after install and through Export → Restore (`tests/pwa.browser.test.ts`). A missing browser
  fails, never skips.
- A toggle with `aria-pressed` also shows its state by class. Only `<main>` scrolls; the tab
  bar sits at the bottom; tap targets are at least 44px.
