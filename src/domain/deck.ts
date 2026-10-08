import type { Card, LensCard, LensId, LensOption, Pair, SwitchCard } from './types';

// Tell's content. Every scene is invented (labelled as such in the app); none
// cites a real event or a statistic. Array order is dealing order within an
// area. `src/domain/deck.test.ts` enforces the structure: four distinct angles
// per round, twins offering the same four, each angle offered equally often
// per area, and paired halves sharing option ids.

const o = (lens: LensId, text: string, sees: string, misses: string): LensOption => ({
  id: lens,
  lens,
  text,
  sees,
  misses,
});

type LensFields = Omit<LensCard, 'v' | 'kind' | 'area'>;
const world = (c: LensFields): LensCard => ({ v: 1, kind: 'decode', area: 'world', ...c });
const work = (c: LensFields): LensCard => ({ v: 1, kind: 'mirror', area: 'work', ...c });

const WORLD: LensCard[] = [
  world({
    id: 'w-headlines',
    title: 'Two headlines, one day',
    scene:
      'Two headlines on the same day: ‘Crime up slightly in big cities’ and ‘Crime near historic lows’. Fear rises, and policy hardens.',
    options: [
      o('perception', 'People weigh bad news more heavily than good.', 'why fear outruns the data', 'who gains from the gap'),
      o('incentives', 'Outlets lead with the stories that hold attention.', 'the business of attention', 'the readers’ own part in it'),
      o('power', 'Politicians gain from looking tough.', 'how fear becomes a political tool', 'why the fear was there to use'),
      o('uncertainty', 'No one can read a trend from two numbers, so feelings fill the gap.', 'how ambiguity invites emotion', 'who chooses which number leads'),
    ],
    line: 'Fear follows what is vivid, not what is frequent.',
  }),
  world({
    id: 'w-newsroom',
    twin: 'k-focus',
    title: 'The newsroom’s good intentions',
    scene:
      'A newsroom sets out to publish long investigations. A year later, nearly everything it publishes is quick reaction.',
    options: [
      o('incentives', 'Quick pieces bring readers today; investigations pay off much later, if ever.', 'what each kind of work earns, and when', 'how the daily routine locks the pattern in'),
      o('structure', 'The whole publishing day is built around a stream of short slots.', 'how the format shapes the work', 'who chose that format, and why'),
      o('capacity', 'There aren’t enough reporters to protect months of slow work.', 'what slow work actually costs', 'where the existing time goes'),
      o('perception', 'What is new and loud gets noticed before what is slow and important.', 'how attention gets pulled rather than chosen', 'the money behind what gets noticed'),
    ],
    line: 'What pays now quietly outbids what matters later.',
  }),
  world({
    id: 'w-late',
    title: 'Promoted for staying late',
    scene:
      'In an office, the people who stay late and reply instantly are promoted ahead of the people who finish their work early.',
    options: [
      o('structure', 'Real output is hard to measure, so visible effort is what gets counted.', 'how measurement shapes behaviour', 'who benefits from the measure'),
      o('incentives', 'Managers are rewarded for teams that look committed.', 'what managers are paid to show', 'why staff go along with it'),
      o('belonging', 'Staying late signals loyalty, and nobody wants to be first to leave.', 'the social pressure to be seen', 'the system that created it'),
      o('capacity', 'Managers are too stretched to judge the work itself, so they go on what they can see.', 'how overload pushes people to shortcuts', 'whether they’d judge differently with time'),
    ],
    line: 'People drift toward whatever gets noticed.',
  }),
  world({
    id: 'w-cycle',
    twin: 'k-plan',
    title: 'The plan that never starts',
    scene:
      'A city’s cycle-lane plan has been ‘nearly ready’ for three years. Every review adds another consultation. Nothing has been built.',
    options: [
      o('uncertainty', 'No one can be sure how it will work, so one more review always feels safer than starting.', 'how open questions keep a project in planning', 'who might prefer the delay'),
      o('identity', 'The council has staked its reputation on the plan, and a visible failure would cost more than a quiet delay.', 'how a reputation can make starting feel dangerous', 'the practical blockers in the way'),
      o('capacity', 'The team is too stretched to run a build alongside everything else.', 'the limits of people, time and money', 'why there is still room for more reviews'),
      o('structure', 'Approval needs sign-off from bodies that rarely meet, so the process sets the pace.', 'how a process can decide the speed', 'whether anyone is pushing to go faster'),
    ],
    line: 'A plan stays safe for as long as it stays a plan.',
  }),
  world({
    id: 'w-inflation',
    title: 'Inflation nobody hurries to fix',
    scene:
      'Governments say they want low inflation. Yet when it runs above target and public debts are high, they act cautiously.',
    options: [
      o('incentives', 'Moderate inflation quietly shrinks the real value of government debt.', 'who gains from slow action', 'the risks of acting fast'),
      o('power', 'Central banks, not governments, hold the main lever, and they move carefully.', 'who actually controls the outcome', 'what governments would do if they could'),
      o('uncertainty', 'Nobody knows whether faster action would tip the economy into recession.', 'how uncertainty argues for caution', 'who benefits while everyone waits'),
      o('capacity', 'Tough measures cost money and goodwill that are already spent elsewhere.', 'the limits on what can be done', 'whether the will is there at all'),
    ],
    line: 'Systems settle for the least damaging trade-off, not the stated goal.',
  }),
  world({
    id: 'w-flaw',
    twin: 'k-meeting',
    title: 'The flaw nobody mentioned',
    scene: 'In a project review, a junior engineer spots the flaw that later sinks the launch. They say nothing.',
    options: [
      o('belonging', 'Speaking up risked looking naive in front of senior colleagues.', 'the social cost of being wrong in public', 'whether the room was ever open to it'),
      o('power', 'The people running the review decide whose views count, and juniors know it.', 'who controls what gets heard', 'the engineer’s own doubts'),
      o('uncertainty', 'They weren’t sure enough they were right to risk saying it.', 'how doubt can silence a good point', 'what made certainty the price of speaking'),
      o('structure', 'The meeting’s format left no real moment for objections.', 'how a format can screen out dissent', 'what people would do with a better format'),
    ],
    line: 'Silence in a room can say more about the room than about the idea.',
  }),
  world({
    id: 'w-view',
    title: 'The queue for the view',
    scene: 'Thousands queue for the same famous viewpoint, while a similar view two streets away stays empty.',
    options: [
      o('belonging', 'The photo matters partly because others will recognise it.', 'the social value of shared landmarks', 'how people are steered there'),
      o('structure', 'Guidebooks, maps and transport all funnel people to the same spots.', 'how routes create crowds', 'what people actually want from the view'),
      o('perception', 'A famous place feels more worth seeing simply because it is famous.', 'how reputation changes what we perceive', 'the practical pull of the route'),
      o('identity', 'Ticking it off fits the story people want to tell about their trip.', 'the trip as part of a self-image', 'the crowd’s own momentum'),
    ],
    line: 'Popularity can be a reason, or stand in for one.',
  }),
  world({
    id: 'w-rail',
    twin: 'k-course',
    title: 'The project that can’t be stopped',
    scene: 'A government keeps funding a rail line whose costs have tripled. Ministers insist it must be finished.',
    options: [
      o('identity', 'Ministers have tied their names to it; stopping would mean admitting a mistake.', 'how a decision becomes part of someone’s standing', 'who else gains from carrying on'),
      o('perception', 'The money already spent makes stopping feel like waste, though it is gone either way.', 'how past costs colour future choices', 'the people pressing for it to continue'),
      o('belonging', 'Cancelling would anger the regions and allies who backed it.', 'the loyalties a decision creates', 'whether the line is still worth building'),
      o('incentives', 'The firms and lobbies who profit from it press hard to keep it going.', 'who benefits from it continuing', 'the ministers’ own reasons'),
    ],
    line: 'What is already spent can steer what happens next.',
  }),
  world({
    id: 'w-shelter',
    title: 'The bike shelter row',
    scene: 'A neighbourhood group chat turns against a new bike shelter. Later, most members admit they never minded it.',
    options: [
      o('belonging', 'Nobody wanted to defend it against the loudest voices.', 'the cost of standing apart', 'how the chat amplified those voices'),
      o('identity', 'Objecting fits how long-time residents see themselves: guardians of the street.', 'the role people play for themselves', 'what the quiet majority thought'),
      o('structure', 'Group chats reward quick reactions, so the first strong opinions set the tone.', 'how the medium shapes the mood', 'why people stayed quiet'),
      o('uncertainty', 'No one knew what the others really thought, so each assumed they were alone.', 'how hidden opinions stay hidden', 'who benefited from the silence'),
    ],
    line: 'A loud few can sound like everyone.',
  }),
  world({
    id: 'w-theory',
    twin: 'k-flaw',
    title: 'The theory under pressure',
    scene:
      'After ten years on a theory, a respected scientist meets strong new evidence against it. They spend the next year hunting for flaws in the evidence.',
    options: [
      o('identity', 'The theory has become part of who they are.', 'how ideas fuse with the self', 'the practical stakes of being wrong'),
      o('incentives', 'Their funding, students and reputation all rest on the theory.', 'what they stand to lose', 'how it feels from the inside'),
      o('perception', 'Everyone tests unwelcome evidence harder than welcome evidence.', 'the ordinary tilt in how evidence is weighed', 'what makes this case different'),
      o('power', 'As a senior figure, they help decide which papers and voices get heard.', 'how gatekeeping protects a view', 'whether they’re simply right to be careful'),
    ],
    line: 'People defend the self attached to an idea harder than the idea.',
  }),
  world({
    id: 'w-system',
    title: 'The system nobody complains about',
    scene: 'A hospital’s new computer system is slower than the old one. Within a month, staff stop complaining.',
    options: [
      o('identity', 'Coping with bad tools becomes part of being a good professional.', 'how endurance becomes a point of pride', 'whether complaining could ever work'),
      o('capacity', 'No one has spare time to push for a fix while the work keeps coming.', 'how overload absorbs protest', 'who could make time if it mattered'),
      o('belonging', 'Complaining starts to look like not being a team player.', 'the social price of objecting', 'the people who made the decision'),
      o('power', 'The decision was made far above them, and they know it won’t be reversed.', 'where control sits', 'what staff could do together'),
    ],
    line: 'Silence can be adaptation, not approval.',
  }),
  world({
    id: 'w-startup',
    twin: 'k-compare',
    title: 'Nine months before a customer',
    scene: 'A start-up spends nine months building features before showing the product to a single customer.',
    options: [
      o('uncertainty', 'Nobody knows what customers want, and building feels safer than finding out.', 'how avoiding an answer can look like work', 'the money that makes the delay affordable'),
      o('capacity', 'Plenty of funding means nothing forces an early test.', 'how abundance removes pressure', 'what the team believes it is doing'),
      o('perception', 'Building feels like progress, so activity gets mistaken for learning.', 'how busy can feel like forward', 'who decides when it is ready'),
      o('power', 'The founder decides what is ready, and nobody can overrule them.', 'where the final say sits', 'why the founder hesitates'),
    ],
    line: 'Building can be a way of not finding out.',
  }),
];

const WORK: LensCard[] = [
  work({
    id: 'k-plan',
    twin: 'w-cycle',
    title: 'The plan you keep improving',
    scene: 'You care about a project. You keep improving the plan, and starting keeps moving to next week.',
    options: [
      o('uncertainty', 'The first step still isn’t clear, so planning feels like progress.', 'how an unclear first step stalls everything', 'what the delay might be protecting'),
      o('identity', 'Starting would put your ability on show; a plan can’t be judged yet.', 'how making something exposes you', 'plainer reasons, like energy or time'),
      o('capacity', 'You don’t have the energy the work needs right now, and planning asks less.', 'the real cost of starting', 'why planning doesn’t feel tiring'),
      o('structure', 'Your days never offer a clear block of time to begin in.', 'how the shape of a week decides what happens', 'what you’d do with the block if you had it'),
    ],
    line: 'Potential feels safe because nothing has judged it yet.',
  }),
  work({
    id: 'k-focus',
    twin: 'w-newsroom',
    title: 'The focus block that leaks',
    scene: 'You plan a focused ninety minutes. Within minutes, your attention drifts to tabs, messages and small side-checks.',
    options: [
      o('incentives', 'The task pays off later; the tabs pay off right now.', 'the rewards competing for you', 'the discomfort you might be escaping'),
      o('structure', 'Your setup leaves too many easy exits open.', 'how surroundings set the default', 'why the exits are tempting'),
      o('capacity', 'You started already tired, so sustained focus costs more than you have.', 'focus as something that runs out', 'how the task itself feels'),
      o('perception', 'Small novelties catch your attention before you notice you’ve moved.', 'how attention moves before you decide', 'what would make the task more gripping'),
    ],
    line: 'Attention follows the easiest reward unless the setting changes.',
  }),
  work({
    id: 'k-reply',
    title: 'The reply you keep putting off',
    scene: 'An important email has sat unanswered for four days. You think about it most evenings.',
    options: [
      o('uncertainty', 'You’re not sure yet what you want to say.', 'the open question behind the reply', 'what waiting is costing'),
      o('belonging', 'Whatever you say will change how they see you.', 'the relationship riding on it', 'how they are reading the silence'),
      o('capacity', 'It needs a kind of focus you haven’t had to spare.', 'the effort it really takes', 'how much effort the avoiding takes'),
      o('identity', 'It touches something you feel you should already have handled.', 'the self-judgement attached to it', 'the practical next step'),
    ],
    line: 'Delay keeps an untested reply perfect.',
  }),
  work({
    id: 'k-meeting',
    twin: 'w-flaw',
    title: 'The idea you kept to yourself',
    scene:
      'In a meeting, you have a sharp, slightly unconventional thought. You don’t say it. Minutes later someone says a flatter version, and it lands well.',
    options: [
      o('belonging', 'You didn’t want to risk being misunderstood or judged.', 'the social cost you were weighing', 'whether the room made space for you'),
      o('power', 'The people leading the meeting decide which ideas get airtime.', 'who controls the floor', 'your own hesitation'),
      o('uncertainty', 'You weren’t sure it was right until someone else said it.', 'how doubt waits for confirmation', 'what made certainty the price of speaking'),
      o('structure', 'The conversation moved on before there was a gap to speak into.', 'how pace and turn-taking decide who speaks', 'what you’d have done with a gap'),
    ],
    line: 'Waiting for zero risk trades signal for safety.',
  }),
  work({
    id: 'k-borrow',
    title: 'Borrowing someone’s system',
    scene: 'You come across someone unusually effective. Within a week, you’ve adopted their whole routine.',
    options: [
      o('uncertainty', 'A proven structure saves you the uncertainty of finding your own.', 'the relief of borrowed certainty', 'whether it fits your life'),
      o('identity', 'Becoming more like them feels like becoming who you want to be.', 'admiration as a pull on identity', 'what already works for you'),
      o('belonging', 'Their way carries status, and copying it borrows some of that.', 'the social signal in a method', 'the method’s actual merits'),
      o('perception', 'Their success makes every part of their routine look like a cause of it.', 'how success casts a halo', 'luck and circumstance'),
    ],
    line: 'Admiration isn’t the same as fit.',
  }),
  work({
    id: 'k-course',
    twin: 'w-rail',
    title: 'The course you keep going with',
    scene: 'You’re halfway through a long course you no longer enjoy or need. You keep going.',
    options: [
      o('identity', 'You see yourself as someone who finishes what they start.', 'how a self-image can drive a choice', 'whether the course still serves you'),
      o('perception', 'The time you’ve already put in makes stopping feel like waste.', 'how past effort colours the next step', 'what you’d gain by stopping'),
      o('belonging', 'You’d feel awkward telling people you dropped it.', 'the audience in your head', 'how much they would actually care'),
      o('incentives', 'The certificate at the end still feels worth something.', 'the payoff you’re still counting on', 'what it costs to get there'),
    ],
    line: 'Finishing can protect a self-image as much as a goal.',
  }),
  work({
    id: 'k-unfinished',
    title: 'The project stuck at eighty per cent',
    scene: 'A side project is eighty per cent done. You start a new one instead of finishing it.',
    options: [
      o('incentives', 'The last stretch is dull; the new idea is exciting right now.', 'the pull of the new', 'what finishing would give you'),
      o('capacity', 'Finishing takes a heavier kind of energy than starting.', 'how phases of work drain differently', 'whether that energy comes back'),
      o('structure', 'Nothing in your week is set up for finishing: no deadline, no audience.', 'how missing structure lets work drift', 'why you haven’t added one'),
      o('identity', 'Finishing would turn it from promising to judged.', 'how unfinished work protects a hope', 'the plainer reasons'),
    ],
    line: 'Unfinished work keeps a hope intact.',
  }),
  work({
    id: 'k-flaw',
    twin: 'w-theory',
    title: 'When someone finds a flaw',
    scene:
      'A colleague finds a real flaw in a framework you built. Before you’ve fully understood their point, you’re looking for holes in it.',
    options: [
      o('identity', 'The framework feels like part of you, so the criticism lands personally.', 'how work becomes part of the self', 'what the flaw actually is'),
      o('incentives', 'You’ve invested a lot in it, and changing course would cost you.', 'the price of being wrong', 'the price of staying wrong'),
      o('perception', 'Criticism is simply easier to scrutinise than agreement.', 'the usual tilt in how evidence is weighed', 'why this case stings'),
      o('power', 'You built it, so it feels like yours to decide what changes.', 'ownership as a kind of control', 'who else depends on it'),
    ],
    line: 'The idea is replaceable; it is the identity that hurts.',
  }),
  work({
    id: 'k-priorities',
    title: 'When priorities keep changing',
    scene: 'Your manager changes the team’s priorities for the third time this month. You quietly stop investing in the plan.',
    options: [
      o('power', 'They can override any plan at any time, so investing feels pointless.', 'where control really sits', 'what you can still shape'),
      o('incentives', 'Nothing rewards long-term plans if they are rarely kept.', 'the payoff that went missing', 'the cost of disengaging'),
      o('belonging', 'Pushing back would make you look difficult.', 'the social price of objecting', 'who else feels the same'),
      o('structure', 'The team has no agreed way of changing priorities, so changes just happen.', 'the missing process', 'who benefits from having none'),
    ],
    line: 'Effort follows what is likely to survive.',
  }),
  work({
    id: 'k-compare',
    twin: 'w-startup',
    title: 'The comparison that ate the evening',
    scene: 'Before choosing a tool for a small project, you spend an evening comparing options that would all do the job.',
    options: [
      o('uncertainty', 'You can’t tell which is best, and more research feels like it will settle it.', 'how uncertainty keeps a search going', 'that none of them may be clearly best'),
      o('capacity', 'You were too tired to start the real work, and comparing asks less.', 'comparison as a low-energy stand-in', 'what made the real work feel heavy'),
      o('perception', 'Comparing feels productive, so it’s hard to notice it has become a loop.', 'how research can feel like progress', 'when to stop'),
      o('power', 'Someone else will judge the choice, so it has to be beyond challenge.', 'who you are really choosing for', 'how little the choice matters'),
    ],
    line: 'More research can be a way of not choosing.',
  }),
  work({
    id: 'k-yes',
    title: 'Another yes',
    scene: 'Someone asks for help with their project. Your week is already full. You say yes.',
    options: [
      o('belonging', 'You don’t want to let them down or seem unhelpful.', 'the wish to be seen as generous', 'what the yes costs the people who rely on you'),
      o('power', 'The person asking has a say in your work.', 'the quiet pressure of influence', 'whether they’d mind a no'),
      o('perception', 'Next week always looks roomier than this one.', 'how the future looks emptier than it is', 'why this request felt urgent'),
      o('incentives', 'Helping now builds credit you may need later.', 'the exchange behind a favour', 'the cost to your own work'),
    ],
    line: 'Next week is always roomier than this one.',
  }),
  work({
    id: 'k-rate',
    title: 'The price you never raise',
    scene: 'You charge less for your freelance work than you think it’s worth, and you haven’t raised your rate in two years.',
    options: [
      o('uncertainty', 'You can’t be sure clients would pay more.', 'the unknown you’d have to test', 'what staying cheap is costing'),
      o('capacity', 'You can’t afford to lose even one client right now.', 'the margin you’re working without', 'whether raising it would lose anyone'),
      o('structure', 'The rate was set long ago, and nothing in your routine prompts a review.', 'how defaults persist unnoticed', 'why it hasn’t felt urgent'),
      o('power', 'Your biggest client sets the terms, and you know it.', 'who holds the bargaining power', 'the options you haven’t tested'),
    ],
    line: 'A default stays in place until something makes it visible.',
  }),
];

// Paired choices: the halves are identical except for one detail, dealt at
// least two days apart, and linked only after the second is answered.
export const PAIRS: Pair[] = [
  {
    id: 'workshop',
    kind: 'consistency',
    title: 'The workshop tonight',
    changed: 'whether the place cost £40 or was free',
    note: 'The £40 is spent either way. Some people find that changes the choice and some don’t; mood and the day itself can tip it too.',
  },
  {
    id: 'flight',
    kind: 'trade-off',
    title: 'The early flight',
    changed: 'the price of the later flight (£79, then £139)',
    note: 'This difference is meant to matter. Whether you switched shows where your line sits between money and sleep.',
  },
  {
    id: 'buffer',
    kind: 'consistency',
    title: 'Six weeks at risk',
    changed: 'whether the same outcomes were described as weeks saved or weeks lost',
    note: 'Both versions describe identical outcomes; only the wording moved between saving and losing. A different answer can come from that, or from the day.',
  },
];

const pairCard = (c: Omit<SwitchCard, 'v' | 'kind' | 'area'>): SwitchCard => ({ v: 1, kind: 'switch', area: 'work', ...c });

const GO = [
  { id: 'go', text: 'Go' },
  { id: 'stay', text: 'Stay home' },
];
const FLIGHTS = [
  { id: 'early', text: 'Flight A, the early one' },
  { id: 'later', text: 'Flight B, the later one' },
];
const PLANS = [
  { id: 'sure', text: 'Plan A' },
  { id: 'gamble', text: 'Plan B' },
];

const workshopA = pairCard({
  id: 's-workshop-a',
  pair: 'workshop',
  variant: 'a',
  title: 'The workshop tonight',
  scene: 'You paid £40 for an evening workshop tonight. You’re tired, and it’s raining hard. Do you go?',
  options: GO,
});
const workshopB = pairCard({
  id: 's-workshop-b',
  pair: 'workshop',
  variant: 'b',
  title: 'The workshop tonight',
  scene: 'You won a free place at an evening workshop tonight. You’re tired, and it’s raining hard. Do you go?',
  options: GO,
});
const flightA = pairCard({
  id: 's-flight-a',
  pair: 'flight',
  variant: 'a',
  title: 'The early flight',
  scene:
    'You’re paying for your own work trip. Flight A costs £35 and leaves at 06:05, with an alarm at 03:30. Flight B costs £79 and leaves at 10:40. Both get you there in time. Which do you book?',
  options: FLIGHTS,
});
const flightB = pairCard({
  id: 's-flight-b',
  pair: 'flight',
  variant: 'b',
  title: 'The early flight',
  scene:
    'You’re paying for your own work trip. Flight A costs £35 and leaves at 06:05, with an alarm at 03:30. Flight B costs £139 and leaves at 10:40. Both get you there in time. Which do you book?',
  options: FLIGHTS,
});
const bufferA = pairCard({
  id: 's-buffer-a',
  pair: 'buffer',
  variant: 'a',
  title: 'Six weeks at risk',
  scene:
    'A supplier delay puts six weeks of your project’s buffer at risk. Plan A saves two of the weeks for certain. Plan B has a 1-in-3 chance of saving all six and a 2-in-3 chance of saving none. Which plan?',
  options: PLANS,
});
const bufferB = pairCard({
  id: 's-buffer-b',
  pair: 'buffer',
  variant: 'b',
  title: 'Six weeks at risk',
  scene:
    'A supplier delay puts six weeks of your project’s buffer at risk. With Plan A, four of the weeks are lost for certain. With Plan B, there is a 1-in-3 chance that none are lost and a 2-in-3 chance that all six are. Which plan?',
  options: PLANS,
});

const [plan, focus, reply, meeting, borrow, course, unfinished, flaw, priorities, compare, yes, rate] = WORK;

// Work interleaves its rounds with the first halves of pairs; second halves
// come last and are only dealt once their first half is two days old.
export const DECK: Card[] = [
  ...WORLD,
  plan,
  focus,
  reply,
  workshopA,
  meeting,
  borrow,
  flightA,
  course,
  unfinished,
  bufferA,
  flaw,
  priorities,
  compare,
  yes,
  rate,
  workshopB,
  flightB,
  bufferB,
];
