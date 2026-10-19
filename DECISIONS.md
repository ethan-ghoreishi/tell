# Decisions

Durable record of non-obvious choices. Newest first.

## Tell 3.0: situations and connections (2026-10-20)

**What changed, and why.** The owner's brief (2026-10-20) redefined Tell as a collection of
intriguing, playable situations that help people notice useful connections between choices,
built around one hypothesis to test: that enjoyable situations in different settings can reveal
a useful shared structure when compared. It asked for the smallest coherent Play + Map that can
test it, and named the main risk: situations that become predictable, and connections that feel
clever but not useful. It authorised replacing obsolete navigation, content formulas, cadence
rules and structures, and a clean data reset.

**Replaced (each authorised by the brief):**
1. *The choice workshop's promise and its two moments* give way to the collection and the
   hypothesis. "See what would make a choice clearer" is gone from the product.
2. *Twelve episodes of one shape* (first answer, one move, second answer, readings) are replaced
   by six situations that vary how they are played. The repeated choose → twist → reconsider
   formula, "Not sure", Slide, Cut, Peek, widen and twist are retired.
3. *The four-question backbone* (Purpose, Possibilities, Priorities, Evidence) is replaced by a
   smaller hidden model (below).
4. *Bring a choice, takeaways, outcomes and past-example matching* are removed, deferred to
   `FUTURE.md`. So are Pass the phone and the "Worth keeping?" step: the brief asks for no
   required writing, filing or reflection, and nothing to approve or maintain.
5. *Schema 4, a clean reset.* Records from schemas 1–3 are kept whole in an archive.

**The hidden model.** Three questions: the way back (can it be undone, at what price), finding
out (bought before acting, arriving while you can still act, only by acting, or only after
committing) and waiting (raises the risk, keeps options at a price, or wears an option away).
This is the brief's "actions, information, consequences and future options" reduced to the
three that change how the others play out: the value of finding out depends on whether the
news arrives before the point of no return and on what undoing would cost; what waiting does
decides whether keeping an option means holding back or acting now. Rejected: a longer taxonomy
(stakes, audience, money, time), which the brief names as story ingredients, not dimensions.

**Builder decisions.**
- *Three pairs, in six places, each pair differing on one question of the model.*
  The old oak (no way back; facts bought with weeks) and the new loaf (a cheap way back; the
  shelf is a test). The harvest (news arrives every morning while you can still pick) and the
  winter order (a lighthouse's forecast comes after the supply boat). Your uncle's boat (waiting keeps her available,
  for a fee, while lessons answer the question) and the last packet (waiting wears old seed
  away; keeping it possible means sowing now). These follow the brief's three illustrative
  structures because, after drafting alternatives (a puppy and a landlord, a ferry ticket, a
  cottage lease, a glass furnace), they gave the sharpest distinctions in the most varied
  settings. The third pair adds what the brief's example doesn't: keeping an option open
  sometimes means acting, not waiting.
- *Six arrangements of four controls.* Uncover (facts from a budget that can't buy them all),
  then choose; compare plans, see what follows, choose again; day by day, act or wait; choose,
  or ask and find another option; one choice and news that comes after it; share ten rows. A test
  keeps every arrangement distinct. Three situations are a single decision: the brief says some
  need no twist.
- *Endings close the story for the path taken* and show other reasonable ways through. No ending
  reveals an outcome that would make one answer right in hindsight: the oak and the boat stop
  before the storms and the autumn; the harvest says what each future would mean for the day
  picked. Where news must come (the lighthouse's forecast, the loaf's Saturday, the beans' one in
  three), every answer keeps a cost and a case.
- *Connections are hidden until both situations are played,* and the collection's order keeps
  partners apart, so one play can't prime the other. An ending says only that one other situation
  shares something. This also makes the connection the moment the hypothesis is tested.
- *First plays count.* Later plays come after the player may have seen the comparison. The card
  says so when there are replays.
- *Every combination of answers has its own note,* written to add a distinction neither ending
  states (for example: a tasting tells you what people say, a sale what they do; the same move,
  waiting, keeps the boat and wears the beans away). Notes for answers that fit the structure
  "neatly" were rewritten so they don't read as endorsed. What the answers can't show is a fixed
  sentence in code, naming the pair's other differences.
- *Connections rest on a declared field of the model,* checked by test, so none can rest on
  shared words.
- *Older data is archived, not migrated.* 2.0's records (choices, takeaways, readings) answer
  different questions, and the brief allows a reset. A real 2.0 document, written by 2.0's own
  engine before it was deleted, is the test fixture for load, Restore and download.
- *Three tabs: Play, Map, About.* The archive lives in About with the data controls.
- *Neutral buttons where a default could nudge:* "Decide without finding out" and the allocation's
  "Done" are not primary, and the plot starts as it always is (ten rows of usual vegetables).

**Editorial review.** Every path and combination was printed and read against the brief's
questions: immediately interesting, several plausible responses, the interaction revealing more
than the opening question, a structure clear enough to compare, a connection that earns more
than "so what?", curiosity to play another. Changes from that read: the beans' "a few rows"
ending lost its hindsight advantage; four notes that restated the structure were rewritten to
add a distinction. Passing tests are not evidence of enjoyment or usefulness; `PILOT.md` is.

**Untested hypotheses**, for the pilot: that the situations stay interesting rather than
predictable; that the connections are useful, not just clever.

---

## Tell 2.0: a choice workshop (2026-10-19; superseded by 3.0)

**What changed, and why.** The owner's brief (2026-10-19) redefined Tell: a playful choice
workshop for people making creative work and independent projects, with the promise "See what
would make a choice clearer". Two triggers: "I keep circling this choice; before more research,
revision or deliberation, what would actually help?" and "give me something interesting to think
through for a few minutes". The choice-experiments rebuild (2026-10-14, below) was never
committed; it was committed unchanged as a checkpoint (`d41ae97`) and then rebuilt on, reusing its
architecture, store, validation door, Slide and Cut, test harness and design.

**Owner-authorised changes** (each explicitly authorised by the brief):
1. *The daily set, its cap and midnight expiry are replaced* by a finite, inspectable library of
   twelve episodes with a recommended start, explicit endings and user-initiated play and replay.
   No lock, expiry, replenishment or completion pressure.
2. *"Four mechanics are the only formats" is replaced* by episodes of one fixed shape (situation,
   first answer, one move, second answer, ending). The moves: twist, widen, Cut, Peek (now any
   number of options, single-text facts) and Slide (with an optional revealed value). Spend and
   "It depends" are retired.
3. *Fixed factor vocabulary and ranking requirements are replaced.* Real choices use the player's
   own words: no compulsory five-item ranking, no factor classification, no money/time dial.
4. *Automatic pattern gates are replaced* by takeaways the player chooses to keep, revise or
   retire. Tell makes no automatic claims (REPEAT_MIN, CHANGE_GAP, verdict notes are gone).
5. *Removed from the main experience:* factor dashboards, patterns, Spend agreement scoring,
   shared-lesson exchange (to `FUTURE.md`) and the AI-first brief. A plain-text export stays, for
   notes or pasting into an AI chat.

**The backbone.** Purpose, Possibilities, Priorities, Evidence: a light adaptation of SDG's
decision-quality elements (frame, alternatives, information, values and trade-offs) and Keeney's
value-focused thinking (start from objectives, then create alternatives). Used to choose questions
and write episodes, not as a validated theory, user categories or a score.

**Builder decisions (routine, within the brief).**
- *Older data is migrated, not refused.* Schemas 1 and 2 are carried into schema 3 with the whole
  original document kept in `archive` (deep-equal, tested) and downloadable from the Map; version
  2's principles (the player's own words) become takeaways. Version 1's kept lines described the
  player, so they stay in the archive only. The migrated document is validated before it is
  written. Unreadable and newer data are still refused untouched. Reason: the brief asks for
  migration coverage, and a recovery screen in front of a usable app helped nobody.
- *Matching is deliberately narrow.* A past example (a kept takeaway or another saved choice)
  shows only when it shares at least two specific features, at least one about structure (option
  shapes such as waiting or a smaller trial; how an unknown that matters could be found out: a
  trial, asking or looking it up, or waiting; a marked assumption), the rest circumstances. The
  next move is not a feature: it is chosen in the summary, after examples are offered, so it could
  never match. The backbone question is never a feature; must-haves and unknowns are shown but
  never count, because nearly every choice has them (tested: two unrelated choices sharing only
  those never match). At most two. Free text is never read. Rejected: counting shared parts,
  keyword overlap (pretends to understand words). Coverage, counted: eight of the twelve stories
  can be offered automatically. Four (Six evenings, The wedding reading, Two writers, The
  journaling app) only by hand, because what they turn on (a purpose, a trade-off between two
  goods) can't be compared without reading words. Accepted rather than invented features.
- *Evidence is never double-counted.* Replays of one story fold into one example; a choice and a
  takeaway kept from it are one example, the takeaway carrying the choice's outcomes as exceptions.
- *Provenance is per snapshot.* A takeaway points at the play, the save or the outcome it came
  from; a match keeps the example's words as offered. Revising either never rewrites evidence.
- *Every reading must be true for the path taken.* Episodes write readings for staying, for
  switching between the original options, for moving to an option the move added, and, for a
  Slide with a revealed value, for following or going against the player's own line. Paths an
  episode can't anticipate (a "Not sure" answer, a Peek with nothing opened, a lean that wavered
  and came back, or held and then changed) get fixed lines in code. The second reading is always
  an alternative ("Or…"). A test walks all 320 reachable paths; their readings were read for
  meaning. The observed lines are fixed sentences filled from the record.
- *Follow-up is voluntary.* No due dates, reminders or "due back" cards; an expectation's date is
  a note. "Too early", "plans changed", settled or still open, and no lesson are all first-class.
- *Three tabs* (Home, Map, About). Home holds both triggers and the library, so neither is a
  second-class path. A draft lives on Home until saved; a saved choice on the Map.
- *Currency is gone*: no episode or choice needs money formatting.
- *Recommended start: "Six evenings"*, a quick twist about several side projects that most
  independent makers recognise, and that shows the full ending in about two minutes.
- *Tap targets are 44px everywhere* (chips and small buttons were 40px), checked on every screen
  by the journeys, with sideways overflow and page scrolling.

**Editorial review.** Every episode was read for meaning against its rationale (shown in the app
under "About this story"). Prescriptive endings ("only the first kind needs obeying") were
rewritten as distinctions. Across the twelve, at least one reading defends committing without
more information wherever an episode features asking, testing or widening. No story fact
describes the player; every invented fact is marked "In this story".

**Untested product hypotheses**, for the pilot (`PILOT.md`): that the stories are enjoyable
enough to play unprompted; that a session leaves a real choice clearer; that past examples help
more than they distract.

---

## Tell v2: choice experiments (2026-10-14; never shipped, superseded by 2.0)

**What changed, and why.** v1 asked players to pick the cause of a scene (eight angles) and
counted picks against a binomial gate. That is the structure of a personality inventory, the
causes of behaviour are psychology's territory, and the 1-in-4 null assumed options equally
tempting when the wording decided. The owner asked for a product with a clear trigger, no
psychology, a defensible question system and more surprising results. v2 asks for choices, not
causes: the methods product teams use to learn what customers value, run on yourself, with counts.

**Owner decisions.**
1. *The four mechanics are the only formats* (Slide, Cut, Spend, Peek, plus "It depends").
   Retired: angles, the odds gate, the world area, twins, paired choices, kept lines.
2. *"No gamification" becomes "No pressure mechanics".* Play that is honest about the evidence
   is in (chart filling in, guess then Slide, pass the phone); streaks, penalties, leaderboards
   and nudges stay out.
3. *Cadence, delegated to the builder: one set a day.* This reverses the earlier recommendation of
   sets on demand. Reasons: answers spread over days sample the player in different states rather
   than one mood (and "it depends on the day" is real); the library of ~70 cells lasts about three
   weeks of daily play, and retests open at 21 days, so there is no content cliff (the 60-day
   simulation test proves a set every day); a daily set gives a reason to return without a streak.
   Decide is never limited.
4. *Shared lessons, now, without a server: a file swap.* A closed call yields a lesson in fixed
   vocabulary (kind, went, feature ids, check ids, a count of other misses). The player previews
   exactly what the file holds, downloads it, and someone else adds it; import is validated, each
   lesson carries a random id so a call re-sent in a later file (or your own coming back) is never
   counted twice, and an item shows once 3 shared calls report it. Things players type
   that aren't on Tell's list show locally as "not on Tell's list yet", which is how the checklist
   improves. A server pool (opt-in, larger threshold) stays in FUTURE.md; this tests the shape.

**The question system.**
- *Content is ingredients, not questions.* Each experiment is structured data checked by a recipe
  test (one changing value, no dominated option, log-spaced steps, fixed vocabulary, no currency
  symbols, coverage). Reveal sentences are templates in code, so no result can claim more than
  the answers show.
- *Slide is the adjusting-amount procedure:* halving over seven steps settles one of eight
  intervals in three choices. A range, never a point.
- *Seven steps, each 1.3–3.5× the last,* because money and time differences are felt as ratios;
  one wide ladder fits most people. Rejected: anchoring each ladder on the player's earlier answer
  (as the final idea suggested). It would bias the very comparison a stress-test makes. Currency
  is a setting instead.
- *Picking is a published priority list, never random.* The probe's mechanic rotates (Slide every
  other day); within it: open call, a change seen once, untested trade-off, open-ended result,
  retest, next in list. Stress-test changes one tagged condition or prices what the probe
  surfaced; Connect tries the same trade-off elsewhere. This is measure, manipulate, replicate.
- *Cut items and Peek facts rotate by one per play,* so position can't favour an item.
- *Spend clashes are adjacent ranks by coins,* testing the stated order link by link; tied coins
  still yield a result (the order your choices set).
- *A context change needs two intervals,* because one step is ordinary wobble between two
  answers. *A repeat needs 3 times and three in four:* a display rule, not inference. Both are
  stated on About.
- *Retests at 21 days* (the final idea said three months): within the usual two-to-four-week
  test–retest window, and needed to keep daily sets full.

**Smaller choices.** Pass the phone is ephemeral; the other person's answers are never saved.
Ratings (Useful, Interesting, Meh) are per set and credited to its experiments on About, so weak
experiments show up. The brief for your AI is always on screen as selectable text; the clipboard
is a convenience. Schema 2: v1 data is refused with its own message and offered as a download,
never overwritten; with one player's data, a migration wasn't worth writing.

---

*Below: earlier decisions, kept as history. Superseded by newer entries where they conflict.*

## A 60-card deck, and call-outs that stay (2026-10-08)

**Deck doubled to 60** (owner: "Proceed", on the recommendation to write more cards before
Decide). 24 world scenes, 24 of your own, 6 paired choices; each angle is offered 12 times per
area; 12 twin pairs. A simulation of daily Mix play runs 16 days before the deck is spent, which
covers a two-week pilot. New cards were appended, so earlier deals are unchanged. Each new scene
of your own offers at least one plainly practical explanation (the setting, the routine, what
your body can take); the gym scene offers physical limits as a real option.

**Call-outs stay once shown.** With 12 offers per angle, an angle shown at 5 of 5 could fall to
5 of 7 and stop clearing, which would make the Map feel like sand through fingers. So
`observations` walks the answer log in order, records when each angle first cleared, and keeps
it: if later rounds bring it under the bar, the card is marked "No longer clears the bar" and
shows both counts. Derived, not stored: no schema change, and notes keep their ids. This
supersedes the v1 note below that a call-out couldn't vanish, which held only for 30 cards.

**Paired choices are literal.** Both halves share identical answers, and the second is a minimal
word-level edit of the first (`deck.test.ts`). A consistency pair changes only something that
carries no information about the outcome: wording, framing, or money already lost or spent.
Anything that could legitimately matter is a trade-off pair. Rejected for that reason: "who
suggested it" and "a tool you already use" as consistency checks. Messenger and switching cost
are real information. The framing pair was rewritten so its halves differ minimally.

**Still no world-versus-me call-out.** Each angle sits in only about six of the twelve twin
pairs, so a paired test can't clear the bar after allowing for eight angles. The side-by-side
rows remain the honest view.

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
offers per angle per area in v1, anything shown at 5 of 5 still clears at 5 of 6. (True for
the 30-card deck only; see "call-outs stay" above.)

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
