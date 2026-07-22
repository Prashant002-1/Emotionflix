import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Eye,
  EyeOff,
  Heart,
  History,
  House,
  ImagePlus,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { EmotionScores } from '../../types/emotion';
import { emotionColors, imageUrl } from '../../utils/display';
import BrandMark from '../brand/BrandMark';

type PreviewRoute = 'home' | 'search' | 'people' | 'activity' | 'diary' | 'add';

interface PreviewShellProps {
  active: PreviewRoute;
  children: ReactNode;
  className: string;
}

interface PreviewTraceProps {
  label: string;
  scores: Partial<EmotionScores>;
}

const emotionKeys = Object.keys(emotionColors) as (keyof EmotionScores)[];

const posters = {
  pastLives: imageUrl('/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg', 'w500'),
  scream: imageUrl('/lr9ZIrmuwVmZhpZuTCW8D9g0ZJe.jpg', 'w500'),
  whiplash: imageUrl('/7fn624j5lj3xTme2SgiLCeuedmO.jpg', 'w500'),
};

const navItems: { id: PreviewRoute; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'people', label: 'People', icon: UsersRound },
  { id: 'activity', label: 'Activity', icon: Bell },
  { id: 'diary', label: 'Diary', icon: History },
  { id: 'add', label: 'Add a response', icon: Plus },
];

const PreviewTrace = ({ label, scores }: PreviewTraceProps) => (
  <div className="moodie-preview-trace" role="img" aria-label={label}>
    {emotionKeys.map(key => {
      const value = Number(scores[key]) || 0;
      return value > 0.01 ? (
        <i
          key={key}
          style={{ backgroundColor: emotionColors[key], flexGrow: value } as CSSProperties}
        />
      ) : null;
    })}
  </div>
);

const PreviewShell = ({ active, children, className }: PreviewShellProps) => (
  <div aria-hidden="true" className={`mf-product-frame moodie-preview ${className}`} data-reveal>
    <aside className="moodie-preview__rail">
      <span className="moodie-preview__mark"><BrandMark /></span>
      <nav>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <span className={item.id === active ? 'is-active' : ''} key={item.id} title={item.label}>
              <Icon size={18} strokeWidth={1.8} />
            </span>
          );
        })}
      </nav>
    </aside>
    <div className="moodie-preview__canvas">{children}</div>
  </div>
);

const PreviewTabs = ({ active }: { active: 'For you' | 'Following' | 'Entries' }) => {
  const tabs = active === 'Entries' ? ['Entries', 'Saved'] : ['For you', 'Following', 'Everyone'];
  return (
    <div className="moodie-preview-tabs">
      {tabs.map(tab => <span className={tab === active ? 'is-active' : ''} key={tab}>{tab}</span>)}
    </div>
  );
};

export const CapturePreview = () => (
  <PreviewShell active="add" className="moodie-preview--capture">
    <div className="moodie-capture-screen">
      <aside className="moodie-capture-film">
        {posters.pastLives && <img src={posters.pastLives} alt="" />}
        <div><strong>Past Lives</strong><span>2023</span></div>
        <p><ArrowLeft size={13} />Choose another film</p>
      </aside>

      <section className="moodie-capture-record">
        <h3>How did it make you feel?</h3>
        <div className="moodie-capture-fields">
          <div className="moodie-preview-field moodie-preview-field--date">
            <span>Watched on</span>
            <strong>July 18, 2026</strong>
          </div>
          <div className="moodie-preview-field moodie-preview-field--note">
            <span>What did it mean to you?</span>
            <p>I expected regret. What caught me was the gentleness of letting grief sit beside a good life without asking that life to disappear.</p>
            <small>143 / 2000</small>
          </div>
          <div className="moodie-preview-field moodie-preview-field--photo">
            <ImagePlus size={19} />
            <span><strong>Choose a photo</strong><small>Optional</small></span>
          </div>
          <fieldset className="moodie-preview-visibility">
            <legend>Visibility</legend>
            <span className="is-selected"><i />Private</span>
            <span><i />Public</span>
            <small>Public responses appear in the feed.</small>
          </fieldset>
        </div>

        <div className="moodie-capture-feelings">
          <header><strong>Add your feelings</strong><span>Set by you</span></header>
          <div className="moodie-preview-sliders">
            <span><i>Stillness</i><b><em style={{ width: '64%' }} /></b><strong>64</strong></span>
            <span><i>Joy</i><b><em style={{ width: '18%' }} /></b><strong>18</strong></span>
            <span><i>Melancholy</i><b><em style={{ width: '77%' }} /></b><strong>77</strong></span>
            <span><i>Wonder</i><b><em style={{ width: '26%' }} /></b><strong>26</strong></span>
          </div>
          <span className="moodie-preview-action">Save response</span>
        </div>
      </section>
    </div>
  </PreviewShell>
);

export const RecommendationPreview = () => (
  <PreviewShell active="home" className="moodie-preview--recommendation">
    <div className="moodie-home-screen">
      <PreviewTabs active="For you" />
      <section className="moodie-journey-moment">
        <div className="moodie-journey-moment__poster">
          {posters.scream && <img src={posters.scream} alt="" />}
        </div>
        <div className="moodie-journey-moment__story">
          <p className="moodie-journey-moment__connection">Recommended through <strong>@ananya_sen</strong></p>
          <h3>Scream</h3>
          <span className="moodie-journey-moment__year">1996</span>
          <blockquote><span>@ananya_sen on Scream</span>I watched this at a friend’s birthday and expected to be scared. Mostly I felt delighted by how suspicion became a shared game in the room.</blockquote>

          <div className="moodie-recommendation-evidence">
            <div>
              <strong>Why this film</strong>
              <dl>
                <div><dt>You both responded to</dt><dd>Whiplash</dd></div>
                <div><dt>Feelings you shared</dt><dd>Friction · Tension</dd></div>
                <div><dt>@ananya_sen felt after Scream</dt><dd>Joy · Tension · Wonder</dd></div>
              </dl>
            </div>
            <section>
              <h4>Your responses to Whiplash</h4>
              <div>
                <blockquote><span>You</span>I hated how quickly I started wanting the approval that was doing the damage.</blockquote>
                <blockquote><span>@ananya_sen</span>I was furious that harm was treated as the price of greatness.</blockquote>
              </div>
            </section>
          </div>

          <div className="moodie-journey-moment__actions">
            <span>Open film <ArrowUpRight size={13} /></span>
            <span>See recommendations</span>
          </div>
        </div>
      </section>
    </div>
  </PreviewShell>
);

interface FeedResponseProps {
  avatar: string;
  date: string;
  feeling: string;
  note: string;
  photo?: string;
  poster: string | null;
  scores: Partial<EmotionScores>;
  title: string;
  username: string;
  year: number;
}

const FeedResponse = ({ avatar, date, feeling, note, photo, poster, scores, title, username, year }: FeedResponseProps) => (
  <article className="moodie-feed-response">
    <header>
      <span className="moodie-feed-response__avatar">{avatar}</span>
      <div><strong>@{username}</strong><time>{date}</time></div>
      <span className="moodie-feed-response__follow">Following</span>
    </header>
    <div className={`moodie-feed-response__content${photo ? ' has-photo' : ''}`}>
      {poster && <img className="moodie-feed-response__poster" src={poster} alt="" />}
      <div>
        <h3>{title} <span>{year}</span></h3>
        <p className="moodie-feed-response__watched">Watched July 2026</p>
        <blockquote>{note}</blockquote>
        <div className="moodie-feed-response__feelings"><PreviewTrace label={feeling} scores={scores} /><span>{feeling}</span></div>
      </div>
      {photo && <img className="moodie-feed-response__photo" src={photo} alt="" />}
    </div>
    <footer>
      <span><Heart size={13} />8 likes</span>
      <span><MessageCircle size={13} />2 comments</span>
      <span>Open film <ArrowUpRight size={13} /></span>
    </footer>
  </article>
);

export const FeedPreview = () => (
  <PreviewShell active="home" className="moodie-preview--feed">
    <div className="moodie-feed-screen">
      <PreviewTabs active="Following" />
      <div className="moodie-feed-screen__responses">
        <FeedResponse
          avatar="A"
          date="Jul 17"
          feeling="Joy · Wonder · Tension"
          note="I watched this at a friend’s birthday and expected to be scared. Mostly I felt delighted by how suspicion became a shared game in the room."
          poster={posters.scream}
          scores={{ happy: 0.86, fearful: 0.17, surprised: 0.49 }}
          title="Scream"
          username="ananya_sen"
          year={1996}
        />
        <FeedResponse
          avatar="D"
          date="Jul 15"
          feeling="Melancholy · Stillness"
          note="I watched this beside someone I love and felt exposed by how quietly grief can live inside a good life. Missing another path did not mean wanting the present to disappear."
          photo="/social/devon-after-past-lives.webp"
          poster={posters.pastLives}
          scores={{ neutral: 0.16, sad: 0.77, surprised: 0.06 }}
          title="Past Lives"
          username="devon_m"
          year={2023}
        />
      </div>
    </div>
  </PreviewShell>
);

interface DiaryPreviewEntryProps {
  date: string;
  feeling: string;
  note: string;
  poster: string | null;
  scores: Partial<EmotionScores>;
  title: string;
  visibility: 'Private' | 'Public';
  year: number;
}

const DiaryPreviewEntry = ({ date, feeling, note, poster, scores, title, visibility, year }: DiaryPreviewEntryProps) => (
  <article className="moodie-diary-entry">
    {poster && <img src={poster} alt="" />}
    <div className="moodie-diary-entry__body">
      <div className="moodie-diary-entry__meta"><span>{date}</span><span>{visibility === 'Private' ? <EyeOff size={11} /> : <Eye size={11} />}{visibility}</span></div>
      <h3>{title} <span>{year}</span></h3>
      <blockquote>{note}</blockquote>
      <div className="moodie-diary-entry__feelings"><PreviewTrace label={feeling} scores={scores} /><span>{feeling}</span></div>
    </div>
    <div className="moodie-diary-entry__actions"><Pencil size={13} /><Trash2 size={13} /></div>
  </article>
);

export const DiaryPreview = () => (
  <PreviewShell active="diary" className="moodie-preview--diary">
    <div className="moodie-diary-screen">
      <header className="moodie-diary-screen__header"><PreviewTabs active="Entries" /><span><Plus size={15} /></span></header>
      <section className="moodie-diary-overview">
        <div>
          <span>Last 10 viewings</span>
          <strong>Melancholy · Stillness · Joy · Wonder</strong>
          <PreviewTrace label="Recent feelings: Melancholy, Stillness, Joy, and Wonder" scores={{ sad: 0.73, neutral: 0.64, happy: 0.31, surprised: 0.22 }} />
          <p><i />Melancholy <i />Stillness <i />Joy <i />Wonder</p>
        </div>
        <dl>
          <div><dt>Responses</dt><dd>34</dd></div>
          <div><dt>Public</dt><dd>18</dd></div>
          <div><dt>Rewatches</dt><dd>3</dd></div>
          <div><dt>Saved</dt><dd>12</dd></div>
        </dl>
      </section>
      <div className="moodie-diary-tools">
        <span><Search size={14} />Search films or your words</span>
        <div><i className="is-active">All</i><i>Public</i><i>Private</i></div>
      </div>
      <section className="moodie-diary-year">
        <h3>2026</h3>
        <DiaryPreviewEntry
          date="July 18"
          feeling="Melancholy · Stillness · Wonder"
          note="The gentleness of letting grief sit beside a good life stayed with me."
          poster={posters.pastLives}
          scores={{ neutral: 0.64, sad: 0.77, surprised: 0.26 }}
          title="Past Lives"
          visibility="Private"
          year={2023}
        />
        <DiaryPreviewEntry
          date="July 12"
          feeling="Friction · Tension"
          note="The ending gave me an ugly burst of excitement, then I felt angry with the film and with myself for feeling it."
          poster={posters.whiplash}
          scores={{ angry: 0.74, fearful: 0.18, disgusted: 0.12 }}
          title="Whiplash"
          visibility="Public"
          year={2014}
        />
      </section>
    </div>
  </PreviewShell>
);
