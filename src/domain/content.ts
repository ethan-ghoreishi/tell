import type { Card, CutCard, Kind, PeekCard, SlideCard, SpendCard } from './types';

// Tell's experiments: structured ingredients, not written questions. Each is
// built to the recipe that `content.test.ts` enforces (one value changes, no
// option wins on everything, log-spaced amounts, fixed vocabulary, no currency
// symbols, length limits). Array order is the tie-break when Tell picks the
// next experiment, so it is curated: everyday trade-offs first. New
// experiments are appended; never reuse an id for different content, and bump
// `v` when an experiment's meaning changes.

const slide = (c: Omit<SlideCard, 'v' | 'mechanic'>): SlideCard => ({ v: 1, mechanic: 'slide', ...c });
const cut = (c: Omit<CutCard, 'v' | 'mechanic'>): CutCard => ({ v: 1, mechanic: 'cut', ...c });
const spend = (c: Omit<SpendCard, 'v' | 'mechanic'>): SpendCard => ({ v: 1, mechanic: 'spend', ...c });
const peek = (c: Omit<PeekCard, 'v' | 'mechanic'>): PeekCard => ({ v: 1, mechanic: 'peek', ...c });

// Ladders: seven steps, each 1.3 to 3.5 times the last, because differences in
// money and time are felt as ratios. Seven steps make eight intervals, found in
// three choices by halving.
const SMALL = [1, 2, 4, 8, 15, 30, 60];
const FARE = [5, 10, 15, 25, 40, 60, 90];
const MID = [10, 20, 40, 60, 90, 130, 200];
const LARGE = [20, 40, 60, 90, 130, 200, 300];
const XL = [50, 100, 200, 300, 500, 800, 1200];
const DAYS = [1, 2, 3, 5, 8, 13, 21];
const HOURS = [1, 2, 3, 5, 8, 12, 24];

// ---- Slides: nine trade-offs, each in three contexts ----------------------

const SLIDES: SlideCard[] = [
  // Money for time
  slide({
    id: 'sl-shop',
    context: 'home',
    title: 'The big shop',
    scene: 'Same basket of shopping. The corner shop is 5 minutes away. The big supermarket is {y} away.',
    a: { text: 'The corner shop', gives: 'time' },
    b: { text: 'The supermarket, {x} cheaper', gives: 'money' },
    dial: { factor: 'money', unit: 'money', steps: SMALL, rises: 'b', measure: 'How much cheaper the supermarket has to be' },
    condition: { tag: 'deadline', text: 'Friends are coming round in an hour.', label: 'friends due in an hour' },
    alt: {
      label: 'how far away the supermarket is',
      factor: 'time',
      unit: 'minutes',
      steps: [10, 15, 20, 30, 45, 60, 90],
      rises: 'a',
      at: 3,
      measure: 'How far away the supermarket can be',
    },
  }),
  slide({
    id: 'sl-taxi',
    context: 'travel',
    title: 'Across town at night',
    scene: 'It’s late and you’re heading home across town. The night bus takes {y}. A taxi takes 15 minutes.',
    a: { text: 'The night bus', gives: 'money' },
    b: { text: 'A taxi, {x}', gives: 'time' },
    dial: { factor: 'money', unit: 'money', steps: FARE, rises: 'a', measure: 'What a taxi home is worth to you' },
    condition: { tag: 'stakes', text: 'You have to be up at six tomorrow.', label: 'an early start tomorrow' },
    alt: {
      label: 'how long the bus takes',
      factor: 'time',
      unit: 'minutes',
      steps: [15, 20, 30, 45, 60, 90, 120],
      rises: 'b',
      at: 3,
      measure: 'How long the bus ride can be',
    },
  }),
  slide({
    id: 'sl-delivery',
    context: 'buying',
    title: 'Next-day delivery',
    scene: 'You’re ordering a desk chair to replace one that broke. Free delivery takes a week.',
    a: { text: 'Free delivery, in a week', gives: 'money' },
    b: { text: 'Next day, for {x}', gives: 'time' },
    dial: { factor: 'money', unit: 'money', steps: SMALL, rises: 'a', measure: 'What next-day delivery is worth to you' },
    condition: { tag: 'deadline', text: 'You start a new job from home on Monday.', label: 'a new job starting Monday' },
  }),

  // Money for energy
  slide({
    id: 'sl-flight',
    context: 'travel',
    title: 'The 06:05 flight',
    scene: 'A work trip you’re paying for yourself. The early flight means a 03:30 alarm. A later flight leaves at 10:40.',
    a: { text: 'The early flight', gives: 'money' },
    b: { text: 'The later flight, {x} more', gives: 'energy' },
    dial: { factor: 'money', unit: 'money', steps: [5, 10, 20, 40, 80, 150, 300], rises: 'a', measure: 'What skipping a 03:30 alarm is worth to you' },
    condition: { tag: 'stakes', text: 'You’re presenting two hours after you land.', label: 'presenting soon after landing' },
  }),
  slide({
    id: 'sl-room',
    context: 'work',
    title: 'The room on the main road',
    scene: 'You’re working away for a week. The cheaper hotel room faces a busy road. A quiet room at the back is free too.',
    a: { text: 'The room on the road', gives: 'money' },
    b: { text: 'The quiet room, {x} more a night', gives: 'energy' },
    dial: { factor: 'money', unit: 'money', steps: FARE, rises: 'a', measure: 'What a quiet night is worth to you' },
    condition: { tag: 'deadline', text: 'It’s the week of a big deadline.', label: 'a big deadline that week' },
  }),
  slide({
    id: 'sl-cleaner',
    context: 'home',
    title: 'Saturday morning',
    scene: 'Cleaning the flat takes your whole Saturday morning. A cleaner could do it while you rest.',
    a: { text: 'Clean it yourself', gives: 'money' },
    b: { text: 'A cleaner, {x}', gives: 'energy' },
    dial: { factor: 'money', unit: 'money', steps: [10, 20, 30, 45, 60, 90, 130], rises: 'a', measure: 'What a Saturday morning off is worth to you' },
    condition: { tag: 'stakes', text: 'You’ve had a run of late nights.', label: 'a run of late nights' },
  }),

  // Time for quality
  slide({
    id: 'sl-ship',
    context: 'project',
    title: 'The rough screen',
    scene: 'Your app works, but one screen still looks rough. Fixing it would push the release back.',
    a: { text: 'Release now', gives: 'time' },
    b: { text: 'Fix it first, {x} later', gives: 'quality' },
    dial: { factor: 'time', unit: 'days', steps: DAYS, rises: 'a', measure: 'How long a delay the fix is worth to you' },
    condition: { tag: 'public', text: 'The release will be announced to everyone on your mailing list.', label: 'a public announcement' },
  }),
  slide({
    id: 'sl-report',
    context: 'work',
    title: 'One more pass',
    scene: 'A report for a client is good enough to send. One more pass would make it clearly better.',
    a: { text: 'Send it now', gives: 'time' },
    b: { text: 'One more pass, {x} later', gives: 'quality' },
    dial: { factor: 'time', unit: 'hours', steps: HOURS, rises: 'a', measure: 'How much delay the extra pass is worth to you' },
    condition: { tag: 'stakes', text: 'The client will decide on renewing your contract from this report.', label: 'a renewal riding on it' },
  }),
  slide({
    id: 'sl-paint',
    context: 'home',
    title: 'One coat or two',
    scene: 'You’re painting a room. A quick coat looks fine from a distance. Filling the cracks and doing two coats looks much better.',
    a: { text: 'The quick coat', gives: 'time' },
    b: { text: 'Do it properly, {x} more', gives: 'quality' },
    dial: { factor: 'time', unit: 'hours', steps: HOURS, rises: 'a', measure: 'How much extra time a proper job is worth to you' },
    condition: { tag: 'public', text: 'You’re hosting a party in that room next week.', label: 'a party in the room' },
  }),

  // Money for convenience
  slide({
    id: 'sl-laptop',
    context: 'buying',
    title: 'Half the weight',
    scene: 'You’re choosing a laptop you’ll carry every day. Two models do the same work. One is half the weight.',
    a: { text: 'The heavier one', gives: 'money' },
    b: { text: 'The light one, {x} more', gives: 'convenience' },
    dial: { factor: 'money', unit: 'money', steps: [25, 50, 100, 150, 250, 400, 600], rises: 'a', measure: 'What half the weight is worth to you' },
    condition: { tag: 'stakes', text: 'You’ll keep it for five years.', label: 'keeping it for five years' },
  }),
  slide({
    id: 'sl-bag',
    context: 'travel',
    title: 'Carry-on only',
    scene: 'For a two-week trip, you could squeeze everything into a carry-on, or check a bag and pack freely.',
    a: { text: 'Carry-on only', gives: 'money' },
    b: { text: 'Check a bag, {x} each way', gives: 'convenience' },
    dial: { factor: 'money', unit: 'money', steps: [10, 20, 30, 45, 60, 90, 130], rises: 'a', measure: 'What packing freely is worth to you' },
    condition: { tag: 'deadline', text: 'You have a tight connection when you land.', label: 'a tight connection' },
  }),
  slide({
    id: 'sl-gym',
    context: 'home',
    title: 'The nearer gym',
    scene: 'Two gyms with the same equipment. One is {y} away. The other is 5 minutes from home.',
    a: { text: 'The far gym', gives: 'money' },
    b: { text: 'The near gym, {x} more a month', gives: 'convenience' },
    dial: { factor: 'money', unit: 'money', steps: FARE, rises: 'a', measure: 'What a gym 5 minutes away is worth to you each month' },
    condition: { tag: 'stakes', text: 'You want to go four times a week.', label: 'going four times a week' },
    alt: {
      label: 'how far away the other gym is',
      factor: 'time',
      unit: 'minutes',
      steps: [10, 15, 20, 30, 45, 60, 90],
      rises: 'b',
      at: 3,
      measure: 'How far away the other gym can be',
    },
  }),

  // Money for flexibility
  slide({
    id: 'sl-fare',
    context: 'travel',
    title: 'The fixed ticket',
    scene: 'You’re booking a train for a trip next month. The cheaper ticket can’t be changed. A flexible one can be changed or cancelled for free.',
    a: { text: 'The fixed ticket', gives: 'money' },
    b: { text: 'The flexible ticket, {x} more', gives: 'flexibility' },
    dial: { factor: 'money', unit: 'money', steps: FARE, rises: 'a', measure: 'What being able to change plans is worth to you' },
    condition: { tag: 'stakes', text: 'The trip is for a close friend’s wedding.', label: 'a close friend’s wedding' },
  }),
  slide({
    id: 'sl-yearly',
    context: 'tools',
    title: 'Monthly or yearly',
    scene: 'A tool you expect to use all year has a monthly plan you can cancel any time, or a yearly plan paid upfront.',
    a: { text: 'Monthly, cancel any time', gives: 'flexibility' },
    b: { text: 'Yearly, saving {x}', gives: 'money' },
    dial: { factor: 'money', unit: 'money', steps: [5, 10, 20, 30, 50, 80, 120], rises: 'b', measure: 'How much the yearly plan has to save' },
    condition: { tag: 'undo', text: 'The yearly plan can’t be refunded, even in part.', label: 'no refunds on the yearly plan' },
  }),
  slide({
    id: 'sl-lease',
    context: 'home',
    title: 'The longer lease',
    scene: 'You’ve found a flat you like. The landlord offers a six-month lease, or a three-year lease at a lower rent.',
    a: { text: 'Six months', gives: 'flexibility' },
    b: { text: 'Three years, {x} less a month', gives: 'money' },
    dial: { factor: 'money', unit: 'money', steps: [10, 25, 50, 75, 100, 150, 250], rises: 'b', measure: 'How much cheaper the long lease has to be' },
    condition: { tag: 'undo', text: 'Leaving the long lease early would cost two months’ rent.', label: 'a penalty for leaving early' },
  }),

  // Money for quality
  slide({
    id: 'sl-headphones',
    context: 'buying',
    title: 'Everyday headphones',
    scene: 'You’re replacing the headphones you use every day. A decent pair does the job. An excellent pair sounds clearly better.',
    a: { text: 'The decent pair', gives: 'money' },
    b: { text: 'The excellent pair, {x} more', gives: 'quality' },
    dial: { factor: 'money', unit: 'money', steps: MID, rises: 'a', measure: 'What clearly better sound is worth to you' },
    condition: { tag: 'undo', text: 'Neither pair can be returned once opened.', label: 'no returns' },
  }),
  slide({
    id: 'sl-logo',
    context: 'work',
    title: 'The pitch logo',
    scene: 'You need a logo for a pitch. A friend will make a decent one for free. A designer you admire would make a far better one.',
    a: { text: 'Your friend’s free logo', gives: 'money' },
    b: { text: 'The designer, {x}', gives: 'quality' },
    dial: { factor: 'money', unit: 'money', steps: XL, rises: 'a', measure: 'What a far better logo is worth to you' },
    condition: { tag: 'public', text: 'The logo opens the pitch, in front of the whole room.', label: 'the whole room seeing it' },
  }),
  slide({
    id: 'sl-mic',
    context: 'project',
    title: 'The podcast microphone',
    scene: 'You’re recording a podcast for your project. Your laptop’s microphone is passable. A good microphone sounds much better.',
    a: { text: 'The laptop microphone', gives: 'money' },
    b: { text: 'A good microphone, {x}', gives: 'quality' },
    dial: { factor: 'money', unit: 'money', steps: MID, rises: 'a', measure: 'What a much better sound is worth to you' },
    condition: { tag: 'public', text: 'Your first episode goes out to everyone you know.', label: 'everyone you know hearing it' },
  }),

  // Money for effort
  slide({
    id: 'sl-tap',
    context: 'home',
    title: 'The dripping tap',
    scene: 'A dripping kitchen tap needs replacing. Doing it yourself means about {y}, a video and a trip for parts.',
    a: { text: 'Do it yourself', gives: 'money' },
    b: { text: 'A plumber, {x}', gives: 'effort' },
    dial: { factor: 'money', unit: 'money', steps: LARGE, rises: 'a', measure: 'What not doing the job yourself is worth to you' },
    condition: { tag: 'stakes', text: 'If it goes wrong, water could leak into the flat below.', label: 'a risk of flooding below' },
    alt: {
      label: 'how long the job would take you',
      factor: 'time',
      unit: 'hours',
      steps: HOURS,
      rises: 'b',
      at: 2,
      measure: 'How long the job can take before you’d pay',
    },
  }),
  slide({
    id: 'sl-booking',
    context: 'project',
    title: 'The booking form',
    scene: 'Your project needs a simple booking form. You could build one yourself in about {y}, or use a ready-made service.',
    a: { text: 'Build it yourself', gives: 'money' },
    b: { text: 'The service, {x} a month', gives: 'effort' },
    dial: { factor: 'money', unit: 'money', steps: [2, 5, 10, 20, 40, 80, 150], rises: 'a', measure: 'What a ready-made booking form is worth to you each month' },
    condition: { tag: 'undo', text: 'Leaving the service later would mean rebuilding everything.', label: 'being locked in' },
    alt: {
      label: 'how long building it would take',
      factor: 'time',
      unit: 'days',
      steps: DAYS,
      rises: 'b',
      at: 0,
      measure: 'How long building it can take before you’d pay',
    },
  }),
  slide({
    id: 'sl-taxes',
    context: 'work',
    title: 'The tax return',
    scene: 'Your yearly tax return takes two evenings of paperwork. An accountant could do it for you.',
    a: { text: 'Do it yourself', gives: 'money' },
    b: { text: 'An accountant, {x}', gives: 'effort' },
    dial: { factor: 'money', unit: 'money', steps: LARGE, rises: 'a', measure: 'What not doing your tax return is worth to you' },
    condition: { tag: 'stakes', text: 'A mistake this year could mean a fine.', label: 'a fine for mistakes' },
  }),

  // Money for certainty
  slide({
    id: 'sl-fee',
    context: 'work',
    title: 'Fixed fee or a share',
    scene: 'A client offers two ways to pay you for a small project.',
    a: { text: 'A fixed {m:1000}', gives: 'certainty' },
    b: { text: 'A share of sales: an even chance of {x} or nothing', gives: 'money' },
    dial: { factor: 'money', unit: 'money', steps: [1500, 2000, 2600, 3400, 4500, 6000, 8000], rises: 'b', measure: 'How big the possible share has to be' },
    condition: { tag: 'stakes', text: 'This month, you need the money for rent.', label: 'needing it for rent' },
  }),
  slide({
    id: 'sl-refurb',
    context: 'buying',
    title: 'New or refurbished',
    scene: 'You need a new phone. A new one has a two-year warranty. A refurbished one looks and works the same, with no warranty.',
    a: { text: 'New, with the warranty', gives: 'certainty' },
    b: { text: 'Refurbished, {x} less', gives: 'money' },
    dial: { factor: 'money', unit: 'money', steps: LARGE, rises: 'b', measure: 'How much cheaper the refurbished phone has to be' },
    condition: { tag: 'stakes', text: 'You rely on your phone for work every day.', label: 'relying on it for work' },
  }),
  slide({
    id: 'sl-quote',
    context: 'project',
    title: 'Fixed price or by the hour',
    scene: 'Two developers quote for finishing a feature. One gives a fixed price. The other charges by the hour, usually less, but it could run over.',
    a: { text: 'The fixed price', gives: 'certainty' },
    b: { text: 'By the hour, usually {x} less', gives: 'money' },
    dial: { factor: 'money', unit: 'money', steps: XL, rises: 'b', measure: 'How much less the hourly quote usually has to be' },
    condition: { tag: 'deadline', text: 'The feature has to be live for a launch in three weeks.', label: 'a launch in three weeks' },
  }),

  // Money for control
  slide({
    id: 'sl-notes',
    context: 'tools',
    title: 'Notes you own',
    scene: 'Your notes app is free, but the company can change it or close it at any time. A paid app keeps your notes as plain files you own.',
    a: { text: 'Stay with the free app', gives: 'money' },
    b: { text: 'The paid app, {x} a year', gives: 'control' },
    dial: { factor: 'money', unit: 'money', steps: [5, 10, 20, 30, 50, 80, 120], rises: 'a', measure: 'What owning your notes is worth to you each year' },
    condition: { tag: 'stakes', text: 'Your notes hold ten years of work.', label: 'ten years of notes' },
  }),
  slide({
    id: 'sl-walls',
    context: 'home',
    title: 'Your own walls',
    scene: 'Two flats to rent, alike except for one thing. In the first you can paint, put up shelves and keep a pet. In the second, nothing can change.',
    a: { text: 'The flat you can change', gives: 'control' },
    b: { text: 'The strict one, {x} less a month', gives: 'money' },
    dial: { factor: 'money', unit: 'money', steps: [10, 25, 50, 75, 100, 150, 250], rises: 'b', measure: 'How much cheaper the strict flat has to be' },
    condition: { tag: 'undo', text: 'You’d sign for three years.', label: 'a three-year lease' },
  }),
  slide({
    id: 'sl-process',
    context: 'work',
    title: 'Their way or yours',
    scene: 'A client wants you to work inside their tools and process, which you find slow. Working your own way means a lower fee.',
    a: { text: 'Their way, the full fee', gives: 'money' },
    b: { text: 'Your way, {x} less', gives: 'control' },
    dial: { factor: 'money', unit: 'money', steps: [100, 250, 500, 1000, 2000, 4000, 8000], rises: 'a', measure: 'How much of the fee your own way is worth to you' },
    condition: { tag: 'public', text: 'Your name goes on the finished work.', label: 'your name on the work' },
  }),
];

// ---- Cuts: five good things with five different factors ------------------

const CUTS: CutCard[] = [
  cut({
    id: 'cut-project',
    context: 'project',
    title: 'Your next side project',
    scene: 'Your next side project could have all five of these.',
    items: [
      { id: 'ships', factor: 'time', text: 'Ships this month' },
      { id: 'polished', factor: 'quality', text: 'Polished' },
      { id: 'cheap', factor: 'money', text: 'Cheap to run' },
      { id: 'yours', factor: 'control', text: 'Fully yours' },
      { id: 'changeable', factor: 'flexibility', text: 'Easy to change later' },
    ],
  }),
  cut({
    id: 'cut-laptop',
    context: 'buying',
    title: 'Your next laptop',
    scene: 'Your next laptop could be all five of these.',
    items: [
      { id: 'light', factor: 'convenience', text: 'Light enough to carry daily' },
      { id: 'fast', factor: 'quality', text: 'Fast for heavy work' },
      { id: 'affordable', factor: 'money', text: 'Affordable' },
      { id: 'reliable', factor: 'certainty', text: 'Reliable for five years' },
      { id: 'repairable', factor: 'control', text: 'Yours to repair and upgrade' },
    ],
  }),
  cut({
    id: 'cut-trip',
    context: 'travel',
    title: 'A weekend away',
    scene: 'A weekend away could be all five of these.',
    items: [
      { id: 'cheap', factor: 'money', text: 'Cheap' },
      { id: 'close', factor: 'time', text: 'Under two hours away' },
      { id: 'restful', factor: 'energy', text: 'Properly restful' },
      { id: 'loose', factor: 'flexibility', text: 'No fixed plans' },
      { id: 'booked', factor: 'certainty', text: 'Everything booked ahead' },
    ],
  }),
  cut({
    id: 'cut-gig',
    context: 'work',
    title: 'A freelance job',
    scene: 'A freelance job could be all five of these.',
    items: [
      { id: 'pays', factor: 'money', text: 'Pays well' },
      { id: 'interesting', factor: 'quality', text: 'Interesting work' },
      { id: 'short', factor: 'time', text: 'Short and contained' },
      { id: 'say', factor: 'control', text: 'Your call on how it’s done' },
      { id: 'steady', factor: 'certainty', text: 'Steady for months' },
    ],
  }),
  cut({
    id: 'cut-flat',
    context: 'home',
    title: 'Your next flat',
    scene: 'Your next flat could be all five of these.',
    items: [
      { id: 'cheap', factor: 'money', text: 'Cheap' },
      { id: 'near', factor: 'time', text: 'Close to work' },
      { id: 'quiet', factor: 'energy', text: 'Quiet at night' },
      { id: 'yours', factor: 'control', text: 'Yours to change' },
      { id: 'leave', factor: 'flexibility', text: 'Easy to leave' },
    ],
  }),
  cut({
    id: 'cut-tool',
    context: 'tools',
    title: 'A tool you use every day',
    scene: 'A tool you use every day could be all five of these.',
    items: [
      { id: 'free', factor: 'money', text: 'Free' },
      { id: 'quick', factor: 'effort', text: 'Quick to learn' },
      { id: 'powerful', factor: 'quality', text: 'Powerful' },
      { id: 'data', factor: 'control', text: 'Your data stays yours' },
      { id: 'familiar', factor: 'convenience', text: 'Works the way you’re used to' },
    ],
  }),
];

// ---- Peeks: two options and five hidden facts, some favouring each --------

const PEEKS: PeekCard[] = [
  peek({
    id: 'peek-flat',
    context: 'home',
    title: 'Two flats',
    scene: 'Two flats to rent at the same price and size. Flat A is on a leafy street. Flat B is next to the station.',
    a: 'Flat A',
    b: 'Flat B',
    facts: [
      { id: 'noise', factor: 'energy', label: 'Noise at night', a: 'Quiet', b: 'Trains until midnight', favours: 'a' },
      { id: 'commute', factor: 'time', label: 'Your commute', a: '45 minutes', b: '15 minutes', favours: 'b' },
      { id: 'light', factor: 'quality', label: 'Daylight', a: 'Dark, north-facing', b: 'Bright all day', favours: 'b' },
      { id: 'deposit', factor: 'money', label: 'Deposit', a: 'One month’s rent', b: 'Three months’ rent', favours: 'a' },
      { id: 'landlord', factor: 'certainty', label: 'The landlord', a: 'Slow to fix things', b: 'Quick to fix things', favours: 'b' },
    ],
  }),
  peek({
    id: 'peek-laptop',
    context: 'buying',
    title: 'Two laptops',
    scene: 'Two laptops at the same price. A friend has Laptop A and likes it. Laptop B gets better reviews.',
    a: 'Laptop A',
    b: 'Laptop B',
    facts: [
      { id: 'battery', factor: 'convenience', label: 'Real battery life', a: '12 hours', b: '7 hours', favours: 'a' },
      { id: 'speed', factor: 'quality', label: 'Speed under load', a: 'Slows when it gets hot', b: 'Stays fast', favours: 'b' },
      { id: 'returns', factor: 'flexibility', label: 'Return window', a: '14 days', b: '30 days', favours: 'b' },
      { id: 'repair', factor: 'money', label: 'Repair costs', a: 'Cheap to repair', b: 'Expensive to repair', favours: 'a' },
      { id: 'updates', factor: 'certainty', label: 'Updates', a: 'For seven years', b: 'For four years', favours: 'a' },
    ],
  }),
  peek({
    id: 'peek-gig',
    context: 'work',
    title: 'Two offers',
    scene: 'Two freelance offers for the same month. Offer A is from a big company. Offer B is from a small studio whose work you like.',
    a: 'Offer A',
    b: 'Offer B',
    facts: [
      { id: 'pay', factor: 'money', label: 'Pay', a: '{m:6000}', b: '{m:4500}', favours: 'a' },
      { id: 'pace', factor: 'energy', label: 'The pace', a: 'Long days', b: 'Normal days', favours: 'b' },
      { id: 'say', factor: 'control', label: 'Your say', a: 'Their brief, no changes', b: 'Shaped together', favours: 'b' },
      { id: 'next', factor: 'certainty', label: 'Afterwards', a: 'Likely more work', b: 'A one-off', favours: 'a' },
      { id: 'travel', factor: 'time', label: 'Getting there', a: 'An hour each way', b: 'From home', favours: 'b' },
    ],
  }),
  peek({
    id: 'peek-notes',
    context: 'tools',
    title: 'Two note apps',
    scene: 'Two note-taking apps. App A is the one everyone at work uses. App B is newer, and you like its design.',
    a: 'App A',
    b: 'App B',
    facts: [
      { id: 'price', factor: 'money', label: 'Price', a: 'Free', b: '{m:8} a month', favours: 'a' },
      { id: 'export', factor: 'control', label: 'Your notes', a: 'Hard to export', b: 'Plain files you keep', favours: 'b' },
      { id: 'sync', factor: 'certainty', label: 'Syncing', a: 'Rock solid', b: 'Occasional glitches', favours: 'a' },
      { id: 'capture', factor: 'convenience', label: 'Quick capture', a: 'Slow to open', b: 'Opens instantly', favours: 'b' },
      { id: 'learning', factor: 'effort', label: 'Learning it', a: 'You already know it', b: 'A week to get used to', favours: 'a' },
    ],
  }),
  peek({
    id: 'peek-rental',
    context: 'travel',
    title: 'Two holiday rentals',
    scene: 'Two rentals for a week away. Rental A has a sea view. Rental B is in the old town.',
    a: 'Rental A',
    b: 'Rental B',
    facts: [
      { id: 'price', factor: 'money', label: 'Price', a: '{m:900}', b: '{m:700}', favours: 'b' },
      { id: 'beds', factor: 'energy', label: 'Beds', a: 'Firm and comfortable', b: 'Old and soft', favours: 'a' },
      { id: 'cancel', factor: 'flexibility', label: 'Cancellation', a: 'Free until a week before', b: 'No refunds', favours: 'a' },
      { id: 'cafes', factor: 'convenience', label: 'Shops and cafés', a: 'A 20-minute walk', b: 'On the doorstep', favours: 'b' },
      { id: 'reviews', factor: 'certainty', label: 'Reviews', a: 'Only a few', b: 'Hundreds, mostly glowing', favours: 'b' },
    ],
  }),
  peek({
    id: 'peek-course',
    context: 'project',
    title: 'Two ways to learn',
    scene: 'You want to learn a new skill for your project. Course A is a well-known online course. Course B is a small group with a teacher.',
    a: 'Course A',
    b: 'Course B',
    facts: [
      { id: 'cost', factor: 'money', label: 'Cost', a: '{m:50}', b: '{m:400}', favours: 'a' },
      { id: 'schedule', factor: 'flexibility', label: 'Schedule', a: 'Any time you like', b: 'Tuesday evenings', favours: 'a' },
      { id: 'feedback', factor: 'quality', label: 'Feedback on your work', a: 'None', b: 'Every week', favours: 'b' },
      { id: 'finish', factor: 'certainty', label: 'People who finish', a: 'Few', b: 'Nearly everyone', favours: 'b' },
      { id: 'useful', factor: 'time', label: 'Time until it’s useful', a: 'About three months', b: 'Six weeks', favours: 'b' },
    ],
  }),
];

// ---- Spends: ten coins over five features, then head-to-heads -------------

const SPENDS: SpendCard[] = [
  spend({
    id: 'spend-phone',
    context: 'buying',
    title: 'Your next phone',
    scene: 'Spend 10 coins on what your next phone should be good at.',
    features: [
      { id: 'price', factor: 'money', label: 'Price', high: 'Costs {m:400}', low: 'Costs {m:800}' },
      { id: 'camera', factor: 'quality', label: 'Camera', high: 'An excellent camera', low: 'An average camera' },
      { id: 'battery', factor: 'convenience', label: 'Battery', high: 'A two-day battery', low: 'A one-day battery' },
      { id: 'updates', factor: 'certainty', label: 'Updates', high: 'Updates for seven years', low: 'Updates for three years' },
      { id: 'repair', factor: 'control', label: 'Repairs', high: 'Easy to repair yourself', low: 'Hard to repair' },
    ],
  }),
  spend({
    id: 'spend-trip',
    context: 'travel',
    title: 'A city break',
    scene: 'Spend 10 coins on what a city break should get right.',
    features: [
      { id: 'price', factor: 'money', label: 'Price', high: 'Costs {m:300}', low: 'Costs {m:500}' },
      { id: 'journey', factor: 'time', label: 'Journey', high: 'Two hours door to door', low: 'Five hours door to door' },
      { id: 'sleep', factor: 'energy', label: 'Sleep', high: 'A quiet, comfortable room', low: 'A noisy, basic room' },
      { id: 'location', factor: 'convenience', label: 'Location', high: 'Right in the centre', low: 'A bus ride out' },
      { id: 'cancel', factor: 'flexibility', label: 'Cancellation', high: 'Free cancellation', low: 'No refunds' },
    ],
  }),
  spend({
    id: 'spend-tool',
    context: 'tools',
    title: 'A tool for your team',
    scene: 'Spend 10 coins on what a project tool for your team should get right.',
    features: [
      { id: 'price', factor: 'money', label: 'Price', high: '{m:5} a month', low: '{m:20} a month' },
      { id: 'setup', factor: 'effort', label: 'Setup', high: 'Set up in ten minutes', low: 'A day to set up' },
      { id: 'features', factor: 'quality', label: 'Features', high: 'Does everything you need', low: 'Covers the basics' },
      { id: 'export', factor: 'control', label: 'Your data', high: 'Export everything any time', low: 'Hard to get data out' },
      { id: 'uptime', factor: 'certainty', label: 'Reliability', high: 'Almost never down', low: 'Down now and then' },
    ],
  }),
  spend({
    id: 'spend-contract',
    context: 'work',
    title: 'A three-month contract',
    scene: 'Spend 10 coins on what a three-month contract should give you.',
    features: [
      { id: 'pay', factor: 'money', label: 'Pay', high: '{m:9000} in total', low: '{m:6000} in total' },
      { id: 'work', factor: 'quality', label: 'The work', high: 'Work you’d be proud of', low: 'Routine work' },
      { id: 'hours', factor: 'flexibility', label: 'Hours', high: 'Choose your own hours', low: 'Fixed office hours' },
      { id: 'commute', factor: 'time', label: 'Commute', high: 'Fully remote', low: 'An hour each way' },
      { id: 'say', factor: 'control', label: 'Your say', high: 'Your call on how', low: 'Their process, their way' },
    ],
  }),
];

export const CARDS: Card[] = [...SLIDES, ...CUTS, ...PEEKS, ...SPENDS];

export const card = (id: string) => CARDS.find((c) => c.id === id);

// ---- Kinds of real call, for Decide ---------------------------------------

export const KINDS: Kind[] = [
  {
    id: 'buying',
    name: 'Buying something',
    example: 'A laptop, a camera, a subscription',
    options: ['', ''],
    features: [
      { id: 'price', factor: 'money', text: 'The price' },
      { id: 'quality', factor: 'quality', text: 'How well it does the job' },
      { id: 'daily', factor: 'convenience', text: 'Easy to live with every day' },
      { id: 'reliable', factor: 'certainty', text: 'Reliable for years' },
      { id: 'return', factor: 'flexibility', text: 'Easy to return or resell' },
      { id: 'soon', factor: 'time', text: 'How soon you’d have it' },
      { id: 'setup', factor: 'effort', text: 'Setting it up and learning it' },
      { id: 'repair', factor: 'control', text: 'Yours to repair or change' },
    ],
    defaults: ['price', 'quality', 'daily', 'reliable', 'return'],
    dial: { unit: 'money', steps: [20, 50, 100, 200, 400, 800, 1500], phrase: 'cost {x} more' },
    checks: [
      { id: 'return-window', text: 'The return window' },
      { id: 'running-costs', text: 'Running costs after you buy' },
      { id: 'real-use', text: 'How often you’d really use it' },
      { id: 'fit', text: 'How it fits with what you already have' },
      { id: 'warranty', text: 'Repairs and warranty' },
      { id: 'long-reviews', text: 'Reviews from people a year in' },
      { id: 'size', text: 'Size and weight in daily use' },
      { id: 'resale', text: 'What it would sell for later' },
    ],
  },
  {
    id: 'work',
    name: 'Taking on or pricing work',
    example: 'The gig, your rate, the deadline',
    options: ['', ''],
    features: [
      { id: 'pay', factor: 'money', text: 'What it pays' },
      { id: 'interesting', factor: 'quality', text: 'How interesting the work is' },
      { id: 'hours', factor: 'time', text: 'The time it takes' },
      { id: 'steady', factor: 'certainty', text: 'How steady it is' },
      { id: 'say', factor: 'control', text: 'Your say in how it’s done' },
      { id: 'room', factor: 'flexibility', text: 'Room for other work' },
      { id: 'energy', factor: 'energy', text: 'How much it takes out of you' },
      { id: 'admin', factor: 'effort', text: 'Admin and hassle' },
    ],
    defaults: ['pay', 'interesting', 'hours', 'steady', 'say'],
    dial: { unit: 'money', steps: [100, 250, 500, 1000, 2000, 4000, 8000], phrase: 'paid {x} less' },
    checks: [
      { id: 'payment-terms', text: 'When and how you’d be paid' },
      { id: 'scope', text: 'How far the scope could grow' },
      { id: 'done', text: 'Who decides when it’s done' },
      { id: 'real-hours', text: 'The hours it really takes' },
      { id: 'turn-down', text: 'What else you’d have to turn down' },
      { id: 'leads', text: 'Whether it leads to more work' },
      { id: 'people', text: 'Who you’d be working with' },
    ],
  },
  {
    id: 'shipping',
    name: 'Shipping or cutting scope',
    example: 'Ship on Friday or polish; rebuild or patch',
    options: ['', ''],
    features: [
      { id: 'quality', factor: 'quality', text: 'How good it is' },
      { id: 'speed', factor: 'time', text: 'How soon it ships' },
      { id: 'risk', factor: 'certainty', text: 'How little could go wrong' },
      { id: 'upkeep', factor: 'effort', text: 'How easy it is to look after' },
      { id: 'change', factor: 'flexibility', text: 'Room to change it later' },
      { id: 'cost', factor: 'money', text: 'What it costs' },
      { id: 'energy', factor: 'energy', text: 'What it takes out of you' },
      { id: 'control', factor: 'control', text: 'Your say over the result' },
    ],
    defaults: ['quality', 'speed', 'risk', 'upkeep', 'change'],
    dial: { unit: 'days', steps: [1, 2, 3, 5, 8, 13, 21], phrase: 'took {x} longer' },
    checks: [
      { id: 'waiting', text: 'Who is waiting for it' },
      { id: 'fix-later', text: 'What fixing it later would really cost' },
      { id: 'rework', text: 'Migration or rework it would need' },
      { id: 'noticed', text: 'Whether anyone would notice' },
      { id: 'depends', text: 'Later work that depends on it' },
      { id: 'testing', text: 'The testing it needs' },
      { id: 'support', text: 'Support it would need after release' },
    ],
  },
  {
    id: 'course',
    name: 'Keep going or change course',
    example: 'A project stuck at 80%, a course you no longer need',
    options: ['Keep going', 'Change course'],
    features: [
      { id: 'result', factor: 'quality', text: 'What finishing would get you' },
      { id: 'time', factor: 'time', text: 'The time it still needs' },
      { id: 'energy', factor: 'energy', text: 'The energy it still needs' },
      { id: 'pays-off', factor: 'certainty', text: 'How sure it is to pay off' },
      { id: 'freedom', factor: 'flexibility', text: 'Freedom to do other things' },
      { id: 'money', factor: 'money', text: 'The money it still needs' },
      { id: 'say', factor: 'control', text: 'Your say in where it goes' },
      { id: 'effort', factor: 'effort', text: 'The work still left' },
    ],
    defaults: ['result', 'time', 'energy', 'pays-off', 'freedom'],
    dial: { unit: 'weeks', steps: [1, 2, 3, 4, 6, 9, 13], phrase: 'took {x} longer' },
    checks: [
      { id: 'left', text: 'What’s actually left to do' },
      { id: 'others', text: 'Who else depends on it' },
      { id: 'pause', text: 'Whether you could pause instead' },
      { id: 'instead', text: 'What you’d do with the time instead' },
      { id: 'salvage', text: 'Which parts could be kept' },
      { id: 'change', text: 'What finishing would really change' },
    ],
  },
];

export const kind = (id: string) => KINDS.find((k) => k.id === id);
