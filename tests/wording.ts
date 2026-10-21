// The wording rules every string a player reads must keep (AGENTS.md).

/** Words that would turn a story or a move into a verdict on the person. */
export const PSYCHOLOGY = /\b(bias|biased|fear|afraid|anxi\w*|avoid\w*|procrastinat\w*|personality|trait|insecur\w*|ego|trauma\w*|impostor|perfectionis\w*|addict\w*|compuls\w*|lazy|guilt\w*|shame\w*|self-esteem|denial|irrational|loss aversion|sunk cost|risk-averse|cautious|reckless|impulsive|diagnos\w*|therap\w*|cognitive|mindset|instinct\w*|tendency|preference)\b/i;
/** Sentences that describe the player rather than the answers. */
export const DESCRIBES_YOU = /\b(you are|you're|you’re the|you tend|you always|you never|you often|you usually|you prefer|you like to|people like you|your type|kind of person|that's like you|that’s like you)\b/i;
/** Lessons in disguise. */
export const VERDICT = /\b(should have|right answer|wrong answer|the best choice|mistake|correct|smart|wise)\b/i;
/** Advice in disguise: urging, where Tell only describes. */
export const ADVICE = /\b(should|ought to|you need|you must|comes first|we recommend|recommended|it’s best|it's best|the best (way|move|option))\b/i;
/** Money is never Tell's measure. */
export const CURRENCY = /[£$€¥]/;
