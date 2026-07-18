import { Link } from 'react-router-dom';
import { EmotionScores } from '../../types/emotion';
import { Movie } from '../../types/movie';
import { emotionLabels } from '../../utils/display';

type RecommendationConnection = NonNullable<Movie['recommended_by']>[number];

interface RecommendationEvidenceProps {
  connection: RecommendationConnection;
  movieTitle: string;
  requestedFeelings?: (keyof EmotionScores)[];
  showComparison?: boolean;
}

const feelingList = (feelings: (keyof EmotionScores)[]) => feelings.map(key => emotionLabels[key]).join(' · ');

export function RecommendationEvidence({ connection, movieTitle, requestedFeelings = [], showComparison = false }: RecommendationEvidenceProps) {
  const shared = connection.shared_feelings || [];
  const response = connection.response_feelings || [];
  return (
    <div className="recommendation-evidence">
      <p className="recommendation-evidence__title">Why this film</p>
      <dl>
        <div><dt>You both responded to</dt><dd>{connection.shared_film_title}</dd></div>
        {shared.length > 0 && <div><dt>Feelings you shared</dt><dd>{feelingList(shared)}</dd></div>}
        {requestedFeelings.length > 0 && <div><dt>You wanted</dt><dd>{feelingList(requestedFeelings)}</dd></div>}
        {response.length > 0 && <div><dt><Link to={`/member/${connection.username}`}>@{connection.username}</Link> felt after {movieTitle}</dt><dd>{feelingList(response)}</dd></div>}
      </dl>
      {showComparison && connection.viewer_shared_note && connection.person_shared_note && (
        <section className="recommendation-evidence__comparison" aria-label={`Your responses to ${connection.shared_film_title}`}>
          <h3>Your responses to {connection.shared_film_title}</h3>
          <div className="recommendation-evidence__responses">
            <blockquote><span>You</span>{connection.viewer_shared_note}</blockquote>
            <blockquote><span>@{connection.username}</span>{connection.person_shared_note}</blockquote>
          </div>
        </section>
      )}
    </div>
  );
}
