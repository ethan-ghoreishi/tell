@AGENTS.md

# Claude Code notes

Everything normative lives in `AGENTS.md` (imported above), `CHARTER.md` (why Tell exists, and
the feature test every proposal must pass) and `DECISIONS.md` (the dated why). Read the
charter before proposing a feature.

- `npm run dev` serves on port 5291 and `npm run preview` on 4291 (`.claude/launch.json`).
  Avoid ports 5173–5184: other local apps use them, and a Practice Compass service worker
  controls some of those origins in the browser pane.
- Never run commands inside sibling projects (`../practice-compass` and others); read only.
- Commit, push or deploy only when the owner asks.
