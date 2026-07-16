import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Compass,
  Film,
  Image as ImageIcon,
  Library,
  LockKeyhole,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { Navigate, useOutletContext } from 'react-router-dom';
import HeroIdentity from '../components/landing/HeroIdentity';
import InkBleed from '../components/landing/InkBleed';
import { LayoutOutletContext } from '../components/layout/Layout';
import { useUser } from '../contexts/UserContext';
import { CommunityEntry, discoveryService } from '../services/discoveryService';
import { EmotionScores } from '../types/emotion';
import { emotionColors, imageUrl } from '../utils/display';
import './HomeLanding.css';

const emotionKeys = Object.keys(emotionColors) as (keyof EmotionScores)[];

interface LandingMoment extends Partial<EmotionScores> {
  id: number | string;
  username: string;
  title: string;
  note: string;
  poster_path: string;
  feeling: string;
}

interface HeroBeat {
  meta: string;
  context: string;
  note: React.ReactNode;
  feeling: string;
  scores: Partial<EmotionScores>;
  film: {
    title: string;
    year: number;
    poster: string | null;
    backdrop: string | null;
  };
  reaction: {
    src: string;
    caption: string;
  };
}

const pastLivesPoster = imageUrl('/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg', 'w500');
const whiplashPoster = imageUrl('/7fn624j5lj3xTme2SgiLCeuedmO.jpg', 'w500');
const screamPoster = imageUrl('/lr9ZIrmuwVmZhpZuTCW8D9g0ZJe.jpg', 'w500');

const cureFeelings: Partial<EmotionScores> = { neutral: 0.29, fearful: 0.76, disgusted: 0.19 };
const pastLivesFeelings: Partial<EmotionScores> = { neutral: 0.16, happy: 0.08, sad: 0.77, surprised: 0.06 };
const sharedWhiplashFeelings: Partial<EmotionScores> = { angry: 0.74, fearful: 0.18, disgusted: 0.12 };
const screamFeelings: Partial<EmotionScores> = { happy: 0.78, fearful: 0.27, surprised: 0.32 };

const heroBeats: HeroBeat[] = [
  {
    meta: '@hiro_s',
    context: 'Cure · 11:42 PM',
    note: <>I watched it alone, expecting a clean scare. Instead the ordinary rooms made me tense, and I kept wondering how little distance there might be between a person and becoming unrecognizable.</>,
    feeling: 'Stillness · Tension · Unease',
    scores: cureFeelings,
    film: {
      title: 'Cure',
      year: 1997,
      poster: imageUrl('/xNVJr9q6AtSbjosS6Ed9YirOkSo.jpg', 'w500'),
      backdrop: imageUrl('/xxIRKSd9LmHojUD5grvMuGypwVC.jpg', 'w1280'),
    },
    reaction: {
      src: '/social/hiro-after-cure-natural.webp',
      caption: 'Hiro, a few minutes later',
    },
  },
  {
    meta: 'For you',
    context: 'Get Out · from Hiro',
    note: <>Hiro found the same slow unease in <em>Get Out</em>. Every polite gesture seems to close one more exit. His words, not its genre, are why it reaches you.</>,
    feeling: 'Quiet dread · Friction · Recognition',
    scores: { angry: 0.39, fearful: 0.78, disgusted: 0.21 },
    film: {
      title: 'Get Out',
      year: 2017,
      poster: imageUrl('/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg', 'w500'),
      backdrop: imageUrl('/o8dPH0ZSIyyViP6rjRX1djwCUwI.jpg', 'w1280'),
    },
    reaction: {
      src: '/social/hiro-after-cure-natural.webp',
      caption: 'A film carried by Hiro’s response',
    },
  },
  {
    meta: 'Shared film',
    context: 'Whiplash · you + Ananya',
    note: <>Your responses circle the same anger: how quickly approval can make damage look necessary. That common ground gives Ananya’s other film experiences a reason to reach you.</>,
    feeling: 'Anger · Tension · Recognition',
    scores: sharedWhiplashFeelings,
    film: {
      title: 'Whiplash',
      year: 2014,
      poster: whiplashPoster,
      backdrop: imageUrl('/wbQa0EnWUyRzQ5d1pHLNRlmsCUP.jpg', 'w1280'),
    },
    reaction: {
      src: '/social/ananya-after-whiplash-natural.webp',
      caption: 'Ananya kept the feeling, not a score',
    },
  },
  {
    meta: 'You asked for happy',
    context: 'Scream · from Ananya',
    note: <>We put this on for horror night and spent most of it laughing together. The tension made every release brighter. I saved that mix for anyone wanting the same kind of night.</>,
    feeling: 'Joy · Wonder · Tension',
    scores: screamFeelings,
    film: {
      title: 'Scream',
      year: 1996,
      poster: screamPoster,
      backdrop: imageUrl('/vh7np635kDIcfO6x2Y9ElgLJsuI.jpg', 'w1280'),
    },
    reaction: {
      src: '/social/ananya-after-whiplash-natural.webp',
      caption: 'Horror to Ananya, joy to the people there',
    },
  },
  {
    meta: '@you',
    context: 'Past Lives · saved by Devon',
    note: <>I expected regret. What stayed was the gentleness of letting grief sit beside a good life without asking that life to disappear. Devon found those words later.</>,
    feeling: 'Melancholy · Stillness · Connection',
    scores: pastLivesFeelings,
    film: {
      title: 'Past Lives',
      year: 2023,
      poster: pastLivesPoster,
      backdrop: imageUrl('/7HR38hMBl23lf38MAN63y4pKsHz.jpg', 'w1280'),
    },
    reaction: {
      src: '/social/devon-after-past-lives.webp',
      caption: 'Devon found your response later',
    },
  },
];

const fallbackMoments: LandingMoment[] = [
  {
    id: 'fallback-moonlight',
    username: 'clara_valdez',
    title: 'Moonlight',
    poster_path: '/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg',
    note: 'I watched this with my younger brother and kept thinking about all the tenderness we learn to hide before we have the language to ask for it.',
    feeling: 'Melancholy · Stillness',
    sad: 0.78,
    neutral: 0.18,
  },
  {
    id: 'fallback-matrix',
    username: 'marcus_k',
    title: 'The Matrix',
    poster_path: '/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg',
    note: 'The action was fun, but the feeling that stayed was stranger: how comfortable obedience can feel until somebody shows you the cage.',
    feeling: 'Wonder · Friction',
    surprised: 0.68,
    angry: 0.28,
  },
  {
    id: 'fallback-past-lives',
    username: 'devon_m',
    title: 'Past Lives',
    poster_path: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
    note: 'I expected regret. What caught me was the gentleness of letting grief sit beside a good life without asking that life to disappear.',
    feeling: 'Melancholy · Stillness',
    sad: 0.77,
    neutral: 0.16,
  },
  {
    id: 'fallback-spirited-away',
    username: 'maya_r',
    title: 'Spirited Away',
    poster_path: '/39wmItIWsg5ZMyRUHLkWBcuVCM.jpg',
    note: 'Rewatching it with friends made me feel brave in a childlike way, as if kindness could still be enough to guide us through a world we did not understand.',
    feeling: 'Wonder · Joy',
    surprised: 0.71,
    happy: 0.34,
  },
  {
    id: 'fallback-parasite',
    username: 'rachel_g',
    title: 'Parasite',
    poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    note: 'I laughed with everyone at first. By the end I felt ashamed of how quickly comfort can make another person’s suffering invisible.',
    feeling: 'Friction · Unease',
    angry: 0.68,
    disgusted: 0.42,
  },
];

const libraryRows = [
  {
    title: 'Past Lives',
    year: '2023',
    watched: 'Tonight',
    note: 'The gentleness of letting grief sit beside a good life stayed with me.',
    feeling: 'Melancholy · Stillness',
    scores: pastLivesFeelings,
    poster: pastLivesPoster,
  },
  {
    title: 'Scream',
    year: '1996',
    watched: 'Jun 28',
    note: 'Horror night turned into the kind of laughter that only works in a room together.',
    feeling: 'Joy · Wonder',
    scores: screamFeelings,
    poster: screamPoster,
  },
  {
    title: 'Cure',
    year: '1997',
    watched: 'Jun 14',
    note: 'The ordinary rooms made my own apartment feel unfamiliar for the rest of the night.',
    feeling: 'Stillness · Unease',
    scores: cureFeelings,
    poster: heroBeats[0].film.poster,
  },
];

const FeelingTrace: React.FC<{ label: string; scores?: Partial<EmotionScores> }> = ({ label, scores }) => (
  <div className="mf-feeling-trace" role="img" aria-label={label}>
    {emotionKeys.map(key => {
      const value = Number(scores?.[key]) || 0;
      return value > 0.01 ? <span key={key} style={{ backgroundColor: emotionColors[key], flexGrow: value }} /> : null;
    })}
  </div>
);

const ProductWindowBar: React.FC<{ path: string; status: string }> = ({ path, status }) => (
  <div className="mf-window-bar">
    <span aria-hidden="true" className="mf-window-dots"><i /><i /><i /></span>
    <span>{path}</span>
    <small>{status}</small>
  </div>
);

const Home: React.FC = () => {
  const { user } = useUser();
  const { openAuth, enterDemo, demoLoading } = useOutletContext<LayoutOutletContext>();
  const [entries, setEntries] = useState<CommunityEntry[]>([]);

  useEffect(() => {
    if (user) return;
    let active = true;
    discoveryService.feed(40)
      .then(result => { if (active) setEntries(result); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [user]);

  const communityMoments = useMemo(() => {
    const seen = new Set<string>();
    const live: LandingMoment[] = entries
      .filter(entry => entry.note && entry.poster_path)
      .map(entry => ({
        ...entry,
        poster_path: entry.poster_path as string,
        feeling: 'A feeling snapshot',
      }));

    return [...live, ...fallbackMoments]
      .filter(entry => {
        const key = entry.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  }, [entries]);

  if (user) return <Navigate replace to="/feed" />;

  return (
    <div className="mf-landing">
      <div aria-hidden="true" className="mf-ambient-field" />
      <div aria-hidden="true" className="mf-landing__grain" />

      <section className="mf-hero" aria-labelledby="landing-title" data-nav-tone="dark">
        <div aria-hidden="true" className="mf-hero__projector" />
        <HeroIdentity
          demoLoading={demoLoading}
          onEnterDemo={() => void enterDemo()}
          onSignIn={openAuth}
        />

        <div className="mf-hero__scene" aria-label="A film response moving from one person to another through Moodie">
          <p className="sr-only">
            Hiro records how Cure made him feel. His response carries Get Out to someone who recognizes that unease.
            A shared response to Whiplash connects that person to Ananya. When they ask for something happy, Ananya’s
            joyful experience of Scream makes it relevant even though it is a horror film. A Past Lives response then
            reaches Devon, and the trail continues.
          </p>

          <div aria-hidden="true" className="mf-hero__demo-label"><i />Live response trail</div>

          <div aria-hidden="true" className="mf-hero-media-cycle">
            {heroBeats.map((beat, index) => (
              <div
                className="mf-cycle-frame mf-hero-media"
                key={beat.film.title}
                style={{ '--beat-delay': `${index * 6}s` } as React.CSSProperties}
              >
                {beat.film.backdrop && <img className="mf-hero__backdrop" src={beat.film.backdrop} alt="" />}
                <div className="mf-hero__backdrop-wash" />
                {beat.film.poster && (
                  <figure className="mf-hero__poster">
                    <img src={beat.film.poster} alt="" />
                    <figcaption><strong>{beat.film.title}</strong><span>{beat.film.year}</span></figcaption>
                  </figure>
                )}
              </div>
            ))}
          </div>

          <article aria-hidden="true" className="mf-response-card mf-hero-response">
            {heroBeats.map((beat, index) => (
              <div
                className="mf-cycle-frame mf-hero-response__beat"
                key={beat.context}
                style={{ '--beat-delay': `${index * 6}s` } as React.CSSProperties}
              >
                <div className="mf-response-card__meta"><span>{beat.meta}</span><span>{beat.context}</span></div>
                <blockquote>{beat.note}</blockquote>
                <FeelingTrace label={beat.feeling} scores={beat.scores} />
                <p>{beat.feeling}</p>
              </div>
            ))}
          </article>

          <div aria-hidden="true" className="mf-hero-reaction-cycle">
            {heroBeats.map((beat, index) => (
              <figure
                className="mf-cycle-frame mf-hero__reaction"
                key={`${beat.film.title}-reaction`}
                style={{ '--beat-delay': `${index * 6}s` } as React.CSSProperties}
              >
                <img src={beat.reaction.src} alt="" />
                <figcaption>{beat.reaction.caption}</figcaption>
              </figure>
            ))}
          </div>

          <div aria-hidden="true" className="mf-hero__progress">
            {heroBeats.map((beat, index) => (
              <span key={`${beat.film.title}-progress`} style={{ '--beat-delay': `${index * 6}s` } as React.CSSProperties} />
            ))}
          </div>
        </div>
      </section>

      <InkBleed from="#12141a" to="#090c11" mix="#4b2932" seed={19} />

      <section className="mf-section mf-capture" id="product" aria-labelledby="capture-title" data-nav-tone="dark">
        <div className="mf-section__inner">
          <header className="mf-section-heading" data-reveal>
            <div>
              <p className="mf-kicker">Capture</p>
              <h2 id="capture-title">A response, not a rating.</h2>
              <p>Moodie keeps the words, feeling mix, and optional image from a specific viewing. That record is the base unit for everything else.</p>
            </div>
            <dl className="mf-spec-list">
              <div><dt>Input</dt><dd>Freeform response</dd></div>
              <div><dt>Signal</dt><dd>Seven adjustable feelings</dd></div>
              <div><dt>Media</dt><dd>Optional expression photo</dd></div>
              <div><dt>Control</dt><dd>Visibility per response</dd></div>
            </dl>
          </header>

          <div aria-hidden="true" className="mf-product-frame mf-capture-demo" data-reveal>
            <ProductWindowBar path="Moodie / Add response" status="Draft" />
            <div className="mf-capture-demo__body">
              <nav className="mf-demo-rail" aria-label="Example product navigation">
                <strong className="mf-demo-rail__mark">M</strong>
                <span><MessageCircle size={15} />Home</span>
                <span><Compass size={15} />Discover</span>
                <span><Library size={15} />History</span>
                <span className="is-active"><Film size={15} />Add response</span>
              </nav>

              <div className="mf-composer">
                <div className="mf-composer__heading">
                  <div><span className="mf-ui-label">New response</span><h3>What stayed with you?</h3></div>
                  <span className="mf-ui-status"><i />Unsaved</span>
                </div>

                <div className="mf-film-field">
                  {pastLivesPoster && <img src={pastLivesPoster} alt="Poster for Past Lives" />}
                  <div><span>Selected film</span><strong>Past Lives</strong><small>2023 · Celine Song</small></div>
                  <span className="mf-ui-link">Change</span>
                </div>

                <div className="mf-response-field">
                  <span>Response</span>
                  <p>I expected regret. What caught me was the gentleness of letting grief sit beside a good life without asking that life to disappear.</p>
                  <small>143 / 1,000</small>
                </div>

                <fieldset className="mf-feeling-controls">
                  <legend><span>Feeling mix</span><small>Set by you</small></legend>
                  <label><span>Melancholy</span><i><b style={{ width: '77%' }} /></i><strong>77</strong></label>
                  <label><span>Stillness</span><i><b style={{ width: '64%' }} /></i><strong>64</strong></label>
                  <label><span>Joy</span><i><b style={{ width: '18%' }} /></i><strong>18</strong></label>
                </fieldset>

                <div className="mf-composer__options">
                  <span><ImageIcon size={16} /><i><strong>Add a photo</strong><small>Optional</small></i></span>
                  <span><LockKeyhole size={16} /><i><strong>Only me</strong><small>Change any time</small></i></span>
                  <span className="mf-ui-button"><Check size={16} />Save response</span>
                </div>
              </div>

              <aside className="mf-record-spec">
                <span className="mf-ui-label">Stored with this viewing</span>
                <dl>
                  <div><dt>Film</dt><dd>Past Lives</dd></div>
                  <div><dt>Words</dt><dd>143 characters</dd></div>
                  <div><dt>Feeling</dt><dd>3 active signals</dd></div>
                  <div><dt>Photo</dt><dd>Not attached</dd></div>
                  <div><dt>Visibility</dt><dd>Only me</dd></div>
                </dl>
                <p>Every viewing stays editable. Rewatches can become separate responses instead of overwriting the first one.</p>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="mf-section mf-discovery" id="discovery" aria-labelledby="discovery-title" data-nav-tone="dark">
        <div className="mf-section__inner">
          <header className="mf-section-heading" data-reveal>
            <div>
              <p className="mf-kicker">Discovery</p>
              <h2 id="discovery-title">People first. Films second.</h2>
              <p>Moodie finds someone who responded to the same film in a familiar way, then uses their other responses as evidence for what reaches you next.</p>
            </div>
            <dl className="mf-spec-list">
              <div><dt>Match</dt><dd>Same film, similar response</dd></div>
              <div><dt>Source</dt><dd>A person, kept visible</dd></div>
              <div><dt>Request</dt><dd>Feeling optional, genre open</dd></div>
              <div><dt>Output</dt><dd>Film with a human reason</dd></div>
            </dl>
          </header>

          <div aria-hidden="true" className="mf-product-frame mf-discovery-demo" data-reveal>
            <ProductWindowBar path="Moodie / Discover" status="People you overlap with" />
            <div className="mf-discovery-demo__body">
              <div className="mf-discovery-request">
                <span className="mf-ui-label">Your request</span>
                <div><Search size={17} /><strong>Something happy</strong><span>Any genre</span></div>
              </div>

              <div className="mf-discovery-reason">
                <i />
                <p>You and <strong>@ananya_sen</strong> described the cost of approval in <strong>Whiplash</strong> in a similar way.</p>
              </div>

              <div className="mf-discovery-grid">
                <article className="mf-shared-film-panel">
                  <span className="mf-ui-label">Common ground</span>
                  <div className="mf-shared-film-panel__film">
                    {whiplashPoster && <img src={whiplashPoster} alt="Poster for Whiplash" />}
                    <div><strong>Whiplash</strong><span>2014</span><FeelingTrace label="Anger, tension, and unease" scores={sharedWhiplashFeelings} /></div>
                  </div>
                  <blockquote><span>You</span>I hated how quickly I started wanting the approval that was doing the damage.</blockquote>
                  <blockquote><span>@ananya_sen</span>I felt angry at the promise that suffering becomes worthwhile if the result impresses enough people.</blockquote>
                </article>

                <aside className="mf-person-bridge">
                  <img src="/social/ananya-after-whiplash-natural.webp" alt="Ananya talking with friends after watching Whiplash" />
                  <span>Matched through one film</span>
                  <strong>Ananya</strong>
                  <small>12 other responses</small>
                  <div><Users size={15} />Person kept in the trail</div>
                </aside>

                <article className="mf-output-panel">
                  <span className="mf-ui-label">Recommendation</span>
                  <div className="mf-output-panel__film">
                    {screamPoster && <img src={screamPoster} alt="Poster for Scream" />}
                    <div><strong>Scream</strong><span>1996 · Horror</span><em>Happy from Ananya’s viewing</em></div>
                  </div>
                  <blockquote>We put this on for horror night and spent most of it laughing together. The tension made every release brighter.</blockquote>
                  <FeelingTrace label="Joy, wonder, and tension" scores={screamFeelings} />
                  <p><Check size={14} />Fits the feeling request through a real experience, not a genre label.</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mf-section mf-feed" id="people" aria-labelledby="feed-title" data-nav-tone="dark">
        <div className="mf-section__inner">
          <header className="mf-section-heading" data-reveal>
            <div>
              <p className="mf-kicker">People feed</p>
              <h2 id="feed-title">The network stays human.</h2>
              <p>Responses arrive as posts from people you follow or people whose film history overlaps with yours. You can always inspect why a person or film is here.</p>
            </div>
            <dl className="mf-spec-list">
              <div><dt>Feed</dt><dd>Responses, not promotion</dd></div>
              <div><dt>Context</dt><dd>Film and feeling attached</dd></div>
              <div><dt>Control</dt><dd>Follow people directly</dd></div>
              <div><dt>Reason</dt><dd>Connection can be inspected</dd></div>
            </dl>
          </header>

          <div aria-hidden="true" className="mf-product-frame mf-feed-demo" data-reveal>
            <ProductWindowBar path="Moodie / Home" status="For you" />
            <div className="mf-feed-demo__body">
              <div className="mf-feed-list">
                <header><nav><span className="is-active">For you</span><span>Following</span></nav><span><SlidersHorizontal size={15} />Feelings</span></header>
                {communityMoments.slice(0, 3).map(entry => {
                  const poster = imageUrl(entry.poster_path, 'w342');
                  return (
                    <article className="mf-feed-row" key={entry.id}>
                      <span className="mf-feed-row__avatar">{entry.username.charAt(0).toUpperCase()}</span>
                      <div className="mf-feed-row__content">
                        <div><strong>@{entry.username}</strong><span>responded to {entry.title}</span><small>recently</small></div>
                        <blockquote>{entry.note}</blockquote>
                        <FeelingTrace label={entry.feeling} scores={entry} />
                        <p>{entry.feeling}</p>
                      </div>
                      {poster && <img className="mf-feed-row__poster" src={poster} alt={`Poster for ${entry.title}`} loading="lazy" />}
                    </article>
                  );
                })}
              </div>

              <aside className="mf-feed-inspector">
                <span className="mf-ui-label">Why this is here</span>
                <div className="mf-feed-inspector__person">
                  <img src="/social/ananya-after-whiplash-natural.webp" alt="Ananya talking with friends" />
                  <div><strong>Ananya Sen</strong><span>@ananya_sen</span></div>
                  <span className="mf-follow-state"><Check size={13} />Following</span>
                </div>
                <ol>
                  <li><i>1</i><span>You both responded to <strong>Whiplash</strong></span></li>
                  <li><i>2</i><span>Your feeling mixes share anger and tension</span></li>
                  <li><i>3</i><span>Her other responses now have a reason to enter your feed</span></li>
                </ol>
                <p>Moodie never hides the person behind a recommendation.</p>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="mf-section mf-history" id="history" aria-labelledby="history-title" data-nav-tone="dark">
        <div className="mf-section__inner">
          <header className="mf-section-heading" data-reveal>
            <div>
              <p className="mf-kicker">History</p>
              <h2 id="history-title">Your film history, in your own language.</h2>
              <p>Every response stays searchable and editable. Moodie uses the collection as personal context without reducing it to one permanent taste profile.</p>
            </div>
            <dl className="mf-spec-list">
              <div><dt>Record</dt><dd>One entry per viewing</dd></div>
              <div><dt>Recall</dt><dd>Search by film or feeling</dd></div>
              <div><dt>Revision</dt><dd>Responses stay editable</dd></div>
              <div><dt>Privacy</dt><dd>Chosen entry by entry</dd></div>
            </dl>
          </header>

          <div aria-hidden="true" className="mf-product-frame mf-history-demo" data-reveal>
            <ProductWindowBar path="Moodie / History" status="34 viewings" />
            <div className="mf-history-demo__body">
              <div className="mf-history-table">
                <header><div><strong>Your responses</strong><span>All viewings</span></div><span><Search size={15} />Search history</span></header>
                <div className="mf-history-table__head"><span>Film</span><span>What stayed</span><span>Feeling</span><span>Watched</span></div>
                {libraryRows.map(row => (
                  <article className="mf-history-row" key={row.title}>
                    <div className="mf-history-row__film">
                      {row.poster && <img src={row.poster} alt={`Poster for ${row.title}`} loading="lazy" />}
                      <span><strong>{row.title}</strong><small>{row.year}</small></span>
                    </div>
                    <p>{row.note}</p>
                    <div><FeelingTrace label={row.feeling} scores={row.scores} /><small>{row.feeling}</small></div>
                    <time>{row.watched}</time>
                  </article>
                ))}
              </div>

              <aside className="mf-history-signal">
                <span className="mf-ui-label">Recent pattern</span>
                <h3>Quiet films are staying longer.</h3>
                <p>This is a view of recent responses, not a permanent label.</p>
                <div className="mf-history-signal__bars">
                  <span><i>Stillness</i><b><em style={{ width: '82%' }} /></b><strong>82</strong></span>
                  <span><i>Melancholy</i><b><em style={{ width: '68%' }} /></b><strong>68</strong></span>
                  <span><i>Joy</i><b><em style={{ width: '37%' }} /></b><strong>37</strong></span>
                </div>
                <div className="mf-history-signal__note"><LockKeyhole size={15} /><span>Private responses still shape your own discovery without entering anyone else’s feed.</span></div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="mf-final" aria-labelledby="final-title" data-nav-tone="dark">
        <div className="mf-final__glow" aria-hidden="true" />
        <div>
          <p className="mf-kicker">Start with one viewing</p>
          <h2 id="final-title">Bring the last film that followed you home.</h2>
          <p>Write what stayed. Moodie will keep the response, learn its shape, and show you where it can lead.</p>
        </div>
        <div className="mf-final__actions">
          <button className="mf-primary-action" disabled={demoLoading} onClick={() => void enterDemo()} type="button">
            {demoLoading ? 'Opening demo' : 'Enter demo'}<ArrowRight size={18} />
          </button>
          <button className="mf-text-action" onClick={openAuth} type="button">Sign in</button>
        </div>
      </section>
    </div>
  );
};

export default Home;
