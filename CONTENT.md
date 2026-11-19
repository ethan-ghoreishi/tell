# CONTENT.md — how rounds are made

Rounds are written and checked when Tell is built, never generated while it runs. This is the
process pack 1 went through. Follow it for every new pack; the tests enforce the structure, but
only people (or independent checkers) can vouch for facts and quality.

The owner is also the player: keep answers out of commit messages, issue titles and anything
they'd read before playing. Name rounds and topics; never what a round reveals.

## 1. Choose

A candidate earns a round if it does at least one of these, and does it honestly:

- **Surprises**: the obvious answer is wrong, or the true story is stranger than the familiar one.
- **Challenges an assumption** worth having challenged, not a straw man.
- **Connects**: it supports, challenges, qualifies or reinterprets an idea already in Tell.
- **Leaves an idea worth keeping**: a question to ask, a way to think, a real saying.

Reject: weak or unverifiable anecdotes, artificial morals, "everyone gets this wrong" gotchas
with no idea behind them, famous stories that only survive by simplification (unless the
simplification is the subject), and anything that needs more than three steps to land.

Keep the collection broad: science, reasoning, philosophy, art, history, culture, language,
economics, practical wisdom. Not too much war, history-as-dilemma or proverbs. Vary the form
(puzzle, thought experiment, true story, dilemma, myth check, timeline) and the step kinds.

## 2. Draft

Write the round in `src/content/pack-N.ts` (types in `src/domain/types.ts`). Each round has:

- `id` (never reused), `v`, `title`, `topic`, `form`, a `hook` that gives nothing away;
- one to three `steps`, each `choose`, `estimate`, `order` or `quickfire`, with `setup`, `prompt`,
  `reveal` and optional `views` (serious answers side by side). `answer` only where one is right;
- a `takeaway` (`question`, `model`, `saying` with `by` and `source`, or `insight`);
- `links` written on one end only, each `{ to, how, note }`, with a note that reads from both ends;
- `claims`, each with a `status` and at least one https `source`; a `note` for anything invented
  or simplified; `checked`, the date the claims were verified.

Style: concrete, short, warm, never preachy. Typographic quotes only; `*italics*` for titles of
works; paragraphs split by a blank line. A reveal explains; it doesn't congratulate.

An AI assistant can draft at development time. A prompt that works:

> Draft a round for Tell (see CONTENT.md and the Round type in src/domain/types.ts) about
> <subject>. Find what is genuinely surprising about it, and frame one to three steps that let
> the player predict, guess, order or choose before the reveal. Use only facts you can source to
> accessible, reliable pages; list every factual statement as a claim with its status and URL;
> mark anything disputed, legendary or invented. Offer a takeaway that is a real idea, not a
> moral. Suggest links to existing rounds (ids in src/content/index.ts) and say why.

## 3. Check, independently

A draft is not done until someone other than its writer has checked it against sources:

1. Dump the pack: `REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts` (it spoils
   everything, so the owner shouldn't read it).
2. Give each half to an independent checker (a person, or a separate AI session with web access
   and no part in the drafting), with this brief:

   > Check EVERY factual statement in these rounds (dates, numbers, names, quotations,
   > attributions, causal and historical claims), not only the listed claims, against reliable
   > sources, starting with those listed. Flag: wrong or arguable puzzle answers; disputed or
   > legendary things stated as fact; listed sources that don't support their claim; misleading
   > simplifications. Report per round only the problems, each with what the source says and a
   > suggested fix with its URL, and anything you could not verify.

3. Apply every correction, or record why not in the round's `note`. Re-check the changed lines
   and any new source URLs. Pack 1's checkers caught wrong dates, unsupported attributions, a statistic
   stretched past what it measured and a puzzle answer the evidence didn't quite support: this
   step is not optional.

## 4. Fit it in

- Add the pack to `ROUNDS` in `src/content/index.ts`; the order there is the first-run order.
  Keep neighbours varied (the test refuses two neighbours with the same topic and form).
- Link new rounds into old ones where the connection is real. Every round needs at least one.
- `npm test` must pass: structure, possible answers, links, sources, wording, length, and the
  browser journeys (which name a few rounds of pack 1 by title).
- Bump `version` in `package.json` so the update can be seen in About.

## Changing a round later

Fix facts freely, re-check them, and update `checked`. Bump `v` when meaning changes. Never
reuse an id or remove a round: a kept idea names it, and keeps its own copy of its words.
