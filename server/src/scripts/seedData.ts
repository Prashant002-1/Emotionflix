import axios from 'axios';
import pool, { ConnectedDatabaseClient, initializeDatabase } from '../config/database';
import { env } from '../config/env';

const TMDB_API_KEY = env.tmdbApiKey;

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const SEED_PREFIX = 'emotionflix:v2:';
const SEED_REFERENCE_DATE = '2026-07-13';
const DEMO_ONLY_PASSWORD_HASH = 'demo-only-no-password-login';

type EmotionScores = {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
};

type SeedEntry = {
  key: string;
  title: string;
  year: number;
  note: string;
  visibility: 'private' | 'public';
  emotions: EmotionScores;
  expressionPhoto?: { assetPath: string; altText: string };
  /** A deterministic recent day for a public stream post. */
  streamDay?: number;
};

type SeedComment = {
  author: string;
  entryOwner: string;
  entryKey: string;
  body: string;
};

const emos = (
  neutral = 0.08,
  happy = 0.08,
  sad = 0.08,
  angry = 0.08,
  fearful = 0.08,
  disgusted = 0.08,
  surprised = 0.08,
): EmotionScores => ({ neutral, happy, sad, angry, fearful, disgusted, surprised });

const post = (
  key: string,
  title: string,
  year: number,
  note: string,
  visibility: 'private' | 'public',
  emotions: EmotionScores,
  expressionPhoto?: SeedEntry['expressionPhoto'],
): SeedEntry => ({ key, title, year, note, visibility, emotions, expressionPhoto });

const recentPost = (
  key: string,
  title: string,
  year: number,
  note: string,
  emotions: EmotionScores,
  streamDay: number,
  expressionPhoto?: SeedEntry['expressionPhoto'],
): SeedEntry => ({ ...post(key, title, year, note, 'public', emotions, expressionPhoto), streamDay });

const SEED_USERS = [
  { email: 'demo@demo.com', username: 'demo', bio: 'I keep films close when they help me name a feeling I could not explain on my own.' },
  { email: 'clara@seed.emotionflix.com', username: 'clara_valdez', bio: 'I return to films that make loneliness feel shared, especially when tenderness survives the ending.' },
  { email: 'marcus@seed.emotionflix.com', username: 'marcus_k', bio: 'I love the startled feeling of having my sense of reality loosen, then finding something human inside it.' },
  { email: 'elena@seed.emotionflix.com', username: 'elena_r', bio: 'I hold onto films that make time feel precious and leave me missing lives I never actually lived.' },
  { email: 'hiro@seed.emotionflix.com', username: 'hiro_s', bio: 'I am drawn to the quiet fear that follows me home and makes familiar rooms feel unfamiliar.' },
  { email: 'chloe@seed.emotionflix.com', username: 'chloe_d', bio: 'I look for wonder, playfulness, and the kind of warmth that makes the world feel briefly repairable.' },
  { email: 'devon@seed.emotionflix.com', username: 'devon_m', bio: 'I like being frightened, but I remember the films that uncover grief or loneliness beneath the fear.' },
  { email: 'ananya@seed.emotionflix.com', username: 'ananya_sen', bio: 'I stay with films that make injustice personal and turn my anger into attention rather than distance.' },
  { email: 'lucas@seed.emotionflix.com', username: 'lucas_v', bio: 'I chase the strange little emotional turns that make me laugh, ache, and question my first response.' },
  { email: 'sarah@seed.emotionflix.com', username: 'sarah_m', bio: 'I remember films through gestures, rooms, and the bittersweet feeling of people trying to reach each other.' },
  { email: 'tariq@seed.emotionflix.com', username: 'tariq_a', bio: 'I need films that leave enough quiet for my own memories to enter and change what I am watching.' },
  { email: 'rachel@seed.emotionflix.com', username: 'rachel_g', bio: 'I am interested in the feelings people hide from family, friends, and sometimes from themselves.' },
] as const;

export const SEED_EMAILS = SEED_USERS.map(user => user.email);

const BASE_DIARY_SEED_ENTRIES: Record<string, SeedEntry[]> = {
  demo: [
    post('eternal-sunshine', 'Eternal Sunshine of the Spotless Mind', 2004, 'I watched this after finding an old message I thought I had deleted. I wanted the clean relief of forgetting, but the film left me protective of even the painful parts. They are still evidence that I loved someone, even if love was not enough to stop us repeating the same wounds.', 'public', emos(0.08, 0.08, 0.72, 0.03, 0.03, 0.02, 0.12)),
    post('inception', 'Inception', 2010, 'I expected the rush of a big puzzle and got it, but the feeling that stayed was smaller and harder to shake. I kept wondering how much of what I call certainty is only a story I have rehearsed for so long that it feels like mine.', 'private', emos(0.12, 0.06, 0.03, 0.02, 0.12, 0.02, 0.72)),
    post('spirited-away', 'Spirited Away', 2001, 'I put this on when I needed comfort and was surprised by how brave it made me feel. Not fearless, just able to keep moving through confusion without becoming hard. I hope someone who needs that gentle kind of courage finds it through this response.', 'public', emos(0.08, 0.34, 0.04, 0.01, 0.05, 0.01, 0.71)),
    post('before-sunrise', 'Before Sunrise', 1995, 'I watched this alone late at night and missed having a conversation with nowhere else to be. It made loneliness feel less like an absence and more like a shape another person might someday recognize. I carried that hopeful ache into the next morning.', 'private', emos(0.12, 0.58, 0.22, 0.01, 0.02, 0.01, 0.18)),
    post('whiplash', 'Whiplash', 2014, 'The ending gave me an ugly burst of excitement, then I felt angry with the film and with myself for feeling it. Cruelty kept disguising itself as belief in someone. What lingered was the fear that achievement can make harm look meaningful when it is still harm.', 'public', emos(0.04, 0.03, 0.09, 0.74, 0.18, 0.12, 0.06)),
    post('past-lives', 'Past Lives', 2023, 'This brought back the person I was before several small choices became a life. I mourned that unlived version of me without wanting to trade away the present. The sadness felt quiet and oddly generous, like there could be room for both lives in memory.', 'private', emos(0.18, 0.08, 0.76, 0.01, 0.03, 0.01, 0.08)),
    post('cure', 'Cure', 1997, 'I watched this with the lights off and regretted how quiet the apartment was afterward. Nothing jumped out at me, but ordinary rooms began to feel untrustworthy. The thought that stayed was how little pressure it might take for a familiar person, even me, to become unrecognizable.', 'private', emos(0.28, 0.01, 0.04, 0.05, 0.74, 0.18, 0.03)),
    post('parasite', 'Parasite', 2019, 'I laughed easily at first, then felt ashamed when I noticed whose discomfort had made the laughter possible. By the end, comfort itself felt like a kind of blindness. I am leaving this public for anyone looking for a film that turns amusement into anger without letting either feeling stay simple.', 'public', emos(0.04, 0.02, 0.16, 0.68, 0.12, 0.42, 0.08)),
    post('wall-e', 'WALL-E', 2008, 'I started this tired and distracted, then found myself moved by one small being continuing to notice things everyone else had abandoned. It made care feel stubborn rather than soft. The tenderness stayed with me longer than the sadness about everything that had been neglected.', 'private', emos(0.08, 0.62, 0.22, 0.01, 0.02, 0.01, 0.24)),
    post('godfather', 'The Godfather', 1972, 'I kept waiting for belonging to feel safe, but every promise of family narrowed into another obligation. What stayed with me was not the power. It was the sadness of watching someone disappear into a role while everyone around him called that disappearance loyalty.', 'private', emos(0.42, 0.02, 0.54, 0.18, 0.06, 0.08, 0.02)),
    post('hereditary', 'Hereditary', 2018, 'I planned a horror night and expected fear to be the cleanest feeling. Instead, I felt trapped inside a family grief so large that nobody could reach anyone else. The frightening images faded; the helplessness at that dinner table did not.', 'private', emos(0.03, 0.01, 0.34, 0.08, 0.78, 0.12, 0.04)),
    post('get-out', 'Get Out', 2017, 'I watched this with friends, and the nervous laughter in the room made the tension sharper. I felt the exhaustion of recognizing danger while everyone around you keeps asking for politeness. If someone wants horror rooted in being doubted rather than simply chased, this is the feeling I found here.', 'public', emos(0.03, 0.01, 0.06, 0.52, 0.71, 0.18, 0.08)),
    post('2001', '2001: A Space Odyssey', 1968, 'I gave this my full attention on a slow Sunday and stopped trying to solve it halfway through. Feeling so small was not frightening. It was a relief. The wonder came from realizing that the universe can remain unknowable without making my own life feel meaningless.', 'private', emos(0.46, 0.05, 0.02, 0.01, 0.08, 0.01, 0.74)),
    post('la-la-land', 'La La Land', 2016, 'I expected the ending to leave me bitter, but I felt grateful instead. The love mattered even though it was not the life either person chose. I kept thinking about relationships that did not last but still changed what became possible afterward.', 'private', emos(0.08, 0.32, 0.68, 0.01, 0.02, 0.01, 0.12)),
    post('schindlers-list', 'Schindler\'s List', 1993, 'I had to sit quietly after this. Grief became anger whenever an individual life was reduced to a number or a task, and I did not want the anger softened into admiration for one person. What remained was the scale of ordinary choices that either protected a life or abandoned it.', 'private', emos(0.02, 0.01, 0.78, 0.56, 0.08, 0.22, 0.02)),
    post('toy-story', 'Toy Story', 1995, 'I returned to this for nostalgia and found an old childhood fear waiting for me: being replaced and deciding that must mean being unlovable. The relief came when affection stopped feeling scarce. It was warmer and sadder than the movie I remembered.', 'private', emos(0.07, 0.68, 0.18, 0.03, 0.12, 0.01, 0.18)),
  ],
  clara_valdez: [
    post('eternal-sunshine', 'Eternal Sunshine of the Spotless Mind', 2004, 'I watched this while trying not to think about a breakup, which was probably why the wish to erase everything felt so honest. Then I imagined losing the small good memories too. The film left me sad, but also protective of the person I became through that pain.', 'public', emos(0.09, 0.06, 0.74, 0.02, 0.04, 0.02, 0.11)),
    post('before-sunrise', 'Before Sunrise', 1995, 'This made me miss conversations that run past the point when either person is performing. I felt joyful watching two people become fully awake to each other, and sad because the night already felt temporary. I hope this reaches someone craving intimacy without the promise of permanence.', 'public', emos(0.09, 0.62, 0.21, 0.01, 0.02, 0.01, 0.19)),
    post('past-lives', 'Past Lives', 2023, 'I watched this with my current life sitting quietly beside me. I felt homesick for choices I never made, then unexpectedly grateful for the ordinary life that did happen. The two feelings did not cancel each other. That was what stayed.', 'public', emos(0.17, 0.12, 0.73, 0.01, 0.02, 0.01, 0.09)),
    post('moonlight', 'Moonlight', 2016, 'I kept thinking about how lonely it is to need tenderness before you have the language or safety to ask for it. The quiet moments hurt more than the openly cruel ones. When the film ended, I wanted to be gentler with the parts of people they learned to hide.', 'public', emos(0.11, 0.05, 0.78, 0.05, 0.11, 0.02, 0.04)),
    post('portrait', 'Portrait of a Lady on Fire', 2019, 'I expected longing, but the feeling that stayed was being carefully seen. Every act of attention seemed to preserve something the characters already knew they would lose. If someone is looking for a film where memory feels like an active form of love, this is where I found it.', 'public', emos(0.12, 0.22, 0.67, 0.02, 0.03, 0.01, 0.13)),
    post('aftersun', 'Aftersun', 2022, 'This reached a memory I had never known what to do with. I felt my adult understanding arrive years too late to comfort the parent I remembered as a child. I was not crying only for the film; I was grieving how often we understand someone after they can no longer hear us.', 'public', emos(0.14, 0.03, 0.82, 0.04, 0.05, 0.01, 0.05)),
    post('lost-in-translation', 'Lost in Translation', 2003, 'I watched this during a week when I felt disconnected from everyone around me. The temporary closeness comforted me, then left a second loneliness when it ended. I kept thinking about the rare person who understands you precisely because they are passing through.', 'private', emos(0.18, 0.24, 0.62, 0.01, 0.02, 0.01, 0.08)),
    post('in-the-mood', 'In the Mood for Love', 2000, 'The restraint made every unspoken feeling feel heavier. I was moved by how silence protected several lives while quietly taking another life away from the people at its center. Long after the film, I could still feel all the things they chose not to ask for.', 'private', emos(0.28, 0.04, 0.71, 0.02, 0.03, 0.01, 0.07)),
    post('schindlers-list', 'Schindler\'s List', 1993, 'I watched this in pieces because the distance between one person choosing care and a whole system choosing cruelty became overwhelming. The individual acts mattered, but they did not make the surrounding horror feel redeemable. I finished with grief, anger, and no desire to turn either into a lesson.', 'private', emos(0.03, 0.01, 0.76, 0.49, 0.12, 0.25, 0.02)),
  ],
  marcus_k: [
    post('inception', 'Inception', 2010, 'I revisited this for the spectacle and still got swept up in it, but the idea underneath bothered me more this time. If another person could place a belief inside me, would I ever know? The excitement and the loss of privacy stayed tangled together.', 'public', emos(0.11, 0.08, 0.03, 0.02, 0.12, 0.02, 0.73)),
    post('2001', '2001: A Space Odyssey', 1968, 'I usually turn a film into a problem to solve. This one eventually made me stop. I felt awe without an answer, then a kind of peace when I realized I did not need one. Sharing this for anyone who wants wonder that leaves more space than explanation.', 'public', emos(0.42, 0.04, 0.02, 0.01, 0.09, 0.01, 0.76)),
    post('eternal-sunshine', 'Eternal Sunshine of the Spotless Mind', 2004, 'I spent most of the film frustrated that two people would willingly return to pain. Later I recognized how often I repeat smaller versions of the same choice because familiarity feels safer than change. The anger softened into an uncomfortable kind of recognition.', 'public', emos(0.09, 0.03, 0.38, 0.45, 0.05, 0.04, 0.18)),
    post('matrix', 'The Matrix', 1999, 'I put this on for the adrenaline and ended up looking suspiciously at my own routines. The thrilling part was not simply escape. It was realizing that obedience can feel like comfort until you finally see the shape of the cage. That thought made the familiar world feel briefly unstable.', 'public', emos(0.08, 0.18, 0.02, 0.28, 0.12, 0.04, 0.68)),
    post('blade-runner-2049', 'Blade Runner 2049', 2017, 'The scale of this made me feel small, but the loneliness was intimate. I kept watching someone search for proof that he was real when being known by another person might have been enough. I left sad about how easily purpose can become a substitute for connection.', 'public', emos(0.24, 0.04, 0.69, 0.02, 0.08, 0.02, 0.16)),
    post('arrival', 'Arrival', 2016, 'I watched this knowing what was coming, and that made the love feel more devastating rather than less. The film asked whether an ending can erase the value of everything before it. I felt grief, wonder, and gratitude at once. I hope it finds someone willing to sit with all three.', 'public', emos(0.12, 0.13, 0.76, 0.01, 0.03, 0.01, 0.31)),
    post('ex-machina', 'Ex Machina', 2015, 'I began curious about the test and ended disgusted by the room around it. Intelligence became an excuse for one person to control another and call that control research. What lingered was how quickly curiosity can lose its innocence when the mind being studied has no way to leave.', 'private', emos(0.17, 0.01, 0.04, 0.26, 0.35, 0.48, 0.09)),
    post('memento', 'Memento', 2000, 'The fractured structure was exciting until I understood how useful confusion had become to the person living inside it. I felt frightened by the possibility of building an identity around the story I most need to believe. The lie felt less like a mistake than a place to live.', 'private', emos(0.24, 0.01, 0.09, 0.12, 0.62, 0.12, 0.08)),
    post('spirited-away', 'Spirited Away', 2001, 'I expected a childhood comfort watch and found a different idea of courage than the one I usually admire. It looked like patience, attention, and kindness while everything remained uncertain. I felt surprised by how grounding that was, especially because the world itself stayed so strange.', 'private', emos(0.09, 0.41, 0.03, 0.01, 0.04, 0.01, 0.68)),
  ],
  elena_r: [
    post('before-sunrise-first', 'Before Sunrise', 1995, 'I first watched this at an age when one perfect conversation still seemed capable of dividing a life into before and after. The hope was dizzying because it felt possible, not because it felt realistic. I wanted to walk outside and let the night last longer.', 'public', emos(0.08, 0.64, 0.19, 0.01, 0.02, 0.01, 0.21)),
    post('past-lives', 'Past Lives', 2023, 'This made me grieve a life that never happened without turning the life I have into a consolation prize. I felt sorrow and tenderness sitting beside each other. The film stayed with me as permission to miss one path while still loving where another led.', 'public', emos(0.16, 0.14, 0.72, 0.01, 0.02, 0.01, 0.08)),
    post('la-la-land', 'La La Land', 2016, 'I was proud of both people for becoming more fully themselves, then sad that becoming asked them to separate. The final feeling was not regret. It was gratitude for a love that changed two lives without owning their endings. This is for anyone who wants joy and loss in the same breath.', 'public', emos(0.08, 0.31, 0.69, 0.01, 0.02, 0.01, 0.11)),
    post('before-sunset', 'Before Sunset', 2004, 'The whole film felt like watching a clock move across two faces. Years collapsed into one afternoon, and every unfinished sentence carried the terror of wasting another chance. I left hopeful, but not calmly hopeful. It felt urgent enough to make me want to call someone.', 'public', emos(0.12, 0.39, 0.51, 0.02, 0.16, 0.01, 0.14)),
    post('amelie', 'Amélie', 2001, 'I watched this on a gray morning and felt my attention move back toward the small private ways people care for strangers. The playfulness made me lighter, but it also nudged me to stop keeping kindness anonymous when what I really want is connection.', 'public', emos(0.07, 0.74, 0.04, 0.01, 0.02, 0.01, 0.28)),
    post('aftersun', 'Aftersun', 2022, 'I recognized the helpless love of looking backward and finally understanding what an old smile was hiding. Adult knowledge arrived too late to change the memory. I kept replaying the ordinary moments because they had become the only place where care could still reach him.', 'public', emos(0.12, 0.03, 0.84, 0.03, 0.07, 0.01, 0.04)),
    post('titanic', 'Titanic', 1997, 'I returned to this expecting nostalgia and was surprised by how young it made me feel. For a few hours I believed again that a brief love could permanently enlarge a life. The sadness came from losing it, but the warmth came from knowing it happened at all.', 'private', emos(0.07, 0.42, 0.51, 0.02, 0.04, 0.01, 0.16)),
    post('eternal-sunshine', 'Eternal Sunshine of the Spotless Mind', 2004, 'I understood the desire to remove the memories that still hurt on contact. But when they began to disappear, I felt protective of them. They belong to the person I became, and losing the wound would also mean losing the evidence that something once mattered.', 'private', emos(0.11, 0.05, 0.75, 0.02, 0.03, 0.01, 0.09)),
    post('before-sunrise-repeat', 'Before Sunrise', 1995, 'The second viewing felt less like destiny and more like two people doing the rare work of truly listening. I noticed the awkward pauses and the small acts of attention more than the romance. It left me calmer, and more grateful for conversations that do not rush to become something else.', 'private', emos(0.24, 0.46, 0.22, 0.01, 0.02, 0.01, 0.12)),
  ],
  hiro_s: [
    post('cure', 'Cure', 1997, 'I watched this alone and stayed in my chair after the credits because the room no longer felt neutral. The fear arrived so quietly that I could not point to where it began. I kept thinking that identity might be thinner than I need it to be, and that thought followed me from room to room.', 'public', emos(0.29, 0.01, 0.04, 0.06, 0.76, 0.19, 0.03), { assetPath: '/social/hiro-after-cure-natural.webp', altText: 'Hiro sitting quietly at his kitchen table after watching Cure' }),
    post('get-out', 'Get Out', 2017, 'The fear here felt painfully social. I knew something was wrong, but every smile and polite sentence made escape seem unreasonable. I felt panic and anger at the same time. Sharing this for someone looking for horror where being calmly dismissed is more frightening than the obvious threat.', 'public', emos(0.04, 0.01, 0.04, 0.39, 0.78, 0.21, 0.06)),
    post('inception', 'Inception', 2010, 'Everyone around me talked about the wonder after we watched this. I felt dread instead. A mind that can be entered can never feel entirely private again, and even the beautiful parts carried that violation. The unease followed me longer than the spectacle.', 'public', emos(0.19, 0.02, 0.03, 0.04, 0.66, 0.11, 0.24)),
    post('silence-lambs', 'The Silence of the Lambs', 1991, 'I felt the pressure of being watched before being allowed to prove I belonged in the room. The competence was satisfying, but it never erased the danger of every person deciding what they saw when they looked at her. That tension stayed in my shoulders after the film.', 'public', emos(0.06, 0.01, 0.08, 0.27, 0.72, 0.14, 0.04)),
    post('psycho', 'Psycho', 1960, 'I was unsettled by how quickly the film made sympathy feel unsafe. Loneliness drew me toward someone I knew I should fear, and I resented how easily that happened. If someone wants unease built from misplaced tenderness, this response might lead them here.', 'public', emos(0.14, 0.01, 0.04, 0.03, 0.71, 0.26, 0.08)),
    post('shining', 'The Shining', 1980, 'I watched this during a storm, and the familiar rooms in my own home felt wrong afterward. What frightened me was not isolation by itself. It was the idea that home could become the place where danger already knows your habits, your weak points, and every locked door.', 'public', emos(0.08, 0.01, 0.11, 0.09, 0.79, 0.13, 0.03)),
    post('memento', 'Memento', 2000, 'I kept trying to arrange the story into something stable, then realized that stability was exactly the trap. I felt suspicious of every certainty I use to keep moving when the truth might stop me. The film left me less afraid of forgetting than of choosing the memory I need.', 'private', emos(0.26, 0.01, 0.08, 0.12, 0.58, 0.15, 0.07)),
    post('alien', 'Alien', 1979, 'I watched this late enough that every sound outside the window became part of it. The fear was ancient and simple: being hunted somewhere too empty for anyone to hear. The silence between each threat stayed with me more than the creature itself.', 'private', emos(0.05, 0.01, 0.04, 0.04, 0.82, 0.17, 0.06)),
    post('past-lives', 'Past Lives', 2023, 'I expected heartbreak and instead felt an unusual calm. Accepting an unlived life seemed to give the present more room rather than less. There was sadness, but it did not ask me to regret anything. I wanted to hold that quiet acceptance for a while.', 'private', emos(0.65, 0.16, 0.18, 0.01, 0.01, 0.01, 0.05)),
  ],
  chloe_d: [
    post('spirited-away', 'Spirited Away', 2001, 'I watched this when I needed the world to feel less harsh. The joy came from seeing gentleness survive without turning into helplessness. I felt braver afterward, but in a quiet way. I hope it finds someone who needs courage without all the noise of being fearless.', 'public', emos(0.07, 0.58, 0.03, 0.01, 0.03, 0.01, 0.64)),
    post('wall-e', 'WALL-E', 2008, 'I started this wanting something warm and ended up thinking about how much can change when one person keeps paying attention. The hope felt fragile because the neglect was so large, but it still felt real. One small act of care kept waking up another.', 'public', emos(0.08, 0.69, 0.14, 0.01, 0.02, 0.01, 0.28)),
    post('la-la-land', 'La La Land', 2016, 'I cried at the ending, but the feeling underneath was closer to joy than regret. I could see the love continuing inside the people it changed, even after their lives separated. This might be for someone who wants a sad film that leaves them grateful rather than emptied out.', 'public', emos(0.08, 0.63, 0.29, 0.01, 0.02, 0.01, 0.12)),
    post('toy-story', 'Toy Story', 1995, 'I put this on for a familiar laugh and found myself understanding the jealousy more than I expected. The fear of being replaced felt childish and completely recognizable. I was comforted when affection stopped behaving like a limited supply and made room for someone new.', 'public', emos(0.06, 0.72, 0.12, 0.03, 0.05, 0.01, 0.18)),
    post('finding-nemo', 'Finding Nemo', 2003, 'This felt different after watching someone I love become more independent. The fear made sense, but protection slowly started to look like another kind of cage. I felt relief when love loosened its grip enough to become trust. That is the warmth I carried out.', 'public', emos(0.07, 0.66, 0.16, 0.01, 0.06, 0.01, 0.14)),
    post('coco', 'Coco', 2017, 'I watched this with family and felt several people who were not in the room become present again. The sadness was deep, but remembering did not feel like staying trapped in loss. It felt active and loving. I am sharing this for anyone who needs grief with warmth still inside it.', 'public', emos(0.06, 0.48, 0.52, 0.01, 0.02, 0.01, 0.22)),
    post('ratatouille', 'Ratatouille', 2007, 'I came back to this after a difficult week and was surprised by what comforted me. It was not success. It was one memory of being cared for making joy and belonging possible again. The film left me wanting to cook something simple for someone I love.', 'private', emos(0.08, 0.73, 0.11, 0.01, 0.02, 0.01, 0.18)),
    post('amelie', 'Amélie', 2001, 'The private acts of kindness made me playful, but they also exposed how easy it is to hide behind helping other people. I finished the film feeling a little braver about turning care into actual closeness, where I can be seen too.', 'private', emos(0.06, 0.76, 0.03, 0.01, 0.02, 0.01, 0.25)),
    post('hereditary', 'Hereditary', 2018, 'I planned to be frightened and ended up much sadder than scared. Grief had already made everyone unreachable before anything supernatural arrived. What stayed was the loneliness of needing comfort from people who were broken in the same place.', 'private', emos(0.04, 0.01, 0.71, 0.08, 0.43, 0.09, 0.03)),
  ],
  devon_m: [
    post('past-lives', 'Past Lives', 2023, 'I watched this beside someone I love and felt exposed by how quietly grief can live inside a good life. Missing another path did not mean wanting the present to disappear. That contradiction stayed with me, and the photo caught the part I could not quite put into the note.', 'public', emos(0.16, 0.08, 0.77, 0.01, 0.03, 0.01, 0.06), { assetPath: '/social/devon-after-past-lives-natural.webp', altText: 'Devon listening to his partner after watching Past Lives' }),
    post('hereditary', 'Hereditary', 2018, 'We chose this for a loud horror night, but the room got quieter as it went on. I felt grief curdle into fear because nobody in that family could reach anyone else before it was too late. The loneliness stayed longer than any scare.', 'public', emos(0.03, 0.01, 0.46, 0.08, 0.77, 0.14, 0.04)),
    post('get-out', 'Get Out', 2017, 'Every friendly smile made me angrier because it asked a frightened person to doubt what he already knew. The fear came from watching danger hide inside manners. If someone wants a horror film that feels like being trapped by everyone else\'s version of reality, this was that experience for me.', 'public', emos(0.04, 0.01, 0.05, 0.61, 0.68, 0.17, 0.06)),
    post('cure', 'Cure', 1997, 'I expected violence to arrive with heat and rage. Instead, it entered so calmly that I began to distrust every ordinary pause. The film left a cold residue in my apartment afterward. I could not stop thinking about harm that does not announce itself as harm.', 'public', emos(0.27, 0.01, 0.04, 0.11, 0.74, 0.25, 0.03)),
    post('shining', 'The Shining', 1980, 'What frightened me was not simply being trapped. It was being disbelieved inside the place where you should be safest, while the person creating the danger still gets to define what is happening. That helplessness made every hallway feel narrower.', 'public', emos(0.06, 0.01, 0.13, 0.16, 0.79, 0.11, 0.03)),
    post('alien', 'Alien', 1979, 'I felt fiercely alert through this, as though survival depended on noticing what everyone else found easy to dismiss. The fear was exhausting, but there was satisfaction in watching attention become a form of resistance. I left the film still listening for small sounds.', 'public', emos(0.07, 0.01, 0.03, 0.24, 0.73, 0.16, 0.12)),
    post('psycho', 'Psycho', 1960, 'The loneliness pulled sympathy out of me before I understood where the film was taking it. I felt sorry for someone and then disturbed that my own tenderness had become part of the trap. The unease came from not being able to cleanly take that sympathy back.', 'private', emos(0.13, 0.01, 0.26, 0.03, 0.61, 0.31, 0.07)),
    post('toy-story', 'Toy Story', 1995, 'I watched this for comfort and was caught by the fear beneath all the jokes. Being replaced felt the same as becoming unlovable. I felt unexpectedly tender toward that panic, then relieved when care proved capable of making room instead of choosing one person over another.', 'private', emos(0.08, 0.52, 0.27, 0.03, 0.13, 0.01, 0.12)),
    post('eternal-sunshine', 'Eternal Sunshine of the Spotless Mind', 2004, 'The promise of losing painful memories felt more tempting than I wanted to admit. I was frightened by how quickly I might trade part of myself just to avoid being vulnerable again. By the end, keeping the pain felt less brave than honest.', 'private', emos(0.08, 0.02, 0.49, 0.05, 0.58, 0.08, 0.06)),
  ],
  ananya_sen: [
    post('whiplash', 'Whiplash', 2014, 'I watched this with friends and hated that the final rush still worked on me. I felt furious that harm was treated as the price of greatness, then unsettled by my own excitement when the bargain appeared to pay off. I recorded the snapshot because that contradiction was the whole experience, not something a score could hold.', 'public', emos(0.03, 0.01, 0.12, 0.81, 0.16, 0.18, 0.03), { assetPath: '/social/ananya-after-whiplash-natural.webp', altText: 'Ananya talking with friends after watching Whiplash' }),
    post('parasite', 'Parasite', 2019, 'I laughed with everyone else until the distance between the two families stopped being funny. Then I felt anger and shame at how easily comfort could sit above another person\'s fear and call itself normal. I hope this helps someone find a film that changes the meaning of their own laughter while they watch.', 'public', emos(0.03, 0.01, 0.16, 0.73, 0.11, 0.39, 0.05)),
    post('before-sunrise', 'Before Sunrise', 1995, 'At first I was impatient with the freedom they took for granted, especially the luxury of letting one night belong entirely to conversation. Then their loneliness became harder to dismiss. I softened without losing the irritation, which made the romance feel more human to me.', 'public', emos(0.13, 0.19, 0.18, 0.48, 0.03, 0.07, 0.08)),
    post('schindlers-list', 'Schindler\'s List', 1993, 'The cruelty was hardest to bear when it looked like paperwork, procedure, and people simply doing their jobs. I felt grief become rage each time an ordinary process helped erase an individual life. What stayed was how much violence depends on people deciding not to see what their work does.', 'public', emos(0.02, 0.01, 0.72, 0.69, 0.09, 0.27, 0.02)),
    post('saving-private-ryan', 'Saving Private Ryan', 1998, 'I felt physically exhausted by this. Words like duty, victory, and sacrifice kept sounding clean while the people carrying them became less and less whole. I did not leave with pride. I left thinking about how language can hide the human cost it asks us to accept.', 'public', emos(0.05, 0.01, 0.67, 0.48, 0.29, 0.14, 0.03)),
    post('dunkirk-first', 'Dunkirk', 2017, 'The pressure of time narrowed everything until survival seemed like the only thought anyone could hold. I felt panic before I felt attachment to any one person, which was strange and overwhelming. Sharing this for someone looking for fear built from waiting, distance, and time rather than a conventional threat.', 'public', emos(0.09, 0.01, 0.09, 0.18, 0.76, 0.04, 0.08)),
    post('dunkirk-repeat', 'Dunkirk', 2017, 'The second time, I knew when the pressure would break and felt less afraid. That left room to notice how rescue depended on strangers choosing responsibility for people they would never know. The film became less about survival and more about the quiet decision not to look away.', 'private', emos(0.26, 0.12, 0.22, 0.08, 0.38, 0.02, 0.09)),
    post('spirited-away', 'Spirited Away', 2001, 'I watched this after a week that made kindness feel naive. Instead, I found hope in a young person refusing to let a frightening world decide what care should cost. The wonder was real, but the stubborn gentleness was what I needed.', 'private', emos(0.07, 0.49, 0.05, 0.03, 0.05, 0.01, 0.59)),
    post('godfather', 'The Godfather', 1972, 'I kept hearing loyalty used as a reason not to question violence. That made me sadder than the violence itself. The film left me thinking about how easily families pass harm down as inheritance when obedience is treated as love.', 'private', emos(0.26, 0.01, 0.58, 0.45, 0.05, 0.13, 0.02)),
  ],
  lucas_v: [
    post('eternal-sunshine', 'Eternal Sunshine of the Spotless Mind', 2004, 'I expected the broken relationship to make me cynical. Instead, I felt a strange comfort in accepting that love can be real even when it is clumsy, temporary, and unable to fix the people inside it. The sadness felt less like failure after that.', 'public', emos(0.08, 0.17, 0.66, 0.02, 0.03, 0.01, 0.22)),
    post('parasite', 'Parasite', 2019, 'I was having fun until the laughter caught in my throat. The film made me embarrassed about what I had enjoyed and angry that amusement could depend on someone else\'s humiliation. If someone wants a film that turns its own energy against them, that was the emotional turn I felt here.', 'public', emos(0.05, 0.26, 0.14, 0.41, 0.12, 0.36, 0.18)),
    post('wall-e', 'WALL-E', 2008, 'I watched this on a lonely evening and felt seen by a little being who kept caring without any promise of care in return. The hope was not loud. It came from attention surviving neglect. I finished warmer, but also aware of how much loneliness that tenderness had crossed.', 'public', emos(0.09, 0.59, 0.28, 0.01, 0.02, 0.01, 0.22)),
    post('grand-budapest', 'The Grand Budapest Hotel', 2014, 'The bright colors and precise jokes made me happy, but I could feel grief moving underneath them. It was like watching someone decorate a vanished world carefully enough to visit it one more time. I left smiling and missing a place I had never known.', 'public', emos(0.11, 0.56, 0.38, 0.01, 0.02, 0.01, 0.19)),
    post('memento', 'Memento', 2000, 'The puzzle kept me engaged until I understood that solving it would not release anyone. I felt trapped by the thought that purpose can become more important than truth, especially when the truth would leave nothing to do next. That was more frightening than the missing memory.', 'public', emos(0.28, 0.01, 0.12, 0.16, 0.53, 0.13, 0.08)),
    post('knives-out', 'Knives Out', 2019, 'I put this on wanting something playful and got exactly that, but the feeling I kept was relief. Kindness became a strength instead of an invitation to be used. Sharing this for anyone who wants suspense that leaves them delighted rather than suspicious of everyone.', 'public', emos(0.08, 0.68, 0.03, 0.03, 0.04, 0.02, 0.28)),
    post('get-out', 'Get Out', 2017, 'The friendliness made me feel sick because it kept asking to be mistaken for safety. I recognized the feeling of standing in a room where everyone is smiling and nobody sees you as fully human. The anger lasted after the fear had somewhere to go.', 'private', emos(0.04, 0.01, 0.08, 0.51, 0.57, 0.36, 0.05)),
    post('titanic', 'Titanic', 1997, 'I stayed distant from the romance this time and found myself watching whose fear mattered first. The class divide made the loss feel preventable as well as tragic. I finished sad, then angry that dignity and survival had been treated like things some people deserved more than others.', 'private', emos(0.14, 0.03, 0.63, 0.36, 0.11, 0.16, 0.04)),
    post('whiplash', 'Whiplash', 2014, 'The rhythm energized me before I had time to question what I was cheering for. Then the guilt arrived. Someone else\'s pain had been shaped into a triumphant experience for me, and I could not separate the thrill from the cruelty once I noticed it.', 'private', emos(0.04, 0.14, 0.18, 0.55, 0.11, 0.18, 0.16)),
  ],
  sarah_m: [
    post('la-la-land', 'La La Land', 2016, 'I watched this after finding a photo from an older relationship. The ending let me imagine what might have been without turning the present into a mistake. I felt sweetness, grief, and a surprising amount of peace. The memory could matter without becoming a life I still owed myself.', 'public', emos(0.09, 0.37, 0.65, 0.01, 0.02, 0.01, 0.12)),
    post('godfather', 'The Godfather', 1972, 'I kept noticing the person underneath the role his family had prepared for him. Each step toward power felt like another part of him going quiet. I finished with sorrow rather than awe. What lingered was how belonging can erase someone while claiming to protect them.', 'public', emos(0.39, 0.01, 0.58, 0.21, 0.06, 0.08, 0.02)),
    post('before-sunrise', 'Before Sunrise', 1995, 'This made me feel young in a way I did not expect. Two people listening closely turned an ordinary night into something neither could dismiss. I hope someone who misses being heard finds this through my response. The hope it gave me was fragile, but still real the next morning.', 'public', emos(0.09, 0.59, 0.23, 0.01, 0.02, 0.01, 0.18)),
    post('amelie', 'Amélie', 2001, 'I laughed at the private kindness because it felt familiar, then noticed how often helping from a distance lets me avoid closeness. The film left me playful and slightly exposed. I wanted to do something kind that required me to be present for the answer.', 'public', emos(0.08, 0.71, 0.04, 0.01, 0.03, 0.01, 0.23)),
    post('grand-budapest', 'The Grand Budapest Hotel', 2014, 'I found comfort in someone preserving grace after the world around him stopped rewarding it. The beauty never hid the loss for me; it made the loss more visible. I left feeling warm toward all the small rituals people keep because they remember a kinder world.', 'public', emos(0.16, 0.57, 0.28, 0.01, 0.02, 0.01, 0.14)),
    post('titanic', 'Titanic', 1997, 'I watched this with friends and still felt swept into the reckless hope of choosing one vivid day over a lifetime arranged by other people. The romance was joyful because the limits around it were so real. The grief afterward felt like the cost of briefly becoming free.', 'public', emos(0.07, 0.48, 0.43, 0.03, 0.07, 0.01, 0.18)),
    post('before-sunset', 'Before Sunset', 2004, 'Every polite sentence seemed to be holding back years of longing and the fear of asking for too much. I felt tense watching time pass while honesty kept almost arriving. What stayed was the ache of two people trying to speak before caution made the choice for them again.', 'private', emos(0.12, 0.28, 0.59, 0.02, 0.15, 0.01, 0.08)),
    post('wall-e', 'WALL-E', 2008, 'The loneliness here made the devotion more moving, not less. Care stayed gentle even after years without an answer. I finished hopeful that attention does not have to become possessive just because it has waited a long time to be returned.', 'private', emos(0.08, 0.64, 0.21, 0.01, 0.02, 0.01, 0.17)),
    post('hereditary', 'Hereditary', 2018, 'The family could sit at the same table and still sound like they were calling from separate rooms. That despair reached me before the horror did. I was frightened, but the feeling that followed me home was the loneliness of grief with nowhere safe to land.', 'private', emos(0.04, 0.01, 0.66, 0.17, 0.49, 0.09, 0.03)),
  ],
  tariq_a: [
    post('2001', '2001: A Space Odyssey', 1968, 'I watched this early in the morning with no phone nearby and eventually became still enough to stop demanding an explanation. Not understanding everything felt comforting. The wonder came with a sense of space around my own thoughts. I am sharing this for anyone who wants that kind of quiet awe.', 'public', emos(0.63, 0.03, 0.02, 0.01, 0.05, 0.01, 0.62)),
    post('cure', 'Cure', 1997, 'The dread entered so slowly that I could not tell when the film ended and my own thoughts took over. Nothing felt urgent, which somehow made everything harder to dismiss. I carried its quiet into the hallway and found the ordinary world slightly less familiar.', 'public', emos(0.34, 0.01, 0.05, 0.04, 0.71, 0.16, 0.03)),
    post('before-sunrise', 'Before Sunrise', 1995, 'I felt peaceful listening to two people make room for thoughts that usually pass without a witness. The romance mattered less to me than the patience. By the end, I wanted to give someone else that same unhurried attention.', 'public', emos(0.43, 0.37, 0.18, 0.01, 0.01, 0.01, 0.09)),
    post('shining', 'The Shining', 1980, 'The large empty spaces made every family silence feel heavier. I could feel the place pressing against people who were already coming apart before they arrived. The fear was slow and architectural, but the sadness came from how little refuge they could find in one another.', 'public', emos(0.31, 0.01, 0.17, 0.08, 0.65, 0.08, 0.03)),
    post('godfather', 'The Godfather', 1972, 'I felt a quiet sadness watching someone mistake control for the ability to keep his family close. Every attempt to secure belonging made real closeness less possible. The film left me thinking about how fear can imitate care when nobody is allowed to speak honestly.', 'public', emos(0.48, 0.01, 0.52, 0.14, 0.04, 0.06, 0.02)),
    post('matrix', 'The Matrix', 1999, 'The action woke me up, but the feeling that stayed was recognition. I kept thinking about the small routines I obey simply because they were waiting when I arrived. If someone wants a film that makes the familiar feel newly questionable, this response might bring them here.', 'public', emos(0.22, 0.08, 0.03, 0.21, 0.11, 0.03, 0.59)),
    post('dunkirk', 'Dunkirk', 2017, 'Time felt like physical pressure through this, tightening even when the image looked calm. I noticed my whole body relax whenever another person chose not to look away. The relief came from responsibility passing between strangers, one small decision at a time.', 'private', emos(0.27, 0.02, 0.13, 0.08, 0.61, 0.03, 0.07)),
    post('1917', '1917', 2019, 'I felt exhausted by the distance one person could be asked to cross for lives he would never know. The landscape kept changing, but the burden never became abstract. I finished thinking about duty as something carried in the body rather than spoken in a speech.', 'private', emos(0.31, 0.01, 0.43, 0.14, 0.37, 0.04, 0.04)),
    post('before-sunset', 'Before Sunset', 2004, 'I could feel the clock moving while two people tried to say what years had hidden. The panic stayed quiet, almost polite, which made it worse. I left with the sense that silence can protect a life until the same silence begins to choose that life for you.', 'private', emos(0.34, 0.17, 0.46, 0.02, 0.14, 0.01, 0.06)),
  ],
  rachel_g: [
    post('whiplash', 'Whiplash', 2014, 'I was angry at the promise that suffering would become worthwhile if it produced something impressive enough. The music still pulled excitement out of me, which made the anger sharper. I kept thinking about how often abuse survives by pointing to the result instead of the person it damaged.', 'public', emos(0.04, 0.01, 0.11, 0.79, 0.14, 0.19, 0.03)),
    post('parasite', 'Parasite', 2019, 'The humiliation stayed with me more than the violence. Being reduced to something another person could smell, but refused to understand, felt unbearably intimate. I felt anger, shame, and grief each time comfort protected itself by turning another family into a problem.', 'public', emos(0.04, 0.01, 0.31, 0.67, 0.09, 0.42, 0.04)),
    post('hereditary', 'Hereditary', 2018, 'I expected a frightening family story and found grief already doing most of the damage. Every person needed comfort from someone broken in the same place, so the need kept turning into blame. The horror felt like grief becoming monstrous after it had nowhere else to go.', 'public', emos(0.03, 0.01, 0.54, 0.12, 0.68, 0.13, 0.03)),
    post('saving-private-ryan', 'Saving Private Ryan', 1998, 'I watched this feeling sorrow for the people asked to carry an idea of honor heavier than their own lives. The scale was overwhelming, but individual fear kept breaking through. I am sharing this for anyone seeking a war film that leaves duty feeling costly rather than clean.', 'public', emos(0.05, 0.01, 0.72, 0.39, 0.27, 0.11, 0.02)),
    post('finding-nemo', 'Finding Nemo', 2003, 'This touched the fear of loving someone so much that protection begins to keep them from living. I understood the panic and still felt frustrated by the cage it built. The relief came when care made room for risk, trust, and a life beyond the person doing the worrying.', 'public', emos(0.06, 0.47, 0.25, 0.03, 0.36, 0.01, 0.08)),
    post('godfather', 'The Godfather', 1972, 'Every promise of family began to sound like a demand for silence, obedience, and fear. I felt betrayed on behalf of everyone expected to call that love. What lingered was the way power keeps itself alive by making departure feel like disloyalty.', 'public', emos(0.21, 0.01, 0.46, 0.57, 0.08, 0.16, 0.02)),
    post('before-sunset', 'Before Sunset', 2004, 'I felt frustrated watching honesty arrive only when there was almost no time left to do anything with it. Their restraint was tender, but it also made me angry. So much of the pain came from treating a direct need as something impolite to say aloud.', 'private', emos(0.12, 0.14, 0.59, 0.38, 0.08, 0.03, 0.05)),
    post('dark-knight', 'The Dark Knight', 2008, 'I felt exhausted by the need to prove that people are cruel, especially when that proof became another excuse for cruelty. The fear was not that everyone would fail. It was that one person\'s certainty about failure could make the world more violent before anyone had chosen.', 'private', emos(0.09, 0.01, 0.19, 0.58, 0.31, 0.17, 0.04)),
    post('eternal-sunshine', 'Eternal Sunshine of the Spotless Mind', 2004, 'I recognized the old temptation to call a painful pattern fate because fate asks less of me than choice. The film made repetition feel romantic and frightening at once. I finished wondering which memories I protect because they matter and which ones I use to avoid doing something different.', 'private', emos(0.15, 0.03, 0.61, 0.26, 0.08, 0.05, 0.05)),
  ],
};

// These additional viewings widen the world without inventing a separate
// persona for every feeling. They deliberately vary public/private balance,
// note length, and the kinds of moments people bring to a film.
const ENRICHED_DIARY_SEED_ENTRIES: Record<string, SeedEntry[]> = {
  demo: [
    post('handmaiden', 'The Handmaiden', 2016, 'I expected to be pulled along by the twists, but I kept feeling protective of every private signal between the two women. The relief I felt was not simple happiness. It was the thrill of watching care become a way out.', 'public', emos(0.06, 0.62, 0.12, 0.18, 0.21, 0.08, 0.66)),
    post('farewell-demo', 'The Farewell', 2019, 'I laughed more than I expected, then felt guilty for how familiar the careful pretending was. Love was everywhere here, but so was the loneliness of deciding what another person is allowed to know.', 'public', emos(0.12, 0.32, 0.63, 0.04, 0.05, 0.01, 0.11)),
    post('iron-giant', 'The Iron Giant', 1999, 'I put this on after a long day and thought I wanted nostalgia. What I needed was the small, stubborn idea that gentleness can be chosen even when fear is asking for something easier.', 'private', emos(0.11, 0.58, 0.24, 0.02, 0.08, 0.01, 0.18)),
    post('lobster-demo', 'The Lobster', 2015, 'I kept laughing and then felt uneasy about why. It made loneliness look absurd enough that I could finally recognize some of the rules I accept just to avoid being alone.', 'private', emos(0.19, 0.27, 0.24, 0.09, 0.38, 0.12, 0.47)),
  ],
  clara_valdez: [
    post('frances-ha', 'Frances Ha', 2013, 'I watched this while feeling behind everyone I know, and it made that comparison feel less final. I was happy for her messiness, then sad about how quickly friendship can become something you only remember by its old routines.', 'public', emos(0.18, 0.58, 0.46, 0.01, 0.03, 0.01, 0.24)),
    post('return-to-seoul', 'Return to Seoul', 2022, 'I did not always agree with her, which made the loneliness harder to turn into something tidy. I felt defensive, then protective, then ashamed of needing her grief to look more familiar before I could sit with it.', 'public', emos(0.17, 0.03, 0.64, 0.22, 0.09, 0.05, 0.19)),
    post('petite-maman', 'Petite Maman', 2021, 'This made me miss the version of my mother I never got to meet. The gentleness did not erase the sadness. It gave it somewhere soft to rest for a while.', 'private', emos(0.39, 0.22, 0.66, 0.01, 0.02, 0.01, 0.17)),
  ],
  marcus_k: [
    post('sorry-to-bother-you', 'Sorry to Bother You', 2018, 'I laughed until the laughter started feeling like an alarm. The film made ambition look thrilling and humiliating at the same time, and I kept wondering how often I change my own voice before anyone has to ask.', 'public', emos(0.07, 0.33, 0.11, 0.44, 0.18, 0.28, 0.54)),
    post('contact', 'Contact', 1997, 'Her experience stayed real even when nobody else could verify it. That hit me harder than the aliens did.', 'public', emos(0.42, 0.28, 0.17, 0.02, 0.05, 0.01, 0.68)),
    post('coherence', 'Coherence', 2014, 'I watched this with the lights still on and kept losing track of which small choice had changed everything. The fear was real, but the stranger feeling was how quickly I wanted one version of myself to win.', 'private', emos(0.12, 0.02, 0.08, 0.16, 0.61, 0.08, 0.57)),
    post('first-reformed-marcus', 'First Reformed', 2018, 'I expected heaviness and got something more restless. I felt angry at how easily concern can become a private performance when action would ask more of me than feeling bad.', 'private', emos(0.25, 0.01, 0.42, 0.53, 0.12, 0.09, 0.11)),
  ],
  elena_r: [
    post('fallen-leaves', 'Fallen Leaves', 2023, 'I loved that tiny, awkward hope. Nothing grand, just two people trying again without pretending they know how.', 'public', emos(0.34, 0.62, 0.24, 0.01, 0.03, 0.01, 0.16)),
    post('enough-said', 'Enough Said', 2013, 'I felt relieved by how imperfect everyone was allowed to be. The tenderness came from people admitting that they had already made mistakes and still wanted to try being known.', 'private', emos(0.36, 0.51, 0.29, 0.03, 0.05, 0.01, 0.09)),
  ],
  hiro_s: [
    post('night-house', 'The Night House', 2021, 'I felt frightened by the idea that grief can make a room feel occupied even when nobody is there. The film left me watching corners longer than I meant to, but the sadness was what made the fear feel personal.', 'public', emos(0.12, 0.01, 0.53, 0.08, 0.72, 0.12, 0.17)),
    post('kaguya', 'The Tale of the Princess Kaguya', 2013, 'I was surprised by how angry the beauty made me. Everyone kept calling a life precious while making it smaller and smaller. I felt grief, wonder, and a wish to protect the freedom that had already been taken.', 'public', emos(0.17, 0.08, 0.64, 0.43, 0.07, 0.04, 0.58)),
    post('burning', 'Burning', 2018, 'The uncertainty stayed too close to ordinary life for me. I kept looking for a clean answer, then realized that wanting certainty might be part of what made the tension work.', 'private', emos(0.23, 0.01, 0.12, 0.18, 0.57, 0.09, 0.34)),
  ],
  chloe_d: [
    post('paddington-2', 'Paddington 2', 2017, 'I watched this when I wanted something easy and ended up crying at how seriously it took the effort of being kind. The joy was not sugary. It came from seeing care make a real difference without needing to become grand.', 'public', emos(0.18, 0.82, 0.14, 0.01, 0.02, 0.01, 0.23)),
    post('totoro', 'My Neighbor Totoro', 1988, 'That bus-stop wait felt like care, not filler. I was calmer by the time the catbus arrived.', 'public', emos(0.72, 0.49, 0.17, 0.01, 0.02, 0.01, 0.33)),
    post('sing-street', 'Sing Street', 2016, 'I was happy for the reckless energy of making something before you feel ready. It reminded me that a little embarrassment can be worth surviving if it gets you closer to the life you actually want.', 'public', emos(0.18, 0.75, 0.08, 0.02, 0.12, 0.01, 0.48)),
    post('iron-giant-chloe', 'The Iron Giant', 1999, 'I remembered the big feeling, but not how quietly it earns it. I felt sad, then steadier. It made bravery seem less like force and more like choosing what you refuse to become.', 'private', emos(0.21, 0.44, 0.53, 0.03, 0.06, 0.01, 0.19)),
  ],
  devon_m: [
    post('invisible-man', 'The Invisible Man', 2020, 'I felt tense because the danger kept asking to be explained before it could be believed. The anger arrived when every reasonable response became another way to make her look unreasonable.', 'public', emos(0.04, 0.01, 0.16, 0.69, 0.73, 0.12, 0.1)),
    post('ghost-story', 'A Ghost Story', 2017, 'This was much quieter than I expected, which made the grief harder to avoid. I felt impatient with time at first, then strangely grateful that love can leave a mark even after it no longer has anyone to answer it.', 'private', emos(0.48, 0.08, 0.72, 0.01, 0.03, 0.01, 0.21)),
  ],
  ananya_sen: [
    recentPost('scream', 'Scream', 1996, 'I watched this at a friend\'s birthday and expected to be scared. Mostly I felt delighted by how suspicion became a shared game in the room. I was laughing, jumping, and genuinely happy to be surprised with other people instead of alone.', emos(0.08, 0.86, 0.03, 0.03, 0.17, 0.01, 0.49), 1, { assetPath: '/social/ananya-after-scream-natural.webp', altText: 'Ananya laughing with friends after watching Scream' }),
    post('sorry-we-missed-you', 'Sorry We Missed You', 2019, 'I felt angry at how every promise of flexibility became another way to make a family carry a system\'s failures privately. The film did not let work stay abstract, and I was grateful for that even while it hurt.', 'public', emos(0.12, 0.01, 0.54, 0.78, 0.18, 0.12, 0.04)),
    post('lobster-ananya', 'The Lobster', 2015, 'I laughed at the rules until I recognized how much cruelty can hide inside a rule that everyone agrees to call normal. The absurdity made me angry, but it also made the loneliness easier to see.', 'private', emos(0.21, 0.18, 0.33, 0.47, 0.17, 0.14, 0.46)),
  ],
  lucas_v: [
    post('fall', 'The Fall', 2006, 'I expected spectacle and felt unexpectedly close to the child\'s imagination holding the story together. The beauty made me happy, but it also made the sadness harder to ignore because so much of it was a way of asking someone not to leave.', 'public', emos(0.09, 0.48, 0.55, 0.03, 0.04, 0.01, 0.71)),
    post('holdovers', 'The Holdovers', 2023, 'Three people being terrible at caring, then doing it anyway. I laughed a lot and got embarrassingly warm about it.', 'public', emos(0.27, 0.67, 0.27, 0.04, 0.02, 0.01, 0.22)),
    post('conversation', 'The Conversation', 1974, 'I felt less scared by the uncertainty than by the pressure to turn another person into something I could fully know. The film made listening feel close to theft when care was not part of it.', 'private', emos(0.24, 0.01, 0.17, 0.19, 0.63, 0.14, 0.35)),
  ],
  sarah_m: [
    post('half-of-it', 'The Half of It', 2020, 'The letters felt tender and a little unfair. I loved them, but kept noticing who disappeared inside whose words.', 'public', emos(0.22, 0.44, 0.52, 0.02, 0.05, 0.01, 0.21)),
    post('paterson', 'Paterson', 2016, 'I felt protective of the ordinary life in this. Nothing huge had to happen for attention to matter. It made me want to notice what someone I love repeats without realizing it.', 'private', emos(0.67, 0.32, 0.16, 0.01, 0.02, 0.01, 0.19)),
  ],
  tariq_a: [
    post('drive-my-car', 'Drive My Car', 2021, 'I felt the relief of two people making room for a truth without demanding it arrive quickly. The sadness stayed, but it was less lonely once someone else could sit beside it without trying to fix it.', 'public', emos(0.54, 0.14, 0.68, 0.01, 0.04, 0.01, 0.18)),
    post('green-knight', 'The Green Knight', 2021, 'I thought I wanted a clear test of courage. Instead, I felt uneasy about how badly I wanted someone to become heroic in a way that would excuse everything before it.', 'public', emos(0.24, 0.05, 0.16, 0.11, 0.41, 0.06, 0.62)),
    post('first-reformed', 'First Reformed', 2018, 'I left this feeling the difference between despair and responsibility without knowing how to hold either one. The quiet made me listen to my own excuses more closely.', 'private', emos(0.39, 0.01, 0.58, 0.36, 0.16, 0.08, 0.13)),
    post('octopus-teacher', 'My Octopus Teacher', 2020, 'I felt embarrassed by how quickly I wanted the connection to prove something about me. What moved me was smaller: attention changing the shape of an ordinary day.', 'private', emos(0.45, 0.42, 0.19, 0.01, 0.02, 0.01, 0.44)),
  ],
  rachel_g: [
    post('minari', 'Minari', 2021, 'I felt how much love can sound like criticism inside a family that is tired and scared. The small acts of care mattered because nobody was very good at asking for them directly.', 'public', emos(0.23, 0.39, 0.58, 0.06, 0.08, 0.01, 0.18)),
    post('quiet-girl', 'The Quiet Girl', 2022, 'Being expected back. That tiny detail got me. I felt sad for what she had missed and relieved she could recognize care.', 'public', emos(0.42, 0.52, 0.61, 0.01, 0.03, 0.01, 0.16)),
    post('single-man', 'A Single Man', 2009, 'I felt the effort of moving through a normal day when grief has made every ordinary task feel staged. The beauty did not make the pain easier. It made me notice how carefully a person can keep going while almost disappearing.', 'private', emos(0.37, 0.08, 0.73, 0.03, 0.05, 0.01, 0.12)),
  ],
};

// One current public response from every community member keeps the signed-in
// streams alive while preserving the older viewing history that powers overlap.
// These are deliberately all films the demo has not logged, so they become
// legible person-led paths rather than duplicate recommendations.
const CURRENT_PUBLIC_RESPONSES: Record<string, SeedEntry[]> = {
  clara_valdez: [
    recentPost('worst-person-world', 'The Worst Person in the World', 2021, 'I expected a story about indecision and felt something kinder. I recognized how a life can keep changing shape before you have the language to defend it. The uncertainty made me sad, but it also gave me permission to stop treating every unfinished choice as a failure.', emos(0.24, 0.2, 0.58, 0.04, 0.03, 0.01, 0.18), 4, { assetPath: '/social/clara-after-worst-person-world-natural.webp', altText: 'Clara pulling on a scarf while talking with friends after The Worst Person in the World' }),
  ],
  marcus_k: [
    recentPost('after-yang', 'After Yang', 2022, 'I kept waiting for the loss to announce itself, but it arrived through ordinary routines that no longer had anyone inside them. I felt curious about memory and then quietly sad about how much of a person lives in the attention they give a household. The gentleness stayed with me.', emos(0.34, 0.14, 0.61, 0.02, 0.03, 0.01, 0.24), 4, { assetPath: '/social/marcus-after-after-yang-natural.webp', altText: 'Marcus pausing over a family photo after watching After Yang' }),
  ],
  elena_r: [
    recentPost('perfect-days', 'Perfect Days', 2023, 'I watched this on a day that had felt too repetitive and left noticing my own routines differently. The film made a small life feel spacious without pretending it was easy. I felt calm, then grateful for the ordinary moments I usually rush past before I can see them.', emos(0.68, 0.36, 0.11, 0.01, 0.02, 0.01, 0.27), 4, { assetPath: '/social/elena-after-perfect-days-natural.webp', altText: 'Elena watering plants after watching Perfect Days' }),
  ],
  hiro_s: [
    recentPost('others', 'The Others', 2001, 'I knew the house was wrong before I knew why. Quiet fear, then a sadness I was not ready for.', emos(0.23, 0.01, 0.28, 0.06, 0.74, 0.14, 0.08), 3, { assetPath: '/social/hiro-after-others-natural.webp', altText: 'Hiro reaching for the hallway light after watching The Others' }),
  ],
  chloe_d: [
    recentPost('kikis-delivery-service', "Kiki's Delivery Service", 1989, 'I was tired of making everything urgent. Kiki did not fix me, but she made rest feel less like failure.', emos(0.18, 0.73, 0.13, 0.01, 0.04, 0.01, 0.32), 3, { assetPath: '/social/chloe-after-kikis-delivery-service-natural.webp', altText: 'Chloe closing her sketchbook while a cat crosses the couch after Kiki\'s Delivery Service' }),
  ],
  devon_m: [
    recentPost('babadook', 'The Babadook', 2014, 'I thought I was ready for a frightening film and mostly felt grief refusing to stay private. The fear worked because it made exhaustion visible. I left unsettled, but also relieved by the idea that love can remain present even when it does not make pain disappear.', emos(0.09, 0.02, 0.62, 0.1, 0.67, 0.11, 0.05), 3, { assetPath: '/social/devon-after-babadook-natural.webp', altText: 'Devon sitting on the floor after watching The Babadook' }),
  ],
  ananya_sen: [
    recentPost('hidden-life', 'A Hidden Life', 2019, 'I felt angry at how much harm could be made to look ordinary when everyone around it asks for obedience. The silence was not empty. It was full of people being asked to carry what they were never allowed to name. I finished wanting attention to become a form of refusal.', emos(0.16, 0.01, 0.31, 0.78, 0.12, 0.18, 0.04), 2),
  ],
  lucas_v: [
    recentPost('truman-show', 'The Truman Show', 1998, 'I was amused at first and then felt unexpectedly protective of someone whose whole life had been turned into other people\'s comfort. The escape mattered, but the feeling I kept was the right to have a private thought without an audience waiting to use it.', emos(0.15, 0.18, 0.19, 0.18, 0.24, 0.08, 0.64), 2, { assetPath: '/social/lucas-after-truman-show-natural.webp', altText: 'Lucas pulling on his jacket while talking with friends after The Truman Show' }),
  ],
  sarah_m: [
    recentPost('columbus', 'Columbus', 2017, 'I felt close to the way a place can hold a conversation that people are not ready to have directly. The stillness gave every small choice room to matter. I left with a tender kind of hope about two people being honest without needing to solve each other.', emos(0.44, 0.34, 0.26, 0.01, 0.03, 0.01, 0.22), 2, { assetPath: '/social/sarah-after-columbus-natural.webp', altText: 'Sarah listening at an open balcony door after watching Columbus' }),
  ],
  tariq_a: [
    recentPost('lives-of-others', 'The Lives of Others', 2006, 'I expected the surveillance to make me only afraid, but I kept thinking about the private cost of witnessing another person closely enough to care. The film left me tense and sad, then moved by the possibility that attention can become a choice to protect someone.', emos(0.26, 0.08, 0.43, 0.11, 0.54, 0.09, 0.16), 2, { assetPath: '/social/tariq-after-lives-of-others-natural.webp', altText: 'Tariq holding a notebook during a conversation after The Lives of Others' }),
  ],
  rachel_g: [
    recentPost('farewell', 'The Farewell', 2019, 'I recognized the strange ache of a family trying to protect someone while also protecting itself from saying what hurts. I laughed, then felt the sadness underneath every careful gesture. The love was real, but so was the loneliness of carrying it indirectly.', emos(0.19, 0.24, 0.63, 0.03, 0.04, 0.01, 0.12), 1, { assetPath: '/social/rachel-after-farewell-natural.webp', altText: 'Rachel wiping her eye while family clears the table after The Farewell' }),
  ],
};

const DIARY_SEED_ENTRIES: Record<string, SeedEntry[]> = Object.fromEntries(
  Object.entries(BASE_DIARY_SEED_ENTRIES).map(([username, entries]) => [
    username,
    [...entries, ...(ENRICHED_DIARY_SEED_ENTRIES[username] || []), ...(CURRENT_PUBLIC_RESPONSES[username] || [])],
  ]),
);

// The schema keeps comments intentionally flat. Adjacent comments on a response
// therefore form a legible conversational exchange without adding artificial
// reply machinery to the product just for the seed world.
const SEED_COMMENTS: SeedComment[] = [
  { author: 'demo', entryOwner: 'ananya_sen', entryKey: 'scream', body: 'You making the fear feel shared rather than isolating explains why I want to watch this with people instead of saving it for a night alone.' },
  { author: 'ananya_sen', entryOwner: 'ananya_sen', entryKey: 'scream', body: 'Exactly. Nobody had to prove they could handle it. We just kept laughing and jumping together.' },
  { author: 'elena_r', entryOwner: 'clara_valdez', entryKey: 'frances-ha', body: 'The sadness around friendship changing shape stayed with me. I like that you did not make the unfinished part sound like a personal failure.' },
  { author: 'clara_valdez', entryOwner: 'clara_valdez', entryKey: 'frances-ha', body: 'That is what I needed too. I can be grateful for who someone was to me without pretending the old version of us is still waiting somewhere.' },
  { author: 'ananya_sen', entryOwner: 'devon_m', entryKey: 'invisible-man', body: 'The demand for a perfect explanation before belief is exactly what made me angry. Your response kept the harm from becoming an abstract idea.' },
  { author: 'devon_m', entryOwner: 'devon_m', entryKey: 'invisible-man', body: 'I kept thinking about how exhaustion becomes evidence against someone when they are already being asked to explain the impossible with perfect calm.' },
  { author: 'sarah_m', entryOwner: 'chloe_d', entryKey: 'paddington-2', body: 'I needed your distinction between kindness and sugariness. The care works because people actually risk being inconvenienced by one another.' },
  { author: 'chloe_d', entryOwner: 'chloe_d', entryKey: 'paddington-2', body: 'Exactly. Kindness costs them time, which is why it lands.' },
  { author: 'rachel_g', entryOwner: 'tariq_a', entryKey: 'drive-my-car', body: 'The permission not to make sadness arrive quickly was what I felt too. It made listening seem more active than finding the right response.' },
  { author: 'tariq_a', entryOwner: 'tariq_a', entryKey: 'drive-my-car', body: 'I am still trying to learn that difference.' },
  { author: 'clara_valdez', entryOwner: 'hiro_s', entryKey: 'kaguya', body: 'Your anger at a life being called precious while it is narrowed made the sadness sharper for me. I had been feeling only the loss.' },
  { author: 'hiro_s', entryOwner: 'hiro_s', entryKey: 'kaguya', body: 'I felt that split too. The beauty kept making the confinement more visible, which was hard but also why I could not stop thinking about it.' },
  { author: 'marcus_k', entryOwner: 'lucas_v', entryKey: 'fall', body: 'The child holding the story together changed the scale for me. It made the bright images feel less like escape and more like someone trying to keep another person close.' },
  { author: 'lucas_v', entryOwner: 'lucas_v', entryKey: 'fall', body: 'That is exactly it. I was enjoying the size of it until I noticed how much of the imagination was asking for care in a language adults could miss.' },
  { author: 'sarah_m', entryOwner: 'rachel_g', entryKey: 'minari', body: 'The way love sounds like criticism in a tired family felt painfully familiar. Your note made me think about how care can arrive wearing the wrong voice.' },
  { author: 'rachel_g', entryOwner: 'rachel_g', entryKey: 'minari', body: 'That phrasing helps. I think I was moved because nobody had a clean way to love one another, but the trying was still there in the mess.' },
  { author: 'ananya_sen', entryOwner: 'demo', entryKey: 'whiplash', body: 'Same. I hated how thrilled I was. That rush felt like evidence against me.' },
  { author: 'clara_valdez', entryOwner: 'demo', entryKey: 'eternal-sunshine', body: 'That protectiveness got me too. Even the memories I want gone still prove I cared.' },
  { author: 'lucas_v', entryOwner: 'marcus_k', entryKey: 'contact', body: 'Yes. Her experience stayed real even when nobody else could certify it.' },
  { author: 'clara_valdez', entryOwner: 'sarah_m', entryKey: 'half-of-it', body: 'That line about disappearing inside someone else\'s words got me. Tender, but not harmless.' },
  { author: 'rachel_g', entryOwner: 'ananya_sen', entryKey: 'sorry-we-missed-you', body: 'The family carrying the system privately is exactly it. I was furious.' },
  { author: 'sarah_m', entryOwner: 'elena_r', entryKey: 'fallen-leaves', body: 'Embarrassingly small is perfect. Big hope would have broken the spell for me.' },
  { author: 'demo', entryOwner: 'chloe_d', entryKey: 'totoro', body: 'That bus-stop wait. I never thought of it as care, but now I cannot unsee it.' },
  { author: 'tariq_a', entryOwner: 'rachel_g', entryKey: 'quiet-girl', body: 'Being expected back. Yep. That tiny detail wrecked me.' },
];

const SAVED_FILMS: Record<string, { title: string; year: number }[]> = Object.fromEntries(
  Object.entries(DIARY_SEED_ENTRIES).map(([username, entries]) => [
    username,
    [...new Map(entries.map(entry => [`${entry.title}|||${entry.year}`, { title: entry.title, year: entry.year }])).values()]
      .slice(username === 'demo' ? 0 : 2, username === 'demo' ? 10 : 7 + (username.length % 2)),
  ]),
);

const FOLLOW_PLAN = [
  ['demo', 'clara_valdez'], ['demo', 'marcus_k'], ['demo', 'elena_r'],
  ['clara_valdez', 'elena_r'], ['clara_valdez', 'ananya_sen'],
  ['marcus_k', 'hiro_s'], ['marcus_k', 'chloe_d'], ['marcus_k', 'lucas_v'],
  ['elena_r', 'clara_valdez'], ['elena_r', 'chloe_d'],
  ['hiro_s', 'devon_m'], ['hiro_s', 'tariq_a'],
  ['chloe_d', 'marcus_k'], ['chloe_d', 'lucas_v'], ['chloe_d', 'sarah_m'],
  ['devon_m', 'hiro_s'], ['devon_m', 'lucas_v'], ['devon_m', 'ananya_sen'],
  ['ananya_sen', 'clara_valdez'], ['ananya_sen', 'elena_r'], ['ananya_sen', 'lucas_v'],
  ['lucas_v', 'chloe_d'], ['lucas_v', 'devon_m'],
  ['sarah_m', 'elena_r'], ['sarah_m', 'chloe_d'], ['sarah_m', 'rachel_g'],
  ['tariq_a', 'clara_valdez'], ['tariq_a', 'ananya_sen'], ['tariq_a', 'hiro_s'],
  ['rachel_g', 'ananya_sen'], ['rachel_g', 'tariq_a'], ['rachel_g', 'sarah_m'],
] as const;

const ensureSocialSchema = async (client: ConnectedDatabaseClient) => {
  await client.query('ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS seed_key VARCHAR(160)');
  await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_diary_entries_seed_key ON diary_entries(seed_key) WHERE seed_key IS NOT NULL');
  await client.query('ALTER TABLE entry_comments ADD COLUMN IF NOT EXISTS seed_key VARCHAR(200)');
  await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_entry_comments_seed_key ON entry_comments(seed_key) WHERE seed_key IS NOT NULL');
  await client.query(`
    CREATE TABLE IF NOT EXISTS entry_media (
      entry_id BIGINT NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
      kind VARCHAR(24) NOT NULL CHECK (kind IN ('expression_photo')),
      asset_path TEXT NOT NULL,
      alt_text VARCHAR(240) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (entry_id, kind)
    )
  `);
  await client.query('ALTER TABLE entry_media ALTER COLUMN asset_path TYPE TEXT');
};

const resolveMovieByTitleAndYear = async (client: ConnectedDatabaseClient, title: string, year: number) => {
  const existing = await client.query(
    'SELECT id, tmdb_data FROM movies WHERE LOWER(title) = LOWER($1) AND EXTRACT(YEAR FROM release_date) = $2 ORDER BY id LIMIT 1',
    [title, year],
  );
  if (existing.rowCount && existing.rows[0].tmdb_data) return existing.rows[0].tmdb_data;

  const search = await axios.get<{ results: Array<{ id: number; title: string; release_date?: string; vote_count?: number; popularity?: number }> }>(`${TMDB_BASE_URL}/search/movie`, {
    params: { api_key: TMDB_API_KEY, query: title, primary_release_year: year },
  });
  const results = search.data.results || [];
  const comparableTitle = (value: string) => value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  const exact = results
    .filter(movie => comparableTitle(movie.title) === comparableTitle(title)
      && Number(movie.release_date?.slice(0, 4)) === year)
    .sort((left, right) => (right.vote_count || 0) - (left.vote_count || 0)
      || (right.popularity || 0) - (left.popularity || 0));
  const match = exact[0];
  if (!match) throw new Error(`No exact TMDB result for "${title}" (${year})`);

  const detailsResponse = await axios.get<Record<string, any>>(`${TMDB_BASE_URL}/movie/${match.id}`, { params: { api_key: TMDB_API_KEY } });
  const details = detailsResponse.data;
  const genreIds = details.genre_ids?.length ? details.genre_ids : details.genres?.map((genre: { id: number }) => genre.id) || [];
  await client.query(
    `INSERT INTO movies (id, title, overview, release_date, poster_path, backdrop_path, vote_average, vote_count, popularity, runtime, tmdb_data)
     VALUES ($1,$2,$3,NULLIF($4,'')::date,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title, overview = EXCLUDED.overview, release_date = EXCLUDED.release_date,
       poster_path = EXCLUDED.poster_path, backdrop_path = EXCLUDED.backdrop_path,
       vote_average = EXCLUDED.vote_average, vote_count = EXCLUDED.vote_count,
       popularity = EXCLUDED.popularity, runtime = EXCLUDED.runtime,
       tmdb_data = EXCLUDED.tmdb_data, last_updated = CURRENT_TIMESTAMP`,
    [details.id, details.title, details.overview || '', details.release_date || '', details.poster_path,
      details.backdrop_path, details.vote_average || 0, details.vote_count || 0, details.popularity || 0,
      details.runtime || null, JSON.stringify({ ...details, genre_ids: genreIds })],
  );
  for (const genreId of genreIds) {
    await client.query(
      'INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [details.id, genreId],
    );
  }
  return { ...details, genre_ids: genreIds };
};

const seedDate = (position: number, streamDay?: number) => {
  const date = new Date(`${SEED_REFERENCE_DATE}T12:00:00.000Z`);
  if (streamDay) {
    date.setUTCDate(date.getUTCDate() - streamDay);
    return date.toISOString().slice(0, 10);
  }
  date.setUTCDate(date.getUTCDate() - (5 + ((position * 37) % 520)));
  return date.toISOString().slice(0, 10);
};

const seedTimestamp = (position: number, streamDay?: number) => {
  const date = seedDate(position, streamDay);
  const hour = 8 + (position * 7) % 12;
  const minute = (position * 17) % 60;
  return `${date} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
};

const seedCommentTimestamp = (position: number) => {
  const date = new Date(`${SEED_REFERENCE_DATE}T21:10:00.000Z`);
  date.setUTCMinutes(date.getUTCMinutes() + position * 3);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const stableOrder = (value: string) => {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const seed = async () => {
  if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY is required to seed film metadata.');
  await initializeDatabase();
  const client = await pool.connect();
  try {
    console.log('Starting social seed transaction...');
    await client.query('BEGIN');
    await ensureSocialSchema(client);

    const usernameToId = new Map<string, number>();
    const emailToId = new Map<string, number>();
    for (const user of SEED_USERS) {
      const existing = await client.query(
        'SELECT id, username, password_hash, bio FROM users WHERE email = $1',
        [user.email],
      );
      let id: number;
      if (existing.rowCount) {
        const current = existing.rows[0];
        if (current.username !== user.username || current.bio !== user.bio || current.password_hash !== DEMO_ONLY_PASSWORD_HASH) {
          const updated = await client.query(
            `UPDATE users SET username = $2, password_hash = $3, bio = $4, updated_at = CURRENT_TIMESTAMP
             WHERE email = $1 RETURNING id`,
            [user.email, user.username, DEMO_ONLY_PASSWORD_HASH, user.bio],
          );
          id = Number(updated.rows[0].id);
        } else {
          id = Number(current.id);
        }
      } else {
        const inserted = await client.query(
          `INSERT INTO users (email, username, password_hash, bio)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [user.email, user.username, DEMO_ONLY_PASSWORD_HASH, user.bio],
        );
        id = Number(inserted.rows[0].id);
      }
      usernameToId.set(user.username, id);
      emailToId.set(user.email, id);
    }

    const allPlans = Object.entries(DIARY_SEED_ENTRIES)
      .flatMap(([username, entries]) => entries.map(entry => ({ username, ...entry })))
      .sort((left, right) => stableOrder(`${left.username}:${left.key}`) - stableOrder(`${right.username}:${right.key}`));

    const movieCache = new Map<string, { id: number }>();
    const moviePlans = new Map<string, { title: string; year: number }>();
    allPlans.forEach(entry => moviePlans.set(`${entry.title}|||${entry.year}`, entry));
    Object.values(SAVED_FILMS).flat().forEach(entry => moviePlans.set(`${entry.title}|||${entry.year}`, entry));
    for (const [movieKey, movie] of moviePlans) {
      movieCache.set(movieKey, await resolveMovieByTitleAndYear(client, movie.title, movie.year));
    }

    const publicEntryIds: number[] = [];
    const publicSeedKeysByEntryId = new Map<number, string>();
    const activeSeedKeys: string[] = [];
    const entryIdsBySeedKey = new Map<string, number>();
    for (const [username, entries] of Object.entries(DIARY_SEED_ENTRIES)) {
      const userId = usernameToId.get(username);
      if (!userId) throw new Error(`Missing seed user ${username}`);
      const existing = await client.query(
        `SELECT id, movie_id, seed_key FROM diary_entries
         WHERE user_id = $1
         ORDER BY id`,
        [userId],
      );
      const claimed = new Set<number>();

      for (const plan of entries) {
        const seedKey = `${SEED_PREFIX}${username}:${plan.key}`;
        activeSeedKeys.push(seedKey);
        const movie = movieCache.get(`${plan.title}|||${plan.year}`);
        if (!movie) throw new Error(`Missing resolved film ${plan.title} (${plan.year})`);
        const globalPosition = allPlans.findIndex(entry => entry.username === username && entry.key === plan.key);
        let row = existing.rows.find(item => item.seed_key === seedKey && !claimed.has(Number(item.id)));
        row ||= existing.rows.find(item => item.seed_key === null && Number(item.movie_id) === movie.id && !claimed.has(Number(item.id)));
        row ||= existing.rows.find(item => item.seed_key === null && !claimed.has(Number(item.id)));

        let entryId: number;
        if (row) {
          entryId = Number(row.id);
          claimed.add(entryId);
          await client.query(
            `UPDATE diary_entries SET
               seed_key = $2, movie_id = $3, watched_on = $4, rating = NULL,
               note = $5, visibility = $6,
               neutral = $7, happy = $8, sad = $9, angry = $10,
               fearful = $11, disgusted = $12, surprised = $13,
               capture_method = 'manual', confidence = 1, created_at = $14
             WHERE id = $1`,
            [entryId, seedKey, movie.id, seedDate(globalPosition, plan.streamDay), plan.note, plan.visibility,
              plan.emotions.neutral, plan.emotions.happy, plan.emotions.sad, plan.emotions.angry,
              plan.emotions.fearful, plan.emotions.disgusted, plan.emotions.surprised, seedTimestamp(globalPosition, plan.streamDay)],
          );
        } else {
          const inserted = await client.query(
            `INSERT INTO diary_entries (
               seed_key, user_id, movie_id, watched_on, rating, note, visibility,
               neutral, happy, sad, angry, fearful, disgusted, surprised,
               capture_method, confidence, created_at, updated_at
             ) VALUES ($1,$2,$3,$4,NULL,$5,$6,$7,$8,$9,$10,$11,$12,$13,'manual',1,$14,$14)
             RETURNING id`,
            [seedKey, userId, movie.id, seedDate(globalPosition, plan.streamDay), plan.note, plan.visibility,
              plan.emotions.neutral, plan.emotions.happy, plan.emotions.sad, plan.emotions.angry,
              plan.emotions.fearful, plan.emotions.disgusted, plan.emotions.surprised, seedTimestamp(globalPosition, plan.streamDay)],
          );
          entryId = Number(inserted.rows[0].id);
        }

        entryIdsBySeedKey.set(seedKey, entryId);

        if (plan.expressionPhoto) {
          await client.query(
            `INSERT INTO entry_media (entry_id, kind, asset_path, alt_text)
             VALUES ($1, 'expression_photo', $2, $3)
             ON CONFLICT (entry_id, kind) DO UPDATE SET
               asset_path = EXCLUDED.asset_path, alt_text = EXCLUDED.alt_text,
               updated_at = entry_media.updated_at`,
            [entryId, plan.expressionPhoto.assetPath, plan.expressionPhoto.altText],
          );
        } else {
          await client.query("DELETE FROM entry_media WHERE entry_id = $1 AND kind = 'expression_photo'", [entryId]);
        }
        if (plan.visibility === 'public') {
          publicEntryIds.push(entryId);
          publicSeedKeysByEntryId.set(entryId, seedKey);
        }
      }

      await client.query(
        `UPDATE diary_entries SET visibility = 'private', rating = NULL, capture_method = 'manual', confidence = 1
         WHERE user_id = $1 AND (seed_key IS NULL OR (seed_key LIKE $2 AND NOT (seed_key = ANY($3::text[]))))`,
        [userId, `${SEED_PREFIX}${username}:%`, activeSeedKeys],
      );
    }

    for (const [username, films] of Object.entries(SAVED_FILMS)) {
      const userId = usernameToId.get(username);
      if (!userId) continue;
      for (const film of films) {
        const movie = movieCache.get(`${film.title}|||${film.year}`);
        if (!movie) continue;
        await client.query(
          `INSERT INTO saved_films (user_id, movie_id, created_at)
           VALUES ($1,$2,$3) ON CONFLICT (user_id, movie_id) DO NOTHING`,
          [userId, movie.id, `${SEED_REFERENCE_DATE} 12:00:00`],
        );
      }
    }

    for (const [follower, followed] of FOLLOW_PLAN) {
      const followerId = usernameToId.get(follower);
      const followedId = usernameToId.get(followed);
      if (!followerId || !followedId) throw new Error(`Invalid follow plan ${follower} -> ${followed}`);
      await client.query(
        `INSERT INTO follows (follower_id, followed_id, created_at)
         VALUES ($1,$2,$3) ON CONFLICT (follower_id, followed_id) DO NOTHING`,
        [followerId, followedId, `${SEED_REFERENCE_DATE} 12:00:00`],
      );
    }

    const seedUserIds = [...emailToId.values()];
    const activeCommentSeedKeys = SEED_COMMENTS.map((comment, index) => `${SEED_PREFIX}comment:${index}:${comment.author}`);
    // Versions before 2.3 did not mark seed-owned comments. Their timestamps
    // were intentionally reserved, so this one-time reconciliation removes
    // only those synthetic legacy rows without touching a real person's words.
    await client.query(
      `DELETE FROM entry_comments
       WHERE seed_key IS NULL
         AND user_id = ANY($1::int[])
         AND created_at >= $2::timestamp
         AND created_at < ($2::timestamp + INTERVAL '1 day')`,
      [seedUserIds, `${SEED_REFERENCE_DATE} 00:00:00`],
    );
    await client.query(
      `DELETE FROM entry_comments
       WHERE seed_key LIKE $1 AND NOT (seed_key = ANY($2::text[]))`,
      [`${SEED_PREFIX}comment:%`, activeCommentSeedKeys],
    );
    for (let index = 0; index < SEED_COMMENTS.length; index += 1) {
      const comment = SEED_COMMENTS[index];
      const authorId = usernameToId.get(comment.author);
      const entryId = entryIdsBySeedKey.get(`${SEED_PREFIX}${comment.entryOwner}:${comment.entryKey}`);
      const createdAt = seedCommentTimestamp(index);
      const commentSeedKey = activeCommentSeedKeys[index];
      if (!authorId || !entryId) throw new Error(`Invalid seed comment target ${comment.author} -> ${comment.entryOwner}:${comment.entryKey}`);

      await client.query(
        `INSERT INTO entry_comments (seed_key, user_id, entry_id, body, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$5)
         ON CONFLICT (seed_key) WHERE seed_key IS NOT NULL DO UPDATE SET
           user_id = EXCLUDED.user_id, entry_id = EXCLUDED.entry_id,
           body = EXCLUDED.body, created_at = EXCLUDED.created_at,
           updated_at = entry_comments.updated_at`,
        [commentSeedKey, authorId, entryId, comment.body, createdAt],
      );
    }
    await client.query(
      `DELETE FROM entry_reactions
       WHERE user_id = ANY($1::int[])
         AND entry_id = ANY($2::bigint[])`,
      [seedUserIds, publicEntryIds],
    );
    await client.query(
      `DELETE FROM entry_reactions
       WHERE user_id = ANY($1::int[])
         AND entry_id IN (SELECT id FROM diary_entries WHERE visibility = 'private')`,
      [seedUserIds],
    );
    for (let index = 0; index < publicEntryIds.length; index += 1) {
      if (index % 10 >= 7) continue;
      const entryId = publicEntryIds[index];
      const author = await client.query('SELECT user_id FROM diary_entries WHERE id = $1', [entryId]);
      const possible = seedUserIds.filter(id => id !== Number(author.rows[0].user_id));
      const reactionTotal = 1 + stableOrder(publicSeedKeysByEntryId.get(entryId) || String(index)) % 5;
      for (let offset = 0; offset < reactionTotal; offset += 1) {
        const reactorId = possible[(index * 3 + offset * 5) % possible.length];
        await client.query(
          `INSERT INTO entry_reactions (user_id, entry_id, created_at)
           VALUES ($1,$2,$3) ON CONFLICT (user_id, entry_id) DO NOTHING`,
          [reactorId, entryId, `${SEED_REFERENCE_DATE} 12:00:00`],
        );
      }
    }

    await client.query('COMMIT');

    const counts = await pool.query(
      `SELECT
         COUNT(DISTINCT de.user_id)::int AS accounts,
         COUNT(DISTINCT de.movie_id)::int AS films,
         COUNT(*)::int AS responses,
         COUNT(*) FILTER (WHERE de.visibility = 'public')::int AS public_posts,
         COUNT(em.entry_id)::int AS expression_photos,
         (SELECT COUNT(*)::int FROM saved_films WHERE user_id = ANY($1::int[])) AS saved_films,
         (SELECT COUNT(*)::int FROM follows WHERE follower_id = ANY($1::int[])) AS follows,
         (SELECT COUNT(*)::int FROM entry_reactions WHERE user_id = ANY($1::int[])) AS likes,
         (SELECT COUNT(*)::int FROM entry_comments WHERE seed_key LIKE $4 AND entry_id = ANY($3::bigint[])) AS comments
       FROM diary_entries de
       LEFT JOIN entry_media em ON em.entry_id = de.id AND em.kind = 'expression_photo'
       WHERE de.seed_key = ANY($2::text[])`,
      [seedUserIds, activeSeedKeys, publicEntryIds, `${SEED_PREFIX}comment:%`],
    );
    const result = counts.rows[0];
    console.log('\nSocial seed complete');
    console.log(`Accounts: ${result.accounts}`);
    console.log(`Films: ${result.films}`);
    console.log(`Responses: ${result.responses}`);
    console.log(`Public posts: ${result.public_posts}`);
    console.log(`Expression photos: ${result.expression_photos}`);
    console.log(`Saved films: ${result.saved_films}`);
    console.log(`Follows: ${result.follows}`);
    console.log(`Likes: ${result.likes}`);
    console.log(`Comments: ${result.comments}`);
    console.log('Run npm run seed:verify to verify the social seed contract.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (typeof require !== 'undefined' && require.main === module) {
  void seed()
    .catch(() => {
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
