# Tell 4.0: review and proposal

*Revision 3, 21 October 2026. This is a proposal: nothing here is a rule until the owner decides
it. Once decided, each decision moves into `CHARTER.md`, `AGENTS.md` and a dated `DECISIONS.md`
entry, and this file is deleted. No product code has been changed.*

## The short version

**Verdict on 3.1.** Play is distinctive and the backbone is sound. The Map is now correct, but it
still produces something to *read about the past*. Every version has done this in a new form:

- a pattern (v1);
- a threshold (v2);
- a workshop record (2.0);
- a distinction between two stories (3.x).

None has given the player something to *use on the next choice*.

**Thesis.** Tell is a small **pattern language for choices under uncertainty**. It has two parts:

- a few **questions** that read a choice's shape;
- named **moves** for dealing with what makes it hard.

The parts of the product each have a job:

- *Play* builds fluency in the language.
- *Bring a choice* applies it to a real choice.
- *Your own choices* make it yours.
- *Evidence from real choices*, freely given, is the only way it grows.

**The language, in brief:**

- **Four questions** read the shape: *Can it be undone? When will you know? What does waiting
  do? How bad could it get?*
  - Three follow-ups are asked only when their answer would change what's shown.
  - Every question offers *Not sure* and *None of these*.
- **Six strategies** sort the moves by the difficulty they deal with:
  - *Find out first*;
  - *Soften the commitment*;
  - *Keep it open*;
  - *Limit the harm*;
  - *Find another way*;
  - *Settle it*.
- **Fifteen moves** sit under the strategies, each with exactly one home. Examples: "try it
  small", "buy a spare", "set a tripwire", "commit".
- **The starting fifteen are proto-moves.** They are grounded in theory, but they count as
  validated only once real choices show three independent uses of each.

**Two kinds of knowledge, kept apart:**

- *Tell's knowledge*, the same for everyone: which moves fit which shapes, what each move
  changes, what it costs and where it breaks.
- *Your record*: the examples you met, your own words for each move, and your past real choices
  with what happened.

Your record makes the library yours, but it never decides which library moves appear.

**The loop: play the shape, keep the move, bring it back.**

- **Play** is the practice ground. You read shapes and meet moves in low-stakes worlds, and each
  ending names the moves.
- **The Map** is your library: the questions you've lived, the moves you've met, and your
  choices. It leads with *Bring a choice*.
- **Bring a choice** is four questions answered by recognition ("can't be undone, like felling
  the oak").
  - Tell replies with one line per strategy that fits, saying why, and *Settle it* is always
    there.
  - You translate a move into your own world ("my shelf is a private preview").

**What accumulates (the moat).** The stories don't: they are teaching instruments, and the
language sets how many it needs. Three things do accumulate:

- the language itself, validated and versioned by evidence;
- a curated set of examples of each move across kinds of choice;
- each person's own library, in their own words.

**Scope.**

- *For:* choices you're **unsure** about.
- *Only in part:* choices you're **torn** about, choices that turn on someone else's strategy,
  and habits. Tell says so whenever it applies.

**4.0 stays small.** It builds the language, the Map, Bring a choice and the migration. Everything
else waits for evidence (§16).

**Before any code** (§15):

- **A coverage study of real choices.** It counts the known uses of every move, and checks
  whether people agree on the questions. An AI acts as a third coder.
- **A Play test.** Does playing improve shape-reading on situations people haven't seen before,
  more than the same time with a plain tool that has the same questions and moves?
- **A paper test of Bring a choice.**

---

## What changed in revision 3

Revision 2 moved the asset from a record of past choices to a library of moves. Revision 3 keeps
that, then tightens the backbone and adds the rules for growth.

| Area | Revision 2 | Revision 3 | Why |
|---|---|---|---|
| Thesis | "A small language of choices" | A small *pattern language*: it grows only from real choices, and your own choices make it yours | Pins down what "language" means, and where value accumulates |
| The analogy | "Grammar" for composition | Pattern language (Alexander), with classical planning as its formal core, plus a map of where the analogy holds and where it stops | The natural-language analogy was loose; this one is exact wherever it claims to be |
| Moves | Fifteen, flat, in three formal kinds | Six strategies grouped by difficulty, each move with one home; formal kind kept per move | People think in difficulties, results can say why each group is there, and growth adds moves under a stable top level |
| Evidence status | All moves treated as settled | All fifteen start as proto-moves, validated by three independent real uses | The growth rule must also apply to the starting library |
| Growth | One rule for additions | Operations to add, merge, split and remove; evidence thresholds; versioning; a size budget the owner sets | Grows without becoming a taxonomy |
| Limits | A table of partial fits | Adds *None of these* on every question, as the single gap signal | States plainly what Tell can't represent |
| Your history | Examples and near cases | Adds your words for each move and your cases with what happened; later, your own moves; never inference | Makes the library yours over time |
| Collective evidence | Not addressed | Opt-in research files that people save and send themselves; they reach the product only through reviewed language changes; never counts, rankings or success rates | Improves the language without herding or disguised advice |
| Moat | Implied | Stated: the validated language, the examples, each person's library; not the stories | Stops stories becoming the bottleneck |
| Play test | Next-day recall, anchored against plain | Shape-reading on situations never seen, Play against a plain tool with the same questions and moves, for equal time; recall becomes secondary | Tests what a plain tool can't give |
| AI | Build-time review and drafting; runtime later | Adds an AI third coder and synthetic red-teaming before building; runtime text-to-shape only if it matches human agreement | AI where it already helps, gated where it doesn't yet |
| Results screen | Three groups, up to three moves each | One line per strategy with its reason; tap to open | Shorter, and every line says why |
| Scope | — | An explicit list of what 4.0 builds and what it doesn't | Keeps 4.0 small |

## 1. What this review covered

- **The repo:** every document (charter, agents, decisions, future, pilot and readme), all
  source and tests, and the review walk of every path and two-story combination (533 lines).
- **History:** the four earlier versions in git, the journey screenshots, and the owner's Map
  screenshot.
- **The 25 answers, tabulated against the content:** how each is tagged, where each value
  appears, and which pairs differ in exactly one part.
- **Rule checks, across revisions 2 and 3.** The proposed rules were applied to every described
  shape in this session as one-off checks; they become a Phase 1 test.
- **Sources** were checked for each revision (see Sources).

## 2. Why Tell isn't there yet

### 2.1 One failure, five forms

| Version | What it gave the player | Why it fell short |
|---|---|---|
| v1 | A pattern about you (eight angles, a statistical gate) | Psychology by another name |
| v2 | A measurement of you ("you switched at £8") | Accurate, and "so what?" |
| 2.0 | A record of your real choice, built in a workshop | Work; you did the thinking |
| 3.0, 3.1 | An observation about two stories | True, but nothing to do with it |

All four outputs face backwards, and all four are *read*. The value Tell wants lies ahead, at the
moment of the next real choice, and comes from something the player *uses*.

### 2.2 The owner's Map, dissected

**"Waiting, or a second chance"** fits a vineyard play that picked on Wednesday or Thursday, and a
film-set play that shot another take. The idea underneath is good: waiting and a spare are two ways
to cover the same risk, and which one you have depends on when the news comes. But:

- the face of the card only summarises what the player just did;
- the title names two options, not the thing that decides between them;
- the one portable part, the question, is folded away;
- the rules forbid stating the principle plainly.

**"Facts about now, not about later"** fits an oak play that looked first and a bakery play that
asked first. It is vague, and on one path it is untrue.

- **It misfiles the photograph.** It fits any oak play that spent time finding out, including one
  that opened only the 1952 photograph. That photograph is a track record: the nearest thing the
  oak offers to evidence about *later*. 3.1 fixed flattening for options, but it came back for
  facts.
- **It compares nothing.** Both sides claim the same thing in the model (`looks-first`). Four
  3.1 connections pair moves the model calls identical. With no difference to turn on, the
  sentence has to invent one, and it comes out vague.

Section 8.7 shows where both ideas live in 4.0.

### 2.3 Root causes

1. **The wrong unit.** A distinction between two stories describes; it doesn't travel. A move
   ("buy a spare") and a question ("When will you know?") do.
2. **Tell does the comparing.** Comparing two cases side by side teaches more than studying them
   apart (Gentner, Loewenstein & Thompson 2003). 3.1 shows the cases one at a time, then hands
   over a finished comparison.
3. **The cases aren't contrasting cases.**
   - Only 15 cross-story pairs of answers differ in exactly one part of the model.
   - The key distinction, no way back against a cheap way back, has no clean pair.
   - Four connections compare identical moves.
4. **No consumer.**
   - Nothing uses the Map.
   - Memory retrieves by surface and only judges by structure (Forbus, Gentner & Law 1995).
   - Few people use a distant story until told to (Gick & Holyoak 1980).
5. **Redundant and lopsided.**
   - Twenty connections carry about ten ideas.
   - 14 of the 20 sit on 3.0's original three pairs, and 7 of 15 story pairs have none.
6. **Consequence-free play.**
   - Endings stop before outcomes.
   - Bought facts change nothing.
   - Take four is soft in both film endings.
7. **Writing grows with the square.** Six stories already make a 533-line review.
8. **Nothing has accumulated or been tested.**
   - Three of four version changes reset the record.
   - Five versions shipped in twelve days.
   - No pilot result is recorded.

## 3. Every issue found, and what 4.0 does about it

Severity: **H** blocks the mission, **M** weakens it, **L** is polish.

### 3.1 Product and experience

| # | Issue | Sev | 4.0 response |
|---|---|---|---|
| P1 | The Map describes the past; there is nothing to use | H | A library of moves and four questions, used by Bring a choice (§7.4, §8.4) |
| P2 | Bring a choice unbuilt; bridge data is kept but never read | H | Ships in 4.0 |
| P3 | The connection is delivered, not discovered | M | Your own moments illustrate everything; "Which story does this remind you of?" later (§8.2) |
| P4 | The portable part is hidden behind a tap | H | Strategies and moves lead, each saying why (§8.3) |
| P5 | A newest-first feed that never compounds | M | A fixed library: questions, strategies, your moves, your choices (§8.3) |
| P6 | Endings are consequence-free; facts change nothing | M | Endings name the moves; what-ifs and the outcome spread later |
| P7 | Play is narrow, and replays read the same | M | Variants before new worlds; new stories only for gaps (§9) |
| P8 | Play never builds the vocabulary Bring a choice needs | M | Each ending names your move and the moves you didn't make |

### 3.2 Content

| # | Issue | Sev | 4.0 response |
|---|---|---|---|
| C1 | "Facts about now" is untrue on the photograph path; facts are flattened | H | Facts carry an evidence kind; *Look first* says where it breaks (§8.7) |
| C2 | Take four is soft in both film endings (`situations.ts:313–314`) | M | Leave it unknown in the closing; the spread shows both |
| C3 | What you find out at the oak never changes the ending | M | The ending acknowledges what was learned |
| C4 | The loaf's second step is invisible to the Map | M | Step two becomes three moves: commit, try it small again, let it go |
| C5 | Opaque or verdict-tinged titles | M | Titles give way to strategy and move names |
| C6 | One idea under several titles | M | Collapsed into moves and their limits (§9) |
| C7 | The beans' named risk never happens | L | The spread shows it in some worlds |

### 3.3 The model

| # | Issue | Sev | 4.0 response |
|---|---|---|---|
| M1 | `uncertainty` mixes a property of the world with a stance of the move | H | Questions describe the situation; moves act on it (§7.3, §7.4) |
| M2 | Sparse tags: 21 of 25 answers leave a part blank | M | Every story answers the questions; every answer names its moves |
| M3 | Cards rely on features the model lacks | M | Part, another and someone become follow-ups; evidence kind stays on facts |
| M4 | Consequences are words that nothing uses | L | Costs and limits sit on each move; the spread later |
| M5 | Four values appear in one story only | M | Coverage grids for answers and moves (§9) |
| M6 | Four connections compare identical moves | H | Lived contrasts need two different answers |

### 3.4 Code and data

| # | Issue | Sev | 4.0 response |
|---|---|---|---|
| D1 | **Content edits erase or rewrite the Map.** `fits` requires `play.v === side.v` (`engine.ts:159`), and discoveries come from today's connections | H | Derive everything from each play's snapshot; fix now |
| D2 | Version changes archive the record and restart (`validate.ts:128`) | H | Migrate to schema 6; version the language; map old records, never rewrite them |
| D3 | `seen` is keyed by connection, with no version | L | `seen` keyed by move |
| D4 | "Playing again keeps both" is wrong after a second play (`Play.tsx:49`) | L | "keeps every play" |
| D5 | The storage note overstates capacity: about 1,500 plays per 5 MB, not thousands | L | Store each story version once, when records grow |
| D6 | Opening the Map writes even when nothing is new | L | Skip unchanged writes |
| D7 | `fitsAgain` can say "already on your map" for an earlier play | L | Gone with the unit change |

### 3.5 Process

| # | Issue | Sev | 4.0 response |
|---|---|---|---|
| R1 | Versions built and replaced within hours; the pilot never run | H | No major version until the studies in §15 report |
| R2 | Reading every combination is the bottleneck | M | Results are assembled by rule and checked across every combination; people read each move once |
| R3 | "Untested hypotheses" are never tested | M | `PILOT.md` rewritten around the claims in §4 |

### 3.6 Fix now, whatever 4.0 becomes

None of these has been made, per the brief.

- D1: make found connections survive content edits.
- C1: split the oak's `look` band.
- C2: stop the film's endings vindicating the second take.
- P4: put the question on each card's face.
- D4: correct the "keeps both" copy.

## 4. Problem, thesis, vision, mission

**Problem.** From inside a real choice, two things are hard to see.

- **Its shape:** whether going ahead can be undone, when you'll know what you need to know, what
  waiting does, and how bad it could get.
- **Its moves:** the smaller step you could stop, the way back you could arrange, the time you
  could ask for, the spare you could buy, or the case for settling it now.

People weigh the one or two options in front of them, in the choice's own terms. The moves that
would change it belong to other kinds of choices, and memory recalls by surface, not by shape. So
people:

- pay for facts, and wait for news, that couldn't change their move (Bastardi & Shafir 1998;
  Tversky & Shafir 1992);
- wait for news that won't come in time;
- take "small" steps that can't be undone;
- weigh a single option (Nutt 1999);
- keep things open past the point where it helps.

*In one line:* from inside a choice you can't see its shape, and the moves that fit it live in
other choices.

**Thesis.** Tell is a small pattern language for choices under uncertainty: a few questions that
read a choice's shape, and named moves for dealing with what makes it hard. Play builds fluency in
it. Bring a choice applies it. Your own choices make it yours. Evidence from real choices, freely
given, is the only way it grows.

**Vision.** People facing hard choices can see what kind of choice it is and what moves it allows,
because they have met both before, somewhere else.

**Mission.** Teach a small, playable language of choices through worlds worth playing for their
own sake. Keep the moves each player meets, in their own words. When a real choice arrives, lend
the moves back, matched by shape, in a few taps and on the player's own device. Grow the language
only from evidence that real choices freely give. Never tell players who they are or what to
choose.

**Tagline.** *Play the shape. Keep the move. Bring it back.*

**What Tell is not.** A test of you, an adviser, a course, a journal, or a game you win.

**What must be true.** Each claim is tested in §15.

1. **The language fits.** Most real choices can be described by the questions, and people
   describing the same choice mostly agree.
2. **The moves are real and widen options.**
   - Each move has independent known uses in real choices.
   - For many choices, Tell shows a move the person hadn't considered and thinks worth trying.
3. **Play earns its place.** Playing improves how well people read the shape of situations they
   haven't seen before, more than the same time with a plain tool that has the same questions and moves.
4. **It compounds.** People bring real choices back unprompted, and real choices expose few
   enough gaps that the language can absorb them within its budget.

## 5. Contrarian insights

1. **Don't make insights memorable; make them findable.**
   - Memory retrieves by surface and judges by structure (Forbus, Gentner & Law 1995).
   - Few people use a distant story until told to (Gick & Holyoak 1980).
   - So the hint at the moment of need is the product, and Tell does the remembering, by shape.
2. **Options beat insights.** Most decisions weigh one alternative (Nutt 1999), and good
   alternatives are made, not given (Keeney 1992). The asset is a library of moves, not a record
   of choices.
3. **Hedging isn't wisdom.** Every way of keeping a choice open has a price (Dixit & Pindyck
   1994). *Settle it* is always on screen, showing what it settles and what it gives up.
4. **Small and decision-relevant beats complete.** A question earns its place only if its answer
   changes which moves fit. The scope is stated, not stretched.
5. **Patterns are found, not invented.**
   - A move joins the language when real choices show it recurring: three independent known
     uses, the convention of the pattern community.
   - The starting fifteen are a theory-built bootstrap, held to the same test. If real choices show
     no uses, they go.
6. **Stories are instruments, not the moat.** Their number is set by what the language needs
   taught. The moat is the validated language, its examples, and each person's library.
7. **Never pre-fill the shape.** Defaults are powerful (Johnson & Goldstein 2003). A guessed shape
   would replace the recognition that is the point.
8. **Telling is fine, after the cases.** Explanation lands best once contrasting cases have been
   lived (Schwartz & Bransford 1998). So each question gets one principle line, shown beside your
   own lived answers.
9. **One changed fact teaches more than a new world.** A feature becomes visible when it varies
   against a stable background (Marton 2015).
10. **No right answer doesn't mean no consequences.** Show every way a move could go, and no
    single outcome can vindicate it (Howard; Duke 2018).
11. **Your attempt first, examples second.** Examples narrow what people come up with (Jansson &
    Smith 1991).
12. **Far cases for seeing and cooling, near cases for solving.**
    - Distant worlds show the shape and cool the choice (Grossmann & Kross 2014).
    - Solving may lean on near cases (Dunbar; to verify).
    - So your real choices join the Map.

## 6. What returns from earlier versions

| From | Idea | Why it fell short then | What it becomes now |
|---|---|---|---|
| v1 | Paired choices that differ by one detail | It measured the player | What-ifs change one fact *of the world* |
| v2 | "How much would need to change before you switch?" | A threshold about you | **Set a tripwire:** a threshold *you* set, as a move |
| v2 | Peek: choosing what to inspect | It measured curiosity | **Look first**, with where it breaks |
| 2.0 | Widen: options people leave out | Typed lists | **Make another option**, and the whole library |
| 2.0 | Bring a choice; matching on marked features | A workshop | Four questions answered by recognition |
| 3.0 | Pairs that differ on one question | Few, and fixed | The coverage grid; variants make minimal pairs cheaply |

Short scenario exercises that train judgement are an established family: tactical decision games,
and Klein's ShadowBox. Tell belongs to it. What none of them has is a bridge back to the player's
own choices.

## 7. The choice language

### 7.1 A library of moves, not a diary

Showing you what you did last time ("you waited") helps little at a new choice. It invites "you
tend to wait", and it anchors you to your past. What helps is:

- seeing what kind of choice it is;
- moves that fit it, above all the ones that come from other kinds of choices;
- each move's price, and where it breaks.

Tell therefore keeps two kinds of knowledge apart:

| | About choices: Tell's | About you: yours |
|---|---|---|
| What | Questions, strategies and moves: what each move fits, changes and costs, and where it breaks; one principle per question | What you played and chose; the moves you've met; your words for them; your real choices and what happened; later, your own moves |
| Same for everyone? | Yes | No |
| Used for | Choosing which library moves to show | Choosing examples; showing your words and your past choices of the same shape |
| Never used for | — | Choosing, ranking or hiding library moves; describing you; counting what you tend to do |

**The test:** for the same answers, the library moves shown are identical whatever your record
holds.

### 7.2 Is "language" the right word?

Yes, as a **pattern language**; not as a natural language.

- **What a pattern language is.** Christopher Alexander's (Alexander, Ishikawa & Silverstein 1977)
  is a set of named patterns. Each pattern pairs a recurring problem in a context with the core of
  a solution, and the patterns link so that they combine.
- **How Tell fits it.** That is what Tell's strategies and moves are. Their formal core is
  classical planning: preconditions and effects (Fikes & Nilsson 1971).

| Language idea | In Tell | Exact or loose? |
|---|---|---|
| Vocabulary | Named answers (to describe a choice) and named moves (to act on it) | Exact: finite, named, versioned |
| A sentence | A described choice, i.e. its answers | Loose: a point in a small space, with no syntax |
| Grammar | When a move applies (preconditions), what it changes (effects), what can follow it (links) | Exact in planning terms; not a syntax |
| Meaning | What a move changes, and what it costs | Qualitative, written down |
| Fluency | Recognising a shape and recalling the moves, quickly | What Play trains (tested in §15) |
| Translation | Saying a move in your own world ("my shelf is a private preview") | The person's step; suggestions later |
| Growth | Patterns are found, not invented: three independent known uses | The pattern community's rule of three |
| Where it stops | No recursion, no open-ended new meanings, nothing about what you want, how likely things are, or what others intend | — |

**None of these words appear in the app.** The app shows questions, strategies and moves in plain
words. The analogy belongs in this document because it explains three decisions:

- why Play matters: fluency comes from use;
- why translation is left to the person: the meaning lives in their world;
- how the library grows: by known uses, not invention.

### 7.3 The questions

The four core questions are always asked: answering them is the reframe, and it is how a choice is
filed. Every question also offers two escape answers:

- **Not sure:** you can't tell.
- **None of these:** the answers don't describe the choice. This is the language's one gap signal
  (§7.7).

Both leave that answer open when matching moves.

| Question | Answers | Examples in today's stories |
|---|---|---|
| **Can it be undone?** | easily · at a cost · no | easily: twelve loaves · at a cost: *none yet* · no: felling, picking, selling the boat, the last light |
| **When will you know?** *(tap all that fit)* | check or ask first · in time, if you wait · by trying a small part · only after you must decide · maybe never | check: the scan, asking at the bakery, the club or the camera operator · in time: the forecast · by trying: the shelf, the rows, the lessons · only after: whether the oak stands the storms, the reels, lessons that end after Friday · never: *none yet* |
| **What does waiting do?** | nothing · it slowly closes · the risk grows · it gets better, and riskier | nothing: the loaf · closes: the old seed, the buyer's offer, the light · risk grows: the oak · better and riskier: grapes on the vine |
| **How bad could it get?** | you'd get over it · hard to recover from | get over it: unsold loaves, half the crop · hard: a branch over the school path, a fault in the film |

**Follow-ups,** asked only when the answer would change what's shown:

- *Could you do part of it first?* Yes, and it could be stopped · yes, but that part is for good
  too · no.
- *Is there another like it?* Yes · no.
- *Is anyone else part of it?* No · yes: they could wait, help or hold it.

**Principle lines,** one per question, shown beside your own lived answers:

- *Can it be undone?* The harder a step is to undo, the more a smaller or undoable version is
  worth looking for.
- *When will you know?* Finding out is worth it only if it could change what you do and comes
  before you must act.
- *What does waiting do?* Waiting is worth its cost only if something useful arrives while you
  wait.
- *How bad could it get?* When a loss would be hard to recover from, limiting it comes first.

### 7.4 Six strategies, fifteen moves

Each strategy deals with one kind of difficulty:

- four strategies answer the hard answers to a question;
- two are always available.

Every move has exactly one home strategy, set by its primary effect. Its because-line can still
cite any answer.

| Strategy | Deals with | Its moves |
|---|---|---|
| **Find out first** | *When will you know?* The answer comes late, or not at all | Look first · Wait for it · Try it small |
| **Soften the commitment** | *Can it be undone?* No, or only at a cost | Make it undoable · Split it |
| **Keep it open** | *What does waiting do?* It closes, or the risk grows | Hold it open · Ask for more time · Hand it over · Keep it by using |
| **Limit the harm** | *How bad could it get?* Hard to recover from | Guard · Buy a spare |
| **Find another way** | Always available | Make another option |
| **Settle it** | Always available | Commit · Let it go · Set a tripwire |

**Why the grouping changed again.**

- *Revision 1* grouped moves by problem.
- *Revision 2* grouped them by formal kind (work with it, change it, end it), to keep the claim
  about composition honest.
- *Revision 3* returns to problems, for three reasons:
  - people facing a choice think in difficulties, not formal kinds;
  - a result grouped by difficulty tells the person why each group is there;
  - growth needs a stable top level, so a new move joins an existing strategy instead of
    lengthening a flat list.

The formal kind of each move is kept, below and in §7.5.

| Move | Kind | Fits when | Changes | Breaks when | Shown in stories |
|---|---|---|---|---|---|
| **Find out first** | | | | | |
| Look first | uses | you can check or ask first | — | what you can check only describes how things are now: what people say isn't what they'll do; a record or a trial says more | the scan, the climb, the photographs; three regulars, tasting; the camera operator |
| Wait for it | uses | it will come in time if you wait | — | the risk grows faster than the news | Wednesday's or Thursday's pick; the lessons, once she's kept |
| Try it small | changes | you'd know only by trying or too late, and part could go first | when you'll know: after → before you decide | the part can't be stopped either, or can't show what the whole would | twelve on the shelf; trying the recipe again; a row or two |
| **Soften the commitment** | | | | | |
| Make it undoable | changes | it can't be undone, or only at a cost | undone: no → at a cost, or at a cost → easily | the way back costs nearly as much as the step | lending her to the club |
| Split it | changes | part could go first, and you'd know only later | everything on one path → some on each | half of each is worth less than all of one | some rows of each |
| **Keep it open** | | | | | |
| Hold it open | changes | waiting closes it, or the risk grows | waiting: closes → stays, for a price | nothing will be learned while it's held | the summer; the fence |
| Ask for more time | changes | someone else sets the clock | when you'll know: too late → in time, if the answer beats the new deadline | asking costs you the offer | *none yet* |
| Hand it over | changes | someone could keep it going | waiting: closes → stays, at someone else's cost | they change what they hold | lending her to the club |
| Keep it by using | changes | it fades if unused | waiting: closes → stays, renewed by use | a little use isn't enough | a row or two |
| **Limit the harm** | | | | | |
| Guard | changes | it would be hard to recover from | how bad: hard → less hard | the guard is itself for good, or brings its own risk | the crown cut; the fence |
| Buy a spare | changes | you'll know only too late, and the bad case would be hard to recover from | how bad, in the bad case: hard → you'd get over it | the spare shares the fault | another take |
| **Find another way** | | | | | |
| Make another option | changes | always | the options: one more | looking costs the chance you have | asking at the club |
| **Settle it** | | | | | |
| Commit | settles | always | — | the answer was on its way | felling; picking on Monday; the wide shot; keeping her whatever happens; baking it weekly |
| Let it go | settles | there's another like it | — | there's no other like it | selling her; keeping it as your own bread; the drawer |
| Set a tripwire | settles | waiting changes something | the later decision → a rule set now | it watches the wrong signal | *none yet* |

**Stories show a move; they don't count as its uses.** Only real choices count (§7.7). All fifteen
moves start as **proto-moves**: defined, grounded in theory, but not yet shown to recur in real
choices.

### 7.5 The formal core

**What the questions read.** Decision analysis describes a choice through:

- its decisions;
- the uncertainties that matter;
- what is known when each decision is made;
- the values at stake.

These are the elements of an influence diagram (Howard & Matheson 1984, reprinted 2005). The
questions read that structure:

| Question | What it reads | Theory |
|---|---|---|
| Can it be undone? | Whether a later decision can reverse the commitment, and at what cost | Irreversibility (Arrow & Fisher 1974); real options (Dixit & Pindyck 1994) |
| When will you know? | Whether the uncertainty is resolved before the commitment, and how | Value of information (Howard 1966) |
| What does waiting do? | How value and risk change while the commitment is put off | The option to defer, and its cost (Dixit & Pindyck 1994) |
| How bad could it get? | The worst outcome, and whether it can be recovered from | Risk treatment (ISO 31000) |

**The planning core.**

- *The answers are a state.*
- *Moves are operators.* "Fits when" is a precondition; "changes" is an effect.
- *A plan is a sequence of moves.* Each move fits the shape the previous one left, as in classical
  planning (Fikes & Nilsson 1971).

**Three kinds of move, three formal statuses.**

- *Uses* (look first, wait for it): a precondition, and no effect.
- *Changes:* one stated effect on one answer. These match established catalogues:
  - real options: defer, stage, abandon, switch, alter scale (Trigeorgis 1996; McGrath 1999);
  - risk treatment (ISO 31000);
  - creating alternatives (Keeney 1992).
- *Settles:* ends the choice, or fixes now the rule for a later decision, as with adaptive
  planning's signposts and triggers (Walker, Haasnoot & Kwakkel 2013).

**What composes, and what is claimed.**

- *Changes* compose into plans. For example, try it small, then set a tripwire on what the small
  version shows (§8.6).
- *Uses* only filter, and *settles* end the choice.
- Costs and limits are words: they are listed, never composed.
- Nothing is computed numerically.
- The language is not complete. It is a small, theory-backed vocabulary with rules for growing.

### 7.6 What it can and cannot represent

**It can represent:**

- whether a step can be undone;
- when and how you'll know;
- what time does;
- how bad the worst case is;
- whether part can go first;
- whether there's another like it;
- whether someone else is involved.

**It cannot represent:**

- what you want, or a choice between two goods;
- how likely or how large anything is;
- what other people intend;
- who you would become;
- habits and self-control;
- group decisions;
- duties.

**How it says so:**

- *None of these* is on every question.
- If two or more core answers are *None of these*, Tell says the questions don't describe this
  choice. It then shows only the moves that are always possible.
- Results always end with: "These moves are about not knowing, and about what can't be undone.
  If what makes this hard is wanting two things at once, they cover only part of it."
- Tell never fills a gap with a guess, and never gives medical, legal or financial advice. "Ask
  someone who knows" is a *Look first* move.

**Coverage of everyday choices.** This is a judgement, pending the coverage study in §15.

| A real choice | Fit | What the language catches | What it misses |
|---|---|---|---|
| Accept one offer while waiting for another | Well | At a cost; you'll know too late; it closes; someone sets the clock | Which job you'd rather have |
| Move city; buy a home; hire someone | Well | Undo at a cost; checking and trying first; a way back (rent first; a trial period) | — |
| Start something, or launch it | Well | §8.6 | — |
| A treatment decision | Partly | Check first, or wait and watch; hard to recover from | Medical judgement; what matters most to you |
| End a relationship | Partly | Hard to undo; try small (time apart) | Feelings, values, the other person |
| Two careers you value | Partly | Try small; split | Two goods "on a par" (Chang 2002) |
| Negotiate | Partly | Ask for more time; make another option | The other side's strategy |
| Have a child | Little | Can't be undone; maybe never knowable beforehand | Who you'd become (Paul 2014) |
| Stick to a habit | No | — | Self-control, not uncertainty |

### 7.7 How the language grows

**Statuses** are the same for every move and answer:

- **Proto.** Defined (fits, changes, breaks), with a basis in theory, but with fewer than three
  independent known uses. It may appear in Play and in results. Language notes list it as proto.
- **Validated.** Three or more independent known uses in real choices.
- **Retired.** Merged into another, or still without known uses after two review rounds.

**Entry differs, and deliberately.**

- *The starting fifteen are a bootstrap.* They enter as proto on theory alone, because a language
  needs a starting vocabulary before any real choice can be coded with it. Any of them with no
  known uses after the coverage study and the pilot is retired.
- *Every later addition must be found, not invented.* It needs at least one real use, and a full
  definition, before it can become proto.

**Operations:**

| Change | When | Evidence |
|---|---|---|
| Add a move | People deal with a difficulty in a way the library lacks | One real use and a full definition makes it proto; three independent uses validate it |
| Merge two moves | Same precondition and effect, and coders can't tell them apart in real choices | Disagreement that concentrates on the pair |
| Split a move | Its uses fall into groups with different preconditions or different limits | Uses that code into two clusters |
| Add an answer | Choices marked *None of these* for the same reason, where the new answer would change which moves fit | Three or more such choices |
| Merge answers | Two answers never lead to different moves, or coders confuse them | Decision relevance and agreement |
| Add a question | It starts as a follow-up, and becomes core only if it changes the moves for most choices and coders agree on it | Agreement at least that of the core questions |
| Remove or demote a question | Coders can't agree on it, or it rarely changes the moves | Agreement and decision relevance |

**Evidence rules:**

- **Only real choices count.** That means the coverage study, the pilot and donated research files
  (§10). Synthetic choices may suggest candidates but never count.
- **"Independent" means different people *and* different kinds of choice.**
  - Donated files carry no person id, so independence between people can't be checked.
  - Donated uses therefore count only across different kinds of choice.
  - At least one of a move's three uses must come from a study with known participants.
- **Only moves actually taken count as uses.** A move someone merely considered only nominates a
  candidate.
- **Agreement.** Each question is double-coded, with Cohen's κ per question. "When will you know?"
  allows several answers, so it gets agreement per answer.
  - A core question aims for the conventional "substantial" 0.61 (Landis & Koch 1977).
  - With 20–30 choices, that figure is noisy, so it is read as a directional judgement until the
    evidence grows.
  - The owner confirms the threshold.

**Budget** (the owner sets it; proposed):

- at most five core questions;
- at most four follow-ups;
- at most eight strategies;
- at most four moves per strategy.

At the cap, an addition needs a merge or a removal. This is what keeps the language from becoming
a taxonomy.

*Keep it open* already has four moves, so the strategy most likely to grow starts at the cap. Its
next addition needs a merge, unless the owner sets five for it.

**Versioning:**

- Every change is a dated `DECISIONS.md` entry, with its evidence.
- The language carries a version, and each play and choice records the version it used.
- Old records are read through a mapping table and are never rewritten.

## 8. The product

### 8.1 The loop, and what Play gives that a plain tool can't

```
PLAY ── practice reading shapes; moves named ──▶ MAP (your library)
  ▲                                                  │
  │ "Not sure when you'll know?                      │ moves that fit,
  │  That's the vineyard."                           ▼ illustrated by yours
  └────────────────────────────────────────────  BRING A CHOICE
                       four questions; the choice is filed back on the Map
```

**A plain decision tool asks you to read the shape of your own choice without practice**, and
your own choice is the hardest place to read one. Play gives practice instead:

- repetitions in low-stakes worlds;
- consequences you feel;
- contrasts you live.

The aim is that reading a shape becomes quicker and more accurate, inside Tell and outside it. The
Play test in §15 checks exactly this: does playing improve shape-reading on situations people
haven't seen before, more than the same time with a plain tool that has the same questions and moves?

Play's other contributions are secondary:

- vivid anchors ("the shelf");
- felt consequences;
- a reason to open Tell between choices.

Bring a choice deliberately works without Play. If Play fails its test, it becomes the practice
room and the pleasure, and Bring a choice leads the product.

**Stories are not the bottleneck.**

- The language sets how many are needed: two examples per answer, and two stories per move (§9).
- New stories are written only when the language grows.
- Variants (one changed fact) cover most needs cheaply, and build-time drafting does most of the
  writing.

### 8.2 Play

**In 4.0:**

- **The six stories, repaired.** Each answers the questions, and each answer names its moves.
- **Endings name the moves.** For example: "Your move: *Hold it open* and *Guard* (the fence).
  Other ways through: *Commit* (fell it), *Guard* (cut the crown)."

**Later, each gated on evidence:**

- what-if variants;
- a tripwire variant (choose your forecast first);
- "Which story does this remind you of?";
- the outcome spread, showing how else it could have gone;
- new stories for gaps in the grid.

### 8.3 The Map

The Map leads with **Bring a choice**, then shows three things:

1. **The questions.** Each shows the answers you've lived ("Can it be undone? The loaf: easily.
   The oak: no."), with its principle line.
2. **Your moves, by strategy.** These are the moves you've met. Each shows:
   - its name, and your example ("Try it small · *the shelf*");
   - your own words for it, if you've given any;
   - its line, *fits when* and *breaks when*;
   - where you met it, and any real choices where you marked it.

   A move is marked "New" until you've seen it. Moves you haven't met don't appear, so there are
   no gaps and no counts.
3. **Your choices.** Each with its shape, the moves you looked at, your words, and what happened.

Moments and moves are listed, never counted or summarised.

### 8.4 Bring a choice

1. **Name it, if you like.** Tell never reads the name.
2. **Answer the four questions.** Each answer is illustrated by your own moves where possible.
   *Not sure* and *None of these* are always there. Follow-ups are offered only when their answer
   would change what's shown.
3. **See the results.** There is one line per strategy that fits, in a fixed order, with its
   reason and its moves, for example:
   > **Find out first** — because you can ask first, and you'd only know after: *Look first ·
   > Try it small*

   Tapping a line opens its moves. Each move shows:
   - your example;
   - its line;
   - *because…*;
   - its cost;
   - where it breaks.

   The results also give:
   - *Settle it*, every time;
   - the closest story you've played, to replay with your choice in mind.
4. **Keep it**, on the device. Optionally, add your own words for a move ("What's yours?"), mark
   one you're trying, and later note what happened. Tell never prompts for any of these.

**Rules:**

- **No pre-filled shapes.**
- **No interpreting typed text in 4.0.**
- **Selection from the answers only,** in a fixed order, never ranked.
- **Because-lines are derived, never argued:**
  - A conditional move cites the answers that make it fit.
  - A move that fits only because an answer is open (*Not sure*, *None of these*, or an unanswered
    follow-up) says so as a condition. For example, *Ask for more time* reads "If someone else
    sets the clock…".
  - *Commit* and *Make another option* say "always possible".
  - Ending moves show what they settle and what they give up, each side citing your answers.

**Effort:** four questions, about half a minute, plus up to three follow-ups.

### 8.5 Your history: what it's for

| Use | What it is | Rule |
|---|---|---|
| Examples | The story moment where you met each move | Never changes which moves show |
| Your words | Your translation of a move ("my shelf: a private preview") | Shown as your example the next time that move appears |
| Your cases | Past real choices with the same answers, and what happened, in your notes. If a later note shows the choice was shaped differently, that choice shows both | Listed as near cases, one choice at a time; never counted or compared across choices |
| Your moves (later) | A move of your own, with the answers it fits, tapped | Matched only by the answers you tapped, in a separate, labelled section. With consent, it is a candidate for the library |
| Never | Traits, tendencies, counts, rankings, or library moves chosen from your history | The property test (§13) |

Your history makes the library yours, and richer over time. It never makes Tell more confident
about you.

### 8.6 Walkthrough: "Whether to open-source my app"

The six stories, by their answers (proposed tags):

| Story | Undone? | When you'll know | Waiting | How bad |
|---|---|---|---|---|
| The old oak | no | check first; only after (the storms) | risk grows | hard |
| The harvest | no | in time, if you wait | better, and riskier | get over it |
| Your uncle's boat | no | ask first (the club); by trying (lessons); only after (they end after Friday) | closes (the offer) | get over it |
| The new loaf | easily | ask first; by trying | nothing | get over it |
| The last of the light | no | ask first (the operator); only after (the reels) | closes (the light) | hard |
| The last packet | easily | by trying | closes (the seed) | get over it |

**The answers:**

- *Can it be undone?* No: published code stays published.
- *When will you know?* Two answers fit: you can ask people now, and whether they'll use it only
  shows after publishing.
- *What does waiting do?* It slowly closes.
- *How bad could it get?* You'd get over it.
- *Follow-ups:*
  - *Could you do part of it first?* Yes, one module, but that part is for good too.
  - *Is there another like it?* Yes.
  - *Is anyone else part of it?* No.

**What Tell shows:**

- **Find out first:** because you can ask first, and you'd only know after: *Look first · Try it
  small*.
  - *Look first* breaks when what you can check only describes how things are now. What people say
    isn't what they'll do, and that limit is the one that matters here.
  - *Try it small:* you said that part is for good too. *Is there a smaller version you could
    stop?*
- **Soften the commitment:** because it can't be undone: *Make it undoable · Split it*.
- **Keep it open:** because waiting lets it close: *Hold it open · Keep it by using*.
- **Find another way:** always possible: *Make another option*.
- **Settle it:** *Commit · Let it go · Set a tripwire*.
  - *Commit* settles it now. It gives up what you'd learn first, since it can't be undone and the
    answer comes only after; less is at stake, since you'd get over it.
- **Limit the harm doesn't appear,** because you said you'd get over it.
- **The closest story is the boat**, which matches on all four answers (the film matches three).

**What the owner might then think** (Tell doesn't say this): *"Asking would only tell me what
people say. My shelf is a private preview I can stop. My tripwire: a dozen weekly users for a
month, then I publish."*

- That is three moves from three worlds, chained into a plan by *Look first*'s limit.
- The plan brings the answer before the point of no return: real options, without the name.

**How this was checked.** A one-off check in this session applied the rules to all 744 described
shapes, and found that:

- the walkthrough comes out as written;
- every shape includes *Settle it*, by construction, since *Commit* always fits;
- at most six strategy lines ever show;
- fourteen shapes show only *Find another way* and *Settle it*. All fourteen are easy to undo and
  ones you'd get over, so Tell doesn't invent a strategy for them.

### 8.7 The owner's screenshot, in 4.0

The owner's Map would hold the ideas behind both cards like this:

> **When will you know?**
> The harvest: in time; the forecast came each morning. The last of the light: too late; the reels
> came back on Thursday.
> *Finding out is worth it only if it could change what you do and comes before you must act.*
>
> **Find out first**
> *Wait for it* · Wednesday's pick. Hold off while the answer arrives. Breaks when the risk grows
> faster than the news.
> *Look first* · the scan, the tasting slices. Check what you can before you commit. Breaks when
> what you can check only describes how things are now: a record (the 1952 photograph) or a trial
> (the shelf) says more.
>
> **Limit the harm**
> *Buy a spare* · another take. Something to fall back on, bought before the point of no return.
> Breaks when the spare shares the fault.

"Waiting, or a second chance" becomes two moves, under the question that decides between them.
"Facts about now" becomes the limit of the move it qualifies. That limit is true on every path,
and it points somewhere useful.

## 9. Content, bounded by the language

**Written per story:**

- setup, steps, closings, "Other ways through" and sources;
- the story's answers;
- each answer's moves, with its own costs and risks;
- each fact's kind of evidence;
- later, what-ifs and outcome worlds.

**Written once:** each move's line, fit, change and limit, and each question's wording and
principle. That is about seventy-five short lines of general knowledge in all.

**Assembled by rule:** move names on endings, the Map, results and because-lines.

**Checked by tests,** across every combination of answers:

- the wording rules;
- the property test;
- coverage.

**Gaps the grid shows today:**

- *Answers with fewer than two examples:*
  - "at a cost": none, filled by a new story (a shop lease with a break fee);
  - "in time, if you wait": the harvest, plus a variant where the lessons finish before Friday;
  - "maybe never": none, filled by a variant where the forecast stops on Tuesday, plus a new story
    (two apprentices for one place);
  - "nothing": the loaf, plus a variant with fresh seed;
  - "the risk grows": the oak, plus a variant where the grapes are as sweet as they'll get;
  - "better, and riskier": the harvest, plus a new story (a cheese that improves and may spoil).
- *Moves shown in fewer than two stories:*
  - Make it undoable and Keep it by using: filled by the lease;
  - Split it, Guard and Buy a spare: filled by the cheese;
  - Ask for more time: a boat variant, and the lease;
  - Hand it over: a beans variant;
  - Make another option: the apprentices;
  - Set a tripwire: a harvest variant, and the cheese.

Three new stories and seven variants complete the grid. After that, new content is written only
when the language changes.

All twenty 3.1 connections survive, each as a move, a move's limit, or a question's contrast.

## 10. Collective evidence: research, not product

**What it could improve, and how:**

| What | Evidence | Path |
|---|---|---|
| Clarity of the questions | Agreement between coders | Reword, merge or demote (§7.7) |
| Missing answers | Clusters of *None of these* | Add an answer |
| Missing moves | What people actually did, in their own words | Proto, then validated |
| Limits | What happened when moves were tried | Sharpen a "breaks when" line, after review |
| Examples | People's own translations of moves | A curated set, shown only after the person's own attempt |

**How it is gathered, in stages:**

1. **Now: the coverage study.** Participants consent and take part knowingly; everything is coded
   by hand.
2. **After the pilot: *Give this choice to research*.** This is an opt-in file the person saves
   and sends themselves; Tell sends nothing.
   - *It holds:* the answers, the moves looked at and tried, and any *None of these*. If the person
     reviews and keeps them, it also holds their translations and what happened.
   - *It never holds:* a name or label, dates finer than the month, other choices, or play history.
   - It is previewed before saving. It can't be withdrawn once anonymised, and that is said up
     front.
3. **Analysis is offline and done by the owner.** AI may help cluster free text. The language
   changes only through the growth rules.

**What never reaches the product:**

- counts or shares ("most people…");
- rankings by popularity or by outcome;
- success rates;
- "people like you";
- anything about a particular person.

Outcomes are confounded and self-selected. They can sharpen how a limit is worded after review;
they can never rank moves.

**Limits:**

- Independence between people can't be verified without a person id (§7.7).
- People who donate are not everyone.
- Free text is reviewed before any use.

## 11. The cumulative moat

1. **The language, validated by real choices:**
   - questions with measured agreement;
   - moves with known uses;
   - limits sharpened by what happened;
   - a versioned history.

   A copied list would have none of this evidence or discipline.
2. **The examples.** Reviewed translations of each move across many kinds of choice.
3. **Each person's library.** Their moves in their own words, with their cases and outcomes. It is
   local and portable; its value comes from what accumulates, not from lock-in.

**Not the stories.** They are bounded teaching instruments, cheap to extend with variants and
drafting.

## 12. AI and deeper technology

**The rule:** AI proposes, the structural model checks, and a person decides. AI proposes only
about choices, never about the person.

**Near term, before and during 4.0,** with no AI running in the app:

| Use | Why it clearly helps | Guardrail |
|---|---|---|
| Third coder in the coverage study | Shows which questions are unclear, and starts the reference set that any later text feature is judged against | A third opinion only. Published human–AI agreement in qualitative coding is moderate |
| Red-teaming with synthetic choices | Finds candidate gaps across many kinds of choice in hours | Synthetic choices never count as evidence |
| Semantic review of content and rules | Catches errors of meaning that regex can't; this review found two | Flags only; a person decides |
| Drafting variants and stories for gaps | Most of the writing | The same gates as hand-written content; a person checks real facts |

**Later, at build time:**

- **Clustering donated research into candidate moves and answers.** Candidates only; the growth
  rules count them on real data.
- **Curated examples of each move for common kinds of choice.** Shown only after the person's own
  attempt.

**Longer term, running in the app.** Each needs an owner decision, and would run on the device,
opt-in and confirm-only.

| Use | Gate |
|---|---|
| **Text to shape:** a sentence proposes answers for you to confirm | Ships only if its agreement with human coders matches human-to-human agreement on a reference set grown by donations, and the pilot shows the questions are a barrier. Output is limited to the answer lists, and it shows the phrase behind each proposal |
| **Your move in your terms** | Only after your own attempt |
| **Plans:** chains of moves toward a goal you pick ("know before I must decide") | Planning over the formal core (§7.5), with no AI needed; you choose the goal |
| **Simulated outcome worlds** | No AI needed |
| **Personal worlds:** a fresh world with your choice's shape | Research; must pass the same checks as authored stories |

**Rejected:** cloud models, including "bring your own key", because they send real choices to a
third party.

**Platform reality, October 2026:**

- Chrome's Prompt API is reported to be desktop-only.
- Safari 26 brings WebGPU to iOS, but models are large downloads and need weights hosted on Tell's
  own site.
- Apple's on-device models need a native app.

Running AI on the phone is therefore a decision about a native shell, and it waits for evidence.

## 13. Data and engineering

**Schema 6, migrated from 5:**

- `plays` as now;
- `seen` keyed by move;
- `choices`: `{ id, at, language, label?, answers, trying?, words?, notes[] }`;
- `archive`.

`language` is the version of the language a play or choice used. Old records are read through
mapping tables and never rewritten. Together these fix D1 and D2.

**Pure engine:**

- `answersOf`;
- `fits`;
- `results`, by strategy, in fixed order, with because-lines;
- `followUps`, offered only if two of their answers give different results;
- `examples`;
- `closest`;
- `lived`.

**Tests:**

- **The property test.** For the same answers, the library moves shown are identical whatever the
  record holds. Your own moves, when they come, sit in a separate, labelled section matched only by
  the answers you tapped.
- *Settle it* appears in every result. This holds by construction; the test guards it.
- Every combination of answers is checked automatically: 744 described shapes, plus *Not sure* and
  *None of these*.
- Coverage of answers and moves.
- Migration from a real 3.1 document.
- Mapping between language versions.

**Kept as now:** the store, the validation door, snapshots, the PWA and CSP, the journeys and the
contrast test.

## 14. Decisions only the owner can make

1. **Replace connections with the language.** Four questions, three follow-ups, six strategies and
   fifteen moves, each written once and assembled by rule, never computed from words. One
   principle line per question, never about the player.
2. **How Tell chooses what to show:**
   - from the answers only, never from the record (a test enforces this);
   - in a fixed order by strategy;
   - with derived because-lines;
   - with *Settle it* every time.
3. **Real choices are kept.** Four questions; an optional name that is never read; optional words,
   "trying" and "what happened", never prompted; everything on the device.
4. **The record is carried forward.** The language is versioned, and old records are mapped, never
   rewritten.
5. **The scope is stated,** and *None of these* is always available.
6. **Growth is by evidence:**
   - proto and validated statuses;
   - three independent known uses, meaning different people and different kinds of choice;
   - an agreement threshold for questions;
   - synthetic choices never count.
7. **The budget for the language.** Proposed: five core questions, four follow-ups, eight
   strategies, four moves per strategy, one in, one out at the cap. *Keep it open* already sits at
   four, so the owner may set five for it.
8. **The research path.** Opt-in files that people save and send themselves. The product never
   shows counts, rankings or success rates.
9. **AI.**
   - *Now, at build time:* coding, red-teaming, review and drafting.
   - *Later, in the app:* only on the device, opt-in and confirm-only, gated on matching human
     agreement.
10. **Gathering is not aggregating.** Things are listed, never counted.
11. **Tabs** are Play · Map · About. No major version until §15 reports.

## 15. Before building

**1. Coverage study** (part-time, over about two weeks)

- **Gather, before anyone sees the library:** 20–30 real choices, each as one anonymised line,
  plus what the person actually did and what they considered, in their own words. Collecting this
  first means the moves can't prime the answers.
- **Code:** two people independently code each choice against the questions, and map what the
  person did to moves. An AI codes as a third coder.
- **Record:**
  - how many can be described, and how often *Not sure* and *None of these* come up;
  - agreement for each question (per answer for "When will you know?");
  - **the known uses of each of the fifteen moves**, counting only moves actually taken, as
    independent uses (different people, different kinds of choice); what people only considered
    nominates candidates;
  - moves people used that the library lacks;
  - how many choices are out of scope.
- **Output:**
  - which moves are validated and which remain proto;
  - which questions pass the agreement threshold;
  - the candidate gaps;
  - the first version of the reference set.
- **Language gate** (directional with this few choices). If fewer than half the choices can be
  described, or a core question clearly falls short on agreement, change the language before
  writing code.

**2. Red-team** (a day)

- About 100 synthetic choices across many kinds of life, coded by the AI, with a sample checked by
  the owner.
- It produces candidate gaps to look for in real choices. It is never evidence.

**3. Play test** (an afternoon per person; eight to ten people)

*Before the test,* two coders code sets A and B independently and settle their disagreements.
That agreed coding is the reference.

1. Everyone codes three short situations they haven't seen before (set A).
2. Half then play the six stories for about 25 minutes, with each ending's moves named on a card.
   The other half spend the same time on a plain tool. It has the same questions and answers,
   illustrated with plain examples, and the same moves with the same names, in plain words. The
   only difference between the two halves is the stories.
3. Everyone codes three different situations they haven't seen before (set B). The sets are
   swapped for half the group.

- **Primary measure, named in advance:** improvement from set A to set B in agreement with the
  reference coding, comparing the Play group with the plain-tool group.
- **The gate passes** only if the Play group improves more.
- **Secondary measure:** recall of the moves a day later.
- With this few people, the result is a directional judgement, not a statistic.

**Why the primary measure changed.** Revision 2's next-day recall tested only whether story
anchors help memory. The stronger claim, and the one unique to Play, is that it trains reading
shapes in situations people haven't seen. That is the skill Bring a choice depends on, and a plain
tool can't give it.

**4. Paper test of Bring a choice** (an hour per person; can share participants with the Play
test)

- **Value gate:** at least one new, worthwhile move in at least half the choices.
- **Tone gate:** no move reads as advice about the person.

**5. Pilot** (two weeks, after 4.0)

- **What it checks:**
  - the claims in §4;
  - known uses from real choices;
  - the *None of these* signals.
- **Kill criterion for the bridge:** fewer than half bring a real choice unprompted, and no one
  reports a changed question or action.

## 16. What 4.0 builds, and what comes later

**4.0 builds:**

- the language as data and rules: the questions with *None of these*, the strategies, the moves
  with their status, principle lines, fits, because-lines and follow-ups;
- the six stories, tagged and repaired (C1–C4), with endings that name moves;
- the Map;
- Bring a choice, including the closest-story pointer, keeping a choice, your words, and what
  happened;
- schema 6, with language versioning and migration;
- the tests;
- AI semantic review, as build tooling.

**4.0 does not build:**

- variants and the tripwire mechanic;
- "Which story does this remind you of?";
- carry-back questions;
- the outcome spread;
- new stories;
- your own moves;
- plans;
- research files;
- any AI that runs in the app;
- text interpretation.

**Later, each behind its own evidence:**

- **4.1:** variants, including the tripwire mechanic; "Which story…"; carry-back questions; your
  own moves.
- **4.2:** the outcome spread; the three new stories.
- **4.x:** research files; clustering; curated examples.
- **5.0:** the decision on AI that runs in the app.

## 17. Risks

| Risk | Mitigation |
|---|---|
| The language bloats into a taxonomy | The budget; merges before additions; proto moves without uses are retired |
| Growth rests on thin evidence | Proto status; independence rules; synthetic choices never count |
| Moves read as advice | "Is there a ___ here?"; derived because-lines; fixed order, never ranked; the tone gate |
| A bias towards hedging | *Settle it* always shown, with what it settles and what it gives up |
| Play turns out redundant | The Play test; if it fails, lead with Bring a choice and keep Play as practice |
| The questions feel abstract | Examples from your own play; *Not sure*; the language gate |
| Research data is misused | Research and product kept separate; no counts, rankings or rates; offline, owner-only analysis |
| An AI coder skews the study | A third opinion only; humans decide |
| Real choices are sensitive | On the device; never in a URL; files sent only by the person |
| Many moments read as "you tend to…" | Listed, never counted |
| Over-design | The "4.0 builds / does not build" list |

## Sources

**Verified across revisions** (publication details confirmed):

- Alexander, C., Ishikawa, S. & Silverstein, M. (1977). *A Pattern Language*. Oxford University
  Press.
- Bastardi, A. & Shafir, E. (1998). *Journal of Personality and Social Psychology* 75(1), 19–32.
- Blanchette, I. & Dunbar, K. (2000). *Memory & Cognition* 28(1), 108–124.
- Fikes, R. E. & Nilsson, N. J. (1971). STRIPS. *Artificial Intelligence* 2, 189–208.
- Forbus, K., Gentner, D. & Law, K. (1995). MAC/FAC. *Cognitive Science* 19(2), 141–205.
- Gentner, D., Loewenstein, J. & Thompson, L. (2003). *Journal of Educational Psychology* 95(2),
  393–408.
- Gick, M. L. & Holyoak, K. J. (1980). *Cognitive Psychology* 12, 306–355.
- Grossmann, I. & Kross, E. (2014). *Psychological Science* 25(8), 1571–1580.
- Howard, R. A. & Matheson, J. E. (2005). Influence diagrams. *Decision Analysis* 2(3), 127–143.
- Johnson, E. J. & Goldstein, D. (2003). *Science* 302(5649), 1338–1339.
- Marton, F. (2015). *Necessary Conditions of Learning*. Routledge.
- McGrath, R. G. (1999). *Academy of Management Review* 24(1), 13–30.
- Nutt, P. C. (1999). *Academy of Management Executive* 13(4), 75–90.
- Schwartz, D. L. & Bransford, J. D. (1998). *Cognition and Instruction* 16(4), 475–522.
- Walker, W. E., Haasnoot, M. & Kwakkel, J. H. (2013). *Sustainability* 5(3), 955–979.

**Confirmed through secondary sources:**

- The pattern community's rule of three: at least three known uses. It is common but not
  universal; candidates are called proto-patterns.
- ISO 31000 / Guide 73: risk-treatment options.
- Trigeorgis, L. (1996). *Real Options*. MIT Press: the typology of real options.
- LLMs as qualitative coders: agreement with humans is fair to moderate (arXiv 2304.10548;
  2403.06607).

**Standard references, not re-checked:**

- Arrow & Fisher (1974); Howard (1966); Dixit & Pindyck (1994).
- Chang (2002), *Ethics*.
- Duke (2018).
- Jansson & Smith (1991), *Design Studies*.
- Keeney (1992).
- Landis & Koch (1977), *Biometrics*.
- Paul (2014).
- Tversky & Shafir (1992).
- Klein's ShadowBox.

**To verify before the charter:**

- Dunbar on near and far analogies.
- Trench, Oberholzer & Minervino (2009).
- Browser AI status.
