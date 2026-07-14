import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Camera, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { Navigate, useOutletContext } from 'react-router-dom';
import HeroIdentity from '../components/landing/HeroIdentity';
import InkBleed from '../components/landing/InkBleed';
import { LayoutOutletContext } from '../components/layout/Layout';
import { useUser } from '../contexts/UserContext';
import { catalogService } from '../services/catalogService';
import { CommunityEntry, discoveryService } from '../services/discoveryService';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { dominantEmotion, emotionColors, emotionLabels, imageUrl, releaseYear } from '../utils/display';

const emotionKeys = Object.keys(emotionColors) as (keyof EmotionScores)[];

const FeelingTrace: React.FC<{ entry?: CommunityEntry; label: string }> = ({ entry, label }) => (
  <div className="feeling-trace" aria-label={label}>
    {emotionKeys.map(key => {
      const value = Number(entry?.[key]) || 0;
      return value > 0.01 ? <span key={key} style={{ backgroundColor: emotionColors[key], flexGrow: value }} /> : null;
    })}
  </div>
);

const Home: React.FC = () => {
  const { user } = useUser();
  const { openAuth, enterDemo, demoLoading } = useOutletContext<LayoutOutletContext>();
  const [films, setFilms] = useState<Movie[]>([]);
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) return;
    let active = true;
    Promise.allSettled([catalogService.trending(), discoveryService.feed(32)]).then(([filmResult, entryResult]) => {
      if (!active) return;
      if (filmResult.status === 'fulfilled') setFilms(filmResult.value.results.filter(film => film.poster_path));
      if (entryResult.status === 'fulfilled') setEntries(entryResult.value);
      setLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  const featuredEntry = useMemo(
    () => entries.find(entry => entry.note && entry.poster_path && entry.backdrop_path && entry.expression_image_path)
      || entries.find(entry => entry.note && entry.poster_path && entry.backdrop_path)
      || entries.find(entry => entry.note)
      || entries[0],
    [entries],
  );
  const reactionEntry = useMemo(
    () => entries.find(entry => entry.id !== featuredEntry?.id && entry.note && entry.poster_path && entry.expression_image_path)
      || entries.find(entry => entry.id !== featuredEntry?.id && entry.note && entry.poster_path)
      || entries[1],
    [entries, featuredEntry?.id],
  );
  const featuredFilm = films.find(film => film.backdrop_path && film.poster_path) || films[0];
  const heroEmotion = featuredEntry ? dominantEmotion(featuredEntry) : null;
  const reactionEmotion = reactionEntry ? dominantEmotion(reactionEntry) : null;
  const sceneBackdrop = imageUrl(featuredEntry?.backdrop_path || featuredFilm?.backdrop_path, 'w1280');
  const scenePoster = imageUrl(featuredEntry?.poster_path || featuredFilm?.poster_path, 'w500');
  const reactionPoster = imageUrl(reactionEntry?.poster_path || films[2]?.poster_path, 'w342');
  const socialMoments = useMemo(() => {
    const seen = new Set<number>();
    return entries
      .filter(entry => entry.note && entry.poster_path)
      .filter(entry => {
        if (seen.has(entry.movie_id)) return false;
        seen.add(entry.movie_id);
        return true;
      })
      .slice(0, 4);
  }, [entries]);
  const identityNotes = useMemo(
    () => entries.filter(entry => entry.note).slice(0, 3).map(entry => entry.note),
    [entries],
  );

  if (user) return <Navigate replace to="/feed" />;

  return (
    <div className="landing-page landing-page--social">
      <section className="landing-hero" aria-labelledby="landing-title" data-nav-tone="light">
        <div className="landing-hero__copy">
          <HeroIdentity
            demoLoading={demoLoading}
            notes={identityNotes}
            onEnterDemo={() => void enterDemo()}
            onSignIn={openAuth}
          />
        </div>

        <div className="landing-hero__scene" aria-label="A public film response">
          {sceneBackdrop && <img alt="" aria-hidden="true" className="landing-scene__backdrop" data-parallax="0.04" src={sceneBackdrop} />}
          <div className="landing-scene__wash" />
          <div className="landing-scene__composition landing-scene__composition--post">
            <figure className="landing-expression-photo">
              <img alt="A person sharing how a film affected them" src={featuredEntry?.expression_image_path || '/social/ananya-after-whiplash.webp'} />
              <figcaption>Expression photo <span>optional</span></figcaption>
            </figure>
            {scenePoster && (
              <figure className="landing-scene__poster landing-scene__poster--small">
                <img alt={featuredEntry?.title ? `Poster for ${featuredEntry.title}` : 'Film poster'} src={scenePoster} />
                <figcaption><strong>{featuredEntry?.title || featuredFilm?.title}</strong><span>{releaseYear(featuredEntry?.release_date || featuredFilm?.release_date)}</span></figcaption>
              </figure>
            )}
            <article className={`landing-record landing-response${loading ? ' landing-record--loading' : ''}`}>
              <div className="landing-record__meta"><span>{featuredEntry ? `@${featuredEntry.username}` : '@ananya_sen'}</span><span>{featuredEntry?.title || 'One film'}</span></div>
              <blockquote>{featuredEntry?.note || 'I felt angry at how easily cruelty can disguise itself as belief in someone, and unsettled by my own excitement.'}</blockquote>
              <FeelingTrace entry={featuredEntry} label="Feelings shared with this response" />
              <p className="landing-record__feeling">{heroEmotion ? emotionLabels[heroEmotion.emotion] : 'What they felt'}</p>
            </article>
          </div>
        </div>
      </section>

      <InkBleed from="#D8D6D1" to="#D76358" mix="#B88B78" seed={9} />

      <section className="landing-sequence" id="how-it-works" aria-labelledby="sequence-title" data-nav-tone="light">
        <div className="landing-section-shell">
          <div className="landing-sequence__lead" data-reveal>
            <h2 id="sequence-title">There is a small moment after every film.</h2>
            <p>Before the conversation becomes a verdict. Before “good” or “bad” flattens everything. EmotionFlix is made for that moment.</p>
          </div>
          <ol className="landing-path landing-path--three">
            <li data-reveal><span>01</span><h3>A thought, before you tidy it up.</h3><p>Write the thing you keep returning to. A sentence is enough.</p></li>
            <li data-reveal><span>02</span><h3>Feelings, in your own proportions.</h3><p>Set them directly. Let wonder sit beside grief or tension beside joy.</p></li>
            <li data-reveal><span>03</span><h3>A person, then another film.</h3><p>Meet someone who felt something familiar and see what moved them next.</p></li>
          </ol>
        </div>
      </section>

      <InkBleed from="#D76358" to="#F4EFE9" mix="#D9B7A9" seed={17} />

      <section className="landing-feelings" id="feelings" aria-labelledby="feelings-title" data-nav-tone="light">
        <div className="landing-feelings__copy" data-reveal>
          <h2 id="feelings-title">For the films five stars could never explain.</h2>
          <p>You do not need the perfect review. Put down what the film meant to you, adjust the feelings until they are yours, and leave the rest alone.</p>
          <div className="feeling-input-list" aria-label="Ways to share a film response">
            <span><MessageCircle size={18} /><strong>Your words</strong><small>What stayed with you.</small></span>
            <span><SlidersHorizontal size={18} /><strong>Your feelings</strong><small>Set directly, never inferred as fact.</small></span>
            <span><Camera size={18} /><strong>Your reaction</strong><small>A photo, only when it adds something fun.</small></span>
          </div>
        </div>
        <div className="landing-feelings__post" data-reveal>
          <article>
            <div className="landing-record__meta"><span>{reactionEntry ? `@${reactionEntry.username}` : '@hiro_s'}</span><span>{reactionEntry?.title || 'After the film'}</span></div>
            <blockquote>{reactionEntry?.note || 'I felt uneasy long after it ended. Not frightened exactly. More like I had seen something in myself that I wanted to look away from.'}</blockquote>
            <FeelingTrace entry={reactionEntry} label="Feelings shared with this response" />
            <p>{reactionEmotion ? emotionLabels[reactionEmotion.emotion] : 'Their response'}</p>
          </article>
          {reactionPoster && <img alt={reactionEntry?.title ? `Poster for ${reactionEntry.title}` : 'Film poster'} className="landing-feelings__poster" loading="lazy" src={reactionPoster} />}
          <figure className="landing-feelings__reaction">
            <img alt="A candid reaction shared after a film" loading="lazy" src={reactionEntry?.expression_image_path || '/social/hiro-after-cure.webp'} />
            <figcaption>How I looked afterward</figcaption>
          </figure>
        </div>
      </section>

      <InkBleed from="#F4EFE9" to="#1D2B33" mix="#477B78" seed={23} />

      <section className="landing-people" id="people" aria-labelledby="people-title" data-nav-tone="dark">
        <div className="landing-section-shell landing-people__inner">
          <div className="landing-people__copy" data-reveal>
            <h2 id="people-title">One honest response opens a door.</h2>
            <p>When someone felt something familiar about a film you both saw, their next response has context. You are not following a score. You are following a person.</p>
          </div>
          <div className="landing-moments" aria-label="Different films shared by the community">
            {(socialMoments.length ? socialMoments : entries.slice(0, 4)).map((entry, index) => {
              const poster = imageUrl(entry.poster_path, 'w342');
              return (
                <article className="landing-moment" data-reveal key={entry.id} style={{ '--reveal-order': index } as React.CSSProperties}>
                  {poster && <img alt={`Poster for ${entry.title}`} loading="lazy" src={poster} />}
                  <div>
                    <span>@{entry.username}</span>
                    <h3>{entry.title}</h3>
                    <blockquote>{entry.note}</blockquote>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <InkBleed from="#1D2B33" to="#D8D6D1" mix="#82908F" seed={31} />

      <section className="landing-care" aria-labelledby="care-title" data-nav-tone="light">
        <div className="landing-care__heading" data-reveal>
          <h2 id="care-title">The small things are the product.</h2>
          <p>A place for people should make room for contradiction, privacy, unfinished thoughts, and the choice to say less.</p>
        </div>
        <ol className="landing-care__list">
          <li data-reveal><span>01</span><p>Your words can stay private.</p></li>
          <li data-reveal><span>02</span><p>Your feelings do not have to agree with each other.</p></li>
          <li data-reveal><span>03</span><p>A reaction photo is a bit of life, not emotional proof.</p></li>
          <li data-reveal><span>04</span><p>Every recommendation should lead back to a person.</p></li>
        </ol>
      </section>

      <section className="landing-final" aria-labelledby="landing-final-title" data-nav-tone="light">
        <div data-reveal>
          <h2 id="landing-final-title">Start with the last film that followed you home.</h2>
          <p>Keep the response. Find the person. Let one film lead somewhere human.</p>
        </div>
        <div className="landing-actions" data-reveal>
          <button className="landing-demo-link" disabled={demoLoading} onClick={() => void enterDemo()} type="button">{demoLoading ? 'Opening demo' : 'Enter demo'}<ArrowRight size={18} /></button>
          <button className="landing-text-link" onClick={openAuth} type="button">Sign in</button>
        </div>
      </section>
    </div>
  );
};

export default Home;
