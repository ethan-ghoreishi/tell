// Wording rules every string a player reads must keep (AGENTS.md). Content may
// state facts, give right answers to puzzles and offer ways to think; it may
// never describe the player or keep score.

/** Sentences that describe the player rather than the question. */
export const DESCRIBES_YOU =
  /\b(you tend|you always|you never|you often|you usually|you prefer|you like to|you seem|you must be|you’re the kind|you're the kind|people like you|your type|kind of person|that's like you|that’s like you|this (says|shows|reveals) (something )?about you|your (personality|style|bias))\b/i;

/** Pressure and tallies: no streaks, scores or counts of right answers. */
export const PRESSURE = /\b(\d+[- ]day streak|your streak|streak of|in a row|your score|you scored|points? earned|level up|\d+ (of|out of|\/) \d+ (correct|right)|well done|great job|keep it up|don’t break|don't break)\b/i;
