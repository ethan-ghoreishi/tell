# Decisions

Durable record of non-obvious choices. Newest first.

## v1 foundations (2026-10-08)

**What v1 is.** Play and Map for two areas, The world and Work & projects: the areas where the
owner's own ChatGPT experiments (Signal Engine, about 40 rounds over two months; Pattern Lab,
about seven rounds) showed real engagement. Decide (briefs for your own AI), more areas, sync
and a weekly recap wait in `FUTURE.md` until v1 earns them.

**From Codex's review of the idea, adopted:**
- The Map shows a *record* from the first answer; a *pattern* appears only when the published
  gate is cleared. "Forming pattern" stages were dropped as manufactured progress.
- Paired choices are questions, never bias findings: a changed answer can come from mood,
  circumstances or wording.
- Progress means richer evidence (denominators growing), not levels. A rejected observation is
  as useful as an accepted one.
- Start small: 30 cards rather than 120.
- "Nothing about you is invented" was wrong. Answers are recorded facts; interpretations are
  authored hypotheses.
- Approving an observation never approves anything derived from it.

**Kept, despite that review:** exact counts in reveals (hedged prose everywhere made reveals
limp; numbers with denominators are honest and substantial), and Decide as the next candidate
rather than an afterthought, because it is how the record becomes useful with AI.

**Phone only** (owner decision). Verified at 390×844 and 375×667. The manifest locks portrait;
wider screens show the same centred column.

**Stack: React 19, TypeScript, Vite, vite-plugin-pwa, Vitest, Playwright as a library.** This
follows Practice Compass, the owner's most developed app (the owner asked for it to be taken
into account), so its lessons, harness pattern and later its sync model carry over. Rejected:
Svelte 5 (Mashq and Systema use it, and it is lighter), because aligning with the most mature
conventions mattered more at this size. Reversal is cheap until more screens exist. Not
adopted from Practice Compass: zustand, react-router and Dexie. With three screens and one
small document, a hash hook and `useSyncExternalStore` are enough.

**Storage: one JSON document in localStorage**, not IndexedDB. There are no blobs, writes are
synchronous and atomic per key, and validating one document is simple. The ceiling is about
5 MB (roughly 20,000 answers); the `ponytail:` note in `store.ts` names the upgrade path.

**Eight angles, balanced deck.** Every lens round offers four distinct angles, and each angle
is offered six times per area, so no angle can win by exposure. Rejected: six or seven angles
(more evidence per angle, but they lose distinctions the owner's transcripts kept using, such
as power and capacity).

**The observation gate.** An angle is called out once it has been offered at least five times,
and only when the binomial chance of picking it at least that often, at 1-in-4 per round,
times eight (the angles checked per area), is below 0.05. In practice that means 5 of 5, 5 of 6
or 6 of 8. Strict on purpose: "don't manufacture patterns". About states the rule, and that
several checks mean a call-out can still be luck. The five-offer floor exists so a call-out
can't vanish: 4 of 4 clears on chance alone but falls to 4 of 5 on the next miss. With six
offers per angle per area in v1, anything shown at 5 of 5 still clears at 5 of 6.

**No world-versus-me call-out in v1.** With six twin pairs, a paired test can never clear any
honest bar after allowing for eight angles. The Map shows the matched rows side by side with
their counts instead. The call-out returns when the deck has enough twins (`FUTURE.md`).

**Paired choices.** The two halves are identical except for one detail, so "only one thing
differed" is literally true. They are dealt at least two days apart, and the first half says
nothing about pairing, so it can't prime the second. The mechanism is disclosed in general
terms on About.

**Four rounds a day, then a clear end.** No "more" path and no cap bypass, even for testing:
the browser journeys move days with Playwright's clock instead.

**Ports 5291 (dev) and 4291 (preview).** In the browser pane, a Practice Compass service worker
controls `localhost:5175`, and other local apps use 5173–5184. Clearing that worker could touch
Practice Compass data, so Tell moved instead.
