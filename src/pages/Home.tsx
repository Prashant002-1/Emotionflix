import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Navigate, useOutletContext } from 'react-router-dom';
import HeroIdentity from '../components/landing/HeroIdentity';
import { CapturePreview, DiaryPreview, FeedPreview, RecommendationPreview } from '../components/landing/ProductPreviews';
import { LayoutOutletContext } from '../components/layout/Layout';
import { useUser } from '../contexts/UserContext';
import { EmotionScores } from '../types/emotion';
import { emotionColors, imageUrl } from '../utils/display';
import './HomeLanding.css';
import '../components/landing/ProductPreviews.css';

const emotionKeys = Object.keys(emotionColors) as (keyof EmotionScores)[];

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
const kikiPoster = imageUrl('/Aufa4YdZIv4AXpR9rznwVA5SEfd.jpg', 'w500');

const cureFeelings: Partial<EmotionScores> = { neutral: 0.29, fearful: 0.76, disgusted: 0.19 };
const pastLivesFeelings: Partial<EmotionScores> = { neutral: 0.16, happy: 0.08, sad: 0.77, surprised: 0.06 };
const sharedWhiplashFeelings: Partial<EmotionScores> = { angry: 0.74, fearful: 0.18, disgusted: 0.12 };
const kikiFeelings: Partial<EmotionScores> = { neutral: 0.18, happy: 0.73, sad: 0.13, fearful: 0.04, surprised: 0.32 };

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
    context: 'The Farewell · from Rachel',
    note: <>I laughed, then felt the sadness underneath every careful gesture. The love was real, but so was the loneliness of carrying it indirectly.</>,
    feeling: 'Melancholy · Joy · Stillness',
    scores: { neutral: 0.19, happy: 0.24, sad: 0.63, fearful: 0.04, surprised: 0.12 },
    film: {
      title: 'The Farewell',
      year: 2019,
      poster: imageUrl('/7ht2IMGynDSVQGvAXhAb83DLET8.jpg', 'w500'),
      backdrop: imageUrl('/5INPBiKVRsyp9kgHfsC0cTfvKFH.jpg', 'w1280'),
    },
    reaction: {
      src: '/social/rachel-after-farewell-natural.webp',
      caption: 'Rachel, after The Farewell',
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
    meta: 'You asked for gentle',
    context: 'Kiki’s Delivery Service · from Chloe',
    note: <>I was tired of making everything urgent. Kiki did not fix me, but she made rest feel less like failure.</>,
    feeling: 'Joy · Wonder · Stillness',
    scores: kikiFeelings,
    film: {
      title: "Kiki's Delivery Service",
      year: 1989,
      poster: kikiPoster,
      backdrop: imageUrl('/h5pAEVma835u8xoE60kmLVopLct.jpg', 'w1280'),
    },
    reaction: {
      src: '/social/chloe-after-kikis-delivery-service-natural.webp',
      caption: 'Chloe, after Kiki’s Delivery Service',
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
      src: '/social/devon-after-past-lives-natural.webp',
      caption: 'Devon found your response later',
    },
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

const Home: React.FC = () => {
  const { user } = useUser();
  const { enterDemo, demoLoading } = useOutletContext<LayoutOutletContext>();
  const [loadedBeatCount, setLoadedBeatCount] = React.useState(1);

  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timers = heroBeats.slice(1).map((_, index) => window.setTimeout(
      () => setLoadedBeatCount(index + 2),
      750 + index * 4_000,
    ));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, []);

  if (user) return <Navigate replace to="/feed" />;

  return (
    <div className="mf-landing">
      <div aria-hidden="true" className="mf-ambient-field" />

      <section className="mf-hero" aria-labelledby="landing-title" data-nav-tone="dark">
        <div aria-hidden="true" className="mf-hero__projector" />
        <HeroIdentity
          demoLoading={demoLoading}
          onEnterDemo={() => void enterDemo()}
        />

        <div className="mf-hero__scene" aria-label="A film response moving from one person to another through Moodie">
          <p className="sr-only">
            Hiro records how Cure made him feel. Rachel’s response to The Farewell reaches someone who recognizes its
            sadness. A shared response to Whiplash creates common ground with Ananya. Chloe’s experience of Kiki’s
            Delivery Service offers a gentler path. A Past Lives response then reaches Devon, and the trail continues.
          </p>

          <div aria-hidden="true" className="mf-hero-media-cycle">
            {heroBeats.map((beat, index) => (
              <div
                className="mf-cycle-frame mf-hero-media"
                key={beat.film.title}
                style={{ '--beat-delay': `${index * 4}s` } as React.CSSProperties}
              >
                {index < loadedBeatCount && beat.film.backdrop && <img className="mf-hero__backdrop" fetchPriority={index === 0 ? 'high' : 'auto'} loading={index === 0 ? 'eager' : 'lazy'} src={beat.film.backdrop} alt="" />}
                <div className="mf-hero__backdrop-wash" />
                {index < loadedBeatCount && beat.film.poster && (
                  <figure className="mf-hero__poster">
                    <img fetchPriority={index === 0 ? 'high' : 'auto'} loading={index === 0 ? 'eager' : 'lazy'} src={beat.film.poster} alt="" />
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
                style={{ '--beat-delay': `${index * 4}s` } as React.CSSProperties}
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
                style={{ '--beat-delay': `${index * 4}s` } as React.CSSProperties}
              >
                {index < loadedBeatCount && <img loading={index === 0 ? 'eager' : 'lazy'} src={beat.reaction.src} alt="" />}
                <figcaption>{beat.reaction.caption}</figcaption>
              </figure>
            ))}
          </div>

        </div>
      </section>

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

          <CapturePreview />
        </div>
      </section>

      <section className="mf-section mf-discovery" id="discovery" aria-labelledby="discovery-title" data-nav-tone="dark">
        <div className="mf-section__inner">
          <header className="mf-section-heading" data-reveal>
            <div>
              <p className="mf-kicker">Recommendations</p>
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

          <RecommendationPreview />
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

          <FeedPreview />
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

          <DiaryPreview />
        </div>
      </section>

      <section className="mf-final" aria-labelledby="final-title" data-nav-tone="dark">
        <div className="mf-final__glow" aria-hidden="true" />
        <div>
          <p className="mf-kicker">Start with one film</p>
          <h2 id="final-title">Log what you watched.</h2>
          <p>Add how it felt. Moodie uses that response to recommend films through people with similar experiences.</p>
        </div>
        <div className="mf-final__actions">
          <button className="mf-primary-action" disabled={demoLoading} onClick={() => void enterDemo()} type="button">
            {demoLoading ? 'Opening demo' : 'Enter demo'}<ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
