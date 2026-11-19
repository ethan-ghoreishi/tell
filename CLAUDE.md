@AGENTS.md

# Claude Code notes

Everything normative lives in `AGENTS.md` (imported above), `CHARTER.md` (why Tell exists, and
the feature test every proposal must pass), `CONTENT.md` (how rounds are researched and checked)
and `DECISIONS.md` (the dated why). Read the charter before proposing a feature.

- The owner is also the player: `src/content/`, the journeys and the review dump contain answers.
  Never quote what a round reveals in chat, commits or summaries; name rounds and topics only.
- `npm run dev` serves on port 5291 and `npm run preview` on 4291 (`.claude/launch.json`), opened
  at `tell.localhost`: the browser pane's `localhost:5291` origin holds the owner's first-version
  data, which loading the current Tell there would move into its archive. For reviews, use the
  `tell-review` launch config (`review.localhost:5291`), an origin of its own. Avoid ports
  5173–5184: other local apps use them, and a Practice Compass service worker controls some of
  those origins in the browser pane.
- Never run commands inside sibling projects (`../practice-compass` and others); read only.
- Commit, push or deploy only when the owner asks.
