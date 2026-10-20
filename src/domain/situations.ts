import type { Connection, Situation } from './types';

// Tell's situations and the connections between them.
//
// Every answer a situation offers is a move in the model (types.ts, MOVES):
// whether it can be taken back, what it does about the unknown, what it
// leaves possible, and what it costs and risks. A connection is a distinction
// between two specific ways through two situations; it names the answers it
// fits, and may only group answers the model describes the same way.
//
// `situations.test.ts` checks the shape, the model and the wording rules; it
// can't judge whether a situation is interesting or a connection useful, so a
// person reads every path and every combination before content ships:
// REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts
//
// Append; never reuse an id for different content, and bump `v` (here and in
// every connection side that names it) when a situation's meaning changes.
// Plays keep a copy of what they showed.

export const SITUATIONS: Situation[] = [
  {
    id: 'oak',
    v: 2,
    title: 'The old oak',
    place: 'A village green',
    hook: 'Two hundred years old, and leaning over the school path.',
    setup:
      'The oak on the village green is about two hundred years old. It leans over the path to the school, and in March a big branch came down in the night. There is fungus at its base. The parish has left the decision to you, and the autumn storms are five weeks away.',
    uncertain: 'Whether a hollowing, leaning oak will stand through the storms.',
    steps: [
      {
        kind: 'uncover',
        id: 'look',
        prompt: 'Before you decide, you can find things out. Each takes time, and the work itself will need the last week.',
        budget: 4,
        unit: ['week', 'weeks'],
        facts: [
          { id: 'climb', label: 'Ask the tree surgeon to climb it', cost: 1, text: 'The crown is full of leaf. She says cutting it back would ease the strain, and that big cuts on an old oak can let rot in.' },
          { id: 'photos', label: 'Find old photographs of the green', cost: 1, text: 'In a photograph from 1952 the oak leans exactly as far as it does today. There is no fungus in the photograph.' },
          { id: 'scan', label: 'Have the trunk scanned', cost: 3, text: 'About a third of the trunk is hollow. Hollow oaks often stand for decades; some don’t.' },
        ],
        bands: [
          { id: 'none', upTo: 0, move: { uncertainty: 'goes-without', costs: 'no time at all', risks: 'acting on a lean and some fungus alone' } },
          { id: 'some', upTo: 4, move: { uncertainty: 'looks-first', costs: 'weeks closer to the storms', risks: 'facts that still don’t settle it' } },
        ],
      },
      {
        kind: 'choose',
        id: 'act',
        prompt: 'What happens to the oak?',
        options: [
          {
            id: 'fell',
            text: 'Fell it',
            detail: 'No more risk from it, and no more oak.',
            move: { action: 'final', future: 'closes', costs: 'a two-hundred-year-old tree', risks: 'felling a tree that would have stood for decades' },
          },
          {
            id: 'crown',
            text: 'Take a third of the weight off the crown',
            detail: 'It stays, smaller. Less likely to fall; the cuts are for good.',
            move: { action: 'final', future: 'guards', costs: 'a third of the crown, for good', risks: 'rot in the cuts, or a fall anyway' },
          },
          {
            id: 'fence',
            text: 'Leave it, and fence off the path',
            detail: 'The oak stays as it is. The children walk round by the road.',
            move: { action: 'undoable-at-a-price', future: 'keeps-open', costs: 'a longer walk to school while it stands', risks: 'the oak coming down inside the fence' },
          },
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
      others: 'Some fell it at once. Some spend three weeks on the scan, because a felled oak can’t be put back. Some fence it off and let the children walk round.',
    },
    real: {
      facts: [
        {
          fact: 'A hollowing trunk is a natural process in old trees, and not necessarily a sign of an ailing one.',
          sources: [{ name: 'Woodland Trust, “Ancient hollow trees” (2023)', url: 'https://www.woodlandtrust.org.uk/blog/2023/07/ancient-hollow-trees/' }],
        },
      ],
      invented: 'The oak, the green, what each check finds and the five weeks are invented.',
    },
  },
  {
    id: 'harvest',
    v: 2,
    title: 'The harvest',
    place: 'A small vineyard',
    hook: 'Every day the grapes get sweeter. A storm may be coming.',
    setup:
      'Your grapes are nearly ripe. Each extra day on the vine makes them sweeter and the wine better. A storm may be on its way: if it hits before you pick, the rain will split half the grapes. Picking takes your crew one full day, and the forecast changes every morning.',
    uncertain: 'Whether the storm comes, and when.',
    steps: [
      {
        kind: 'days',
        id: 'pick',
        days: [
          { label: 'Monday', text: 'Forecast: a three-in-ten chance of a storm this week, most likely Friday. This far ahead, forecasts are often a day or two out. Picked today, a good, light wine.' },
          { label: 'Tuesday', text: 'Forecast: five in ten, Thursday or Friday. Picked today, a good wine.' },
          { label: 'Wednesday', text: 'Forecast: seven in ten, on Friday, perhaps Thursday night. Picked today, a very good wine.' },
          { label: 'Thursday', text: 'Forecast: nine in ten, from Friday midday. Storms like this sometimes arrive a day early. Picked today, the best wine in years.' },
        ],
        act: 'Pick today',
        wait: 'Wait a day',
        last: 'Wait for the storm to pass',
        bands: [
          { id: 'mon', upTo: 0, move: { action: 'final', uncertainty: 'before-news', costs: 'four more days of sweetness', risks: 'nothing from the storm' } },
          { id: 'tue', upTo: 1, move: { action: 'final', uncertainty: 'before-news', costs: 'three more days of sweetness', risks: 'nothing from the storm' } },
          { id: 'wed', upTo: 2, move: { action: 'final', uncertainty: 'waits-for-news', costs: 'Thursday’s extra sweetness', risks: 'a storm two days early' } },
          { id: 'thu', upTo: 3, move: { action: 'final', uncertainty: 'waits-for-news', costs: 'four days of watching the sky', risks: 'rain on the last rows if the storm comes early' } },
          { id: 'out', upTo: 4, move: { action: 'holds', uncertainty: 'waits-for-news', costs: 'nothing yet', risks: 'half the crop' } },
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
      others: 'Some pick on Monday: a good wine in hand beats a better one in the forecast. Some wait for Wednesday’s clearer news. A few hold on for Thursday’s sugar, or let the storm decide.',
    },
    real: {
      facts: [
        {
          fact: 'Heavy rain close to harvest can split a large share of ripe grapes.',
          sources: [{ name: 'University of Wisconsin Fruit Program, “Berry splitting in grapes, should you harvest?” (2020)', url: 'https://fruit.wisc.edu/2020/09/17/harvesting-decisions-after-heavy-rains-and-berry-splitting/' }],
        },
      ],
      invented: 'The vineyard, the forecasts and “half the grapes” are invented.',
    },
  },
  {
    id: 'boat',
    v: 2,
    title: 'Your uncle’s boat',
    place: 'A harbour',
    hook: 'A wooden boat, a fair offer, and a summer you haven’t had yet.',
    setup:
      'Your uncle has left you his wooden sailing boat. You’ve never sailed. A buyer has made a fair offer, good until Friday. Keeping her means a mooring fee every month and weekends of sanding and varnish. Sailing lessons start at the harbour next week: by autumn, you’d know whether you like it.',
    uncertain: 'Whether you’ll like sailing.',
    steps: [
      {
        kind: 'choose',
        id: 'keep',
        prompt: 'What do you do?',
        options: [
          {
            id: 'sell',
            text: 'Sell her on Friday',
            detail: 'A fair price now. You’d learn in the club’s dinghies.',
            move: { action: 'final', future: 'closes', costs: 'your uncle’s boat', risks: 'loving sailing, in someone else’s boat' },
          },
          {
            id: 'summer',
            text: 'Keep her for the summer, then decide',
            detail: 'Mooring and upkeep until autumn. The buyer may not wait.',
            move: { action: 'holds', uncertainty: 'waits-for-news', future: 'keeps-open', costs: 'a summer of fees and sanding', risks: 'losing the buyer' },
          },
          {
            id: 'always',
            text: 'Keep her, whatever happens',
            detail: 'She stays in the family, and so do the fees.',
            move: { action: 'undoable-at-a-price', uncertainty: 'before-news', costs: 'fees for as long as you keep her', risks: 'a boat that never leaves her mooring' },
          },
        ],
        ask: {
          label: 'Ask at the sailing club first',
          did: 'Asked at the sailing club',
          answer: 'The club would take her for the season and teach beginners on her. No fees for you. She’d be theirs until October, so no sale before then, and beginners are hard on boats.',
          adds: {
            id: 'club',
            text: 'Lend her to the club for the season',
            detail: 'No fees, no sale until October, and beginners at the helm.',
            move: { action: 'holds', uncertainty: 'waits-for-news', future: 'keeps-open', costs: 'a season of wear on her', risks: 'losing the buyer' },
          },
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
          club: 'The club takes her for the season, and beginners learn on her, you among them. By October you’ll know about sailing, and she’ll have the scrapes to show for it.',
        },
      },
      others: 'Some sell on Friday: a fair price is certain, and there are other boats to learn in. Some pay to keep the question open until the lessons answer it. Some keep her whatever happens.',
    },
  },
  {
    id: 'loaf',
    v: 2,
    title: 'The new loaf',
    place: 'A small bakery',
    hook: 'Eleven years of the same six breads. Now, maybe, a seventh.',
    setup:
      'Your bakery has sold the same six breads for eleven years, and your regulars like it that way. One night you worked out a seventh: dark rye with figs and fennel. You love it. You have no idea whether anyone else will.',
    uncertain: 'Whether anyone but you will want the new bread.',
    steps: [
      {
        kind: 'choose',
        id: 'plan',
        prompt: 'What do you do with it first?',
        options: [
          {
            id: 'shelf',
            text: 'Put twelve on the shelf on Saturday',
            detail: 'Costs a batch. If they don’t sell, you stop.',
            move: { action: 'undoable', uncertainty: 'tests', costs: 'a batch of bread', risks: 'loaves coming home unsold' },
          },
          {
            id: 'taste',
            text: 'Hand out tasting slices all week',
            detail: 'Costs a week and half a batch. You hear what people say.',
            move: { uncertainty: 'looks-first', costs: 'a week and half a batch', risks: 'kind words that never become sales' },
          },
          {
            id: 'regulars',
            text: 'Give a loaf each to three regulars',
            detail: 'Costs three loaves. You hear from people who know your bread.',
            move: { uncertainty: 'looks-first', costs: 'three loaves', risks: 'three opinions standing in for everyone' },
          },
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
          { id: 'weekly', text: 'Bake it every Saturday', move: { action: 'undoable', costs: 'a place on the board', risks: 'Saturdays of loaves coming home' } },
          { id: 'change', text: 'Change the recipe, then try again', move: { action: 'undoable', uncertainty: 'tests', costs: 'another fortnight', risks: 'losing what the first version had' } },
          { id: 'own', text: 'Keep it as your own bread, not the shop’s', move: { action: 'undoable', costs: 'the shop’s seventh bread', risks: 'never finding out' } },
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
      others: 'Some put it straight on the shelf: a batch is cheap to lose, and only a sale shows who would buy it. Some ask first, because a shelf can’t tell you why a loaf didn’t sell.',
    },
  },
  {
    id: 'take',
    v: 1,
    title: 'The last of the light',
    place: 'A film set',
    hook: 'The best take of the day, and no way to see it until Thursday.',
    setup:
      'You’re directing a small film, shot on 16mm film. On the last evening at the lighthouse, take four of the farewell scene felt right: she held the pause before her last line. There’s light for one more set-up. Film can’t be seen until a lab develops it, and this evening’s reels come back on Thursday, after the crew has left the island.',
    uncertain: 'Whether take four is as good on film as it felt on set.',
    steps: [
      {
        kind: 'choose',
        id: 'light',
        prompt: 'What do you use the last light for?',
        options: [
          {
            id: 'again',
            text: 'Another take of the scene',
            detail: 'A second chance if take four has a fault. The film ends without its wide shot.',
            move: { uncertainty: 'news-after', future: 'guards', costs: 'the closing wide shot', risks: 'a second take with faults of its own' },
          },
          {
            id: 'wide',
            text: 'The wide shot of the lighthouse',
            detail: 'The ending you planned. Take four is your only good take.',
            move: { action: 'final', uncertainty: 'news-after', costs: 'nothing you planned', risks: 'a fault in take four, with no other take' },
          },
        ],
        ask: {
          label: 'Ask the camera operator about take four',
          did: 'Asked the camera operator',
          answer: 'She watched it through the lens. “The frame was right, and it looked sharp to me. On film, you only know on Thursday.”',
        },
      },
    ],
    ending: {
      closing: {
        step: 'light',
        cases: {
          again: 'Thursday, at the lab. Take four is soft for two seconds, right on her last line. Take five is sharp throughout, and she rushes the pause. The film will end on her face, not the lighthouse.',
          wide: 'Thursday, at the lab. Take four is soft for two seconds, right on her last line. An editor can cut away for those seconds, and lose her face as she says it. The wide shot is beautiful.',
        },
      },
      others: 'Some shoot the scene again: the film can’t be checked, so a second take is the only cover. Some take the wide shot: take four felt right, and the ending matters too.',
    },
    real: {
      facts: [
        {
          fact: 'Film has to be developed before anyone can see what it caught. In the film era, each day’s footage went to a lab overnight and was watched later as “dailies”.',
          sources: [
            { name: 'Wikipedia, “Dailies”', url: 'https://en.wikipedia.org/wiki/Dailies' },
            { name: 'Roland Denning, “The golden age of film laboratories”, RedShark News (2023)', url: 'https://www.redsharknews.com/the-golden-age-of-film-laboratories' },
          ],
        },
        {
          fact: 'On a film camera only the operator looks through the lens; the focus puller works from marks and judgement, and a soft shot can’t be made sharp afterwards.',
          sources: [{ name: 'Wikipedia, “Focus puller”', url: 'https://en.wikipedia.org/wiki/Focus_puller' }],
        },
      ],
      invented: 'The film, the island, the takes and the lab’s Thursday are invented. Digital footage can be checked at once; this story is shot on film.',
    },
  },
  {
    id: 'beans',
    v: 2,
    title: 'The last packet',
    place: 'A vegetable plot',
    hook: 'Ten rows, and a packet of beans nobody grows any more.',
    setup:
      'At the village seed swap, an old man presses a packet of climbing beans into your hand: a local kind nobody sells any more. Seeds this old don’t keep. Each year fewer will sprout, and in a few years none will. Your plot has ten rows, and your household eats from it all summer.',
    uncertain: 'How many of the old seeds are still alive.',
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
          { id: 'none', upTo: 0, move: { action: 'holds', future: 'lets-it-fade', costs: 'nothing this year', risks: 'a kind that stops sprouting' } },
          { id: 'few', upTo: 3, move: { action: 'undoable', uncertainty: 'tests', future: 'keeps-by-using', costs: 'a few rows of vegetables', risks: 'too few plants to save seed' } },
          { id: 'many', upTo: 10, move: { action: 'undoable', uncertainty: 'tests', future: 'keeps-by-using', costs: 'much of the summer’s vegetables', risks: 'rows standing half empty' } },
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
      others: 'Some plant none: the household eats from those rows. Some give it a row or two, enough to save fresh seed. Some give it half the plot, because a kind that’s lost is lost for good.',
    },
    real: {
      facts: [
        {
          fact: 'Bean seed keeps for two to four years on average, longest when it is stored cool and dry.',
          sources: [{ name: 'Johnny’s Selected Seeds, “Seed viability and seed storage guidelines”', url: 'https://www.johnnyseeds.com/growers-library/reference-documents/seed-storage-guidelines.html' }],
        },
      ],
      invented: 'The packet, its age and “one seed in three” are invented.',
    },
  },
];

// Connections. Each names, for two situations, exactly which answers it
// fits; no two connections fit the same pair of plays. Not every pair of
// plays has one: where nothing true and useful can be said, nothing is.
export const CONNECTIONS: Connection[] = [
  // ---- The oak and the loaf: looking first, and ways back -----------------
  {
    id: 'way-back-that-teaches',
    title: 'A way back that teaches',
    sides: [
      { situation: 'oak', v: 2, when: { act: ['fence'] }, claims: { action: 'undoable-at-a-price', future: 'keeps-open' } },
      { situation: 'loaf', v: 2, when: { plan: ['shelf'] }, claims: { action: 'undoable', uncertainty: 'tests' } },
    ],
    says: 'Both moves could be taken back. The shelf answered its question by closing time; the fence can stand for years, and the only test it allows is the storm.',
    breaks: 'A failed loaf costs a batch. A failed oak falls where the fence is.',
    question: 'If you take this back later, will you know more than you do now?',
  },
  {
    id: 'ending-or-testing',
    title: 'Ending a question, or testing it',
    sides: [
      { situation: 'oak', v: 2, when: { act: ['fell'] }, claims: { action: 'final', future: 'closes' } },
      { situation: 'loaf', v: 2, when: { plan: ['shelf'] }, claims: { action: 'undoable', uncertainty: 'tests' } },
    ],
    says: 'Felling ended the oak’s question for good, the risk and the tree together. Twelve loaves on a shelf ended nothing: if they hadn’t sold, you could stop.',
    breaks: 'Waiting at the oak risked a branch over children; waiting at the bakery risked almost nothing.',
    question: 'Does this move answer the question, or just end it?',
  },
  {
    id: 'small-is-not-reversible',
    title: 'Small is not the same as reversible',
    sides: [
      { situation: 'oak', v: 2, when: { act: ['crown'] }, claims: { action: 'final', future: 'guards' } },
      { situation: 'loaf', v: 2, when: { plan: ['shelf'] }, claims: { action: 'undoable', uncertainty: 'tests' } },
    ],
    says: 'Cutting back the crown and baking twelve loaves are both partial moves. The loaves can stop next Saturday; the cuts will never grow back.',
    breaks: 'The cut lowers a risk to people; the loaves only test a hope.',
    question: 'Is the smaller version also the one you can undo?',
  },
  {
    id: 'what-finding-out-costs',
    title: 'What finding out costs',
    sides: [
      { situation: 'oak', v: 2, when: { look: ['none'], act: ['fell'] }, claims: { uncertainty: 'goes-without', action: 'final', future: 'closes' } },
      { situation: 'loaf', v: 2, when: { plan: ['taste', 'regulars'] }, claims: { uncertainty: 'looks-first' } },
    ],
    says: 'At the bakery, asking first cost a few loaves or a week of slices. At the oak, each week of finding out was a week closer to the storms, and a felled oak can’t be asked anything afterwards.',
    breaks: 'No fact you could buy at the oak would have said what the storms will do.',
    question: 'What does finding out cost here, and what does not knowing cost?',
  },
  {
    id: 'find-out-later',
    title: 'Finding out later, behind a way back',
    sides: [
      { situation: 'oak', v: 2, when: { look: ['none'], act: ['fence'] }, claims: { uncertainty: 'goes-without', action: 'undoable-at-a-price', future: 'keeps-open' } },
      { situation: 'loaf', v: 2, when: { plan: ['taste', 'regulars'] }, claims: { uncertainty: 'looks-first' } },
    ],
    says: 'At the bakery, asking came before anything else. At the oak, the fence came first: while it stands, the scan can still be done.',
    breaks: 'The fence costs the children a longer walk for every week the question stays open.',
    question: 'Could a move you can undo buy time to find out?',
  },
  {
    id: 'facts-about-now',
    title: 'Facts about now, not about later',
    sides: [
      { situation: 'oak', v: 2, when: { look: ['some'] }, claims: { uncertainty: 'looks-first' } },
      { situation: 'loaf', v: 2, when: { plan: ['taste', 'regulars'] }, claims: { uncertainty: 'looks-first' } },
    ],
    says: 'What you can learn about the oak describes it as it stands; what people say about a loaf describes today. Neither says what the storms, or a winter of Saturdays, will do.',
    breaks: 'The loaf could still be tried afterwards. The oak’s only trial is a storm, which a felled oak never faces.',
    question: 'Will what you can find out describe the outcome, or only the present?',
  },

  // ---- The harvest and the film: news in time, and news too late ----------
  {
    id: 'news-you-can-wait-for',
    title: 'News you can wait for, and news you can’t',
    sides: [
      { situation: 'harvest', v: 2, when: { pick: ['wed', 'thu'] }, claims: { action: 'final', uncertainty: 'waits-for-news' } },
      { situation: 'take', v: 1, when: { light: ['wide'] }, claims: { action: 'final', uncertainty: 'news-after' } },
    ],
    says: 'At the vineyard, each day’s wait brought a clearer forecast while picking was still possible. On set no wait would have shown take four: film can’t be seen until it’s developed.',
    breaks: 'Waiting at the vineyard risked the crop; waiting on set would only have lost the light.',
    question: 'Will the news you’re waiting for come before the point of no return?',
  },
  {
    id: 'cover-you-might-not-need',
    title: 'Cover you might not have needed',
    sides: [
      { situation: 'harvest', v: 2, when: { pick: ['mon', 'tue'] }, claims: { action: 'final', uncertainty: 'before-news' } },
      { situation: 'take', v: 1, when: { light: ['again'] }, claims: { uncertainty: 'news-after', future: 'guards' } },
    ],
    says: 'An early pick and a second take both cover the bad case before the news. At the vineyard, waiting would have brought clearer forecasts; on set nothing could show the film until Thursday.',
    breaks: 'The early pick cost sweetness; the second take cost the planned ending.',
    question: 'Could you wait to see whether you need this cover?',
  },
  {
    id: 'waiting-or-a-second-chance',
    title: 'Waiting, or a second chance',
    sides: [
      { situation: 'harvest', v: 2, when: { pick: ['wed', 'thu'] }, claims: { action: 'final', uncertainty: 'waits-for-news' } },
      { situation: 'take', v: 1, when: { light: ['again'] }, claims: { uncertainty: 'news-after', future: 'guards' } },
    ],
    says: 'At the vineyard the forecast came while you could still pick, so waiting for it was one guard against the storm. On set the film stays unseen until Thursday, so a second take is the only guard against a fault.',
    breaks: 'Waiting risked an early storm; the second take cost the wide shot for sure.',
    question: 'When the news comes too late, what second chance can you buy now?',
  },
  {
    id: 'nothing-to-wait-for',
    title: 'Not waiting, and nothing to wait for',
    sides: [
      { situation: 'harvest', v: 2, when: { pick: ['mon', 'tue'] }, claims: { action: 'final', uncertainty: 'before-news' } },
      { situation: 'take', v: 1, when: { light: ['wide'] }, claims: { action: 'final', uncertainty: 'news-after' } },
    ],
    says: 'Picking early gave up a forecast that was a day away. Trusting take four gave up nothing you could have known: the reels were going to the lab either way.',
    breaks: 'An early pick still made a good wine; a fault in take four stays in the film.',
    question: 'Is the news you’d be giving up actually on its way?',
  },

  // ---- The boat and the beans: what waiting keeps -------------------------
  {
    id: 'keeping-by-waiting-or-using',
    title: 'Keeping by waiting, keeping by using',
    sides: [
      { situation: 'boat', v: 2, when: { keep: ['summer', 'club'] }, claims: { action: 'holds', future: 'keeps-open' } },
      { situation: 'beans', v: 2, when: { rows: ['few', 'many'] }, claims: { future: 'keeps-by-using' } },
    ],
    says: 'The boat stayed possible by not deciding yet. The beans stay possible only by being sown. Keeping something open took opposite moves.',
    breaks: 'Waiting with the boat cost fees or wear; sowing cost rows of food.',
    question: 'Does keeping this possible mean waiting, or using it?',
  },
  {
    id: 'waiting-keeps-and-wears',
    title: 'Waiting keeps some things, and wears others',
    sides: [
      { situation: 'boat', v: 2, when: { keep: ['summer', 'club'] }, claims: { action: 'holds', future: 'keeps-open' } },
      { situation: 'beans', v: 2, when: { rows: ['none'] }, claims: { action: 'holds', future: 'lets-it-fade' } },
    ],
    says: 'Holding off kept the boat available until the lessons answered. Holding off with the beans is how the packet runs out, a few sprouts fewer each spring.',
    breaks: 'The boat’s wait ends with an answer; the drawer never gives one.',
    question: 'If you wait, does this stay open, or slowly close?',
  },
  {
    id: 'what-can-be-replaced',
    title: 'What can be replaced',
    sides: [
      { situation: 'boat', v: 2, when: { keep: ['sell'] }, claims: { action: 'final', future: 'closes' } },
      { situation: 'beans', v: 2, when: { rows: ['few', 'many'] }, claims: { future: 'keeps-by-using' } },
    ],
    says: 'Selling closed the boat for good, but there are other boats to learn in. The old beans have no other packet: once they stop sprouting, the kind is gone.',
    breaks: 'The sale paid you; the rows cost food, with nothing paid back.',
    question: 'If you let this go, is there another like it?',
  },
  {
    id: 'closing-by-waiting',
    title: 'Closing by deciding, closing by waiting',
    sides: [
      { situation: 'boat', v: 2, when: { keep: ['sell'] }, claims: { action: 'final', future: 'closes' } },
      { situation: 'beans', v: 2, when: { rows: ['none'] }, claims: { action: 'holds', future: 'lets-it-fade' } },
    ],
    says: 'Selling closed the boat on Friday, in one move. Leaving the packet in a drawer closes the beans too, slowly, without a day you would notice.',
    breaks: 'The sale paid you; the drawer costs nothing until it’s too late.',
    question: 'Is not deciding closing something anyway?',
  },

  // ---- Across the collection ----------------------------------------------
  {
    id: 'leaving-it-to-time',
    title: 'Leaving it to time',
    sides: [
      { situation: 'harvest', v: 2, when: { pick: ['out'] }, claims: { action: 'holds', uncertainty: 'waits-for-news' } },
      { situation: 'beans', v: 2, when: { rows: ['none'] }, claims: { action: 'holds', future: 'lets-it-fade' } },
    ],
    says: 'Left on the vine, the grapes could become an extraordinary wine or half a crop. Left in the drawer, the beans can only lose: fewer sprout each spring.',
    breaks: 'The storm was days away; the beans fade over years.',
    question: 'Is time on your side here, or only against you?',
  },
  {
    id: 'what-waiting-buys',
    title: 'What waiting buys',
    sides: [
      { situation: 'oak', v: 2, when: { act: ['fence'] }, claims: { action: 'undoable-at-a-price', future: 'keeps-open' } },
      { situation: 'boat', v: 2, when: { keep: ['summer', 'club'] }, claims: { action: 'holds', uncertainty: 'waits-for-news', future: 'keeps-open' } },
    ],
    says: 'The fence and keeping the boat both cost something while you wait. At the harbour the wait brings the lessons’ answer. At the oak it brings only the storms.',
    breaks: 'A boat left waiting picks up scratches; an oak left waiting could fall.',
    question: 'While you wait, what will you learn?',
  },
  {
    id: 'gone-for-good',
    title: 'Gone for good',
    sides: [
      { situation: 'oak', v: 2, when: { act: ['fell'] }, claims: { action: 'final', future: 'closes' } },
      { situation: 'boat', v: 2, when: { keep: ['sell'] }, claims: { action: 'final', future: 'closes' } },
    ],
    says: 'Felling and selling both close something for good. There are other boats to learn in; there is no other two-hundred-year-old oak on that green.',
    breaks: 'The sale paid you; the felling removed a risk to children.',
    question: 'What exactly ends for good if you do this?',
  },
  {
    id: 'tests-you-can-repeat',
    title: 'Tests you can repeat, and tests that won’t wait',
    sides: [
      { situation: 'loaf', v: 2, when: { plan: ['shelf'] }, claims: { action: 'undoable', uncertainty: 'tests' } },
      { situation: 'beans', v: 2, when: { rows: ['few'] }, claims: { uncertainty: 'tests', future: 'keeps-by-using' } },
    ],
    says: 'Twelve loaves and a few rows of beans both answer by being tried. The loaf can be tried again next week; the beans can’t wait many springs for a second try.',
    breaks: 'The loaf tested what people want; the beans tested whether the seed is still alive.',
    question: 'How many more chances will you get to try this?',
  },
  {
    id: 'facts-for-sale',
    title: 'Facts for sale, and none',
    sides: [
      { situation: 'oak', v: 2, when: { look: ['none'] }, claims: { uncertainty: 'goes-without' } },
      { situation: 'take', v: 1, when: { light: ['wide'] }, claims: { action: 'final', uncertainty: 'news-after' } },
    ],
    says: 'At the oak, facts were for sale, at a price in weeks. On set none were: take four couldn’t be seen until Thursday, whatever you paid.',
    breaks: 'Take four was only unknown; the oak’s risk grew every week.',
    question: 'Can what you need to know be bought before you act?',
  },
  {
    id: 'pay-to-wait-or-for-a-spare',
    title: 'Paying to wait, or for a spare',
    sides: [
      { situation: 'take', v: 1, when: { light: ['again'] }, claims: { uncertainty: 'news-after', future: 'guards' } },
      { situation: 'boat', v: 2, when: { keep: ['summer', 'club'] }, claims: { action: 'holds', uncertainty: 'waits-for-news', future: 'keeps-open' } },
    ],
    says: 'At the harbour the answer would come in time, so it could be waited for, at a price. On set it would come too late, so the only thing to pay for was a second take.',
    breaks: 'The boat’s wait cost a whole season; the second take cost one shot.',
    question: 'Can you pay to wait for the answer, or only for a second chance?',
  },
];

export const situation = (id: string) => SITUATIONS.find((s) => s.id === id);
