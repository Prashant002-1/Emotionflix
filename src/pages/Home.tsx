import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, PenLine, UsersRound } from 'lucide-react';
import { Navigate, useOutletContext } from 'react-router-dom';
import BrandMark from '../components/brand/BrandMark';
import { LayoutOutletContext } from '../components/layout/Layout';
import { useUser } from '../contexts/UserContext';
import { catalogService } from '../services/catalogService';
import { CommunityEntry, CommunityPerson, discoveryService } from '../services/discoveryService';
import { EmotionScores } from '../types/emotion';
import { Movie } from '../types/movie';
import { dominantEmotion, emotionColors, emotionLabels, imageUrl, releaseYear } from '../utils/display';

const emotionKeys = Object.keys(emotionColors) as (keyof EmotionScores)[];

const Home: React.FC = () => {
  const { user } = useUser();
  const { openAuth, enterDemo, demoLoading } = useOutletContext<LayoutOutletContext>();
  const [films, setFilms] = useState<Movie[]>([]);
  const [entries, setEntries] = useState<CommunityEntry[]>([]);
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) return;
    let active = true;
    Promise.allSettled([
      catalogService.trending(),
      discoveryService.feed(12),
      discoveryService.people(),
    ]).then(([filmResult, entryResult, peopleResult]) => {
      if (!active) return;
      if (filmResult.status === 'fulfilled') setFilms(filmResult.value.results.filter(film => film.poster_path));
      if (entryResult.status === 'fulfilled') setEntries(entryResult.value);
      if (peopleResult.status === 'fulfilled') setPeople(peopleResult.value);
      setLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  const featuredEntry = useMemo(
    () => entries.find(entry => entry.note && entry.poster_path && entry.backdrop_path) || entries.find(entry => entry.note) || entries[0],
    [entries],
  );
  const featuredFilm = useMemo(
    () => films.find(film => film.backdrop_path && film.poster_path) || films[0],
    [films],
  );
  const featuredPerson = people[0];
  const entryEmotion = featuredEntry ? dominantEmotion(featuredEntry) : null;
  const personEmotion = featuredPerson ? dominantEmotion(featuredPerson) : null;
  const sceneBackdrop = imageUrl(featuredEntry?.backdrop_path || featuredFilm?.backdrop_path, 'w1280');
  const scenePoster = imageUrl(featuredEntry?.poster_path || featuredFilm?.poster_path, 'w500');
  const recordTitle = featuredEntry?.title || featuredFilm?.title;
  const recordYear = featuredEntry ? releaseYear(featuredEntry.release_date) : releaseYear(featuredFilm?.release_date);
  const recommendationFilms = films.slice(1, 4);

  if (user) return <Navigate replace to="/recommendations" />;

  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__copy">
          <p className="landing-kicker"><BookOpen size={17} />Emotion-based social film discovery</p>
          <h1 id="landing-title">Films stay with people <strong>differently.</strong></h1>
          <p className="landing-hero__intro">
            Record what a film left with you, in your own words and emotional terms. EmotionFlix connects that
            history with people whose responses move in familiar ways, then uses those connections to find what
            you may want to watch next.
          </p>
          <div className="landing-actions">
            <button className="button button--primary" disabled={demoLoading} onClick={() => void enterDemo()} type="button">
              {demoLoading ? 'Opening demo' : 'Enter demo'}<ArrowRight size={18} />
            </button>
            <button className="landing-text-link" onClick={openAuth} type="button">Sign in to your diary</button>
          </div>
          <p className="landing-assurance"><Check size={16} />Your record stays private until you publish an entry.</p>
        </div>

        <div className="landing-hero__scene" aria-label="A film and its emotional record">
          {sceneBackdrop && <img alt="" aria-hidden="true" className="landing-scene__backdrop" src={sceneBackdrop} />}
          <div className="landing-scene__wash" />
          <div className="landing-scene__composition">
            {scenePoster ? (
              <figure className="landing-scene__poster">
                <img alt={recordTitle ? `Poster for ${recordTitle}` : 'Film poster'} src={scenePoster} />
                {recordTitle && <figcaption><strong>{recordTitle}</strong><span>{recordYear}</span></figcaption>}
              </figure>
            ) : (
              <div className="landing-scene__poster landing-scene__poster--empty"><BrandMark /></div>
            )}

            <article className={`landing-record${loading ? ' landing-record--loading' : ''}`}>
              <div className="landing-record__meta">
                <span>{featuredEntry ? `Recorded by @${featuredEntry.username}` : 'A personal record'}</span>
                <span>{featuredEntry?.rating ? `${featuredEntry.rating} / 5` : 'One viewing'}</span>
              </div>
              <blockquote>
                {featuredEntry?.note || 'A note keeps the part of the experience that a rating cannot hold on its own.'}
              </blockquote>
              {featuredEntry && (
                <>
                  <div className="landing-record__trace" aria-label="Emotional trace from this diary entry">
                    {emotionKeys.map(key => {
                      const value = Number(featuredEntry[key]) || 0;
                      return value > 0.01 ? <span key={key} style={{ backgroundColor: emotionColors[key], flexGrow: value }} /> : null;
                    })}
                  </div>
                  <p className="landing-record__feeling">
                    {entryEmotion ? `${emotionLabels[entryEmotion.emotion]} is the strongest trace` : 'The emotional mix remains attached to the record'}
                  </p>
                </>
              )}
            </article>
          </div>
        </div>
      </section>

      <section className="landing-sequence" id="how-it-works" aria-labelledby="sequence-title">
        <div className="landing-section-shell">
          <div className="landing-sequence__lead">
            <h2 id="sequence-title">A recommendation begins with a record.</h2>
            <p>
              Ratings show preference. Your diary preserves the shape of the experience, including what was
              tender, difficult, unresolved, or hard to name.
            </p>
          </div>
          <ol className="landing-path">
            <li>
              <span>Record</span>
              <PenLine aria-hidden="true" size={20} />
              <h3>Keep what the film left behind.</h3>
              <p>Add a note and set the emotional mix directly. Suggestions remain yours to edit.</p>
            </li>
            <li>
              <span>Pattern</span>
              <span className="landing-path__trace" aria-hidden="true"><i /><i /><i /></span>
              <h3>See what returns across viewings.</h3>
              <p>Your diary becomes a personal pattern rather than a list of isolated scores.</p>
            </li>
            <li>
              <span>People</span>
              <UsersRound aria-hidden="true" size={21} />
              <h3>Find responses that move like yours.</h3>
              <p>Public records reveal people whose emotional relationship to film feels familiar.</p>
            </li>
            <li>
              <span>Next film</span>
              <ArrowRight aria-hidden="true" size={21} />
              <h3>Follow that connection somewhere new.</h3>
              <p>The person and the shared pattern stay visible in the recommendation reason.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="landing-record-proof" id="records" aria-labelledby="record-proof-title">
        <div className="landing-record-proof__art">
          {scenePoster ? <img alt={recordTitle ? `Poster for ${recordTitle}` : 'Film poster'} loading="lazy" src={scenePoster} /> : <BrandMark />}
          <div className="landing-record-proof__caption">
            <span>{recordYear || 'One viewing'}</span>
            <strong>{recordTitle || 'The film stays attached to the record'}</strong>
          </div>
        </div>
        <div className="landing-record-proof__copy">
          <h2 id="record-proof-title">Your words and your emotional record belong together.</h2>
          <p>
            Direct controls are always available. Writing can suggest a mix for you to review. Other consented
            inputs may help later, but no model gets final authority over what you felt.
          </p>
          <div className="record-source-list" aria-label="Ways to create an emotional record">
            <div><strong>Set it directly</strong><span>The complete default path</span></div>
            <div><strong>Write what stayed</strong><span>Review an editable suggestion from your note</span></div>
            <div><strong>Add an optional signal</strong><span>A secondary input, never a requirement</span></div>
          </div>
        </div>
      </section>

      <section className="landing-people" id="people" aria-labelledby="people-title">
        <div className="landing-section-shell landing-people__inner">
          <div className="landing-people__copy">
            <h2 id="people-title">The social layer has a purpose.</h2>
            <p>
              You are finding people whose film records carry a familiar emotional shape, then seeing where their
              diaries can take you next.
            </p>
            <div className="landing-person">
              <span className="landing-person__avatar">{featuredPerson?.username.charAt(0).toUpperCase() || 'M'}</span>
              <div>
                <strong>{featuredPerson ? `@${featuredPerson.username}` : 'A nearby public diary'}</strong>
                <span>
                  {featuredPerson?.pattern_overlap !== null && featuredPerson?.pattern_overlap !== undefined
                    ? `${Math.round(featuredPerson.pattern_overlap * 100)}% pattern overlap`
                    : personEmotion
                      ? `Often records ${emotionLabels[personEmotion.emotion].toLowerCase()}`
                      : 'Several records move in a familiar way'}
                </span>
              </div>
            </div>
          </div>

          <div className="landing-recommendation" aria-label="An example of discovery through another person's diary">
            <div className="landing-recommendation__posters">
              {recommendationFilms.map(film => {
                const poster = imageUrl(film.poster_path, 'w342');
                return poster ? <figure key={film.id}><img alt={`Poster for ${film.title}`} loading="lazy" src={poster} /><figcaption>{film.title}</figcaption></figure> : null;
              })}
            </div>
            <article className="landing-recommendation__reason">
              <span>Why this film reached you</span>
              <p>
                A person with a related pattern carried something similar through these films. Their public diary
                gives the recommendation a human reason, not only a score.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-final" aria-labelledby="landing-final-title">
        <div>
          <h2 id="landing-final-title">Start with the last film you kept thinking about.</h2>
          <p>The demo opens a complete diary, its patterns, connected people, and the recommendations that follow.</p>
        </div>
        <div className="landing-actions">
          <button className="button button--primary" disabled={demoLoading} onClick={() => void enterDemo()} type="button">
            {demoLoading ? 'Opening demo' : 'Enter demo'}<ArrowRight size={18} />
          </button>
          <button className="landing-text-link" onClick={openAuth} type="button">Sign in</button>
        </div>
      </section>
    </div>
  );
};

export default Home;
