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
  world({
    id: 'w-reviews',
    twin: 'k-praise',
    title: 'Five stars, one month',
    scene: 'A gadget with thousands of five-star reviews stops working for many buyers within a month.',
    options: [
      o('incentives', 'Sellers nudge happy buyers to review, and quietly discourage unhappy ones.', 'who shapes which voices get counted', 'what buyers themselves get wrong'),
      o('perception', 'People review in the first glow, long before problems show.', 'how timing colours a verdict', 'who benefits from early reviews'),
      o('belonging', 'A lone bad review among glowing ones feels like being the odd one out.', 'the pull of agreeing with the crowd', 'the product itself'),
      o('uncertainty', 'Nobody can judge durability until long after they’ve reviewed.', 'what a review can’t yet know', 'how sellers use that gap'),
    ],
    line: 'A verdict given in week one can’t know about month two.',
  }),
  world({
    id: 'w-fares',
    title: 'The fare almost nobody pays',
    scene: 'Budget airlines advertise fares that almost nobody ends up paying once bags and seats are added.',
    options: [
      o('structure', 'Comparison sites rank by the headline price, so everything else gets split off.', 'how a ranking rewards the wrong number', 'why travellers accept it'),
      o('incentives', 'The low price wins the click; the extras make the money.', 'where the profit actually is', 'how the comparison was set up'),
      o('perception', 'Once a low price is in your head, each extra feels small.', 'how a first number anchors the rest', 'who designed the sequence'),
      o('power', 'A few airlines dominate most routes, so travellers take the terms.', 'who sets the terms', 'what travellers could compare'),
    ],
    line: 'Whoever chooses the number you compare on chooses a lot.',
  }),
  world({
    id: 'w-streak',
    twin: 'k-practice',
    title: 'The streak that never talks',
    scene: 'Thousands of people keep a daily streak in a language app for years, yet still can’t hold a conversation.',
    options: [
      o('incentives', 'The app rewards showing up, not progress.', 'what the reward actually tracks', 'what learners put in themselves'),
      o('structure', 'Each lesson is built to be finished in minutes, never to stretch.', 'how the format caps the challenge', 'why learners don’t look elsewhere'),
      o('identity', 'Keeping the streak becomes part of who people are.', 'how a habit becomes a self-image', 'what the habit is for'),
      o('capacity', 'Real conversation practice takes more energy than most evenings have.', 'the real cost of the harder thing', 'how small the app’s ask is by design'),
    ],
    line: 'What gets counted can quietly replace what was wanted.',
  }),
  world({
    id: 'w-gym',
    title: 'The gym that sells more than it holds',
    scene: 'A gym sells far more memberships than it could ever fit inside at once, and it still runs smoothly.',
    options: [
      o('capacity', 'Most members come rarely, so the space is never tested.', 'the gap between paying and showing up', 'why members keep paying'),
      o('perception', 'People joining picture a future self who goes three times a week.', 'how hope shapes the purchase', 'how the contract keeps it going'),
      o('identity', 'Paying feels like being someone who exercises.', 'the self a membership buys', 'the gym’s side of the deal'),
      o('structure', 'Contracts renew by themselves, and cancelling takes effort.', 'how defaults keep money flowing', 'what members hoped for'),
    ],
    line: 'Paying for a plan can feel like following it.',
  }),
  world({
    id: 'w-summaries',
    twin: 'k-ai',
    title: 'The summaries nobody checks',
    scene:
      'A company rolls out an AI assistant. Within months, managers act on its summaries without reading the reports behind them.',
    options: [
      o('perception', 'A fluent, confident summary feels more reliable than it is.', 'how fluency passes for accuracy', 'what else pushes people to skip the source'),
      o('capacity', 'Nobody has time to read every report any more.', 'the time pressure behind the shortcut', 'how much is lost when it fails'),
      o('power', 'The tool was chosen at the top, so questioning it means questioning them.', 'how authority shields a tool', 'the tool’s actual quality'),
      o('uncertainty', 'No one knows which summaries are wrong, so all of them get trusted alike.', 'how unknown errors spread trust evenly', 'who could check, and doesn’t'),
    ],
    line: 'Confidence is not the same as being checked.',
  }),
  world({
    id: 'w-tables',
    title: 'The subjects that quietly disappear',
    scene: 'Schools judged on exam results begin steering pupils away from the hardest subjects.',
    options: [
      o('structure', 'Results are what’s measured, so results are what’s managed.', 'how a measure reshapes the work', 'who sets the measure'),
      o('power', 'Inspectors and rankings can make or break a school.', 'who holds the consequences', 'how schools could push back'),
      o('belonging', 'Parents choose by ranking, and no school wants to fall behind its neighbours.', 'the pressure of comparison', 'the pupils’ own interests'),
      o('capacity', 'Hard subjects need specialist teachers the school can’t find.', 'the practical limit', 'why the gap isn’t closed'),
    ],
    line: 'A measure can end up steering the thing it was meant to describe.',
  }),
  world({
    id: 'w-rebuild',
    twin: 'k-rebuild',
    title: 'Scrapping the system that works',
    scene: 'A government department scraps a system that mostly works and starts again from scratch.',
    options: [
      o('identity', 'New leaders want a project with their name on it.', 'how a fresh start serves a reputation', 'the practical case either way'),
      o('perception', 'The old system’s flaws are vivid; the new one’s don’t exist yet.', 'why the known feels worse than the unknown', 'who benefits from the switch'),
      o('incentives', 'Budgets reward big new projects more than steady repair.', 'what the money favours', 'how people feel about the old system'),
      o('uncertainty', 'Nobody fully understands the old system any more, so replacing it feels safer than touching it.', 'how lost knowledge pushes toward starting over', 'the risks of the rebuild'),
    ],
    line: 'A clean start looks cleanest before it begins.',
  }),
  world({
    id: 'w-office',
    title: 'Back to the office',
    scene: 'A company calls everyone back to the office five days a week, while saying the work went fine from home.',
    options: [
      o('power', 'Leaders want to see their teams, and they can insist.', 'who gets to decide', 'why they want it'),
      o('belonging', 'Being seen in the office signals commitment.', 'presence as a social signal', 'what the work needs'),
      o('uncertainty', 'Nobody can measure what was lost at home, so presence becomes the proxy.', 'how a missing measure gets filled', 'who benefits from the proxy'),
      o('identity', 'Leaders built their careers in offices and see the job as being there.', 'how past experience shapes a rule', 'how others experience it'),
    ],
    line: 'When the work is hard to see, people count the hours they can see.',
  }),
  world({
    id: 'w-stadium',
    twin: 'k-deadline',
    title: 'The stadium promised for spring',
    scene: 'A builder promises a new stadium in record time. It opens two years late.',
    options: [
      o('perception', 'Plans picture the best case; delays aren’t vivid until they happen.', 'the optimism built into plans', 'who rewards the optimism'),
      o('incentives', 'The builder who promises fastest wins the contract.', 'how bids reward the boldest date', 'what the builders privately expected'),
      o('power', 'The client set the date, and the builders had no real say.', 'who imposed the deadline', 'the builders’ own role'),
      o('belonging', 'Nobody in the room wanted to be the one saying it couldn’t be done.', 'the social cost of realism', 'the money behind the date'),
    ],
    line: 'The fastest promise often wins the contract and loses the date.',
  }),
  world({
    id: 'w-outrage',
    title: 'A small mistake, a week of news',
    scene: 'A public figure makes a small mistake, and it leads the news for a week.',
    options: [
      o('belonging', 'Joining in shows which side you’re on.', 'outrage as a signal of belonging', 'the business behind the coverage'),
      o('incentives', 'Outrage holds attention, and attention pays.', 'the money in a story', 'why people join in'),
      o('power', 'Opponents use the moment to weaken a rival.', 'who gains from keeping it going', 'the audience’s part'),
      o('capacity', 'Stretched newsrooms follow the story everyone else is already covering.', 'how limited resources herd coverage', 'who chose the story first'),
    ],
    line: 'The size of a reaction is not the size of the mistake.',
  }),
  world({
    id: 'w-board',
    twin: 'k-feedback',
    title: 'The problem everyone half knew',
    scene:
      'A hospital’s board learns of a recurring problem only when it becomes a public scandal. Many staff had noticed it for months.',
    options: [
      o('belonging', 'Raising problems marks you as disloyal.', 'the social cost of speaking up', 'whether there was anywhere to speak'),
      o('identity', 'The board saw itself as running a good hospital, and the problem didn’t fit.', 'how a self-image filters news', 'how the news travelled, or didn’t'),
      o('uncertainty', 'Each person saw only part of it and wasn’t sure it was real.', 'how fragments stay fragments', 'who could have joined them up'),
      o('structure', 'There was no safe route for concerns to travel upward.', 'the missing channel', 'why no one built one'),
    ],
    line: 'What everyone half knows can stay unknown.',
  }),
  world({
    id: 'w-finding',
    title: 'The finding that wouldn’t go away',
    scene: 'A well-known finding fails when others try to repeat it, yet it keeps appearing in textbooks and talks.',
    options: [
      o('structure', 'Textbooks and courses are revised slowly, so old findings linger.', 'how slow revision keeps errors alive', 'who has reasons to keep it'),
      o('identity', 'Teachers built lessons, and some built reputations, on it.', 'how attachment slows correction', 'the practical difficulty of revising'),
      o('uncertainty', 'One failed repeat doesn’t prove it wrong either.', 'the genuine doubt on both sides', 'how long doubt can serve as cover'),
      o('capacity', 'Re-checking every taught finding takes time no one has.', 'the cost of keeping knowledge current', 'which findings deserve the effort'),
    ],
    line: 'A good story can outlive the evidence for it.',
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

// The second batch of your own scenes. Every one offers at least one plainly
// practical explanation (the setting, the routine, what the body can take).
const WORK_MORE: LensCard[] = [
  work({
    id: 'k-praise',
    twin: 'w-reviews',
    title: 'The praise that didn’t last',
    scene: 'Friends say your new project is great. A month later, none of them uses it.',
    options: [
      o('belonging', 'They praised it to be kind.', 'the kindness in early praise', 'what the project itself lacked'),
      o('perception', 'First impressions are generous; habits are the real test.', 'the gap between liking and using', 'what would turn one into the other'),
      o('incentives', 'Praise cost them nothing; using it costs time every day.', 'the price of actually using something', 'whether it was worth that price'),
      o('uncertainty', 'They couldn’t tell yet whether it would fit their lives.', 'what nobody could know at first', 'what a month of use could have told you sooner'),
    ],
    line: 'Liking something and living with it are different tests.',
  }),
  work({
    id: 'k-rest',
    title: 'The weekend that became work',
    scene: 'You plan to rest this weekend. By Sunday afternoon, you’ve worked most of it.',
    options: [
      o('identity', 'Resting feels like falling behind the person you mean to be.', 'the self-image that work protects', 'plainer pulls, like habit'),
      o('structure', 'Work and rest happen on the same laptop, so nothing separates them.', 'how a setting blurs a boundary', 'what draws you to the work itself'),
      o('incentives', 'Work gives quick, visible progress; rest gives nothing to show.', 'the rewards competing for the day', 'what rest gives that doesn’t show'),
      o('power', 'Clients and colleagues can reach you any time, so the weekend is partly theirs.', 'who else has a claim on your time', 'the part that’s your choice'),
    ],
    line: 'Rest with nothing to show can still be the point.',
  }),
  work({
    id: 'k-practice',
    twin: 'w-streak',
    title: 'Practising what you can already play',
    scene: 'You practise every day, but mostly the pieces you already play well, not the passage that keeps tripping you up.',
    options: [
      o('incentives', 'Familiar pieces sound good now; the hard passage pays off later.', 'the reward of sounding good', 'what the hard passage would unlock'),
      o('structure', 'Your practice starts with run-throughs and rarely gets as far as the hard part.', 'how the order of a routine decides what gets done', 'why the order stays'),
      o('identity', 'Playing well feels like being a musician; stumbling doesn’t.', 'how practice can protect a self-image', 'the practical side of the routine'),
      o('capacity', 'The hard passage needs a freshness you rarely bring to practice.', 'the energy the hard part takes', 'when that energy is available'),
    ],
    line: 'Practice can confirm what you can do or build what you can’t.',
  }),
  work({
    id: 'k-gym',
    title: 'The exercise you skip',
    scene: 'At the gym, you keep skipping the exercise that would help most. It’s also the one you’re worst at.',
    options: [
      o('identity', 'Being bad at it doesn’t fit how you see yourself.', 'how a self-image steers effort', 'the practical reasons'),
      o('belonging', 'Other people can see you struggle with it.', 'the audience in the room', 'how little attention they pay'),
      o('capacity', 'It asks more than your body has to give right now.', 'what your body can actually take', 'whether a lighter version would work'),
      o('structure', 'Your routine puts it last, where it’s easiest to drop.', 'how order decides what survives', 'why it sits last'),
    ],
    line: 'The order of a routine quietly decides what gets skipped.',
  }),
  work({
    id: 'k-ai',
    twin: 'w-summaries',
    title: 'The confident answer',
    scene: 'You ask an AI for advice. The answer is confident, and you follow it, though something about it felt off.',
    options: [
      o('perception', 'It was fluent and confident, which made it feel right.', 'how fluency passes for accuracy', 'what made you stop checking'),
      o('capacity', 'You were too tired to work it out yourself.', 'the time and energy a second look costs', 'the cost of not looking'),
      o('power', 'It sounded like an expert, and experts get the benefit of the doubt.', 'how authority borrows trust', 'whose judgement it actually was'),
      o('uncertainty', 'You couldn’t name what felt off, so you overrode it.', 'how unnamed doubts lose to clear answers', 'what the doubt was pointing at'),
    ],
    line: 'A faint doubt is information, even before it has words.',
  }),
  work({
    id: 'k-client',
    title: 'The changes that made it worse',
    scene: 'A client asks for changes that you think make the work worse. You make them without saying so.',
    options: [
      o('power', 'It’s their money and their call in the end.', 'where the final say sits', 'how much your view could still count'),
      o('incentives', 'Keeping them happy keeps the next project coming.', 'the future work riding on this one', 'what the work’s quality is worth to you'),
      o('capacity', 'Arguing would take time and energy you don’t have this week.', 'the cost of pushing back', 'the cost of not pushing back'),
      o('structure', 'The brief never said who decides on quality, so it defaulted to them.', 'the missing agreement', 'why it was never agreed'),
    ],
    line: 'Silence in a brief becomes a decision later.',
  }),
  work({
    id: 'k-rebuild',
    twin: 'w-rebuild',
    title: 'Starting over on something that works',
    scene: 'A tool you built works, but the code feels messy. You start rebuilding it from scratch.',
    options: [
      o('identity', 'A clean rebuild feels more like your work than patching an older version of it.', 'how a fresh start fits a self-image', 'the practical case either way'),
      o('perception', 'The mess you can see feels worse than the problems you can’t see yet.', 'why the known feels worse than the unknown', 'what the rebuild will reveal'),
      o('incentives', 'Starting fresh is more fun than repair.', 'the pull of the enjoyable part', 'what repair would get you sooner'),
      o('uncertainty', 'You no longer fully understand the old code, so starting over feels safer.', 'how lost understanding pushes toward a restart', 'the risks hidden in the rebuild'),
    ],
    line: 'Messy and broken are not the same thing.',
  }),
  work({
    id: 'k-senior',
    title: 'The weaker idea you went along with',
    scene: 'In a project meeting, a senior colleague’s plan seems weaker than yours. You go along with it.',
    options: [
      o('power', 'They have more say over the project, and you know it.', 'where the decision really sits', 'how open they might be'),
      o('belonging', 'Pushing your plan would look like competing with them.', 'the social cost of disagreeing upward', 'what the project needed'),
      o('uncertainty', 'You weren’t sure enough your plan was better.', 'honest doubt about your own idea', 'what would have settled it'),
      o('perception', 'Their experience makes their plan sound more solid than it is.', 'how seniority colours a judgement', 'the merits laid side by side'),
    ],
    line: 'Seniority can make a plan sound tested when it isn’t.',
  }),
  work({
    id: 'k-deadline',
    twin: 'w-stadium',
    title: 'The deadline you knew was tight',
    scene: 'You agree to a deadline you already suspect is too tight.',
    options: [
      o('perception', 'From here, the work looked smaller than it is.', 'the optimism built into planning', 'what made you set the suspicion aside'),
      o('incentives', 'Saying yes kept the project, or the goodwill.', 'what the yes was buying', 'what a missed date will cost'),
      o('power', 'The person asking sets the terms, and you know it.', 'who set the date', 'how much room there was to negotiate'),
      o('belonging', 'You didn’t want to be the one who sounds negative.', 'the social cost of realism', 'how they would have reacted'),
    ],
    line: 'A yes now borrows time from later.',
  }),
  work({
    id: 'k-tutorials',
    title: 'One more tutorial',
    scene: 'Learning something new, you watch tutorials for hours instead of trying it yourself.',
    options: [
      o('uncertainty', 'You don’t know where to start, and tutorials feel like finding out.', 'the search for a starting point', 'how trying would show it faster'),
      o('perception', 'Watching feels like learning, even when little of it sticks.', 'how familiarity feels like skill', 'the difference doing makes'),
      o('capacity', 'Trying takes a kind of energy that watching doesn’t.', 'the effort of a first attempt', 'when you would have that energy'),
      o('identity', 'A clumsy first attempt doesn’t fit the person you want to be at this.', 'the self-image at stake in being a beginner', 'plainer reasons'),
    ],
    line: 'Familiar is not the same as able.',
  }),
  work({
    id: 'k-feedback',
    twin: 'w-board',
    title: 'Feedback with the edges sanded off',
    scene: 'A friend asks for honest feedback on their project. You soften it until it says almost nothing.',
    options: [
      o('belonging', 'You didn’t want the friendship to pay for honesty.', 'what you were protecting', 'what they asked for'),
      o('identity', 'You see yourself as encouraging, and blunt feedback doesn’t fit.', 'how a self-image shapes the message', 'what encouragement could include'),
      o('uncertainty', 'You weren’t sure your view was right.', 'honest doubt about your own judgement', 'how to offer it as a doubt'),
      o('structure', 'It came up in passing, with no real space for a careful conversation.', 'how the setting shaped what could be said', 'whether a better moment could be made'),
    ],
    line: 'Kindness and vagueness can feel alike from the inside.',
  }),
  work({
    id: 'k-covering',
    title: 'The part you keep doing for them',
    scene: 'A collaborator keeps missing their part of a shared project. You quietly do it yourself instead of raising it.',
    options: [
      o('power', 'It’s their project too; managing them doesn’t feel like your place.', 'the limits of your authority', 'what the project needs'),
      o('structure', 'No one ever agreed who does what, so there’s nothing to point to.', 'the missing agreement', 'why it was never made'),
      o('belonging', 'Raising it would make things awkward between you.', 'the relationship at stake', 'the strain of covering'),
      o('capacity', 'Doing it yourself is quicker than the conversation.', 'the short-term cost of raising it', 'the long-term cost of not'),
    ],
    line: 'What isn’t agreed tends to fall to whoever minds most.',
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
  {
    id: 'ticket',
    kind: 'consistency',
    title: 'The lost £30',
    changed: 'whether the £30 you lost was the ticket itself or cash',
    note: 'Either way you are £30 down and the talk costs £30. Some people feel the two losses differently and some don’t; mood and the day can play a part too.',
  },
  {
    id: 'fee',
    kind: 'trade-off',
    title: 'Fixed fee or a share',
    changed: 'the upside of the share (£2,500, then £4,000)',
    note: 'This difference is meant to matter. Whether you switched shows where certainty stops being worth more to you than a bigger possible payoff.',
  },
  {
    id: 'proud',
    kind: 'trade-off',
    title: 'Good enough by Friday',
    changed: 'how much extra time it would take (a week, then a month)',
    note: 'This difference is meant to matter. Whether you switched shows where your line sits between finished and proud.',
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
const BUY = [
  { id: 'buy', text: 'Buy a ticket' },
  { id: 'home', text: 'Go home' },
];
const PAY = [
  { id: 'fixed', text: 'The fixed £1,000' },
  { id: 'share', text: 'The share of sales' },
];
const TIME = [
  { id: 'friday', text: 'Deliver on Friday' },
  { id: 'more', text: 'Ask for more time' },
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
    'A supplier delay puts six weeks of your project’s buffer at risk. With Plan A, two of the weeks are saved for certain. With Plan B, there is a 1-in-3 chance that all six are saved and a 2-in-3 chance that none are. Which plan?',
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
const ticketA = pairCard({
  id: 's-ticket-a',
  pair: 'ticket',
  variant: 'a',
  title: 'The lost £30',
  scene: 'You’re on your way to a £30 talk and realise you’ve lost your £30 ticket. Another costs £30 at the door. Do you buy it?',
  options: BUY,
});
const ticketB = pairCard({
  id: 's-ticket-b',
  pair: 'ticket',
  variant: 'b',
  title: 'The lost £30',
  scene: 'You’re on your way to a £30 talk and realise you’ve lost £30 in cash. A ticket costs £30 at the door. Do you buy it?',
  options: BUY,
});
const feeA = pairCard({
  id: 's-fee-a',
  pair: 'fee',
  variant: 'a',
  title: 'Fixed fee or a share',
  scene:
    'A client offers two ways to pay for a small project: a fixed £1,000, or a share of sales with an even chance of £2,500 or nothing. Which do you take?',
  options: PAY,
});
const feeB = pairCard({
  id: 's-fee-b',
  pair: 'fee',
  variant: 'b',
  title: 'Fixed fee or a share',
  scene:
    'A client offers two ways to pay for a small project: a fixed £1,000, or a share of sales with an even chance of £4,000 or nothing. Which do you take?',
  options: PAY,
});
const proudA = pairCard({
  id: 's-proud-a',
  pair: 'proud',
  variant: 'a',
  title: 'Good enough by Friday',
  scene:
    'A client wants your project by Friday. Rushed, it will be good enough. With one more week, you’d be proud of it. Do you deliver on Friday or ask for more time?',
  options: TIME,
});
const proudB = pairCard({
  id: 's-proud-b',
  pair: 'proud',
  variant: 'b',
  title: 'Good enough by Friday',
  scene:
    'A client wants your project by Friday. Rushed, it will be good enough. With one more month, you’d be proud of it. Do you deliver on Friday or ask for more time?',
  options: TIME,
});

const [plan, focus, reply, meeting, borrow, course, unfinished, flaw, priorities, compare, yes, rate] = WORK;
const [praise, rest, practice, gym, ai, client, rebuild, senior, deadline, tutorials, feedback, covering] = WORK_MORE;

// Work interleaves its rounds with the first halves of pairs; second halves
// come last and are only dealt once their first half is two days old. New
// rounds are appended, so the order of earlier deals never shifts.
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
  praise,
  rest,
  ticketA,
  practice,
  gym,
  ai,
  feeA,
  client,
  rebuild,
  senior,
  proudA,
  deadline,
  tutorials,
  feedback,
  covering,
  workshopB,
  flightB,
  bufferB,
  ticketB,
  feeB,
  proudB,
];
