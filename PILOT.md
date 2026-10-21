# Pilot plan

Nothing in Tell 4.0 has been tried by anyone but its builder. What tests can't show: whether the stories are worth playing, whether people read a real choice
the same way, and whether the moves help. There are no analytics: evidence comes from
observation, what pilots say and, with their consent, the plain-text download they choose to send
(About → "Download as plain text").

**Who:** five to ten people, including the owner, who haven't seen Tell's content. **How long:**
one observed session, two weeks of their own, then a short conversation. **Setup:** each installs
Tell on their own phone and is told only "Short stories to play, and a way to bring a real
choice." No reminders.

## 0. Do people read a choice the same way? (before anyone sees the moves)

The language is only as useful as its questions are clear. This needs no app.

- **Gather** 20–30 real choices, each as one line, with what the person did and what else they
  considered, in their own words, before they see Tell. `tests/fixtures/reference-choices.json`
  shows the format, coded by one person; it is not evidence.
- **Code:** two people answer the four questions for each choice independently, then compare.
  Agreement per question (per answer for "When will you know?"); Cohen's κ is a directional
  figure at this size (0.61 is the usual "substantial").
- **Watch** waiting (not much, against the chance goes) and how bad (something to get over,
  against hard to recover from): the builder's own coding was unsure there, and both change
  which moves show. Can it be undone (no, against at a cost) matters less: both show the same
  moves.
- **Also record** what each person actually did, as moves (known uses), and anything they did
  that no move names.
- **Holds if:** most choices can be described, and waiting and how bad mostly agree. **Fails if:**
  either splits the coders. Then reword or merge before anything else.

## 1. Is play worth it by itself?

- **Watch** the first session, thinking aloud, without help. Where do they slow down, smile or
  hesitate over a choice? Where do they tap through? Do they read the moves on an ending, or the
  shape?
- **Ask after two stories, before the third:** "What do you think the next one will ask you to
  do?" Then after it: was it what you expected?
- **Ask at the end:** Which would you play again, and why? Did any feel like it had a right
  answer? Did a move's name feel like a grade?
- **Holds if:** most can't predict the third story's controls or turn, most play four of six in
  the first sitting unprompted, and nobody reports a right answer or a give-away.
- **Fails if:** pilots predict the shape, skim the endings, or read the moves as marks.

## 2. Do the moves help with a real choice?

- **Watch** each pilot bring one real choice of their own in the app, thinking aloud. Do the
  four questions make sense of their step? Where do they reach for Not sure or None of these?
- **Ask straight away:** Was there a move you hadn't considered and would think about trying?
  Did anything read as advice about you, or as a verdict?
- **Value holds if:** at least half find a move they hadn't considered and think worth trying.
  **Tone holds if:** nobody reads a move as advice about them.
- **Two weeks later, without the app:** did they come back to the choice, mark a move as being
  tried, or bring another, unprompted? Has any move's name come up for anything real?
- **Kill criterion for Bring a choice:** fewer than half bring a real choice unprompted, and
  nobody reports a changed question or action.

## 3. Does play help people read shapes? (directional)

Half play the six stories for about 25 minutes; the other half spend the same time with the
same questions and moves in plain words (About, and Bring a choice on made-up examples). Then
everyone codes three short situations they haven't seen, against a reference coding agreed
beforehand. If play doesn't help more, it stays as the pleasure and the source of examples, and
Bring a choice leads.

## Afterwards

Write what happened as a dated entry in `DECISIONS.md`: what held, what failed, what changes.
Questions that split coders are reworded or merged; moves with three independent known uses
count as established, moves with none are marked for retirement (`FUTURE.md`, growth rules);
stories named predictable or pointless are rewritten or retired. All follow the review rule in
`AGENTS.md`.
