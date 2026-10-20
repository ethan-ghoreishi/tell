# Tell — Charter

Return to this when deciding what to build, change or cut. A change that can't be justified
here doesn't ship. `AGENTS.md` turns it into rules the code must keep; `DECISIONS.md` records why.

## Vision and mission (for now)

**Vision:** a world where exploring unfamiliar situations helps people see their own choices more
clearly.

**Mission:** make thoughtful exploration enjoyable through short, playable stories, and preserve
the useful connections so people can draw on them when facing real choices.

## What Tell is

Small, intriguing worlds to play: an old oak over a school path, a vineyard waiting on a storm,
a film set losing its light. Each is a small choice somewhere unfamiliar, two or three minutes
long, worthwhile by itself. Now and then two of the player's choices, in different worlds, turn
up a distinction worth remembering. That goes on the Map, to draw on later.

Play must be worth playing without the Map. The Map must add something worth remembering. Both
stay light, tap-based and calm; nothing asks the player to write, reflect, approve or file.

## The backbone

Every answer a story offers is a **move**, described in the four parts of a choice under
uncertainty:

- **Action:** can it be taken back, cheaply, at a price, or not at all; or does it hold off?
- **Uncertainty:** what does it do about what isn't known: find out first, find out by doing,
  wait for news that will come in time, move before news that was coming, commit before news
  that can only come after, or go on what is already known?
- **Future options:** does it close something for good, keep things open at a price, guard
  against the worst, keep something possible by using it, or let it fade?
- **Consequences:** what it costs for sure, and what it risks if things go the other way.

The logic that holds these together:

1. Finding out is worth something only if it could change what you do and arrives before the
   point of no return. (Value of information: Ronald A. Howard, "Information Value Theory",
   *IEEE Transactions on Systems Science and Cybernetics*, 1966.)
2. Keeping options open is worth something only if a move can be undone or put off, and more so
   when news is on its way. (The irreversibility effect: Kenneth J. Arrow and Anthony C. Fisher,
   "Environmental Preservation, Uncertainty, and Irreversibility", *Quarterly Journal of
   Economics* 88(2), 1974, 312–319; real options: Avinash K. Dixit and Robert S. Pindyck,
   *Investment under Uncertainty*, Princeton University Press, 1994.)
3. Consequences decide how much either matters.

Reversibility, learning and waiting are the themes of this collection, not a complete taxonomy
of choice. Tell takes the concepts, not the mathematics: no probabilities are computed, no
utilities assumed, and nothing is measured about the player.

## Connections

A connection is a distinction between two **particular ways through** two situations, written
by hand. It names exactly which answers it fits, and may only group answers the model describes
the same way: felling the oak and fencing it off never share an explanation, nor do selling the
boat and keeping her. It leads with an observation about the moves themselves, in a sentence or
two. The player's own choices, where the comparison stops holding, and a question to carry to a
real choice are a tap away.

A connection never says why the player chose, never infers a motive, trait, stable preference or
cause, and never aggregates across connections. Where nothing true and useful can be said about a
combination of choices, nothing is said; completing two stories doesn't earn an insight by right.

A connection is anchored to the first moment the player's plays fitted it. Later plays can fit
it again or find new ones; they never rewrite what was found. New finds are marked as new until
seen.

## Principles

1. **Curiosity carries it.** Interesting choices, not instructions or promises of
   self-improvement. One clear action at a time, familiar controls, concise words, calm screens.
2. **No formula.** Stories vary how they're played: finding things out from a budget, comparing
   plans and seeing what follows, waiting day by day, sharing something scarce, asking someone.
   Mechanics serve a story's tension, never variety for its own sake.
3. **Fair play.** Several responses are genuinely reasonable, and every ending shows some of
   them. Asking or looking never guarantees a reward. No tricks, corrective twists, hidden
   preferred answers or compulsory debriefs.
4. **Honest worlds.** A story that borrows a real field (a film set, a vineyard) uses a real
   constraint or fact, checked against reliable sources that it cites, and says what it invents.
   A few taps don't make anyone an expert, and Tell never implies they do.
5. **Answers, not reasons.** Tell shows what was chosen, never why.
6. **Play, not pressure.** A finite collection, explicit endings, continuing and replaying by
   choice. No streaks, scores, reminders, locks, counts or nudges.
7. **The player's data, on the player's device.** No accounts, analytics or runtime AI. Backup,
   restore and plain text always work.

## The feature test

> Does this make a story more worth playing, or a connection more worth remembering and more
> honestly drawn from the path the player took, while keeping the record true, the experience
> light and the conclusions the player's own?

## Scope

**Now (3.1):** a phone PWA with six stories, twenty path-specific connections, a Map that grows
with play, and local storage with backup, restore and plain text that keeps what a future Bring a
choice would need.

**Later, only if 3.1 earns it:** see `FUTURE.md`.
