# Tell — Charter

Return to this when deciding what to build, change or cut. A change that can't be justified
here doesn't ship. `AGENTS.md` turns it into rules the code must keep; `DECISIONS.md` records why.

## Vision and mission (for now)

**Vision:** a world where exploring unfamiliar situations helps people see their own choices more
clearly.

**Mission:** make thoughtful exploration enjoyable through short, playable stories, keep the moves
people make in them, and, when a real choice comes, show the moves that fit its shape.

## What Tell is

Small, intriguing worlds to play: an old oak over a school path, a vineyard waiting on a storm,
a film set losing its light. Each is a small choice somewhere unfamiliar, two or three minutes
long, worthwhile by itself. Every option in them is a move in a small language for choices under
uncertainty, shown as it's chosen, under the shape of the step the story turns on; each ending
says what the moves cost and risked there. Some stories can be played again with one fact
changed, and the two plays sit side by side. The Map is the language with the player's plays on
it. When a real choice comes, Bring a choice asks four questions about it, in taps, and shows the
moves that fit, by rule.

Play must be worth playing without the Map. Bring a choice must work without play. Both stay
light, tap-based and calm; nothing asks the player to write, reflect, approve or file. A label
and a note on a kept choice are there for the player, and Tell never reads them.

## The language

Four questions read the shape of a step (the step a story turns on, or the one a player is
unsure about taking):

- **Can it be undone?** Easily, at a cost, or not at all.
- **When will you know whether it was right?** Before, by checking or asking; in time, by
  waiting; only once it's done; maybe never. Several can be true.
- **If you wait, what happens?** Not much; the chance goes; the risk grows; it gets better, but
  riskier.
- **If it goes badly, how bad?** Something to get over, or hard to recover from.

Fifteen named **moves** deal with what makes a step hard, grouped by the difficulty they meet:
find out first (look first, wait for it, try it small); soften the step (make it undoable, split
it); keep it open (hold it open, ask for more time, hand it over, keep it by using); limit the
harm (guard, buy a spare); find another way (make another option); settle it (commit, rule it
out, set a tripwire). Each has a price and a point where it breaks. No move is free.

The logic that holds them together:

1. Finding out is worth something only if it could change what you do and arrives before the
   point of no return. (Value of information: Ronald A. Howard, "Information Value Theory",
   *IEEE Transactions on Systems Science and Cybernetics*, 1966.)
2. Keeping options open is worth something only if a move can be undone or put off, and more so
   when news is on its way. (The irreversibility effect: Kenneth J. Arrow and Anthony C. Fisher,
   "Environmental Preservation, Uncertainty, and Irreversibility", *Quarterly Journal of
   Economics* 88(2), 1974, 312–319; real options: Avinash K. Dixit and Robert S. Pindyck,
   *Investment under Uncertainty*, Princeton University Press, 1994.)
3. Consequences decide how much either matters.

Tell takes the concepts, not the mathematics: no probabilities are computed, no utilities
assumed, and nothing is measured about the player. The language is small on purpose and says
what it can't hold: wanting two things at once, someone else's plans, habits and duties. Every
move starts as a proposal, and counts as established only once real choices show it in use.

## What play is for

Play is worth playing for itself. Beyond that it gives four things a plain list of moves can't:

- **Felt meaning.** A move met in a world comes with what it cost there and where it led: the
  shelf, the fence, the second take.
- **Shapes to recognise.** Each story turns on one step and shows that step's shape from the
  start, so the four questions arrive already answered by somewhere the player has been, and the
  moves are seen as they're chosen, not named afterwards.
- **Contrast.** A variant changes one fact of a story, so one answer of its shape changes. Played
  both ways, the two plays sit side by side under that question, with what makes its moves worth
  something. It is the one honest way to feel why a shape matters: everything else is the same.
- **Contextual evidence.** Every play keeps the whole situation: its shape, every option, what
  was found out first and what was chosen. The record therefore shows the player's moves *in
  situations of known shape*. Tell keeps it, and lists it (the moves made, and a story beside
  its variant), but never counts it, sums it up, turns it into a sentence about the player, or
  uses it to choose what Bring a choice shows. Even a variant's pair is the player's to read,
  never Tell's to explain.

Whether play makes real choices easier to read is a claim for the pilot, not something the
product asserts.

## Bring a choice

Four questions about a real step, answered by recognition: each answer with an everyday moment
("can't be undone, like posting a letter") and the step of any story the player has played that
had it ("as in felling the oak"), each with Not sure and None of these. Tell then shows the moves
that fit, by strategy in a fixed order, one row each: the question it puts and why it fits. Its
card holds what it costs, where it breaks, an example (the player's own, from play, when they
have one) and the stories where it can be tried. The answers alone decide which moves show;
settling it is always there; nothing is ranked or recommended.
The scope is said before the questions and after the moves, and again before the moves when a
question doesn't describe the choice. A choice is kept only if the player
keeps it, with the moves exactly as shown, and whatever the player marks as being tried.

## Principles

1. **Curiosity carries it.** Interesting choices, not instructions or promises of
   self-improvement. One clear action at a time, familiar controls, concise words, calm screens.
2. **No formula.** Stories vary how they're played: finding things out from a budget, comparing
   plans and seeing what follows, waiting day by day, sharing something scarce, asking someone.
   Mechanics serve a story's tension, never variety for its own sake.
3. **Fair play.** Several responses are genuinely reasonable, and every ending shows some of
   them. Asking or looking never guarantees a reward. No tricks, corrective twists, hidden
   preferred answers or compulsory debriefs.
4. **Honest worlds.** A story that borrows a real field uses a real constraint or fact, checked
   against reliable sources that it cites, and says what it invents.
5. **Answers, not reasons.** Tell shows what was chosen, never why, and never what it says about
   the person.
6. **Tell doesn't choose.** Moves are described, never urged; none is ranked; history lends
   examples, never selects.
7. **Play, not pressure.** A finite collection, explicit endings, continuing and replaying by
   choice. No streaks, scores, reminders, locks, counts or nudges.
8. **The player's data, on the player's device.** No accounts, analytics or runtime AI. Backup,
   restore and plain text always work, and a record from any version is never lost.

## The feature test

> Does this make a story more worth playing, a move more worth knowing, or the shape of a real
> choice easier to see, while keeping the record true, the experience light and the conclusions
> the player's own?

## Scope

**Now (4.1):** a phone PWA with six stories and three one-fact variants, a language of four
questions and fifteen moves shown in play as they're chosen, a card for each move and question,
a Map of the language with the player's plays on it, Bring a choice with kept choices, and local
storage with backup, restore and plain text.

**Later, only if 4.1 earns it:** see `FUTURE.md`. What would show it has: `PILOT.md`.
