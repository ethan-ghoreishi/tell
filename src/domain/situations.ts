import type { Connection, Situation } from './types';

// Tell's situations and the connections between them. Six invented
// situations in very different places, written as three pairs: each pair
// shares a tension and differs on one field of the model (types.ts, MODEL).
// The pairs are never named in play, so one can't prime the other.
//
// `situations.test.ts` checks the shape and the wording rules; it can't judge
// whether a situation is interesting or a connection useful, so a person
// reads every path and every combination before content ships:
// REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts
//
// Append; never reuse an id for different content, and bump `v` (here and in
// the connection's side) when a situation's meaning changes. Plays keep a
// copy of what they showed.

export const SITUATIONS: Situation[] = [
  {
    id: 'oak',
    v: 1,
    title: 'The old oak',
    place: 'A village green',
    hook: 'Two hundred years old, and leaning over the school path.',
    setup:
      'The oak on the village green is about two hundred years old. It leans over the path to the school, and in March a big branch came down in the night. There is fungus at its base. The parish has left the decision to you, and the autumn storms are five weeks away.',
    steps: [
      {
        kind: 'uncover',
        id: 'look',
        prompt: 'Before you decide, you can find things out. Each takes time, and the work itself will need the last week.',
        budget: 4,
        unit: ['week', 'weeks'],
        facts: [
          { id: 'climb', label: 'Ask the tree surgeon to climb it', cost: 1, text: 'The crown is healthy and full of leaf. She could take a third of its weight off without harming it.' },
          { id: 'photos', label: 'Find old photographs of the green', cost: 1, text: 'In a photograph from 1952, the oak leans exactly as far as it does today.' },
          { id: 'scan', label: 'Have the trunk scanned', cost: 3, text: 'About a third of the trunk is hollow. Hollow oaks often stand for decades. Some don’t.' },
        ],
        bands: [
          { id: 'none', upTo: 0 },
          { id: 'some', upTo: 4 },
        ],
      },
      {
        kind: 'choose',
        id: 'act',
        prompt: 'What happens to the oak?',
        options: [
          { id: 'fell', text: 'Fell it', detail: 'No more risk from it, and no more oak.' },
          { id: 'crown', text: 'Take a third of the weight off the crown', detail: 'It stays, smaller. Less likely to fall; not certain.' },
          { id: 'fence', text: 'Leave it, and fence off the path', detail: 'The oak stays as it is. The children walk round by the road.' },
        ],
      },
    ],
    ending: {
      closing: {
        step: 'act',
        cases: {
          fell: 'The oak comes down in a day. The stump is wider than a kitchen table, and a boy from the school counts 214 rings. The path is open again by Friday.',
          crown: 'The tree surgeon spends two days in the crown. From the pub the oak looks thinner, and still very much itself. The path stays open, and the storms will test it.',
          fence: 'A fence goes up around the oak, and the school sends a letter about the longer walk. The oak meets the storms as it is.',
        },
      },
      others:
        'Some fell it straight away: the fungus is enough. Some spend three weeks on the scan, because a felled oak can’t be put back. Some fence it off and keep every option open, and the children pay with a longer walk.',
    },
    structure: { undo: 'none', news: 'buy', waiting: 'risks' },
  },
  {
    id: 'harvest',
    v: 1,
    title: 'The harvest',
    place: 'A small vineyard',
    hook: 'Every day the grapes get sweeter. A storm may be coming.',
    setup:
      'Your grapes are nearly ripe. Each extra day on the vine makes them sweeter and the wine better. A storm may be on its way: if it hits before you pick, the rain will split half the grapes. Picking takes your crew one full day, and the forecast changes every morning.',
    steps: [
      {
        kind: 'days',
        id: 'pick',
        days: [
          { label: 'Monday', text: 'Forecast: a three-in-ten chance of a storm this week, most likely Friday. This far ahead, forecasts are often a day or two out. Picked today, the grapes would make a good, light wine.' },
          { label: 'Tuesday', text: 'Forecast: five in ten, Thursday or Friday. Picked today, a good wine.' },
          { label: 'Wednesday', text: 'Forecast: seven in ten, on Friday, perhaps Thursday night. Picked today, a very good wine.' },
          { label: 'Thursday', text: 'Forecast: nine in ten, from Friday midday. Storms like this sometimes arrive a day early. Picked today, the best wine in years.' },
        ],
        act: 'Pick today',
        wait: 'Wait a day',
        last: 'Wait for the storm to pass',
        bands: [
          { id: 'mon', upTo: 0 },
          { id: 'tue', upTo: 1 },
          { id: 'wed', upTo: 2 },
          { id: 'thu', upTo: 3 },
          { id: 'out', upTo: 4 },
        ],
      },
    ],
    ending: {
      closing: {
        step: 'pick',
        cases: {
          mon: 'Your crew picks on Monday in sunshine. Every grape is in, whatever the week brings: a good, light wine.',
          tue: 'You pick on Tuesday, before the forecasts firm up. Every grape is in: a good wine, whatever the storm does.',
          wed: 'You pick on Wednesday under a high, thin sky. Every grape is in: a very good wine, whatever Friday brings.',
          thu: 'You pick all Thursday under a darkening sky. If the storm keeps to its forecast, every grape is in: the best wine in years. If it comes a day early, rain catches the last rows.',
          out: 'You wait. If the storm misses, as it does one time in ten, you’ll make an extraordinary wine. If it comes, you lose half the crop, and the half that’s left is still very fine.',
        },
      },
      others:
        'Some pick on Monday: a good wine in hand beats a better one in the forecast. Some wait for clearer news on Wednesday and stop there. Some hold on for Thursday’s sugar. A few let the storm decide.',
    },
    structure: { undo: 'none', news: 'comes', waiting: 'risks' },
  },
  {
    id: 'boat',
    v: 1,
    title: 'Your uncle’s boat',
    place: 'A harbour',
    hook: 'A wooden boat, a fair offer, and a summer you haven’t had yet.',
    setup:
      'Your uncle has left you his wooden sailing boat. You’ve never sailed. A buyer has made a fair offer, good until Friday. Keeping her means a mooring fee every month and weekends of sanding and varnish. Sailing lessons start at the harbour next week: by autumn, you’d know whether you like it.',
    steps: [
      {
        kind: 'choose',
        id: 'keep',
        prompt: 'What do you do?',
        options: [
          { id: 'sell', text: 'Sell her on Friday', detail: 'A fair price now. You’d learn in the club’s dinghies.' },
          { id: 'summer', text: 'Keep her for the summer, then decide', detail: 'Mooring and upkeep until autumn. The buyer may not wait.' },
          { id: 'always', text: 'Keep her, whatever happens', detail: 'She stays in the family, and so do the fees.' },
        ],
        ask: {
          label: 'Ask at the sailing club first',
          did: 'Asked at the sailing club',
          answer: 'The club secretary says they’d look after her for the summer and use her for lessons. No fees for you, and beginners at the helm.',
          adds: { id: 'club', text: 'Lend her to the club for the summer', detail: 'No fees until autumn. Other people learn on her.' },
        },
      },
    ],
    ending: {
      closing: {
        step: 'keep',
        cases: {
          sell: 'The buyer sails her away on Saturday and promises a photo from the water. Your lessons start in a club dinghy. If you love it, there will be other boats, though not this one.',
          summer: 'You pay the mooring and spend Saturdays sanding. By autumn you’ll know about sailing. Whether the buyer will still be interested, the story doesn’t say.',
          always: 'You paint her name fresh on the stern. Whether you’ll sail her, the summer will tell. She’s yours either way.',
          club: 'The club takes her for the summer, and beginners learn on her, you among them. By autumn you’ll know about sailing, and she’ll have a few new scratches.',
        },
      },
      others:
        'Some sell on Friday: a fair price is certain, and there are other boats to learn in. Some pay to keep the question open until the lessons answer it. Some keep her whatever happens, because not everything turns on whether you like sailing.',
    },
    structure: { undo: 'costly', news: 'comes', waiting: 'holds' },
  },
  {
    id: 'loaf',
    v: 1,
    title: 'The new loaf',
    place: 'A small bakery',
    hook: 'Eleven years of the same six breads. Now, maybe, a seventh.',
    setup:
      'Your bakery has sold the same six breads for eleven years, and your regulars like it that way. One night you worked out a seventh: dark rye with figs and fennel. You love it. You have no idea whether anyone else will.',
    steps: [
      {
        kind: 'choose',
        id: 'plan',
        prompt: 'What do you do with it first?',
        options: [
          { id: 'shelf', text: 'Put twelve on the shelf on Saturday', detail: 'Costs a batch. If they don’t sell, you stop.' },
          { id: 'taste', text: 'Hand out tasting slices all week', detail: 'Costs a week and half a batch. You hear what people say.' },
          { id: 'regulars', text: 'Give a loaf each to three regulars', detail: 'Costs three loaves. You hear from people who know your bread.' },
        ],
      },
      {
        kind: 'choose',
        id: 'next',
        before: {
          step: 'plan',
          cases: {
            shelf: 'By closing time on Saturday, seven of the twelve have gone. A man in a green coat asks whether it will be there next week. Five come home with you.',
            taste: 'All week the slices disappear. Most people say it’s lovely, a few say “interesting”, and one asks what fennel is. Nobody asks to buy a loaf.',
            regulars: 'Two of them love it. Mrs Okafor says the fennel is far too strong, and that she’d buy it anyway.',
          },
        },
        prompt: 'What now?',
        options: [
          { id: 'weekly', text: 'Bake it every Saturday' },
          { id: 'change', text: 'Change the recipe, then try again' },
          { id: 'own', text: 'Keep it as your own bread, not the shop’s' },
        ],
      },
    ],
    ending: {
      closing: {
        step: 'next',
        cases: {
          weekly: 'It goes up on the board as the seventh bread. Over the winter you’ll find out what eleven years of regulars make of it.',
          change: 'You take out half the fennel and try again in a fortnight. The rye stays dark.',
          own: 'You bake it on Sundays, for the house. The six breads carry on as they were.',
        },
      },
      others:
        'Some put it straight on the shelf: a batch is cheap to lose, and only a sale shows who would buy it. Some taste first, because a shelf can’t tell you why a loaf didn’t sell. Some ask the regulars, whose opinion matters most if it’s to last.',
    },
    structure: { undo: 'cheap', news: 'act', waiting: 'holds' },
  },
  {
    id: 'lighthouse',
    v: 1,
    title: 'The winter order',
    place: 'A lighthouse',
    hook: 'Whatever the boat brings today has to last until spring.',
    setup:
      'You keep the lighthouse on a small island. The last supply boat of the year leaves this afternoon, and what it brings has to last until spring. Most winters the usual order is plenty, but one winter in five the sound freezes and nothing gets through until April. The winter forecast comes out in November.',
    steps: [
      {
        kind: 'choose',
        id: 'order',
        prompt: 'What do you order?',
        options: [
          { id: 'usual', text: 'The usual order', detail: 'Plenty for most winters, and money left for new lamp glass.' },
          { id: 'more', text: 'Half as much again', detail: 'Enough for a long winter. The lamp glass waits a year.' },
          { id: 'promise', text: 'The usual order, and a promise from the boatman', detail: 'He’ll try one run in January if you radio. It costs you a favour.' },
        ],
      },
    ],
    ending: {
      closing: {
        step: 'order',
        cases: {
          usual: 'November. The forecast is out: a long winter is twice as likely as usual this year, two chances in five. There is nothing to add now. The new glass is in the lamp, and you count the tins.',
          more: 'November. The forecast is out: a long winter is twice as likely as usual this year, two chances in five. The extra tins are stacked in the store. Long winter or short, you’ll eat them.',
          promise: 'November. The forecast is out: a long winter is twice as likely as usual this year, two chances in five. You write the boatman’s frequency on the wall by the radio. The favour may be needed.',
        },
      },
      others:
        'Some send the usual order: four winters in five, it’s plenty. Some order half as much again, because no forecast in November can change what October’s boat carried. Some keep the usual order and arrange a way out, at the price of a favour.',
    },
    structure: { undo: 'none', news: 'after', waiting: 'risks' },
  },
  {
    id: 'beans',
    v: 1,
    title: 'The last packet',
    place: 'A vegetable plot',
    hook: 'Ten rows, and a packet of beans nobody grows any more.',
    setup:
      'At the village seed swap, an old man presses a packet of climbing beans into your hand: a local kind nobody sells any more. Seeds this old don’t keep. Each year fewer will sprout, and in a few years none will. Your plot has ten rows, and your household eats from it all summer.',
    steps: [
      {
        kind: 'allocate',
        id: 'rows',
        prompt: 'How do you plant your ten rows this spring?',
        total: 10,
        unit: ['row', 'rows'],
        items: [
          { id: 'old', text: 'The old beans', detail: 'Nobody knows how many will come up.' },
          { id: 'usual', text: 'Your usual vegetables', detail: 'They come up every year.' },
        ],
        measure: 'old',
        bands: [
          { id: 'none', upTo: 0 },
          { id: 'few', upTo: 3 },
          { id: 'many', upTo: 10 },
        ],
      },
    ],
    ending: {
      closing: {
        step: 'rows',
        cases: {
          none: 'You keep the packet in a drawer, and the plot gives you its usual summer. Next spring, fewer of the beans will sprout; the spring after, fewer still.',
          few: 'About one seed in three comes up. By September a handful of plants hang heavy with pods: just enough fresh seed to try again next year. The rest of the plot does what it always does.',
          many: 'About one seed in three comes up, so those rows stand half empty and you buy vegetables in August. By September there is fresh seed to give away at next year’s swap.',
        },
      },
      others:
        'Some plant none: the household eats from those rows, and a packet in a drawer is still a packet. Some give it a row or two, enough to save fresh seed. Some give it half the plot, because a kind that’s lost is lost for good.',
    },
    structure: { undo: 'cheap', news: 'act', waiting: 'erodes' },
  },
];

export const CONNECTIONS: Connection[] = [
  {
    id: 'look-or-undo',
    title: 'Look first, or keep a way back',
    on: 'undo',
    sides: [
      { situation: 'oak', v: 1, step: 'look', classes: { looked: ['some'], went: ['none'] } },
      { situation: 'loaf', v: 1, step: 'plan', classes: { looked: ['taste', 'regulars'], went: ['shelf'] } },
    ],
    link: 'Both let you find out before you act, at a price. A felled oak can’t be put back. A loaf can come off the shelf: if it doesn’t sell, you stop.',
    differs: 'what was at stake, and what finding out cost',
    notes: {
      'looked+looked':
        'You found out first both times. At the bakery the shelf itself could have been the test, and it answers a different question: asking tells you what people say, a sale tells you what they do.',
      'looked+went':
        'You found out first at the oak and let the shelf be the test at the bakery. The oak had an undoable move too, the fence: it can come down again. A felled oak can’t go back up.',
      'went+looked':
        'You went on what you could see at the oak, and found out first at the bakery. The oak’s facts cost weeks closer to the storms; the bakery’s cost a few loaves or a week of slices. What finding out costs can weigh as much as what is at stake.',
      'went+went':
        'You went on what you had both times. Being wrong would have cost the bakery a batch of bread. At the oak, the cost of being wrong depended on which move you made, more than on what you knew.',
    },
    question: 'Is there a version you could try and undo, and what would undoing cost?',
  },
  {
    id: 'news-in-time',
    title: 'News in time, and news too late',
    on: 'news',
    sides: [
      { situation: 'harvest', v: 1, step: 'pick', classes: { early: ['mon', 'tue'], waited: ['wed', 'thu', 'out'] } },
      { situation: 'lighthouse', v: 1, step: 'order', classes: { usual: ['usual'], covered: ['more', 'promise'] } },
    ],
    link: 'Both turn on news you don’t have yet. At the vineyard it came every morning while you could still pick. At the lighthouse it came in November, after the supply boat had gone.',
    differs: 'what was at stake, and what waiting cost',
    notes: {
      'early+usual':
        'You acted without the news both times. At the vineyard that meant giving up a forecast only a day away. At the lighthouse there was nothing to give up: no wait could have brought November before the supply boat.',
      'early+covered':
        'Both times you guarded against the bad case before the news came. At the lighthouse that was the only guard there was. At the vineyard there was a second one: waiting, because the news would come while you could still pick.',
      'waited+usual':
        'You waited for the forecasts at the vineyard, and sent the usual order at the lighthouse. At the vineyard the news could still change what you did. At the lighthouse it could only change how October’s order looks.',
      'waited+covered':
        'You waited at the vineyard and prepared for a long winter at the lighthouse. Neither was free: waiting risked an early storm, and preparing cost the lamp glass or a favour. Only at the vineyard could waiting have bought news.',
    },
    question: 'Will the news you’re waiting for arrive before the point of no return?',
  },
  {
    id: 'what-waiting-keeps',
    title: 'What waiting keeps',
    on: 'waiting',
    sides: [
      { situation: 'boat', v: 1, step: 'keep', classes: { waited: ['summer', 'club'], decided: ['sell', 'always'] } },
      { situation: 'beans', v: 1, step: 'rows', classes: { sowed: ['few', 'many'], waited: ['none'] } },
    ],
    link: 'Both weigh something possible later against something sure now. The boat could wait, at a price, while the lessons answered the question. The beans can’t wait like that: each year in the packet, fewer will sprout.',
    differs: 'what each cost to keep, and what was at stake',
    notes: {
      'waited+sowed':
        'You waited with the boat and sowed the beans: opposite moves. Waiting kept the boat’s question open at the price of fees or a loan to the club; sowing kept the beans going at the price of rows. Neither way of keeping something possible was free.',
      'waited+waited':
        'You waited both times. With the boat, waiting kept every option open until autumn. With the beans, waiting is the one move that slowly closes the door. The same move, opposite effects.',
      'decided+sowed':
        'You settled the boat now and gave rows to the beans. Settling the boat meant deciding before the lessons could answer. Sowing the beans was the only way to get the beans’ answer at all.',
      'decided+waited':
        'You settled the boat now and kept the beans in their packet. The boat would have waited, at a price. The beans wait for free, but they don’t wait whole: each spring a few more won’t come up.',
    },
    question: 'If you wait, does this stay open, or slowly close?',
  },
];

export const situation = (id: string) => SITUATIONS.find((s) => s.id === id);
