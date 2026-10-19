import type { Episode } from './types';

// Tell's episodes: short invented stories, three for each of the four
// questions. Each has the same shape: a situation, a first answer, one move
// (a twist, more options, a Cut, a Peek or a Slide), a second answer and an
// ending that separates what was answered from what it might mean and what
// stays unknown. `episodes.test.ts` checks the shape; a person reviews the
// meaning of every episode before it ships (see `rationale`).
//
// Append new episodes; never reuse an id for different content, and bump `v`
// when an episode's meaning changes. Plays keep a copy of what they showed.

/** The recommended first episode. */
export const START = 'pu-projects';

export const EPISODES: Episode[] = [
  // ---- Purpose: what outcome would make this worthwhile? -------------------
  {
    id: 'pu-projects',
    v: 1,
    part: 'purpose',
    title: 'Six evenings',
    project: 'Side projects',
    setup:
      'You have three projects half-done: a short story collection, a podcast pilot and a small app. You have about six free evenings a month. A friend asks which one gets them this season.',
    ask: 'Where do the evenings go?',
    options: [
      { id: 'stories', text: 'The stories: they’re closest to done' },
      { id: 'podcast', text: 'The podcast: it’s the most fun to make' },
      { id: 'app', text: 'The app: the most people might use it' },
    ],
    beat: {
      kind: 'twist',
      text: 'Now suppose that, in this story, none of the three will ever reach more than you and a handful of friends. Nothing else changes.',
    },
    reask: 'Then where do the evenings go?',
    ending: {
      point: 'Taking one hoped-for outcome off the table shows whether a choice was resting on it.',
      changed: [
        'Something your first answer relied on, perhaps the work reaching people, was gone, and a different reason took over.',
        'Or the thought experiment is far enough from your real situation that the second answer says little about it.',
      ],
      stayed: [
        'Your answer didn’t rest on reach: it held without it.',
        'Or you answered with your real situation in mind rather than the imagined one, which is a fair way to answer.',
      ],
      unknown: 'How many people any of the three would actually reach.',
      apply: 'If the outcome you’re hoping for were ruled out, would you still choose the same way?',
    },
    features: ['several'],
    rationale: {
      distinction: 'Whether a preference is carried by an outcome (reaching people) or by the work itself.',
      alternatives: 'Each project has a real reason behind it: finishing, enjoyment, usefulness. Staying with the app is coherent if being useful to a few friends is the point.',
      limits: 'A “suppose” question is not a forecast, and answers to imagined situations can differ from what people do.',
      relevance: 'People with several projects on the go can use it to see which reason is doing the work in a choice between them.',
    },
  },
  {
    id: 'pu-concert',
    v: 1,
    part: 'purpose',
    title: 'The house concert',
    project: 'A performance',
    setup:
      'You’ve spent a year learning a long traditional piece on the setar. A friend has offered you a ten-minute slot at a house concert in three weeks. You can play the first half cleanly, or the whole piece with two passages that still wobble.',
    ask: 'Which do you prepare?',
    options: [
      { id: 'half', text: 'The first half, played cleanly' },
      { id: 'whole', text: 'The whole piece, wobbles and all' },
    ],
    beat: {
      kind: 'cut',
      prompt: 'Before you settle it: what would make the evening worth it? Drop one at a time until one is left.',
      items: [
        { id: 'heard', text: 'The room hears the piece as it was written' },
        { id: 'clean', text: 'You play without stumbling' },
        { id: 'test', text: 'You find out how it holds up in front of people' },
        { id: 'host', text: 'Your friend’s evening goes well' },
        { id: 'mark', text: 'The year’s work ends in a performance' },
      ],
    },
    reask: 'With that one in front of you, which do you prepare?',
    ending: {
      point: 'The same evening can be worth it for different reasons, and the reasons can point to different versions.',
      changed: [
        'Naming what would make the evening worth it pointed somewhere your first answer didn’t.',
        'Or the two versions were close, and any extra question would have tipped it.',
      ],
      stayed: [
        'What you kept was already served by your first answer.',
        'Or what you kept could be served by either version, so it didn’t decide anything here.',
      ],
      unknown: 'How the evening would actually go, and whether what you kept is what you’d care about afterwards.',
      apply: 'If your real choice went the way you hope, what exactly would make it worth it?',
    },
    features: ['shape-smaller', 'public', 'others'],
    rationale: {
      distinction: 'Purpose before format: half or whole looks different once a reason for playing is named.',
      alternatives: 'Both versions are defensible. Playing cleanly respects the room; the whole piece respects the music. “Find out how it holds up” fits either.',
      limits: 'A Cut forces one survivor, and real purposes often come in pairs. The order of cutting is about this story, not a fixed order of the player’s.',
      relevance: 'Performances, launches and shows often hide a choice of purpose inside a choice of format.',
    },
  },
  {
    id: 'pu-translation',
    v: 1,
    part: 'purpose',
    title: 'The wedding reading',
    project: 'A translation',
    setup:
      'A friend has asked you to translate a short Persian poem to read at their wedding. You have two drafts. One keeps every image but sounds stiff read aloud. The other reads beautifully, drops two images and adds a line of your own.',
    ask: 'Which do you read?',
    options: [
      { id: 'faithful', text: 'The faithful draft' },
      { id: 'free', text: 'The free draft' },
    ],
    beat: {
      kind: 'twist',
      text: 'In this story, your friend mentions that the bride’s grandmother, who knows the poem by heart in Persian, will be sitting in the front row.',
    },
    reask: 'Which do you read now?',
    ending: {
      point: 'What counts as a good translation depends on who it is for and what the moment is for.',
      changed: [
        'Knowing who would be listening changed what “working” meant for the reading.',
        'Or the grandmother became a risk to manage rather than a listener to serve. Both are readings of the same change.',
      ],
      stayed: [
        'Your first draft already served the people you had in mind, her included.',
        'Or the occasion, a wedding rather than a recital, settled it whoever was listening.',
      ],
      unknown: 'How the grandmother, or anyone else in the room, would actually hear either version.',
      apply: 'Who is your real choice for, and would it change if someone else were in the front row?',
    },
    features: ['public', 'others'],
    rationale: {
      distinction: 'Audience as purpose: fidelity and beauty are both goods, and which one the reading serves depends on who hears it.',
      alternatives: 'The faithful draft honours the poem and the grandmother; the free draft honours the room and the moment. A third route, such as a line in Persian first, is left for the player to think of.',
      limits: 'One vivid listener may weigh more in the story than her real influence would. The story invents her and can’t say how she’d react.',
      relevance: 'Writers, translators, designers and musicians often serve two audiences at once.',
    },
  },

  // ---- Possibilities: are these the right options? -------------------------
  {
    id: 'po-rewrite',
    v: 1,
    part: 'possibilities',
    title: 'Rewrite or keep going',
    project: 'An app',
    setup:
      'Your habit-tracking app works, and about thirty people use it. The code has become a tangle: adding anything now takes days. You’ve framed the choice as rewriting it properly, or carrying on with the tangle.',
    ask: 'Which do you choose?',
    options: [
      { id: 'rewrite', text: 'Rewrite it' },
      { id: 'keep', text: 'Keep shipping as it is' },
    ],
    beat: {
      kind: 'widen',
      prompt: 'Before you settle it: which of these would you seriously consider?',
      items: [
        { id: 'part', text: 'Rewrite only the part that changes most often' },
        { id: 'tidy', text: 'Stop adding features for a month and tidy as you go' },
        { id: 'beside', text: 'Build the new version beside the old one, and switch when it’s ready' },
        { id: 'done', text: 'Stop adding features for good: it does what it’s for' },
      ],
    },
    reask: 'Now which do you choose?',
    ending: {
      point: 'Rewrite or not is two ends of a range: there are options in between, and one outside it.',
      changed: [
        'Seeing the range made the other end look more reasonable than it did at first.',
        'Or the extra options didn’t appeal, and turning them down settled which end you’d defend.',
      ],
      added: [
        'One of the in-between options suited this story better than either end.',
        'Or a new option appealed because it puts off the hard part. It might be a real option or a postponement, and the story can’t tell which.',
      ],
      stayed: [
        'The extra options didn’t beat the ones you had.',
        'Or the in-between options cost more than they look: a partial rewrite can take as long as a full one.',
      ],
      unknown: 'Whether the option you chose is as workable as it reads, with this code and these thirty people.',
      apply: 'In your real choice, what would a smaller, combined, later or “not at all” option look like?',
    },
    features: ['shape-smaller', 'shape-combine', 'shape-keep'],
    rationale: {
      distinction: 'Whether-or-not framing: two options presented as the whole space when others exist.',
      alternatives: 'Any of the six options is defensible. Keeping on as it is stays strong when the app is close to what it’s for.',
      limits: 'The extra options are Tell’s, not the player’s; in a real choice the useful ones come from the situation. Picking an option here doesn’t show it is workable.',
      relevance: 'Rewrite or patch, redo or revise, restart or continue: common in creative and technical work alike.',
    },
  },
  {
    id: 'po-album',
    v: 1,
    part: 'possibilities',
    title: 'Eight songs',
    project: 'A record',
    setup:
      'Your band has eight new songs. The small label that released your first record offers to put out the next one if you cut it to the four most radio-friendly songs. The other route you’ve been weighing: release all eight yourselves.',
    ask: 'Which way do you lean?',
    options: [
      { id: 'label', text: 'Four songs with the label' },
      { id: 'self', text: 'All eight on your own' },
    ],
    beat: {
      kind: 'twist',
      text: 'In this story, the drummer raises a route nobody had mentioned: the label releases the four, and you release the other four yourselves a few months later. The label is fine with it. You’d be promoting two releases instead of one.',
      adds: { id: 'both', text: 'Both: four with the label, four yourselves later' },
    },
    reask: 'Which do you choose?',
    ending: {
      point: 'Two options are sometimes not exclusive, but a combined option has costs of its own, not just the best of both.',
      changed: [
        'Hearing a third route made the original two compare differently.',
        'Or setting the combined route aside made it clearer which of the two you’d actually defend.',
      ],
      added: [
        'The combined route kept something from each that mattered more than its extra cost.',
        'Or the new option was attractive partly because it was new and hadn’t been examined like the others.',
      ],
      stayed: [
        'The cost of doing both outweighed what it kept.',
        'Or doing both splits the songs and your attention, a cost neither original route has.',
      ],
      unknown: 'Whether the split would keep the songs’ sense as a set, and what two releases would really take.',
      apply: 'Could you do part of each option? What would that cost that neither does alone?',
    },
    features: ['shape-combine', 'others', 'public'],
    rationale: {
      distinction: 'Exclusive versus combinable options, and the hidden cost of combining.',
      alternatives: 'Each of the three routes is coherent: reach (the label), the set as a whole (all eight), or both at a cost.',
      limits: 'The combined option comes from a character, which can make it feel endorsed. An option that arrives in a twist is not thereby better.',
      relevance: 'Splitting a release, phasing a launch or doing part of both are common moves in independent projects.',
    },
  },
  {
    id: 'po-newsletter',
    v: 1,
    part: 'possibilities',
    title: 'Four hundred readers',
    project: 'A newsletter',
    setup:
      'Your photography newsletter has 400 readers and has stayed that size for a year. You’re weighing a move to a paid platform with discovery features against redesigning it yourself. A third option is to leave it as it is for now.',
    ask: 'Which way do you lean?',
    options: [
      { id: 'move', text: 'Move to the platform' },
      { id: 'redesign', text: 'Redesign it yourself' },
      { id: 'leave', text: 'Leave it as it is for now' },
    ],
    beat: {
      kind: 'peek',
      prompt: 'Some facts are hidden. Open up to two, one at a time.',
      opens: 2,
      facts: [
        { id: 'replies', label: 'Readers’ replies', text: 'In this story, most replies say they like it as it is: short, one photo, one paragraph.' },
        { id: 'discovery', label: 'Discovery', text: 'In this story, the platform’s discovery page sends a new newsletter about 30 readers in its first month.' },
        { id: 'platform', label: 'The platform’s terms', text: 'In this story, the platform takes a tenth of any income, and every newsletter on it shares the same look.' },
        { id: 'weekends', label: 'The redesign', text: 'In this story, the redesign would take about six weekends, the same weekends you’d otherwise spend taking photos.' },
      ],
    },
    reask: 'Which do you choose?',
    ending: {
      point: 'Leaving things as they are is an option with its own costs and benefits, not only the absence of a decision.',
      changed: [
        'A fact you opened changed how one option looked, for better or worse.',
        'Or the order mattered: the facts arrived one at a time, and in another order a different one might have tipped you.',
      ],
      stayed: [
        'Nothing you opened moved you away from your first lean.',
        'Or you had already weighed those things before you opened them.',
      ],
      unknown: 'What the facts you didn’t open would have done, and how the newsletter would actually grow under any option.',
      apply: 'If you changed nothing for two months, what would happen? Is that one of your options?',
    },
    features: ['shape-keep', 'several', 'public'],
    rationale: {
      distinction: 'The status quo as an explicit option, weighed with facts like the others rather than taken as the default.',
      alternatives: 'Facts favour each option: the replies favour leaving it, discovery favours moving, the terms count against moving, the weekends count against redesigning.',
      limits: 'Two facts out of four is a small sample, and which ones get opened reflects curiosity as much as importance.',
      relevance: 'Independent projects plateau, and “keep it as it is” is a real choice that often goes unexamined.',
    },
  },

  // ---- Priorities: what matters when good things conflict? -----------------
  {
    id: 'pr-collaborator',
    v: 1,
    part: 'priorities',
    title: 'Two writers',
    project: 'A webcomic',
    setup: 'You’re about to start a six-month webcomic and need a writer. Two want in. Sam’s scripts surprise you every time. Ali’s are solid and always on time.',
    ask: 'Who do you work with?',
    options: [
      { id: 'sam', text: 'Work with Sam' },
      { id: 'ali', text: 'Work with Ali' },
    ],
    beat: {
      kind: 'slide',
      text: 'Suppose Sam has missed {x} of their last 10 deadlines with other artists.',
      unit: 'number',
      steps: [1, 2, 3, 4, 5, 6, 8],
      rises: 'b',
      measure: 'Missed deadlines out of 10 you’d accept for Sam’s surprises',
      actual: { value: 4, text: 'In this story, Sam missed 4 of the last 10: two by a day, two by a month.' },
    },
    reask: 'Who do you work with?',
    ending: {
      point: 'When two good things conflict, the point where you’d switch can be clearer than ranking them.',
      changed: [
        'Something in the reveal, the count or the detail behind it, moved you.',
        'Or your first answer was close, and any new information would have tipped it.',
      ],
      stayed: [
        'What you learned didn’t outweigh what drew you to your first answer.',
        'Or the count mattered less than the details you imagined behind it.',
      ],
      followed: [
        'The line you drew decided it once the story’s number arrived.',
        'Or the number agreed with what you’d have chosen anyway, so the line wasn’t really tested.',
      ],
      against: [
        'The detail behind the number, two days late or a month late, mattered more than the count.',
        'Or the line was a guess about a person, and guesses about people move when the details arrive.',
      ],
      unknown: 'How Sam and Ali would actually work with you. Past deadlines with others are only a partial guide.',
      apply: 'In your real choice, how much of one good thing would you give up for the other before switching?',
    },
    features: ['others', 'undo'],
    rationale: {
      distinction: 'A trade-off threshold: brilliance against reliability, made concrete as a count you would accept.',
      alternatives: 'Both writers are good choices. Some projects live on surprise, others on rhythm; neither answer is the intended one.',
      limits: 'A deadline record is a crude stand-in for reliability, and the numbers are invented. The switch point is a range from three answers, not a measurement.',
      relevance: 'Choosing collaborators, tools or venues often trades excellence against dependability.',
    },
  },
  {
    id: 'pr-journal',
    v: 1,
    part: 'priorities',
    title: 'The journaling app',
    project: 'An app design',
    setup:
      'You’re designing a journaling app for yourself and a few friends. You’ve sketched two designs. One syncs every device through a small server you’d run. The other keeps everything on one phone, with export files for backup.',
    ask: 'Which design do you lean towards?',
    options: [
      { id: 'sync', text: 'Sync through your own server' },
      { id: 'local', text: 'Everything on the phone, with exports' },
    ],
    beat: {
      kind: 'cut',
      prompt: 'Each design gives up something here. Drop one at a time until one is left.',
      items: [
        { id: 'private', text: 'Entries never leave the phone' },
        { id: 'devices', text: 'Write on any device' },
        { id: 'noserver', text: 'No server for you to run' },
        { id: 'friends', text: 'Easy for friends who aren’t technical' },
        { id: 'safe', text: 'Nothing lost if a phone is lost' },
      ],
    },
    reask: 'With that one left, which design do you choose?',
    ending: {
      point: 'Giving things up one at a time can show an order that a list of wishes hides.',
      changed: [
        'What survived the cut sat more naturally with the other design.',
        'Or the order you cut in was shaped by this story’s details, and with real friends it might differ.',
      ],
      stayed: [
        'Your first lean already protected what you kept.',
        'Or either design could be stretched to serve what you kept, so the cut didn’t separate them.',
      ],
      unknown: 'Whether the two designs really trade off as the story says; real builds sometimes find a third way.',
      apply: 'If you gave things up one at a time in your real choice, what would go first, and what would you keep to the end?',
    },
    features: ['others'],
    rationale: {
      distinction: 'Priority order under conflict: privacy, convenience, upkeep and resilience can’t all be maximised at once.',
      alternatives: 'Both designs are respectable and common. “Easy for friends” doesn’t clearly favour either.',
      limits: 'Forced dropping makes a strict order out of things that may be nearly tied, and the story simplifies the engineering.',
      relevance: 'People building small tools meet this exact conflict; the shape applies to any “pick two of three” design.',
    },
  },
  {
    id: 'pr-feedback',
    v: 1,
    part: 'priorities',
    title: 'The night before',
    project: 'A friend’s novel',
    setup:
      'A friend asks for honest feedback on their first novel the night before they send it to literary agents. You think the opening chapter is the weakest part of the book.',
    ask: 'What do you do tonight?',
    options: [
      { id: 'tell', text: 'Tell them the opening is the weakest part' },
      { id: 'later', text: 'Say it’s ready, and give full notes after' },
      { id: 'fixable', text: 'Mention only what they could fix by morning' },
    ],
    beat: {
      kind: 'peek',
      prompt: 'Some facts are hidden. Open up to two, one at a time.',
      opens: 2,
      facts: [
        { id: 'asked', label: 'What they said', text: 'In this story, your friend said: “Don’t be kind. I need to hear it now, not in a month.”' },
        { id: 'agents', label: 'The agents', text: 'In this story, the agents ask for the first three chapters only.' },
        { id: 'rewrites', label: 'The opening', text: 'In this story, your friend has already rewritten the opening four times and is worn out.' },
        { id: 'window', label: 'The deadline', text: 'In this story, the agents’ reading window closes tomorrow and next opens in a year.' },
      ],
    },
    reask: 'What do you do tonight?',
    ending: {
      point: 'Honesty, kindness and timing can pull three ways. The facts that moved your lean show which of them was doing the work in this story.',
      changed: [
        'A fact you opened shifted the balance between candour and care.',
        'Or the fact arrived when you were already wavering, and another might have done the same.',
      ],
      stayed: [
        'The facts you opened fitted the balance you had already struck.',
        'Or the facts that might have moved you were the ones you didn’t open.',
      ],
      unknown: 'How your friend would actually take any of the three, tonight or later.',
      apply: 'In your real choice, which two good things are pulling against each other, and what fact would tip them?',
    },
    features: ['shape-smaller', 'several', 'deadline', 'others'],
    rationale: {
      distinction: 'Conflicting goods that aren’t money or time: candour, care and timing.',
      alternatives: 'All three responses are things thoughtful friends do; none is presented as right. Two facts lean towards telling, one away, one either way.',
      limits: 'Facts arrive as certainties, unlike in real friendships. Opening two of four leaves the choice partly blind on purpose.',
      relevance: 'Giving and receiving feedback on creative work is constant in independent projects.',
    },
  },

  // ---- Evidence: what could change what you'd do? --------------------------
  {
    id: 'ev-mugs',
    v: 1,
    part: 'evidence',
    title: 'The bigger mug',
    project: 'A pottery shop',
    setup:
      'You sell handmade mugs through a small online shop with about forty regular customers. Three have asked for a larger size. A new shape would take about a month of evenings to get right. You can find out a little more first.',
    ask: 'Which way do you lean?',
    options: [
      { id: 'make', text: 'Make the larger mug' },
      { id: 'not', text: 'Not now' },
    ],
    beat: {
      kind: 'peek',
      prompt: 'Open only the facts you think could change what you’d do. Up to two, one at a time.',
      opens: 2,
      facts: [
        { id: 'who', label: 'Who asked', text: 'In this story, the three who asked are among your most frequent buyers.' },
        { id: 'now', label: 'What they do now', text: 'In this story, they say they use two of your mugs or a jug instead, and it’s fine.' },
        { id: 'glaze', label: 'The glaze', text: 'In this story, your best-selling glaze cracks on larger pieces, and a new glaze would need testing.' },
        { id: 'fair', label: 'The craft fair', text: 'In this story, a craft fair in two months would give you a place to show something new.' },
      ],
    },
    reask: 'Which do you choose?',
    ending: {
      point: 'Some facts could change the action; others are interesting but wouldn’t. Choosing which to open is itself a choice about what matters.',
      changed: [
        'A fact you chose to open changed the plan, so in this story that one was worth finding out.',
        'Or it changed the plan because it was the last thing you read, and the order mattered.',
      ],
      stayed: [
        'What you opened didn’t change the plan: the choice may have been settled before the facts arrived.',
        'Or the facts that would have moved you were among the ones you left closed.',
      ],
      unknown: 'What the unopened facts would have done, and whether real versions of these facts would be as clear.',
      apply: 'Which unknown in your real choice could actually change what you do, and which wouldn’t?',
    },
    features: ['shape-wait', 'find-ask'],
    rationale: {
      distinction: 'The value of information: whether a fact would change the action, rather than whether it is interesting.',
      alternatives: 'Making the mug and not making it are both reasonable; two facts lean each way.',
      limits: 'Only two facts can be opened, so the result depends on which caught the eye. Real information is rarely this clean.',
      relevance: 'Makers and builders often face requests from a few loyal customers and must decide what to learn first.',
    },
  },
  {
    id: 'ev-testers',
    v: 1,
    part: 'evidence',
    title: 'Twenty testers',
    project: 'A puzzle game',
    setup:
      'Your puzzle game is nearly done. Before launching, you’ll give it to 20 testers for a week. You want to decide in advance what result would make you launch now rather than spend another month on the tutorial.',
    ask: 'Right now, which way do you lean?',
    options: [
      { id: 'launch', text: 'Launch now' },
      { id: 'month', text: 'Another month on the tutorial' },
    ],
    beat: {
      kind: 'slide',
      text: 'Suppose {x} of the 20 testers finish level one without help.',
      unit: 'number',
      steps: [4, 6, 8, 10, 12, 14, 16],
      rises: 'a',
      measure: 'Testers out of 20 who must finish level one for you to launch',
      actual: { value: 11, text: 'The week passes. In this story, 11 of the 20 finished level one without help. Most who got stuck said one hint would have been enough.' },
    },
    reask: 'Launch now, or another month?',
    ending: {
      point: 'Setting the bar before seeing the result makes it visible when the result, or something beside it, changes the decision.',
      changed: [
        'Something in the result, the count or the comment beside it, moved you.',
        'Or your first lean was loose, and any result would have moved it.',
      ],
      stayed: [
        'The result didn’t give you a reason to move from where you started.',
        'Or a week of testing was never likely to change this choice, and launching and learning from players is a test too.',
      ],
      followed: [
        'The bar you set in advance did its job: the result decided it.',
        'Or the result agreed with what you’d have done anyway, so the bar wasn’t really tested.',
      ],
      against: [
        'Something beside the number, like the comment about one hint, outweighed the bar you set.',
        'Or the bar was set quickly, and a real result showed it was in the wrong place.',
      ],
      unknown: 'Whether 20 testers in one week say much about everyone who would play it.',
      apply: 'Before you find something out for your real choice, what result would make you act differently?',
    },
    features: ['find-trial', 'public'],
    rationale: {
      distinction: 'A bar set before the evidence and then compared with it: deciding in advance what would count.',
      alternatives: 'Launching now is fully defensible, and the hint comment opens a third path (add a hint) the player may think of.',
      limits: 'The bar is a range from three answers. The story’s 11 is invented, and placed near common bars on purpose.',
      relevance: 'Beta tests, pilots, sample chapters and test screenings all invite deciding the bar in advance.',
    },
  },
  {
    id: 'ev-cafe',
    v: 1,
    part: 'evidence',
    title: 'The café wall',
    project: 'A small exhibition',
    setup:
      'A café has offered you one wall for a month of photographs. You’ve been assuming they want large framed prints, which would cost a lot and take three weeks to make. Your other idea is twenty small unframed prints pinned in a grid.',
    ask: 'Which do you prepare?',
    options: [
      { id: 'framed', text: 'Large framed prints' },
      { id: 'grid', text: 'The pinned grid' },
    ],
    beat: {
      kind: 'twist',
      text: 'In this story, you reread the café’s message. It never mentions size or frames. It says: “Whatever suits the wall. It’s yours for March.”',
    },
    reask: 'Which do you prepare now?',
    ending: {
      point: 'A limit someone set and a guess about what they’d want can feel the same until you look at where each came from.',
      changed: [
        'Learning the limit was an assumption changed how the two options compared.',
        'Or the message made the café seem relaxed, which changed what felt fitting. That is a different thing from removing a rule.',
      ],
      stayed: [
        'You preferred your first option for its own sake, not because you thought it was required.',
        'Or the message changed nothing that mattered to this choice.',
      ],
      unknown: 'What the café actually hopes for. The message is all the story gives.',
      apply: 'Which limits in your real choice did someone actually set, and which are you assuming?',
    },
    features: ['assumption', 'find-ask', 'public'],
    rationale: {
      distinction: 'A constraint someone set versus an assumption about what they want.',
      alternatives: 'Large prints stay a strong choice for their own sake; the grid is cheaper and quicker. Neither is the intended answer.',
      limits: 'The twist resolves the assumption cleanly; real messages are often ambiguous. Changing answers here is not a sign of anything beyond this story.',
      relevance: 'Shows, submissions, commissions and client work are full of limits nobody actually set.',
    },
  },
];

export const episode = (id: string) => EPISODES.find((e) => e.id === id);
