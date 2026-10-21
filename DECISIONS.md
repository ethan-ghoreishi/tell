# Decisions

Durable record of non-obvious choices. Newest first.

## Tell 4.1: the moves in view, one fact at a time (2026-10-21)

**The brief.** The owner's review of 4.0: it took time and reflection to understand; it is wordy;
a link is missing and there is no "aha"; play names the shapes and moves only at the end, so Tell
journals moves the player made unawares instead of bringing them out of autopilot; examples from
play need remembering and limit the collection; could Bring a choice point to stories, or to
strategies? Authorised: treat the model, UI and docs as hypotheses, redesign fundamentally if
that's the answer, keep the fun, low effort, no inference, no disguised advice and honest limits,
then commit and push.

**Diagnosis: placement, not missing explanation.** In 4.0 the move and the shape were absent at
the moment of choice. Options were story words; the shape came after the choice, as a definition
list apart from the moves; the moves came as names with nothing attached. What each answer costs
and risks in its story, written for every option and band, reached only the plain-text download.
Contrast, which is what makes a shape matter, existed only across different stories, and 4.0
itself had ruled out reading anything from those. Each section showed the same unit differently
(an option, a pill, a list item, a drawer), so nothing travelled. And Bring a choice, for the
commonest real shape (hard to undo, check first and only once done, the chance goes, hard to
recover), opened six drawers on 14 of 15 moves, six lines each.

**What changed.**
1. *One visual unit for each idea, everywhere.* A move is a named pill; a step's shape is four
   cells (Undo, Know when, If you wait, If it goes badly), with short answers. Each opens one card,
   as an overlay, never a page: a story in progress, and a choice not yet kept, hold their answers
   in the page, so there the card names stories instead of linking away from them. The move card
   gives what the move is, the answers it fits (the rule, as cells), when that is worth something
   (the question's principle), its price, its limit, an everyday instance, where the player made
   it, the kept choices that showed it, and the stories that offer it. The question card gives the
   answers, each with an everyday moment and the steps of played stories that had it, and the
   principle.
2. *Play shows the language at the moment of choice.* The shape of the step a story turns on sits
   under its setup. Every option, and every ask, shows its moves before it is chosen. A number's
   moves change as it does: rows of old beans go from try it small to split it; the harvest says
   what picking today would make. That one is a line under the forecast, not a label on the
   button: "Pick today · Wait for it" read backwards.
3. *Endings show each step's cost and risk in the story's terms*, under the shape. "The shape of
   it" and "Moves here are about…" are gone; the label "The step: felling the oak" and the cells
   carry them.
4. *One-fact variants.* Three stories have a variant, offered on their ending as a question ("What
   if the forecasts stopped after Monday?") with the changed cell marked and what it was. Once both
   are played, the variant's ending and the Map set the two plays side by side under the question
   they differ on, with its principle, never explained. Each flips a different question:
   - *The harvest, without forecasts* (when you'll know: news comes → once done). Wait for it gives
     way to commit, split it and set a tripwire (pick the day the barometer falls).
   - *Your uncle's boat, with no deadline* (waiting: the chance goes → little changes). Keeping
     her for the summer is the same option, now try it small instead of hold it open.
   - *The last of the light, with a second camera* (how bad: hard → something to get over). The
     same options and moves; the spare's reason weakens.
   Split it gains a second story and set a tripwire its first. Not built: an oak variant (in a
   meadow, losing the oak itself is still the bad case, so no clean flip), a loaf variant (an undo
   flip needed new options) and a beans variant (a freezer flips the same question as the boat and
   shows less). This is the minimal pair that 4.0 said alone could carry contrast honestly.
5. *The Map is the language, with the player's plays on it.* Every move by strategy, each opening
   its card; under each, the stories where the player made it, or an everyday instance. Both read
   the same (no dimming, no count, no "not yet"), so the list can't work as a completion meter.
   Then each story played both ways, then everything played. "The shapes you've played", the
   cross-story contrasts, is gone: those stories differ in many ways, and pairs now carry contrast.
6. *Bring a choice is a tab*, and holds the kept choices. The shape fills in, cell by cell, as the
   four questions are answered; on the results a cell changes its answer. Results are one row per
   move (its name, the question it puts or what it is, and why it fits) under its strategy, in the
   fixed order. Price, limit and examples are in the card, the player's own example included.
7. *Anchors are everyday first.* Every answer has an everyday moment ("Like posting a letter");
   the steps of stories the player has played follow it ("as in felling the oak"), read from the
   plays' snapshots. A story is never an anchor before it has been played, so a larger collection
   costs nobody anything to remember.

**Bring a choice points to stories per move, not per choice.** A whole-choice pointer ("shaped
like the old oak") was checked against the twenty in-scope reference choices before building. Most
share three of four answers with five or six of the nine stories, and two stories matched twelve
of the twenty: it would send nearly everyone to the same few stories and suggest an analogy beyond
shape. Not built, and the FUTURE entry is closed. Instead each move's card lists the stories that
offer it, in collection order, where it can be tried at no cost.

**Kept.** The language (LANGUAGE 1: no meaning changed; answers gain a few-word form for the cells
and everyday anchors, and set a tripwire's instance reads after "Like"), schema 6, and every rule:
the answers alone decide which moves show, fixed order, settling it always there, New only on
endings, nothing counted, nothing said about the player.

**Data.** A variant's play is an ordinary play whose snapshot names the story it varies (`of`)
and how (`whatIf`); validation wants both or neither. Earlier 4.0 records load unchanged, and an
earlier 4.0 build reads a 4.1 record (the new fields are ignored there).

**Tests.** Variants: each keeps its story's place and step, differs on exactly one question, asks
"What if …?", comes after its story, and has a shape no other story has; between them they flip
more than one question. Base stories keep the old rules. No answer's anchor names a story. The
journeys play the new flow in both engines at both sizes, open cards (checked for wording, overflow
and 44px targets like every screen), play the harvest both ways, change an answer from its cell,
and mark a move as tried from its card. A card on unkept results names its stories without links;
on a kept choice it links. Contrast covers the tinted cells: a changed cell's label uses the dim
colour, as the faint one fell to 4.1:1 on the tint. The review file prints each variant beside its
story; every path was read.

**Untested, for the pilot.** Whether moves shown on options make play feel like a test, or lead
players to pick by move name rather than by the story; whether variants give the intended "aha" or
feel like homework; whether the cards are found; whether four tabs crowd a small phone. Nobody but
the builder has used 4.1.

---

## Tell 4.0: a language of moves, and Bring a choice (2026-10-21; revised by 4.1)

**What changed, and why.** The owner's brief (2026-10-21): take `PROPOSAL-4.0.md` (revision 3;
kept in history at `902278b`, and removed from the tree with this release, as its header asks
once decided) through validation into implementation if justified, as the leading design rather
than a fixed specification; challenge the core model first; say what play is for; resolve the
model's edge cases; prefer a smaller coherent system; current data need not be migrated. 3.1's
connections described the past (a distinction between two stories, with writing that grew with
the square of the stories) and gave the player nothing to use at the next choice. 4.0 replaces
them with a small language: four questions that read the shape of a step, and fifteen named
moves in six strategies. Play teaches it, the Map keeps the moves a player makes, and Bring a
choice shows the moves that fit a real choice, by rule.

**The mission.** The vision is unchanged. The mission's second half was "preserve the useful
connections so people can draw on them when facing real choices"; it is now "keep the moves
people make in them, and, when a real choice comes, show the moves that fit its shape". A draft
said "lend those moves back", which was wrong: Bring a choice shows every move that fits, the same
for everyone, and the player's own plays only lend examples. Settled in the acceptance review.

**Checked before building (what can be done without participants).**
1. *Reference choices.* 25 one-line choices, written and coded by the builder before any move
   list or rule existed in code, with pass thresholds frozen first
   (`tests/fixtures/reference-choices.json`, sha256 `ffe02589…`). Twenty in scope, of the kinds
   Levitt's coin-toss study names (quitting a job, ending a relationship, moving, education,
   marriage, minor ones like hair colour; *Review of Economic Studies* 88(1), 2021) and
   independent-work ones; five expected to fit only partly (torn between two goods, a habit,
   the other side's strategy, having a child, a duty).
   - *Describable:* 20 of 20, but 17 carried an ambiguity flagged while coding. On "can it be
     undone?" it was no against at a cost, which show the same moves. On waiting (not much
     against the chance goes) and how bad, the ambiguity changes the moves: agreement there is
     the first thing to test with people.
   - *A concrete move beyond the options people name:* 20 of 20, each a move the rules showed
     for that case, with an instance of at most 15 words (the builder's judgement):
     quitting for a year out, try it small (a month's unpaid leave first); ending a
     relationship, try it small (a month living apart first); moving for a partner, ask for more
     time (the employer pushes the start date back); a master's, split it (part-time, keeping the
     job); proposing, look first (talk about marriage together first); green hair, try it small
     (a wash-out colour or one streak); selling the flat, make it undoable (let it for a year and
     rent); asking for a raise, set a tripwire (no raise by June, start looking); offer A or wait
     for B, ask for more time (a week more from A); retraining as a nurse, try it small (months as
     a healthcare assistant); a dog, try it small (foster for a month); a mother moving in, guard
     (agree now what happens if it doesn't work); open-sourcing, try it small (share privately
     with five users); going full-time, split it (four days a week first); raising prices, try it
     small (new customers only); launching, try it small (a small beta list); a studio lease, make
     it undoable (a break clause at six months); an exclusive client, make it undoable (an exit
     clause at three months); a rewrite, try it small (one module, the rest running); self-
     publishing, try it small (a novella first).
   - *Tone:* no string or reason that urges or describes the person (a regex and a read).
   - *Filtering:* at least one strategy hidden in 17 of 20, but only the waiting and how-bad
     questions filtered. Every in-scope choice was hard to undo and "check first; only once it's
     done". So the value is the reframe and each move's question more than the selection, and
     results lead with the questions moves put.
   - *Partial cases:* results never reached the core difficulty, and two read badly ("hand it
     over" for having a child). The scope is now said before the questions as well as after.
   - *Limits:* one coder, invented choices, agreement unmeasured. Not evidence that the language
     fits real choices; `PILOT.md` says what is.
2. *Every set of answers* (2,040): settling it and another option always there, every move with
   a derived reason, fixed order; between 3 and 15 moves show.
3. *The stories, tagged:* six distinct shapes, every question answered two ways among them, 12 of
   15 moves shown in play.

**Where 4.0 departs from the proposal.**
1. *"When will you know?" lost "by trying a small part".* That answer is a move (try it small)
   leaking into the situation: the very fault (M1) the proposal set out to fix. Answers are now
   timing only: before, by checking or asking; in time, by waiting; only once it's done; maybe
   never.
2. *No follow-ups.* Answered from inside the choice ("could part go first? no"), a follow-up
   hides the move most worth seeing. A move whose condition the four questions can't read puts
   it as a question instead: "Could part of it go first, and be stopped?"
3. *"It" is the step.* Undo and how-bad belong to a step, not a situation. Every question is
   about the step the person is unsure of (said once, before the questions); each story names
   the step it turns on (`turnsOn`) and carries that step's shape; each answer names its moves.
4. *Not sure and None of these differ:* could be (the move shows, with "If …") against doesn't
   apply (it doesn't). No special rule for two Nones; when all four are None, Tell says the
   questions don't describe the choice.
5. *Settle it is commit, rule it out, set a tripwire.* "Let it go" read as giving up the thing,
   which inverted at the boat, where keeping her whatever happens rules out the sale.
6. *Principles are conditions on a move's worth* ("…only if…"). The proposal's "limiting it
   comes first" was an instruction.
7. *Not built:* proto and validated statuses (every move would be proto; About says so once),
   language mapping tables (there is one version; records carry `language`), the closest-story
   pointer, follow-ups, research files, the growth budget. Each is in `FUTURE.md` or `PILOT.md`.

**What play is for (the owner's question).** Accepted in its preserving form: every play keeps
the whole situation (its shape, every option and its moves, what was found out, what was
chosen), so the record is contextual evidence of the player's moves in situations of known
shape. The Map lists it two ways: each move with every play that made it, and, only where the
played stories' shapes differ on a question, those stories side by side with their moves. Never
counted, summarised or put into a sentence, and never used by Bring a choice except as examples.
Rejected: presenting it as "how your move changed when the situation changed". Two stories
differ in many ways at once, a single pair is noise, and any sentence joining them infers a
cause; only minimal-pair variants could carry that, and even then as two listed plays. Play's
other roles: worth playing by itself; felt meaning for each move; shapes to recognise, since
every ending shows the shape of the step. Whether play makes real choices easier to read is a
claim for the pilot.

**Content.** All six stories bumped and tagged. The film's endings stop before the lab: both had
revealed take four soft, which vindicated the second take in hindsight. The beans gain a band
(all ten rows) so splitting the plot and giving it all to the beans are told apart. The loaf's
second step names its moves. The boat's step only shows once it's done: asking at the club brings
an option, not an answer about sailing. Three moves have no story yet (make it undoable, ask for
more time, set a tripwire), and they did much of the work in the reference choices; nor do the
answers "at a cost" and "maybe never". New content goes there first (`FUTURE.md`).

**Fixed from the proposal's review.** D1: everything shown comes from snapshots, so a content
edit can't rewrite what a play made (tested). D4: "keeps every play". D5: the storage note
(about 800 plays). D6: an unchanged state isn't rewritten. C1 is moot without connections; the
photograph's point now lives in look first's limit.

**Data.** Schema 6: plays (with `language`), kept choices (the answers, the moves as shown with
their reasons, prices and limits, what is being tried, a note; the example under each move is
drawn from the record when the choice is opened, so it can become the player's own), `seen` by
move, archive. Schemas 1–5 are archived whole; a real 3.1 document written by 3.1's engine joins
the 2.0 and 3.0 fixtures. Records from a newer language are refused as newer. The owner's own 3.1 record in the browser pane (four plays) was
archived on first load and checked byte-identical against a copy taken beforehand. From schema 6
on, a newer schema migrates plays and kept choices rather than archiving them.

**Acceptance review, before release.** The owner couldn't test by hand, so the builder exercised
the production build in Chromium and WebKit at 390×844 and 375×667: every story down unusual
paths (all the budget spent, waiting past Thursday, no rows, all ten rows), replays, six real
choices in Bring a choice (unsure throughout, None of these throughout, partly described, changed
answers, leaving without keeping, keeping, trying, notes, removing), reloads, a junk and a newer
backup refused, Export → Restore (cancelled, then accepted, exact), migration from schemas 1, 3, 4
and the owner's real 3.1 record (downloads back identical), and offline play and keeping in
Chromium. Fixed from what that showed:
- Endings say which step the moves are about ("Moves here are about selling the boat"): keeping
  the boat whatever happens is tagged "rule it out", which read backwards without it.
- When some answers are None of these, a notice before the moves says they cover only part of
  the choice; before, that was said only at the bottom.
- The Map folds each question of "the shapes you've played" into a row: after six stories it ran
  to a screen of repeated lines. Its first line now says only what is there.
- Home links to Bring a choice. Reached only through the Map, the pilot's "brings a choice back
  unprompted" would have measured finding it, not wanting it.
- "Make it undoable" asks about an easier way back, which reads right after "No" and after "Yes,
  at a cost"; examples read "In your play of …"; About no longer says Bring a choice lends the
  player's moves back.
- A long word typed as a label ran off the screen inside `<main>`, which the journeys' sideways
  check didn't look at. Labels wrap, and the check now covers `<main>`.
- Leftovers of 3.1: the page description, and two contrast-test labels.
Known and accepted: for choices outside the language's scope (a child, a duty), some moves still
read oddly ("Hand it over" for a second child); they arrive as questions, under the notice, and
the scope is said before the questions and after the moves.

**What the unrun pilot leaves open.** Nobody but the builder has used 4.0. Untested: whether people
read the same choice the same way (agreement, `PILOT.md` §0, comes first: waiting and how bad are
where the builder's own coding wavered); whether the moves widen what people consider for real
choices; whether play makes shapes easier to read than a plain list; whether people bring choices
back unprompted. Until §0 reports, no move counts as established.

---

## Tell 3.1: connections that follow the path (2026-10-20; superseded by 4.0)

**What changed, and why.** The owner's review of 3.0: Map too long and explanatory; some
connections flattened materially different choices into one interpretation (selling and keeping
the boat; felling and fencing the oak); three fixed connections showed no growing personal value;
some discoveries made the interesting choice too easy. Highest priority: the meaning of
connections, then their presentation. The brief authorised revising conflicting rules and
deleting test data, and set a vision and mission (now in `CHARTER.md`).

**The backbone, reworked.** 3.0 labelled whole stories (the way back, finding out, waiting).
3.1 describes every answer as a move in the four parts of a choice under uncertainty: action
(final, undoable, undoable at a price, holds), uncertainty (looks first, goes without, tests,
waits for news, moves before news, commits before news that can only come after), future options
(closes, keeps open, guards, keeps by using, lets fade) and consequences (what it costs, what it
risks). The logic: information is worth something only if it could change the move and arrives
before the point of no return; flexibility only if a move can be undone or put off; consequences
set how much either matters. Grounded in Howard (1966), Arrow and Fisher (1974) and Dixit and
Pindyck (1994), each checked; Tell uses the concepts, never the mathematics.

**Connections, rebuilt (owner-authorised).**
1. *Path-specific.* Each connection names the exact answers it fits. The fixed story pairs and
   their classes are gone. Felling, cutting and fencing the oak meet the bakery's shelf with three
   different distinctions; selling the boat and keeping her for the summer meet the beans
   differently, and keeping her whatever happens meets them with nothing.
2. *Two rules, tested:* a side may group answers only if the model describes them identically
   (the flattening fix, as a test); and at most one connection for any two ways through two
   stories (the review walk checks every combination).
3. *Observation apart from demonstration.* `says` describes the moves; the player's choices are
   fixed record lines behind a tap; `breaks` says where the analogy stops; `question` is for a
   real choice. The per-card "what the answers can't show" sentence is gone: said once in About.
4. *Growth.* Twenty connections, every story in at least two, many across the old pairs (the
   fence and the boat's summer: what waiting buys; the oak and the film: facts for sale, and
   none). A full first run finds about three to seven; a replay down another path can find more.
5. *Omission is valid.* Combinations with nothing true and useful get nothing; the review lists
   them. Completing two stories doesn't earn an insight by right.
   A connection that names only some steps must hold whatever the others were; the review prints
   which steps each ignores, and cards show the whole path. Where the unnamed step changed the
   meaning, the connection was split: not looking and then felling the oak ("What finding out
   costs") meets asking at the bakery differently from not looking and then fencing it ("Finding
   out later, behind a way back"); not looking and then cutting the crown gets nothing.
6. *Anchored history.* A discovery is fixed at the earliest moment both sides fitted; later plays
   add examples and never rewrite it. Replays now count (3.0 used first plays only), because the
   anchor already protects history and a different path deserves its own distinction. Priming
   guards built for fixed pairs (never adjacent, "one other story shares something") are dropped.
7. *Seen.* `seen` records the first sighting of each connection; "New" is a word, shown until
   then, never a count.

**Map.** Connections only, newest first: a short heading and one or two sentences each; "Your
choices, and where it breaks" behind a disclosure; everything played folded into one closed
section. No lede beyond one line, no repeated summaries, no per-card disclaimer.

**Play.**
- *The oak:* the tree surgeon's fact said the crown cut was harmless, which made buying it settle
  the choice. Now she says cutting eases the strain and big cuts can let rot in. The photograph
  shows the same lean and no fungus. No fact settles it.
- *The boat:* asking at the club gave a fee-free option that beat waiting outright, a guaranteed
  reward for asking. Now the club keeps her until October, so no sale before then, and beginners
  are hard on boats.
- *The lighthouse is replaced by a film set* ("The last of the light"), the weakest story repaired
  with a field that contributes a real constraint: on film, nobody can see what was caught until
  a lab develops it, so the call between another take and the planned wide shot is made blind.
  Asking the camera operator returns her honest limit, not a verdict. Facts checked against
  Wikipedia ("Dailies", "Focus puller", "Video assist") and Roland Denning, RedShark News (2023);
  "safety take" couldn't be sourced, so the story doesn't use the term. It says it is shot on
  film, because digital footage can be checked at once, and what it invents.
- *Sources for the others:* hollow oaks (Woodland Trust), rain splitting ripe grapes (University of
  Wisconsin Fruit Program), bean seed life (Johnny's Selected Seeds' storage guide). Each page was
  opened and each fact narrowed to what the page itself says. Each story's ending
  has "What's real in this story".
- *Endings:* "Other ways through" cut to a sentence or two. The teaser is gone.

**Data.** Schema 5 (plays, seen, archive). Schemas 1–4 are archived whole; a real 3.0 document,
written by 3.0's engine before it changed, joins the 2.0 one as a fixture.

**The bridge.** Each play now keeps what a future Bring a choice would need: what was unknown,
every option's move, and the path taken; each connection keeps where it breaks and a question.
The plain-text download carries all of it. `FUTURE.md` describes the retrieval.

**Editorial review.** Every path and every combination was printed and read. Changes from that
read: four sentences that overclaimed for some paths ("a day's wait would have shown",
"within a week", "meet a storm", "the light was the only clock"); a link that described waiting
when the player had sold; a risk line that read as describing the player.

---

## Tell 3.0: situations and connections (2026-10-20; revised by 3.1)

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
