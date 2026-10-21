import type { Situation } from './types';

// Tell's stories. Each turns on one step (`turnsOn`), which the four questions of
// the language read (`shape`), and every answer it offers names the moves it
// makes (language.ts) and what it costs and risks in the story's own terms.
//
// `situations.test.ts` checks the shape, the tags and the wording rules; it
// can't judge whether a story is interesting, so a person reads every path
// before content ships: REVIEW_FILE=/tmp/review.txt npx vitest run tests/review.test.ts
//
// Append; never reuse an id for different content, and bump `v` when a
// story's meaning or tags change. Plays keep a copy of what they showed.
//
// A variant (`of`) is its base story with one fact changed: the same step,
// a shape that differs on one question, reached from the base's ending.
// Played after the base, the two sit side by side, and nothing explains them.

export const SITUATIONS: Situation[] = [
  {
    id: 'oak',
    v: 3,
    title: 'The old oak',
    place: 'A village green',
    hook: 'Two hundred years old, and leaning over the school path.',
    setup:
      'The oak on the village green is about two hundred years old. It leans over the path to the school, and in March a big branch came down in the night. There is fungus at its base. The parish has left the decision to you, and the autumn storms are five weeks away.',
    uncertain: 'Whether a hollowing, leaning oak will stand through the storms.',
    turnsOn: 'felling the oak',
    shape: { undo: 'no', know: ['check', 'after'], wait: 'risk', bad: 'hard' },
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
          { id: 'none', upTo: 0, moves: [], costs: 'no time at all', risks: 'acting on a lean and some fungus alone' },
          { id: 'some', upTo: 4, moves: ['look'], costs: 'weeks closer to the storms', risks: 'facts that still don’t settle it' },
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
            moves: ['commit'], costs: 'a two-hundred-year-old tree', risks: 'felling a tree that would have stood for decades',
          },
          {
            id: 'crown',
            text: 'Take a third of the weight off the crown',
            detail: 'It stays, smaller. Less likely to fall; the cuts are for good.',
            moves: ['guard'], costs: 'a third of the crown, for good', risks: 'rot in the cuts, or a fall anyway',
          },
          {
            id: 'fence',
            text: 'Leave it, and fence off the path',
            detail: 'The oak stays as it is. The children walk round by the road.',
            moves: ['hold', 'guard'], costs: 'a longer walk to school while it stands', risks: 'the oak coming down inside the fence',
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
    v: 3,
    title: 'The harvest',
    place: 'A small vineyard',
    hook: 'Every day the grapes get sweeter. A storm may be coming.',
    setup:
      'Your grapes are nearly ripe. Each extra day on the vine makes them sweeter and the wine better. A storm may be on its way: if it hits before you pick, the rain will split half the grapes. Picking takes your crew one full day, and the forecast changes every morning.',
    uncertain: 'Whether the storm comes, and when.',
    turnsOn: 'picking the grapes',
    shape: { undo: 'no', know: ['wait'], wait: 'better', bad: 'over' },
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
          { id: 'mon', upTo: 0, moves: ['commit'], costs: 'four more days of sweetness', risks: 'nothing from the storm' },
          { id: 'tue', upTo: 1, moves: ['commit'], costs: 'three more days of sweetness', risks: 'nothing from the storm' },
          { id: 'wed', upTo: 2, moves: ['wait-for-it'], costs: 'Thursday’s extra sweetness', risks: 'a storm two days early' },
          { id: 'thu', upTo: 3, moves: ['wait-for-it'], costs: 'four days of watching the sky', risks: 'rain on the last rows if the storm comes early' },
          { id: 'out', upTo: 4, moves: ['wait-for-it'], costs: 'nothing yet', risks: 'half the crop' },
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
    v: 3,
    title: 'Your uncle’s boat',
    place: 'A harbour',
    hook: 'A wooden boat, a fair offer, and a summer you haven’t had yet.',
    setup:
      'Your uncle has left you his wooden sailing boat. You’ve never sailed. A buyer has made a fair offer, good until Friday. Keeping her means a mooring fee every month and weekends of sanding and varnish. Sailing lessons start at the harbour next week: by autumn, you’d know whether you like it.',
    uncertain: 'Whether you’ll like sailing.',
    turnsOn: 'selling the boat',
    shape: { undo: 'no', know: ['after'], wait: 'closes', bad: 'over' },
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
            moves: ['commit'], costs: 'your uncle’s boat', risks: 'loving sailing, in someone else’s boat',
          },
          {
            id: 'summer',
            text: 'Keep her for the summer, then decide',
            detail: 'Mooring and upkeep until autumn. The buyer may not wait.',
            moves: ['hold'], costs: 'a summer of fees and sanding', risks: 'losing the buyer',
          },
          {
            id: 'always',
            text: 'Keep her, whatever happens',
            detail: 'She stays in the family, and so do the fees.',
            moves: ['rule-out'], costs: 'fees for as long as you keep her', risks: 'a boat that never leaves her mooring',
          },
        ],
        ask: {
          label: 'Ask at the sailing club first',
          did: 'Asked at the sailing club',
          answer: 'The club would take her for the season and teach beginners on her. No fees for you. She’d be theirs until October, so no sale before then, and beginners are hard on boats.',
          moves: ['another'],
          adds: {
            id: 'club',
            text: 'Lend her to the club for the season',
            detail: 'No fees, no sale until October, and beginners at the helm.',
            moves: ['hand-over'], costs: 'a season of wear on her', risks: 'losing the buyer',
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
    v: 3,
    title: 'The new loaf',
    place: 'A small bakery',
    hook: 'Eleven years of the same six breads. Now, maybe, a seventh.',
    setup:
      'Your bakery has sold the same six breads for eleven years, and your regulars like it that way. One night you worked out a seventh: dark rye with figs and fennel. You love it. You have no idea whether anyone else will.',
    uncertain: 'Whether anyone but you will want the new bread.',
    turnsOn: 'putting the new bread on sale',
    shape: { undo: 'easily', know: ['check', 'after'], wait: 'nothing', bad: 'over' },
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
            moves: ['small'], costs: 'a batch of bread', risks: 'loaves coming home unsold',
          },
          {
            id: 'taste',
            text: 'Hand out tasting slices all week',
            detail: 'Costs a week and half a batch. You hear what people say.',
            moves: ['look'], costs: 'a week and half a batch', risks: 'kind words that never become sales',
          },
          {
            id: 'regulars',
            text: 'Give a loaf each to three regulars',
            detail: 'Costs three loaves. You hear from people who know your bread.',
            moves: ['look'], costs: 'three loaves', risks: 'three opinions standing in for everyone',
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
          { id: 'weekly', text: 'Bake it every Saturday', moves: ['commit'], costs: 'a place on the board', risks: 'Saturdays of loaves coming home' },
          { id: 'change', text: 'Change the recipe, then try again', moves: ['small'], costs: 'another fortnight', risks: 'losing what the first version had' },
          { id: 'own', text: 'Keep it as your own bread, not the shop’s', moves: ['rule-out'], costs: 'the shop’s seventh bread', risks: 'never finding out' },
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
    v: 2,
    title: 'The last of the light',
    place: 'A film set',
    hook: 'The best take of the day, and no way to see it until Thursday.',
    setup:
      'You’re directing a small film, shot on 16mm film. On the last evening at the lighthouse, take four of the farewell scene felt right: she held the pause before her last line. There’s light for one more set-up. Film can’t be seen until a lab develops it, and this evening’s reels come back on Thursday, after the crew has left the island.',
    uncertain: 'Whether take four is as good on film as it felt on set.',
    turnsOn: 'spending the last light on the wide shot',
    shape: { undo: 'no', know: ['check', 'after'], wait: 'closes', bad: 'hard' },
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
            moves: ['spare'], costs: 'the closing wide shot', risks: 'a second take with faults of its own',
          },
          {
            id: 'wide',
            text: 'The wide shot of the lighthouse',
            detail: 'The ending you planned. Take four is your only good take.',
            moves: ['commit'], costs: 'nothing you planned', risks: 'a fault in take four, with no other take',
          },
        ],
        ask: {
          label: 'Ask the camera operator about take four',
          did: 'Asked the camera operator',
          answer: 'She watched it through the lens. “The frame was right, and it looked sharp to me. On film, you only know on Thursday.”',
          moves: ['look'],
        },
      },
    ],
    ending: {
      closing: {
        step: 'light',
        cases: {
          again: 'You shoot take five as the light goes, and she rushes the pause a little. The reels leave on the morning boat. On Thursday the lab will show which take holds her last line. The film will end on her face, not the lighthouse.',
          wide: 'The wide shot catches the last light on the lighthouse, and the crew packs up in the dark. The reels leave on the morning boat. On Thursday the lab will show whether take four is as good on film as it felt.',
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
    v: 3,
    title: 'The last packet',
    place: 'A vegetable plot',
    hook: 'Ten rows, and a packet of beans nobody grows any more.',
    setup:
      'At the village seed swap, an old man presses a packet of climbing beans into your hand: a local kind nobody sells any more. Seeds this old don’t keep. Each year fewer will sprout, and in a few years none will. Your plot has ten rows, and your household eats from it all summer.',
    uncertain: 'How many of the old seeds are still alive.',
    turnsOn: 'sowing the old beans',
    shape: { undo: 'easily', know: ['after'], wait: 'closes', bad: 'over' },
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
          { id: 'none', upTo: 0, moves: [], costs: 'nothing this year', risks: 'a kind that stops sprouting' },
          { id: 'few', upTo: 3, moves: ['small', 'by-using'], costs: 'a few rows of vegetables', risks: 'too few plants to save seed' },
          { id: 'many', upTo: 9, moves: ['split', 'by-using'], costs: 'much of the summer’s vegetables', risks: 'rows standing half empty' },
          { id: 'all', upTo: 10, moves: ['by-using'], costs: 'the summer’s vegetables', risks: 'a plot standing half empty' },
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
          all: 'About one seed in three comes up, so the whole plot stands half empty and you buy vegetables all summer. By September there is more fresh seed than next year’s swap can take.',
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
  {
    id: 'harvest-blind',
    v: 1,
    of: 'harvest',
    whatIf: 'What if the forecasts stopped after Monday?',
    title: 'The harvest, without forecasts',
    place: 'A small vineyard',
    hook: 'The same grapes, the same storm, and no more news.',
    setup:
      'Your grapes are nearly ripe, and each extra day on the vine makes the wine better. Monday’s forecast gives a three-in-ten chance of a storm this week, most likely Friday: if it hits before you pick, the rain will split half the grapes. Then the forecasts stop. The station is down until next week. Picking everything takes your crew one full day.',
    uncertain: 'Whether the storm comes, and when, with no more news.',
    turnsOn: 'picking the grapes',
    shape: { undo: 'no', know: ['after'], wait: 'better', bad: 'over' },
    steps: [
      {
        kind: 'choose',
        id: 'pick',
        prompt: 'With no more forecasts, how do you pick?',
        options: [
          {
            id: 'now',
            text: 'Pick everything today',
            detail: 'A good, light wine, whatever the week brings.',
            moves: ['commit'], costs: 'four more days of sweetness', risks: 'nothing from the storm',
          },
          {
            id: 'half',
            text: 'Pick half today, the rest on Thursday',
            detail: 'Half a light wine now, half a rich one if the storm keeps to Friday.',
            moves: ['split'], costs: 'half of each wine', risks: 'the second half, if the storm comes early',
          },
          {
            id: 'glass',
            text: 'Wait, and pick the day the barometer falls',
            detail: 'It has fallen before most storms here. Not every one.',
            moves: ['tripwire'], costs: 'days of watching the barometer', risks: 'a storm that comes without warning',
          },
        ],
      },
    ],
    ending: {
      closing: {
        step: 'pick',
        cases: {
          now: 'Your crew picks on Monday in sunshine. Every grape is in, whatever the week brings: a good, light wine.',
          half: 'Half the grapes come in on Monday, light and clean. The rest hang until Thursday: if the storm keeps to Friday, a rich wine to blend with the light one. If it comes early, rain splits the second half.',
          glass: 'You tap the barometer every morning. If it falls first, your crew picks at once: the longer it held, the sweeter the wine. If the storm comes without warning, it splits half the crop.',
        },
      },
      others: 'Some pick at once: with no news coming, waiting is a bet. Some split the crop between two days. Some decide now what will make them pick, and watch for it.',
    },
    real: {
      facts: [
        {
          fact: 'Heavy rain close to harvest can split a large share of ripe grapes.',
          sources: [{ name: 'University of Wisconsin Fruit Program, “Berry splitting in grapes, should you harvest?” (2020)', url: 'https://fruit.wisc.edu/2020/09/17/harvesting-decisions-after-heavy-rains-and-berry-splitting/' }],
        },
      ],
      invented: 'The vineyard, the forecasts, the broken station, the barometer’s record and “half the grapes” are invented.',
    },
  },
  {
    id: 'boat-spring',
    v: 1,
    of: 'boat',
    whatIf: 'What if she would sell just as well next spring?',
    title: 'Your uncle’s boat, with no deadline',
    place: 'A harbour',
    hook: 'The same boat, and a buyer whenever you want one.',
    setup:
      'Your uncle has left you his wooden sailing boat. You’ve never sailed. A broker says boats like her sell every spring, for about what she’d fetch today. Keeping her means a mooring fee every month and weekends of sanding and varnish. Sailing lessons start at the harbour next week: by autumn, you’d know whether you like it.',
    uncertain: 'Whether you’ll like sailing.',
    turnsOn: 'selling the boat',
    shape: { undo: 'no', know: ['after'], wait: 'nothing', bad: 'over' },
    steps: [
      {
        kind: 'choose',
        id: 'keep',
        prompt: 'What do you do?',
        options: [
          {
            id: 'sell',
            text: 'Sell her now',
            detail: 'A fair price now. You’d learn in the club’s dinghies.',
            moves: ['commit'], costs: 'your uncle’s boat', risks: 'loving sailing, in someone else’s boat',
          },
          {
            id: 'summer',
            text: 'Keep her for the summer, then decide',
            detail: 'Mooring and upkeep until autumn. She’ll sell as well in spring.',
            moves: ['small'], costs: 'a summer of fees and sanding', risks: 'a summer that doesn’t settle it',
          },
          {
            id: 'always',
            text: 'Keep her, whatever happens',
            detail: 'She stays in the family, and so do the fees.',
            moves: ['rule-out'], costs: 'fees for as long as you keep her', risks: 'a boat that never leaves her mooring',
          },
        ],
        ask: {
          label: 'Ask at the sailing club first',
          did: 'Asked at the sailing club',
          answer: 'The club would take her for the season and teach beginners on her. No fees for you. She’d be theirs until October, so no sale before then, and beginners are hard on boats.',
          moves: ['another'],
          adds: {
            id: 'club',
            text: 'Lend her to the club for the season',
            detail: 'No fees, no sale until October, and beginners at the helm.',
            moves: ['hand-over'], costs: 'a season of wear on her', risks: 'a buyer put off by the scrapes',
          },
        },
      },
    ],
    ending: {
      closing: {
        step: 'keep',
        cases: {
          sell: 'The broker finds a buyer in a fortnight, who promises a photo from the water. Your lessons start in a club dinghy. If you love it, there will be other boats, though not this one.',
          summer: 'You pay the mooring and spend Saturdays sanding. By autumn you’ll know about sailing. If it isn’t for you, she goes to the broker in spring.',
          always: 'You paint her name fresh on the stern. Whether you’ll sail her, the summer will tell. She’s yours either way.',
          club: 'The club takes her for the season, and beginners learn on her, you among them. By October you’ll know about sailing, and she’ll have the scrapes to show for it.',
        },
      },
      others: 'Some sell now: the price is fair, and there are other boats to learn in. Some keep her for a summer, since the buyers will still be there. Some keep her whatever happens.',
    },
  },
  {
    id: 'take-side',
    v: 1,
    of: 'take',
    whatIf: 'What if a second camera had filmed the scene from the side?',
    title: 'The last of the light, with a second camera',
    place: 'A film set',
    hook: 'The same take, and a second angle on it.',
    setup:
      'You’re directing a film, shot on 16mm. On the last evening at the lighthouse, take four of the farewell felt right: she held the pause before her last line. A second camera filmed it from the side, so a fault in one angle could be covered by the other. There’s light for one more set-up. Film can’t be seen until a lab develops it: Thursday, after the crew has left.',
    uncertain: 'Whether take four is as good on film as it felt on set.',
    turnsOn: 'spending the last light on the wide shot',
    shape: { undo: 'no', know: ['check', 'after'], wait: 'closes', bad: 'over' },
    steps: [
      {
        kind: 'choose',
        id: 'light',
        prompt: 'What do you use the last light for?',
        options: [
          {
            id: 'again',
            text: 'Another take of the scene',
            detail: 'A second chance at the front angle. The film ends without its wide shot.',
            moves: ['spare'], costs: 'the closing wide shot', risks: 'a second take with faults of its own',
          },
          {
            id: 'wide',
            text: 'The wide shot of the lighthouse',
            detail: 'The ending you planned. If take four has a fault, the side angle covers it.',
            moves: ['commit'], costs: 'nothing you planned', risks: 'a scene seen only from the side',
          },
        ],
        ask: {
          label: 'Ask the camera operator about take four',
          did: 'Asked the camera operator',
          answer: 'She watched it through the lens. “The frame was right, and it looked sharp to me. On film, you only know on Thursday.”',
          moves: ['look'],
        },
      },
    ],
    ending: {
      closing: {
        step: 'light',
        cases: {
          again: 'You shoot take five as the light goes, and she rushes the pause a little. The reels leave on the morning boat. On Thursday the lab will show which take holds her last line, and from which side. The film will end on her face, not the lighthouse.',
          wide: 'The wide shot catches the last light on the lighthouse, and the crew packs up in the dark. The reels leave on the morning boat. On Thursday the lab will show whether take four holds, from the front or only from the side.',
        },
      },
      others: 'Some shoot the scene again: the front angle is the one they want. Some take the wide shot: the side angle is cover enough, and the ending matters too.',
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
      invented: 'The film, the island, the takes, the second camera and the lab’s Thursday are invented. Digital footage can be checked at once; this story is shot on film.',
    },
  },
];

export const situation = (id: string) => SITUATIONS.find((s) => s.id === id);

/** The collection: every story that isn't a variant of another. */
export const STORIES = SITUATIONS.filter((s) => !s.of);

/** The variant of a story, if it has one. */
export const variantOf = (id: string) => SITUATIONS.find((s) => s.of === id);
