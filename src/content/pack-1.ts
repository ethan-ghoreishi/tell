import type { Round } from '../domain/types';

// Pack 1: the first collection. Each round's claims were checked against the
// sources listed with them on the date in `checked`. Text uses typographic
// quotes only (a test enforces it). See CONTENT.md before changing anything:
// never reuse an id for different content, and bump `v` when meaning changes.

const W = (page: string) => ({ name: `Wikipedia: ${page.replace(/_/g, ' ').replace(/%27/g, '’')}`, url: `https://en.wikipedia.org/wiki/${page}` });

export const PACK_1: Round[] = [
  {
    id: 'night-sky',
    v: 1,
    title: 'Why is the night dark?',
    topic: 'Science',
    form: 'Puzzle',
    hook: 'A question a child could ask, which took astronomers centuries.',
    steps: [
      {
        kind: 'choose',
        id: 'why',
        setup:
          'Suppose space goes on for ever, has always existed, and is scattered evenly with stars. Look in any direction and your line of sight should end, sooner or later, on the surface of a star. The whole sky should blaze like the Sun.\n\nIt doesn’t. The puzzle is called Olbers’ paradox, after the astronomer who described it in 1823, though Kepler had worried about it in 1610.',
        prompt: 'So why is the night sky dark?',
        options: [
          { id: 'far', text: 'Faraway stars are too faint to see', reply: 'Each distant star is fainter, but the farther you look, the more stars there are. In an endless, evenly filled universe the two cancel exactly: every shell of stars sends us the same amount of light, however far away it is.' },
          { id: 'dust', text: 'Dust between the stars blocks the light', reply: 'Dust soaking up that much starlight would heat up until it glowed as brightly as the stars themselves.' },
          { id: 'age', text: 'The universe hasn’t existed for ever' },
          { id: 'thin', text: 'The stars are spread too thinly', reply: 'Spreading them out only pushes the wall of stars farther away. In an endless universe, every line of sight still ends on one.' },
        ],
        answer: 'age',
        reveal:
          'Light travels at a finite speed, and the universe had a beginning, about 13.8 billion years ago. We can only see stars whose light has had time to reach us, so most lines of sight run out before they meet one. The expansion of space stretches the oldest light and dims it further.\n\nSo the dark between the stars is evidence: one of the plainest sights there is, and it says the universe has a history.',
      },
      {
        kind: 'choose',
        id: 'who',
        setup: 'An early version of this answer came from someone who wasn’t a scientist at all.',
        prompt: 'Who was it?',
        options: [
          { id: 'poe', text: 'Edgar Allan Poe, the writer of macabre tales' },
          { id: 'darwin', text: 'Charles Darwin, the naturalist' },
          { id: 'lovelace', text: 'Ada Lovelace, the mathematician' },
          { id: 'verne', text: 'Jules Verne, the novelist' },
        ],
        answer: 'poe',
        reveal:
          'In *Eureka*, a long prose poem about the universe published in 1848, Poe suggested the dark gaps could be explained “by supposing the distance of the invisible background so immense that no ray from it has yet been able to reach us at all.”\n\nHe offered it as a possibility, not a proof. The physicist Lord Kelvin worked the idea out with numbers in 1901, and the cosmologist Edward Harrison credits Kelvin with the first satisfactory solution.',
      },
    ],
    takeaway: { kind: 'question', text: 'If my picture were right, what would I see? And what does it mean that I don’t?' },
    links: [
      { to: 'stones', how: 'supports', note: 'Poe and Galileo both settled a question about nature by asking what must follow if an idea were true, with no new observation needed.' },
    ],
    claims: [
      { text: 'In an endless, unchanging universe evenly filled with stars, every line of sight would end on a star. Olbers described the paradox in 1823; Kepler raised it in 1610. Distance alone doesn’t resolve it, and absorbing dust would heat up and glow.', status: 'established', sources: [W('Olbers%27_paradox')] },
      { text: 'The universe is about 13.8 billion years old.', status: 'established', sources: [{ name: 'NASA: WMAP mission overview', url: 'https://science.nasa.gov/mission/wmap/wmap-overview/' }] },
      { text: 'Poe’s *Eureka* (1848) suggested the background was so distant that its light had not yet reached us.', status: 'established', sources: [{ name: 'Wikisource: Eureka: A Prose Poem', url: 'https://en.wikisource.org/wiki/Eureka:_A_Prose_Poem' }] },
      { text: 'Edward Harrison credits Lord Kelvin (1901) with the first satisfactory resolution; Poe anticipated it qualitatively.', status: 'interpretation', sources: [W('Olbers%27_paradox')] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'windows',
    v: 1,
    title: 'The bricked-up windows',
    topic: 'History',
    form: 'True story',
    hook: 'Blank windows on old buildings, and the stories told about them.',
    steps: [
      {
        kind: 'choose',
        id: 'why',
        setup: 'Walk down older streets in Britain and now and then you’ll see a window filled in with brick, flush with the wall around it.',
        prompt: 'In the 1700s, what was one common reason to brick up a window?',
        options: [
          { id: 'fire', text: 'Fire regulations' },
          { id: 'tax', text: 'A tax that counted windows' },
          { id: 'plague', text: 'To keep out the plague' },
          { id: 'privacy', text: 'Privacy from new neighbours' },
        ],
        answer: 'tax',
        reveal:
          'From 1696 until 1851, houses in England and Wales paid a window tax: a flat charge, and at first a further charge on houses with more than ten windows. Some owners blocked windows to pay less, sometimes only while the assessor was due.\n\nBut not every blank window is a dodge. Builders had long used blind windows to keep a front symmetrical, so a filled-in window is a clue, not proof.',
      },
      {
        kind: 'choose',
        id: 'phrase',
        setup: 'The tax is often said to have given English a phrase: “daylight robbery”, for the daylight it stole from people’s homes.',
        prompt: 'Does that hold up?',
        options: [
          { id: 'yes', text: 'Yes, it dates from the window tax' },
          { id: 'no', text: 'Probably not' },
          { id: 'unknown', text: 'There’s no way to tell' },
        ],
        answer: 'no',
        reveal:
          'The phrase is in print from the early 1800s, first for robberies done by day, soon for any brazen swindle. None of the early uses mentions windows, and no scholar has found a link to the tax. Most likely it means just what it says: a robbery so bold it happens in broad daylight.',
      },
      {
        kind: 'choose',
        id: 'fence',
        setup: 'In 1929, G. K. Chesterton imagined a reformer who finds a fence or gate across a road, can’t see the use of it, and proposes to clear it away.',
        prompt: 'What did Chesterton say the reformer should be told?',
        options: [
          { id: 'clear', text: 'Clear it away: if it mattered, someone will complain', reply: 'That’s the reformer’s own view, the one Chesterton was answering.' },
          { id: 'keep', text: 'Leave it: old things are best left alone', reply: 'Chesterton wasn’t against removing it, only against removing it before knowing why it was there.' },
          { id: 'think', text: 'Go and find out why it’s there, first' },
        ],
        answer: 'think',
        reveal:
          '“Go away and think,” he wrote. “Then, when you can come back and tell me that you do see the use of it, I may allow you to destroy it.” People now call this Chesterton’s fence.\n\nA bricked-up window is a small one: a thing that looks pointless until you know its history. And “daylight robbery” shows the other half of the lesson: the history you’re told can be wrong too.',
      },
    ],
    takeaway: { kind: 'question', text: 'Why was this put here? And how do I know the story about why is true?' },
    links: [],
    claims: [
      { text: 'A window tax applied in England and Wales from 1696 and was repealed in 1851; it began as a flat charge plus a charge on houses with more than ten windows. Some householders bricked up windows to pay less.', status: 'established', sources: [W('Window_tax'), { name: 'World Wide Words: Daylight robbery', url: 'https://www.worldwidewords.org/qa/qa-day1.htm' }] },
      { text: 'Some blind or blocked windows were architectural, for symmetry, and have nothing to do with the tax.', status: 'established', sources: [W('Window_tax')] },
      { text: '“Daylight robbery” is in print from the early 1800s (literally in 1804; for swindles by 1828); no early use mentions windows, and there is no scholarly support for a link to the window tax.', status: 'established', sources: [{ name: 'The Phrase Finder: Daylight robbery', url: 'https://www.phrases.org.uk/meanings/daylight-robbery.html' }, { name: 'Word Histories: Daylight robbery', url: 'https://wordhistories.net/2022/10/11/daylight-robbery/' }, W('Window_tax')] },
      { text: 'Chesterton’s fence comes from *The Thing* (1929), in the essay “The Drift from Domesticity”.', status: 'established', sources: [{ name: 'Wikipedia: G. K. Chesterton', url: 'https://en.wikipedia.org/wiki/G._K._Chesterton' }] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'earth',
    v: 1,
    title: 'Measuring the Earth with a shadow',
    topic: 'Science',
    form: 'True story',
    hook: 'Two cities, one shadow, and the size of the whole planet.',
    steps: [
      {
        kind: 'choose',
        id: 'shadow',
        setup:
          'Around 240 BCE, Eratosthenes, head of the great library at Alexandria, learned that at noon on midsummer’s day in Syene, far to the south (today’s Aswan), upright objects cast no shadow: the Sun was directly overhead. At the same moment in Alexandria, an upright pole still cast a short shadow.',
        prompt: 'If the Sun is so far away that its rays arrive parallel, what does that shadow tell him?',
        options: [
          { id: 'near', text: 'The Sun must be close after all' },
          { id: 'curve', text: 'The ground between the two cities curves' },
          { id: 'higher', text: 'Alexandria stands higher above the sea' },
        ],
        answer: 'curve',
        reveal:
          'Parallel rays falling on flat ground would cast the same shadow everywhere. A shadow here and none there means the ground itself tilts between the two places, and the shadow’s angle equals the angle between them, measured at the centre of the Earth.',
      },
      {
        kind: 'estimate',
        id: 'size',
        setup: 'The shadow’s angle was about one fiftieth of a full circle (about 7.2°), and Syene was reckoned to be 5,000 stadia from Alexandria.',
        prompt: 'How far is it around the whole Earth?',
        min: 0,
        max: 500_000,
        step: 10_000,
        unit: 'stadia',
        answer: 250_000,
        reveal:
          '50 × 5,000 = 250,000 stadia. Nobody knows exactly how long his stadion was, so in modern terms that’s somewhere between about 39,000 and 47,000 kilometres, against a true figure of about 40,000. A shadow and a careful guess at a distance came within a fifth of the planet’s true size, and perhaps much closer.\n\nWe know the method mainly from Cleomedes, who described it centuries later.',
      },
    ],
    takeaway: { kind: 'model', text: 'A small, careful measurement and a clear model can reach something far too big to measure directly.' },
    links: [
      { to: 'night-sky', how: 'supports', note: 'A shadow at noon and the darkness at night: everyday sights that, reasoned about carefully, measure something enormous.' },
    ],
    claims: [
      { text: 'Eratosthenes found an angle of about 1/50 of a circle (7.2°) between Syene and Alexandria, about 5,000 stadia apart, giving about 250,000 stadia; the method is preserved by Cleomedes.', status: 'established', sources: [{ name: 'APS News: Eratosthenes measures the Earth', url: 'https://www.aps.org/apsnews/2006/06/eratosthenes-measures-earth' }, W('Eratosthenes')] },
      { text: 'Scholars disagree about the length of his stadion, so how accurate he was is uncertain (roughly 24,000 to 29,000 miles for common estimates).', status: 'disputed', sources: [{ name: 'APS News: Eratosthenes measures the Earth', url: 'https://www.aps.org/apsnews/2006/06/eratosthenes-measures-earth' }] },
      { text: 'The Earth’s equatorial radius is about 6,378 km, a circumference of about 40,000 km.', status: 'established', sources: [{ name: 'NASA: Earth fact sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html' }] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'ship',
    v: 1,
    title: 'The ship that was rebuilt',
    topic: 'Philosophy',
    form: 'Thought experiment',
    hook: 'Replace every plank of a famous ship. Then build another from the old ones.',
    steps: [
      {
        kind: 'choose',
        id: 'same',
        setup:
          'Plutarch, writing about 1,900 years ago, tells of the thirty-oared ship Theseus sailed home from Crete. The Athenians kept it for centuries, taking away rotten timbers and putting sound new ones in their place, until it became the philosophers’ standard example in arguments about things that grow and change.',
        prompt: 'Once every plank has been replaced, is it still Theseus’s ship?',
        options: [
          { id: 'yes', text: 'Yes: it was repaired, never replaced all at once' },
          { id: 'no', text: 'No: nothing Theseus sailed is left' },
          { id: 'partly', text: 'In some ways yes, in some ways no' },
        ],
        reveal: 'Each answer has had serious defenders. And each has a puzzle of its own: if the ship stops being Theseus’s, when does it happen? At the first new plank, the last, or somewhere in between?',
      },
      {
        kind: 'choose',
        id: 'two',
        setup:
          'In 1655 the philosopher Thomas Hobbes added a twist. Suppose someone kept every old plank as it was taken out, and later put them back together in the original arrangement. Now there are two ships.',
        prompt: 'Which one is Theseus’s ship?',
        options: [
          { id: 'harbour', text: 'The repaired ship in the harbour' },
          { id: 'planks', text: 'The one rebuilt from the original planks' },
          { id: 'both', text: 'Both, in different senses' },
          { id: 'neither', text: 'Neither, any more' },
        ],
        reveal: 'Now the first answer pulls two ways at once. Both ships have a strong claim, and they can’t both be the one ship Theseus sailed. Something has to give.',
        views: [
          { who: 'Same continuing thing', view: 'The ship in the harbour. It was there all along, repaired and sailed, never gone.' },
          { who: 'Same material', view: 'The rebuilt one. It is, plank for plank, what Theseus sailed, back in its old shape.' },
          { who: 'Two meanings', view: '“The same” is being asked two questions at once, same stuff and same continuing thing, and here the answers come apart.' },
        ],
      },
      {
        kind: 'choose',
        id: 'ise',
        setup:
          'In Japan, the Grand Shrines of Ise are rebuilt every twenty years, in fresh timber, to the same design, on a site beside the old one. The first rebuilding is recorded in 690; apart from a break of more than a century during the civil wars of the 1400s and 1500s, it has gone on ever since. The one in 2013 was the 62nd.',
        prompt: 'So how old is the shrine at Ise?',
        options: [
          { id: 'old', text: 'More than 1,300 years old' },
          { id: 'young', text: 'No more than twenty years old' },
          { id: 'both', text: 'Both, depending on what you count' },
        ],
        reveal: 'Its wood is rarely much more than twenty years old; its design and its ritual go back more than thirteen centuries. Ise keeps its age in the practice rather than the material: Theseus’s ship, with the replacing planned from the start.',
      },
    ],
    takeaway: { kind: 'question', text: 'When someone asks “is it the same?”, ask: the same what? The material, the design, or the history?' },
    links: [
      { to: 'vermeer', how: 'qualifies', note: 'At Ise, age can live in a design and a practice rather than the material. Paintings are judged more strictly: a canvas that passed for a Vermeer lost its standing the moment its real history came out, though nothing on it had changed.' },
    ],
    claims: [
      { text: 'Plutarch’s *Life of Theseus* (23.1): the Athenians preserved Theseus’s thirty-oared galley, replacing old timbers, so it became a standing illustration for the philosophers in the question of growth.', status: 'established', sources: [{ name: 'Plutarch, Life of Theseus (Loeb translation, LacusCurtius)', url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Plutarch/Lives/Theseus*.html' }] },
      { text: 'Hobbes added the version in which the old planks are reassembled into a second ship, in *De Corpore* (1655).', status: 'established', sources: [W('Ship_of_Theseus'), { name: 'Stanford Encyclopedia of Philosophy: Material Constitution', url: 'https://plato.stanford.edu/entries/material-constitution/' }, { name: 'Stanford Encyclopedia of Philosophy: Relative Identity', url: 'https://plato.stanford.edu/entries/identity-relative/' }] },
      { text: 'The Grand Shrines of Ise are renewed every twenty years; the first renewal was performed for the Inner Shrine in 690, the practice lapsed for 124 years after 1462 and resumed in 1585, and the 62nd renewal was in 2013.', status: 'established', sources: [{ name: 'Kokugakuin University, Encyclopedia of Shinto: Shikinen sengū', url: 'https://d-museum.kokugakuin.ac.jp/eos/detail/?id=9063' }, { name: 'Ise-Shima tourism: Shikinen Sengu', url: 'https://www.iseshima-kanko.jp/en/highlights/sengu_eg' }] },
      { text: 'The three ways of answering Hobbes’s question are standard positions in the philosophy of identity, set out here in Tell’s own words.', status: 'interpretation', sources: [{ name: 'Stanford Encyclopedia of Philosophy: Material Constitution', url: 'https://plato.stanford.edu/entries/material-constitution/' }] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'test',
    v: 1,
    title: 'The positive test',
    topic: 'Reasoning',
    form: 'Puzzle',
    hook: 'A test, a positive result, and what it actually means.',
    steps: [
      {
        kind: 'estimate',
        id: 'random',
        setup:
          'A disease affects 1 person in 1,000. A test for it catches every case, but it also comes back positive for 5% of people who don’t have the disease.\n\nSomeone picked at random takes the test, and it’s positive.',
        prompt: 'What’s the chance they have the disease?',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        answer: 2,
        reveal:
          'About 2%. Picture 1,000 people: 1 has the disease and tests positive. Of the other 999, about 50 test positive anyway. So only about 1 positive in 51 is real.\n\nIn 1978 a version of this question was put to 60 students and doctors at Harvard Medical School. 27 of them answered 95%. Only 11 gave the right answer, about 2%.',
      },
      {
        kind: 'estimate',
        id: 'symptoms',
        setup: 'Same test. But this person wasn’t picked at random: they came to a doctor with symptoms, and among people with these symptoms, 1 in 10 has the disease.',
        prompt: 'They test positive. What’s the chance now?',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        answer: 69,
        reveal:
          'About 69%. Of 1,000 people with the symptoms, 100 have the disease and all test positive; of the 900 without it, about 45 test positive anyway. So 100 of the 145 positives are real.\n\nThe test didn’t change. What its result means depends on how common the disease is among the people taking it.',
      },
    ],
    takeaway: { kind: 'question', text: 'Before asking how accurate the test is, ask how common the thing it looks for is.' },
    links: [],
    claims: [
      { text: 'Casscells, Schoenberger and Graboys (1978) asked 60 Harvard Medical School students, residents and attending physicians this question (prevalence 1/1000, false positive rate 5%): 27 answered 95%; 11 gave the correct answer, about 2%.', status: 'established', sources: [{ name: 'NEJM CardioExchange: Numbers traps in clinical practice', url: 'https://blogs.nejm.org/cardioexchange/2011/08/25/numbers-traps-in-clinical-practice/' }, { name: 'Casscells et al., NEJM 1978;299:999', url: 'https://www.nejm.org/doi/full/10.1056/NEJM197811022991808' }] },
    ],
    note: 'The second question’s numbers (1 in 10 among people with symptoms) are invented to keep the arithmetic clear. The test is idealised: it never misses a case.',
    checked: '2026-11-19',
  },
  {
    id: 'rats',
    v: 1,
    title: 'The rat bounty',
    topic: 'History',
    form: 'True story',
    hook: 'Hanoi, 1902: a simple plan to get rid of rats.',
    steps: [
      {
        kind: 'choose',
        id: 'next',
        setup:
          'Hanoi, 1902. The French colonial government had laid modern sewers under the French quarter, and rats had moved in. With plague spreading in Asia, the authorities paid rat catchers, then opened the hunt to everyone: a bounty of one cent per rat. To spare officials a pile of bodies, the proof was just the tail.',
        prompt: 'What did officials start to notice?',
        options: [
          { id: 'fewer', text: 'Fewer rats every week' },
          { id: 'gone', text: 'The catchers ran out of rats to catch' },
          { id: 'tailless', text: 'Rats running around without tails' },
          { id: 'ignored', text: 'Almost nobody claimed the bounty' },
        ],
        answer: 'tailless',
        reveal: 'Rats without tails. Catchers were apparently cutting off the tails and letting the rats go, back into the sewers to breed more, and rats were found being bred on the city’s outskirts. The bounty was cancelled.',
      },
      {
        kind: 'choose',
        id: 'cobra',
        setup:
          'The Hanoi bounty is often told beside a more famous story: in British India, a bounty on dead cobras in Delhi led people to breed cobras, and when the bounty ended they let them loose. Economists call this the “cobra effect”.',
        prompt: 'How well documented is the cobra story?',
        options: [
          { id: 'records', text: 'It’s in the colonial records' },
          { id: 'none', text: 'No record of the breeding has been found' },
          { id: 'novel', text: 'A novelist made it up in the 1960s' },
        ],
        answer: 'none',
        reveal: 'The name was coined by the economist Horst Siebert in a 2001 book, from an anecdote. No record of any cobra breeding has been found, and a 2025 investigation cast further doubt on the story. The historian Michael Vann, who brought the Hanoi bounty to light, has suggested the effect be named after Hanoi’s rats instead: that story can be proven.',
      },
    ],
    takeaway: {
      kind: 'saying',
      text: 'When a measure becomes a target, it ceases to be a good measure.',
      by: 'Marilyn Strathern (1997), restating an idea of the economist Charles Goodhart',
      source: W('Goodhart%27s_law'),
    },
    links: [
      { to: 'windows', how: 'supports', note: 'A tax that counted windows got bricked-up windows; a bounty that counted tails got tails. People answer what a rule counts, not what its makers hoped for.' },
    ],
    claims: [
      { text: 'In 1902 Hanoi paid a bounty of one cent per rat, with the tail as proof; tailless rats were then seen, as catchers allegedly released rats to breed; rat breeding was found on the city’s outskirts; the bounty was cancelled. Michael Vann argues the cobra example cannot be proven and proposes calling it the Rat Effect.', status: 'established', sources: [W('Great_Hanoi_Rat_Massacre'), { name: 'Freakonomics: The Cobra Effect (with Michael Vann)', url: 'https://freakonomics.com/podcast/the-cobra-effect-2/' }] },
      { text: 'The “cobra effect” was coined by Horst Siebert (2001) from an anecdote about the British Raj; no documentation has been found to support the breeding, and a 2025 investigation cast doubt on the story.', status: 'tradition', sources: [W('Perverse_incentive')] },
      { text: 'Goodhart’s 1975 wording differs; the phrasing “When a measure becomes a target, it ceases to be a good measure” is Strathern’s (1997), reworking Keith Hoskin’s 1996 version.', status: 'established', sources: [W('Goodhart%27s_law')] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'timeline',
    v: 1,
    title: 'Closer than it looks',
    topic: 'History',
    form: 'Timeline',
    hook: 'Five moments from the past. Put them in order.',
    steps: [
      {
        kind: 'order',
        id: 'order',
        setup: 'In the mind, history folds into eras: ancient, medieval, modern. Some of those folds hide surprising overlaps.',
        prompt: 'Put these in order, earliest first.',
        first: 'Earliest',
        last: 'Latest',
        items: [
          { id: 'pyramid', text: 'The Great Pyramid of Giza is built', detail: 'About 2600 BCE' },
          { id: 'mammoth', text: 'The last woolly mammoths die out', detail: 'About 4,000 years ago, on Wrangel Island in the Arctic' },
          { id: 'cleopatra', text: 'Cleopatra dies', detail: '30 BCE' },
          { id: 'oxford', text: 'Teaching is recorded at Oxford', detail: 'By 1096' },
          { id: 'aztec', text: 'The Aztecs found Tenochtitlan', detail: 'Traditionally 1325' },
        ],
        reveal: 'Mammoths were still alive, on an island off Siberia, centuries after the Great Pyramid was finished. And there was teaching at Oxford more than two centuries before Tenochtitlan was founded on its lake, where Mexico City stands now.',
      },
      {
        kind: 'choose',
        id: 'cleopatra',
        prompt: 'Was Cleopatra closer in time to the building of the Great Pyramid, or to the first Moon landing?',
        options: [
          { id: 'pyramid', text: 'The Great Pyramid' },
          { id: 'moon', text: 'The Moon landing' },
          { id: 'even', text: 'About halfway between' },
        ],
        answer: 'moon',
        reveal: 'The Moon landing, by about five centuries. About 2,500 years separate the pyramid from Cleopatra’s death; about 2,000 separate her death from Apollo 11 in 1969. The Great Pyramid was older to Cleopatra than she is to us.',
      },
    ],
    takeaway: { kind: 'model', text: '“Long ago” squashes thousands of years together. Put the dates on a line before comparing them.' },
    links: [
      { to: 'ship', how: 'reinterprets', note: '“How old is it?” sounds like a plain matter of dates, until a shrine rebuilt every twenty years turns out to be more than thirteen centuries old.' },
    ],
    claims: [
      { text: 'The Great Pyramid of Giza was built around 2600 BCE.', status: 'established', sources: [W('Great_Pyramid_of_Giza')] },
      { text: 'The last woolly mammoths died on Wrangel Island about 4,000 years ago.', status: 'established', sources: [{ name: 'Science News: The last woolly mammoths', url: 'https://www.sciencenews.org/article/last-woolly-mammoths-species-extinct' }] },
      { text: 'Cleopatra died in August 30 BCE.', status: 'established', sources: [W('Cleopatra')] },
      { text: 'There is evidence of teaching at Oxford as early as 1096; its foundation date is unknown.', status: 'established', sources: [W('University_of_Oxford')] },
      { text: 'Tenochtitlan’s exact founding date is unclear; 1325 is the traditional date.', status: 'tradition', sources: [W('Tenochtitlan')] },
      { text: 'Apollo 11 landed on the Moon in July 1969.', status: 'established', sources: [W('Apollo_11')] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'proverbs',
    v: 1,
    title: 'Look before you leap?',
    topic: 'Wisdom',
    form: 'Dilemma',
    hook: 'Two proverbs, both wise, giving opposite advice.',
    steps: [
      {
        kind: 'choose',
        id: 'origin',
        setup: '“Look before you leap.” “He who hesitates is lost.” Both sound wise. They point in opposite directions.',
        prompt: '“He who hesitates is lost” grew from a line in Joseph Addison’s play *Cato* (1713). In the original, who was lost?',
        options: [
          { id: 'soldier', text: 'The soldier who deliberates' },
          { id: 'woman', text: 'The woman who deliberates' },
          { id: 'king', text: 'The king who deliberates' },
        ],
        answer: 'woman',
        reveal:
          '“The woman that deliberates is lost”: in the play, a line about giving in to love. And when John Heywood printed “look ere ye leap” in his collection of proverbs in 1546, it was a warning against rushing into marriage, though older versions say nothing of weddings. Both sayings have served as advice about the same kind of leap.',
      },
      {
        kind: 'quickfire',
        id: 'cases',
        setup: 'Proverbs aren’t right or wrong so much as tools for different situations.',
        prompt: 'Which one fits each case better?',
        labels: ['Look first', 'Don’t hesitate'],
        items: [
          { id: 'tattoo', text: 'Getting a partner’s name tattooed', answer: 0, note: 'Hard to undo, and nothing is lost by waiting a month.' },
          { id: 'tickets', text: 'Concert tickets that sell out in minutes, and can be resold if plans change', answer: 1, note: 'The chance is going fast, and the step is easy to reverse.' },
          { id: 'lease', text: 'Signing a five-year lease after a single viewing', answer: 0, note: 'Hard to undo, and a second viewing could change the decision.' },
          { id: 'choking', text: 'Someone at the next table is choking', answer: 1, note: 'Waiting teaches nothing, and the harm grows by the second.' },
        ],
        reveal:
          'Two questions sort most cases. Can the step be undone? And will waiting tell you anything before the chance goes? Look first when a step is hard to reverse and looking could change your mind. Don’t hesitate when the chance is closing and waiting teaches nothing.\n\nDecision theorists and economists have studied both halves: the value of information, and the extra worth of waiting when a step can’t be reversed.',
      },
    ],
    takeaway: { kind: 'model', text: 'When two sayings disagree, ask: can this be undone, and will waiting tell me anything before the chance goes?' },
    links: [
      { to: 'windows', how: 'qualifies', note: 'Find out why the fence is there before removing it: worth most when taking it down can’t be undone. A fence that’s easy to put back can be a cheap experiment.' },
      { to: 'quotes', how: 'supports', note: '“He who hesitates is lost” is one more saying that drifted from its source: Addison wrote it about a woman and love.' },
    ],
    claims: [
      { text: '*Cato* (1713), Act IV, scene 1: “The woman that deliberates is lost”; the line has often been misreported as “He who hesitates is lost”.', status: 'established', sources: [{ name: 'Wikiquote: Joseph Addison', url: 'https://en.wikiquote.org/wiki/Joseph_Addison' }] },
      { text: 'John Heywood’s proverb collection of 1546 has “look ere ye leap”, about rushing into marriage; a version without the marriage (“First loke and aftirward lepe”) dates from the 1300s.', status: 'established', sources: [{ name: 'The Phrase Finder: Look before you leap', url: 'https://www.phrases.org.uk/meanings/look-before-you-leap.html' }, { name: 'Medievalists.net: English proverbs from the Middle Ages', url: 'https://www.medievalists.net/2020/02/english-proverbs-middle-ages/' }] },
      { text: 'The two questions draw on decision theory: the value of information, and the value of keeping options open when a step is irreversible. Which proverb fits each case is Tell’s judgement.', status: 'interpretation', sources: [W('Value_of_information'), W('Real_options_valuation')] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'silence',
    v: 1,
    title: 'Four minutes, thirty-three seconds',
    topic: 'Art',
    form: 'True story',
    hook: 'A pianist walks on stage, sits down, and plays nothing.',
    steps: [
      {
        kind: 'choose',
        id: 'heard',
        setup:
          'Woodstock, New York, 29 August 1952. In the Maverick Concert Hall, a wooden hall in the woods, the pianist David Tudor sits at the piano and closes the keyboard lid. He opens and closes the lid to mark three movements, and plays nothing. After four minutes and thirty-three seconds, he stands up. The piece is John Cage’s *4′33″*.',
        prompt: 'What did the audience hear?',
        options: [
          { id: 'nothing', text: 'Nothing at all' },
          { id: 'room', text: 'Wind, then rain on the roof, then the audience itself' },
          { id: 'tape', text: 'A recording played offstage' },
          { id: 'strings', text: 'The piano’s strings humming on their own' },
        ],
        answer: 'room',
        reveal: 'Cage described it later: wind stirring outside during the first movement, raindrops pattering on the roof during the second, and in the third, the people themselves making all kinds of interesting sounds as they talked or walked out. “There’s no such thing as silence,” he said.',
      },
      {
        kind: 'choose',
        id: 'chamber',
        setup: 'A year or so before, Cage had visited an anechoic chamber at Harvard: a room built to swallow every sound, as near to silence as engineering could get.',
        prompt: 'What did he hear inside?',
        options: [
          { id: 'none', text: 'Nothing, for the first time in his life' },
          { id: 'two', text: 'Two sounds, one high and one low' },
          { id: 'voice', text: 'His own voice, strangely flattened' },
        ],
        answer: 'two',
        reveal: 'Two sounds, one high and one low. The engineer in charge, Cage wrote, told him the high one was his nervous system working and the low one his blood circulating. What Cage took from it: “Until I die there will be sounds.”',
      },
      {
        kind: 'choose',
        id: 'music',
        prompt: 'So is *4′33″* music?',
        options: [
          { id: 'yes', text: 'Yes: it’s a frame that turns the room into the music' },
          { id: 'no', text: 'No: music needs sounds someone means to make' },
          { id: 'question', text: 'It’s a question about music more than a piece of it' },
        ],
        reveal: 'People still argue about it. Cage called *4′33″* his most important work, many times over. Its score asks the performer not to play; everything heard is whatever the room and the people in it provide, different at every performance.',
      },
    ],
    takeaway: { kind: 'saying', text: 'There’s no such thing as silence.', by: 'John Cage, on the first performance of 4′33″', source: W('4%E2%80%B233%E2%80%B3') },
    links: [],
    claims: [
      { text: '*4′33″* was first performed by David Tudor on 29 August 1952 at the Maverick Concert Hall, Woodstock, New York, marking movements with the keyboard lid.', status: 'established', sources: [W('4%E2%80%B233%E2%80%B3')] },
      { text: 'Cage’s account of the premiere (wind, rain, the audience talking or walking out) and his “There’s no such thing as silence”, from interviews with Richard Kostelanetz.', status: 'established', sources: [W('4%E2%80%B233%E2%80%B3')] },
      { text: 'Cage’s account of the Harvard anechoic chamber (two sounds; nervous system and blood) and “Until I die there will be sounds”, from his lecture “Experimental Music”, in *Silence* (1961). The engineer’s explanation is as Cage reported it.', status: 'established', sources: [W('4%E2%80%B233%E2%80%B3')] },
      { text: 'Cage repeatedly called *4′33″* his most important work.', status: 'established', sources: [W('4%E2%80%B233%E2%80%B3')] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'doors',
    v: 1,
    title: 'Three doors',
    topic: 'Reasoning',
    form: 'Puzzle',
    hook: 'A game show, three doors, and a choice to stick or switch.',
    steps: [
      {
        kind: 'choose',
        id: 'switch',
        setup:
          'On a game show there are three closed doors: a car behind one, a goat behind each of the others. You pick door 1.\n\nThe host knows where the car is. He always opens another door with a goat behind it, picking at random when he has a choice. He opens door 3: a goat. He offers you door 2 instead.',
        prompt: 'Stick with door 1, or switch to door 2?',
        options: [
          { id: 'stick', text: 'Stick with door 1' },
          { id: 'switch', text: 'Switch to door 2' },
          { id: 'same', text: 'It makes no difference', reply: 'It feels like 50–50: two doors, one car. But the host’s choice wasn’t random.' },
        ],
        answer: 'switch',
        reveal:
          'Switching wins 2 times in 3. Door 1 had a 1-in-3 chance, and the host’s move doesn’t change that: he could always find a goat to show you. The other 2 in 3 doesn’t vanish. It all lands on door 2, because the host had to avoid the car.\n\nWhen Marilyn vos Savant gave this answer in *Parade* magazine in 1990, about 10,000 readers wrote in, nearly 1,000 of them with PhDs, most of them insisting she was wrong. She wasn’t.',
      },
      {
        kind: 'choose',
        id: 'fall',
        setup: 'Same show, different host. This one doesn’t know where the car is. You pick door 1; he opens door 3 at random, and it happens to be a goat.',
        prompt: 'Stick or switch now?',
        options: [
          { id: 'stick', text: 'Stick' },
          { id: 'switch', text: 'Switch' },
          { id: 'same', text: 'It makes no difference' },
        ],
        answer: 'same',
        reveal: 'Now it really is 50–50. A host who might have shown you the car, and happened not to, tells you less than one who never could have. The statistician Jeffrey Rosenthal calls this version “Monty Fall”: same doors, same goat, different odds.',
      },
    ],
    takeaway: { kind: 'model', text: 'What evidence means depends on how it came to be shown to you, not only on what it shows.' },
    links: [
      { to: 'test', how: 'supports', note: 'A positive test and an opened door are both evidence whose meaning depends on how it was produced: how common the disease is, what the host knew.' },
    ],
    claims: [
      { text: 'The problem was posed by Steve Selvin in 1975; vos Savant’s 1990 *Parade* answer drew about 10,000 letters, nearly 1,000 from people with PhDs, most saying she was wrong.', status: 'established', sources: [W('Monty_Hall_problem')] },
      { text: 'If the host opens a door at random and it happens to hide a goat, sticking and switching each win with probability 1/2.', status: 'established', sources: [{ name: 'Jeffrey S. Rosenthal, Monty Hall, Monty Fall, Monty Crawl (Math Horizons, 2008)', url: 'https://www.probability.ca/jeff/writing/montyfall.pdf' }] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'stones',
    v: 1,
    title: 'Two stones and a cord',
    topic: 'Science',
    form: 'Thought experiment',
    hook: 'An argument that settles a question without dropping anything.',
    steps: [
      {
        kind: 'choose',
        id: 'tie',
        setup:
          'For centuries a common view, going back to Aristotle, held that heavier things fall faster than lighter ones. In his *Two New Sciences* (1638), Galileo answered it with an argument you can run in your head.\n\nSuppose the old view is right. Now tie a small stone to a big one with a short cord, and drop them together.',
        prompt: 'If heavier things fall faster, what should the pair do?',
        options: [
          { id: 'faster', text: 'Fall faster than the big stone alone: together they’re heavier', reply: 'That follows from the old view. But so does the opposite.' },
          { id: 'slower', text: 'Fall slower: the small stone holds the big one back', reply: 'That follows from the old view too. But so does the opposite.' },
          { id: 'both', text: 'Both of those, which is a problem' },
        ],
        answer: 'both',
        reveal: 'In Galileo’s dialogue, Salviati makes this point: the same assumption says the pair falls both faster and slower than the big stone alone. An assumption that leads to a contradiction can’t be right. Weight doesn’t set how fast things fall; what holds a feather back is the air.',
      },
      {
        kind: 'choose',
        id: 'moon',
        setup: 'On 2 August 1971, at the end of the last moonwalk of Apollo 15, the astronaut David Scott held out a 1.32 kg geologist’s hammer and a falcon feather in front of a TV camera, and let go of both at once.',
        prompt: 'With no air on the Moon, what happened?',
        options: [
          { id: 'hammer', text: 'The hammer landed first' },
          { id: 'together', text: 'They landed together' },
          { id: 'feather', text: 'The feather drifted down slowly' },
        ],
        answer: 'together',
        reveal:
          'They struck the ground at the same moment. Galileo had predicted it 333 years earlier: with no air to resist them, he reasoned, all bodies would fall at the same speed.\n\nAs for the famous story of Galileo dropping balls from the Leaning Tower of Pisa: it comes from a biography by his pupil Vincenzo Viviani, written after Galileo’s death. Galileo never described doing it, and most historians think it was a thought experiment.',
      },
    ],
    takeaway: { kind: 'model', text: 'If one assumption leads to two opposite answers to the same question, the assumption is wrong.' },
    links: [
      { to: 'ship', how: 'qualifies', note: 'Hobbes’s two ships also give two answers to one question: which is the real ship? There, the trouble may not be a false assumption but a word, “same”, asked to do two jobs.' },
    ],
    claims: [
      { text: 'Galileo’s tied-stones argument against heavier bodies falling faster is in *Two New Sciences* (1638).', status: 'established', sources: [{ name: 'Galileo, Two New Sciences (extract, University of Virginia)', url: 'https://galileoandeinstein.phys.virginia.edu/tns61.htm' }] },
      { text: 'On Apollo 15 (1971) David Scott dropped a 1.32 kg hammer and a falcon feather; they struck the surface simultaneously.', status: 'established', sources: [{ name: 'NASA: The Apollo 15 hammer–feather drop', url: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_15_feather_drop.html' }] },
      { text: 'The Leaning Tower story comes from Viviani’s biography (written 1654); Galileo left no account of it, and most historians consider it a thought experiment.', status: 'tradition', sources: [W('Galileo%27s_Leaning_Tower_of_Pisa_experiment')] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'north',
    v: 1,
    title: 'An ant on your north leg',
    topic: 'Language',
    form: 'True story',
    hook: 'A word Captain Cook’s crew wrote down, and a language without left and right.',
    steps: [
      {
        kind: 'choose',
        id: 'word',
        setup:
          'In 1770, James Cook’s ship *Endeavour* was beached for repairs on a river in what is now north Queensland. The crew met the local Guugu Yimithirr people, and the naturalist Joseph Banks wrote down their name for a large animal that bounded on its hind legs: “kanguru”.',
        prompt: 'A popular story says the word really meant “I don’t understand you”. Does it?',
        options: [
          { id: 'yes', text: 'Yes, it was a misunderstanding' },
          { id: 'no', text: 'No, it’s a real Guugu Yimithirr name for a kind of kangaroo' },
          { id: 'unknown', text: 'No one can tell any more' },
        ],
        answer: 'no',
        reveal: 'The story is a myth. In 1972 the linguistic anthropologist John Haviland, working with Guugu Yimithirr speakers, confirmed that *gangurru* names a large kind of kangaroo. The anthropologist Walter Roth had tried to correct the myth as early as 1898. A different word, recorded in the same area by a later expedition around 1820, helped the doubt along.',
      },
      {
        kind: 'choose',
        id: 'leg',
        setup: 'Guugu Yimithirr is famous among linguists for something else. Its speakers don’t usually describe where things are with words like left, right, in front or behind.',
        prompt: 'So how might a speaker warn you about an ant on your leg?',
        options: [
          { id: 'north', text: '“There’s an ant on your north leg”' },
          { id: 'near', text: '“On the leg nearer me”' },
          { id: 'point', text: 'Only by pointing' },
        ],
        answer: 'north',
        reveal: 'By compass direction: north, south, east and west, even indoors. Something left in a house is “on the southern edge of the western table”; the warning is about “that big ant just north of your foot”. By one estimate, as much as one word in ten in ordinary conversation is a compass direction, and children in communities like this start using them as early as two.',
      },
      {
        kind: 'choose',
        id: 'think',
        prompt: 'Does talking this way change how its speakers think?',
        options: [
          { id: 'yes', text: 'Yes: they always know which way they’re facing' },
          { id: 'no', text: 'No: anyone could notice the same things' },
          { id: 'unsure', text: 'Somewhere in between' },
        ],
        reveal: 'Speakers keep track of direction with remarkable accuracy, indoors or out, as researchers including John Haviland and Stephen Levinson have described. How much the language causes that skill, and how much it reflects a life lived by the landscape, is still argued over.\n\nThe linguist Roman Jakobson put a careful version of the idea: languages differ less in what they let you say than in what they make you say.',
      },
    ],
    takeaway: { kind: 'saying', text: 'Languages differ essentially in what they must convey and not in what they may convey.', by: 'Roman Jakobson, “On Linguistic Aspects of Translation” (1959)', source: { name: 'Wikiquote: Roman Jakobson', url: 'https://en.wikiquote.org/wiki/Roman_Jakobson' } },
    links: [],
    claims: [
      { text: 'Banks first recorded the word as “kanguru” on 12 July 1770; it derives from Guugu Yimithirr *gangurru*. The “I don’t know” story is a myth: Roth tried to correct it in 1898, and Haviland confirmed *gangurru* in 1972. Phillip Parker King recorded a different word in 1819–20.', status: 'established', sources: [W('Kangaroo'), { name: 'Macquarie Dictionary: The origin of kangaroo', url: 'https://www.macquariedictionary.com.au/the-origin-of-kangaroo-getting-to-the-bottom-of-an-australian-furphy/' }] },
      { text: 'Guugu Yimithirr describes position with cardinal directions rather than left/right or front/behind (how strictly is disputed); speakers keep a precise sense of direction; up to one word in ten in conversation may be a direction; children in such communities use them from as early as two.', status: 'established', sources: [{ name: 'Guy Deutscher, “Does Your Language Shape How You Think?”, New York Times Magazine, 2010', url: 'https://www.nytimes.com/2010/08/29/magazine/29language-t.html' }, W('Guugu_Yimithirr_language')] },
      { text: 'How far language shapes thought (linguistic relativity) is still debated.', status: 'disputed', sources: [W('Linguistic_relativity')] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'quotes',
    v: 1,
    title: 'Who really said it?',
    topic: 'Wisdom',
    form: 'Myth check',
    hook: 'Five famous sayings. Which of them hold up?',
    steps: [
      {
        kind: 'quickfire',
        id: 'calls',
        setup: 'Wise words travel fast, and the name attached to them often travels faster than the evidence.',
        prompt: 'For each one: does it hold up?',
        labels: ['Holds up', 'Doesn’t'],
        items: [
          { id: 'cake', text: '“Let them eat cake”: Marie Antoinette, about the hungry poor of Paris.', answer: 1, note: 'Rousseau told of “a great princess” saying “let them eat brioche” in his *Confessions*, in pages written around 1765, when Marie Antoinette was a nine-year-old in Austria. It was pinned on her half a century after her death.' },
          { id: 'delphi', text: '“Know thyself” was inscribed at the temple of Apollo at Delphi.', answer: 0, note: 'The Greek traveller Pausanias, in the 2nd century CE, records “Know thyself” and “Nothing in excess” at the temple’s entrance.' },
          { id: 'crisis', text: 'The Chinese word for “crisis” is made of “danger” and “opportunity”.', answer: 1, note: 'The first part, *wēi*, does mean danger. But *jī* here means something like “crucial point”, the moment when things change, not opportunity, as the sinologist Victor Mair has explained.' },
          { id: 'gandhi', text: '“Be the change you wish to see in the world”: Gandhi.', answer: 1, note: 'There’s no record of Gandhi saying it. The closest is a 1913 article of his: “If we could change ourselves, the tendencies in the world would also change.” The snappy version appears in the 1970s.' },
          { id: 'ikigai', text: 'The four-circle “ikigai” diagram (what you love, what you’re good at, what the world needs, what you can be paid for) is a traditional Japanese model.', answer: 1, note: 'In 2014 the blogger Marc Winn put the Japanese word *ikigai*, roughly “a reason for living”, into the middle of an existing Western diagram about purpose. The word is Japanese; the diagram isn’t.' },
        ],
        reveal: 'Only one of the five holds up as told, and under each of the others is a better story: a real line by Rousseau, a real sentence by Gandhi, a real Chinese word, a real Japanese idea. A famous name or a far-off origin makes a saying more believable. It doesn’t make it more true.',
      },
    ],
    takeaway: { kind: 'question', text: 'Before passing a saying on, ask: who said it first, and where is it written down?' },
    links: [
      { to: 'north', how: 'supports', note: '“Kangaroo means I don’t know” and “crisis means danger plus opportunity”: both too-good stories about other languages, repeated far more often than checked.' },
      { to: 'windows', how: 'supports', note: '“Daylight robbery” from the window tax and “Let them eat cake” from Marie Antoinette: stories that fit so well they outran their evidence.' },
    ],
    claims: [
      { text: 'Rousseau’s *Confessions* (book 6, written 1765) attributes “Qu’ils mangent de la brioche” to an unnamed great princess; Marie Antoinette was nine; the line was first attributed to her by Alphonse Karr in 1843.', status: 'established', sources: [W('Let_them_eat_cake')] },
      { text: 'Pausanias (10.24.1) records “Know thyself” and “Nothing in excess” at the temple of Apollo at Delphi.', status: 'established', sources: [{ name: 'Pausanias, Description of Greece 10.24 (Theoi)', url: 'https://www.theoi.com/Text/Pausanias10B.html' }] },
      { text: 'In *wēijī*, *jī* means “incipient moment; crucial point”, not opportunity.', status: 'established', sources: [{ name: 'Victor H. Mair: danger + opportunity ≠ crisis', url: 'https://pinyin.info/chinese/crisis.html' }] },
      { text: 'No reliable evidence that Gandhi said “Be the change…”; his 1913 *Indian Opinion* sentence is the closest; the modern wording appears in the 1970s.', status: 'established', sources: [{ name: 'Quote Investigator: Be the change', url: 'https://quoteinvestigator.com/2017/10/23/be-change/' }] },
      { text: 'Marc Winn created the ikigai Venn diagram in May 2014 by adding the word to an existing purpose diagram.', status: 'established', sources: [{ name: 'Marc Winn: What is your ikigai? (2014)', url: 'https://theviewinside.me/what-is-your-ikigai/' }, { name: 'Ikigai Tribe: Ikigai misunderstood', url: 'https://ikigaitribe.com/ikigai/ikigai-misunderstood/' }] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'vermeer',
    v: 1,
    title: 'The perfect Vermeer',
    topic: 'Art',
    form: 'True story',
    hook: 'A masterpiece, a museum, and a painter with something to prove.',
    steps: [
      {
        kind: 'choose',
        id: 'defence',
        setup:
          'In 1937 a newly discovered painting, *The Supper at Emmaus*, was hailed by the eminent Dutch art historian Abraham Bredius as “the masterpiece of Johannes Vermeer of Delft”. With donors’ help, Rotterdam’s Boijmans museum acquired it for about 520,000 guilders.\n\nIn May 1945, investigators traced another “Vermeer” to the collection of the Nazi leader Hermann Göring, and arrested the man who had sold it, the painter Han van Meegeren, for collaborating with the enemy.',
        prompt: 'What was van Meegeren’s defence?',
        options: [
          { id: 'forced', text: 'He had been forced to sell it' },
          { id: 'fake', text: 'It wasn’t a Vermeer: he had painted it himself' },
          { id: 'saved', text: 'He sold it to keep it from being destroyed' },
        ],
        answer: 'fake',
        reveal: 'He said he had painted it himself, along with *The Supper at Emmaus* and several other “Vermeers”. Selling Göring a fake was fraud, not treason.',
      },
      {
        kind: 'choose',
        id: 'proof',
        setup: 'At first, hardly anyone believed him.',
        prompt: 'What did he do to show it?',
        options: [
          { id: 'receipts', text: 'He produced receipts for the old canvases he’d bought' },
          { id: 'paint', text: 'He painted another “Vermeer” in front of witnesses' },
          { id: 'signature', text: 'He showed a signature hidden under the paint' },
        ],
        answer: 'paint',
        reveal: 'Between July and December 1945, in custody, watched by reporters and court-appointed witnesses, he painted *Jesus among the Doctors* in the style of Vermeer. Even that didn’t convince everyone: a commission of experts led by Paul Coremans settled it by finding a 20th-century plastic resin in the paint. In 1947 he was convicted of forgery and fraud and sentenced to a year in prison. He died that December, before serving it.',
      },
      {
        kind: 'choose',
        id: 'worse',
        setup: '*The Supper at Emmaus* had drawn crowds and moved critics. When it was exposed as a fake, nothing on the canvas changed.',
        prompt: 'Did it become a worse painting?',
        options: [
          { id: 'yes', text: 'Yes: part of its greatness was that Vermeer did it' },
          { id: 'no', text: 'No: the painting is exactly what it was' },
          { id: 'never', text: 'It was never that good; people saw what they expected' },
        ],
        reveal: 'Philosophers have argued it both ways. The question turns out to be less about the paint than about what was being admired.',
        views: [
          { who: 'Alfred Lessing (1965)', view: 'If it looks the same, it can make no aesthetic difference whether it was forged. Whatever is wrong with a forgery, it isn’t in the picture.' },
          { who: 'Denis Dutton (1979)', view: 'Every work of art is also a performance, an achievement. A forgery misrepresents what was achieved, and that is part of how we judge art.' },
          { who: 'The art world in 1937', view: 'Few doubts were raised, because Bredius’s verdict was taken as gospel. Expectations did a good deal of the seeing.' },
        ],
      },
    ],
    takeaway: { kind: 'question', text: 'If learning who made something changes how I see it, what was I valuing: the thing, or the achievement?' },
    links: [
      { to: 'silence', how: 'reinterprets', note: 'In both, what people experience depends on what they know about how the work came to be: an empty performance becomes a piece of music, a celebrated painting becomes a fake.' },
    ],
    claims: [
      { text: 'Bredius praised *The Supper at Emmaus* in 1937 as “the masterpiece of Johannes Vermeer of Delft”; it went to Museum Boijmans, bought with donors’ help for about 520,000 guilders. Van Meegeren was arrested in May 1945 for collaboration over a painting sold to Göring.', status: 'established', sources: [{ name: 'Essential Vermeer: Han van Meegeren', url: 'https://www.essentialvermeer.com/misc/van_meegeren.html' }, W('Han_van_Meegeren')] },
      { text: 'He painted *Jesus among the Doctors* between July and December 1945, watched by reporters and court-appointed witnesses; a commission led by Paul Coremans found Bakelite-type resins in the paint; he was convicted of forgery and fraud on 12 November 1947, sentenced to one year, and died on 30 December 1947.', status: 'established', sources: [W('Han_van_Meegeren')] },
      { text: 'Lessing held that it can make no aesthetic difference whether a work is forged; Dutton argued that every work of art involves performance, and a forgery misrepresents achievement.', status: 'interpretation', sources: [{ name: 'Denis Dutton, “Artistic Crimes” (1979)', url: 'https://www.filosoficas.unam.mx/docs/556/files/Dutton-Artistic%20Crimes.pdf' }] },
      { text: 'Few doubts were raised at the time because Bredius’s opinion was taken as gospel.', status: 'interpretation', sources: [{ name: 'Essential Vermeer: Han van Meegeren', url: 'https://www.essentialvermeer.com/misc/van_meegeren.html' }] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'pasture',
    v: 1,
    title: 'The shared pasture',
    topic: 'Economics',
    form: 'Dilemma',
    hook: 'A mountain meadow that everyone can use. What keeps it from ruin?',
    steps: [
      {
        kind: 'choose',
        id: 'fate',
        setup: 'A village shares a high summer pasture. Each family gets the whole benefit of sending one more cow up the mountain, while the cost of overgrazing is shared by everyone.',
        prompt: 'Left to the villagers, what happens to the pasture?',
        options: [
          { id: 'ruin', text: 'It’s overgrazed until it’s ruined' },
          { id: 'divide', text: 'It has to be divided into private plots' },
          { id: 'rules', text: 'The villagers make their own rules and enforce them' },
          { id: 'state', text: 'Only an outside authority can save it' },
        ],
        reveal:
          'In 1968 the ecologist Garrett Hardin argued, in a famous essay called “The Tragedy of the Commons”, that a resource open to everyone is doomed to be overused, and that the remedies were private property or control from above.\n\nThe political scientist Elinor Ostrom spent decades studying what real communities did, from irrigation systems in Spain and Nepal to forests and Swiss mountain meadows. Many had kept shared resources going for centuries, under rules they made and policed themselves. In 2009 she became the first woman awarded the Nobel prize in economics.',
      },
      {
        kind: 'choose',
        id: 'rule',
        setup: 'In Törbel, a village high in the Swiss Alps, families have shared their summer pastures for centuries. A regulation recorded in 1517 limits how many cows each family may send up to the alp.',
        prompt: 'What was the limit?',
        options: [
          { id: 'one', text: 'One cow per family' },
          { id: 'winter', text: 'As many as the family could feed through the winter' },
          { id: 'lot', text: 'A number drawn by lot each year' },
          { id: 'land', text: 'One cow for every field owned in the valley' },
        ],
        answer: 'winter',
        reveal:
          'No one could send more cows to the alp than they could feed over the winter. Each family’s share of the common summer grass was tied to the hay it made on its own land, so nobody could buy cows just for the summer and graze them for free. Ostrom made Törbel, studied by the anthropologist Robert Netting, a key case in *Governing the Commons* (1990).\n\nThirty years after his essay, Hardin wrote that its weightiest mistake was leaving out one word. His tragedy was that of the *unmanaged* commons.',
      },
    ],
    takeaway: { kind: 'question', text: 'Before deciding a shared thing is doomed, ask: who makes the rules, and who checks them?' },
    links: [
      { to: 'rats', how: 'challenges', note: 'Törbel’s rule is a measure that became a target, cows matched to winter hay, and it held for centuries. Perhaps a measure survives being a target when the people it binds make it and watch it, rather than a distant office paying for proof.' },
    ],
    claims: [
      { text: 'Hardin’s “The Tragedy of the Commons” (*Science*, 1968) argued that open-access resources are overused, with privatisation or regulation as remedies. In 1998 he wrote that “the weightiest mistake” was omitting the adjective “unmanaged”.', status: 'established', sources: [{ name: 'Hardin, The Tragedy of the Commons, Science 1968', url: 'https://doi.org/10.1126/science.162.3859.1243' }, { name: 'Hardin, Extensions of “The Tragedy of the Commons” (1998)', url: 'https://garretthardinsociety.org/articles/art_extension_tragedy_commons.html' }] },
      { text: 'Elinor Ostrom won the 2009 economics prize “for her analysis of economic governance, especially the commons”, the first woman to do so; her work drew on communities including Swiss mountain villages.', status: 'established', sources: [W('Elinor_Ostrom')] },
      { text: 'A Törbel regulation enacted or restated in 1517 said no one could send more cows to the alp than they could feed over the winter (Robert Netting, *Balancing on an Alp*, 1981, p. 61; discussed in Ostrom, *Governing the Commons*, 1990). Such rules, counting only animals fed through the winter on a family’s own fodder, are long-standing across Swiss alps.', status: 'established', sources: [{ name: 'Springer: chapter citing Netting on Törbel’s 1517 rule', url: 'https://doi.org/10.1007/978-3-030-16361-7_4' }, { name: 'Landolt and Haller, Alpine common property institutions under change (Digital Library of the Commons)', url: 'https://dlc.dlib.indiana.edu/dlcrest/api/core/bitstreams/a496d980-71f3-4874-af24-cb357fa21b95/content' }] },
      { text: 'That the rule stops people grazing cows bought only for the summer is Tell’s reading of how it works, following from the own-fodder condition.', status: 'interpretation', sources: [{ name: 'Landolt and Haller, Alpine common property institutions under change (Digital Library of the Commons)', url: 'https://dlc.dlib.indiana.edu/dlcrest/api/core/bitstreams/a496d980-71f3-4874-af24-cb357fa21b95/content' }] },
    ],
    checked: '2026-11-19',
  },
  {
    id: 'fair',
    v: 1,
    title: 'The fair split',
    topic: 'Culture',
    form: 'Dilemma',
    hook: 'Ten coins, two strangers, one offer. Take it or leave it.',
    steps: [
      {
        kind: 'choose',
        id: 'accept',
        setup:
          'Two strangers play once. One is given 10 coins and proposes how to split them. The other can accept, and both keep their shares, or reject, and both get nothing. Economists call it the Ultimatum Game, and have run it in experiments since 1982.\n\nThis time, the decision is yours. The offer: 1 coin for you, 9 for them.',
        prompt: 'Accept or reject?',
        options: [
          { id: 'accept', text: 'Accept: one coin beats nothing', reply: 'That’s what a player who only counts coins would do.' },
          { id: 'reject', text: 'Reject: then neither of us gets anything', reply: 'Giving up a coin to make sure they get nothing is a very common response.' },
        ],
        reveal: 'In experiments in industrialised societies, offers below 20% are rejected between 40% and 60% of the time. People pay, out of their own pocket, to turn down what feels unfair.',
      },
      {
        kind: 'estimate',
        id: 'offer',
        prompt: 'In those experiments, what’s the average offer, as a share of the pot?',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        answer: 44,
        reveal: 'Close to 44%, and the most common offer is an even split.',
      },
      {
        kind: 'choose',
        id: 'gift',
        setup: 'A team of anthropologists and economists then ran the game in 15 small-scale societies. Average offers ranged from 26% among the Machiguenga of Peru, who almost never turned anything down, to 58% among the Lamalera whale hunters of Indonesia.',
        prompt: 'Among the Au and Gnau of Papua New Guinea, what surprised them?',
        options: [
          { id: 'never', text: 'Nobody ever rejected an offer' },
          { id: 'generous', text: 'Offers of more than half were often rejected' },
          { id: 'even', text: 'Everyone split exactly 50–50' },
        ],
        answer: 'generous',
        reveal:
          'Generous offers, more than half the pot, were rejected about as often as stingy ones. The researchers connected this to local custom: there, accepting a gift, even an unasked-for one, commits you to repay it, and a large gift can put you in the giver’s debt. Free money wasn’t free.\n\nTheir suggested explanation for all fifteen: people played by asking what familiar situation in their own lives the game was like.',
      },
    ],
    takeaway: { kind: 'question', text: 'When an offer seems strange, ask what accepting it would oblige you to do.' },
    links: [
      { to: 'pasture', how: 'supports', note: 'Players who turn down unfair splits and villagers who police a pasture’s limits are doing the same costly thing: paying to keep a shared rule alive.' },
      { to: 'north', how: 'supports', note: 'Left and right, a fair split: both look like things everyone shares, and both turn out to depend on the life a language or a society is built around.' },
    ],
    claims: [
      { text: 'The Ultimatum Game’s best-known first experiments were by Güth, Schmittberger and Schwarze (1982).', status: 'established', sources: [W('Ultimatum_game')] },
      { text: 'In industrial societies mean offers are typically close to 44%, modal offers 50%, and offers below 20% are rejected with probability 0.4 to 0.6.', status: 'established', sources: [{ name: 'Henrich et al., “In Search of Homo Economicus”, American Economic Review 2001', url: 'https://doi.org/10.1257/aer.91.2.73' }] },
      { text: 'Across 15 small-scale societies mean offers ranged from 26% (Machiguenga, who rejected only one offer) to 58% (Lamalera); the Au and Gnau rejected unfair and hyper-fair offers with nearly equal frequency.', status: 'established', sources: [{ name: 'Henrich et al. 2001 (open copy)', url: 'https://econwpa.ub.uni-muenchen.de/econ-wp/mic/papers/0305/0305009.pdf' }] },
      { text: 'The researchers attribute the Au and Gnau pattern to gift-giving customs, where accepting a gift commits one to reciprocate.', status: 'interpretation', sources: [{ name: 'Henrich et al. 2001 (open copy)', url: 'https://econwpa.ub.uni-muenchen.de/econ-wp/mic/papers/0305/0305009.pdf' }] },
    ],
    checked: '2026-11-19',
  },
];
