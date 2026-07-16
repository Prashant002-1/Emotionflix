import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroIdentityProps {
  demoLoading: boolean;
  onEnterDemo: () => void;
  onSignIn: () => void;
}

const HeroIdentity: React.FC<HeroIdentityProps> = ({ demoLoading, onEnterDemo, onSignIn }) => (
  <div className="mf-hero-copy">
    <p className="mf-hero-copy__eyebrow">A social film journal and recommendation system</p>
    <div className="mf-hero-copy__statement">
      <h1 id="landing-title">No two people feel the same.</h1>
      <p className="mf-hero-copy__conclusion">
        Log how a film felt. Get recommendations from people who felt something similar.
      </p>
    </div>

    <div className="mf-hero-copy__actions">
      <button className="mf-primary-action" disabled={demoLoading} onClick={onEnterDemo} type="button">
        {demoLoading ? 'Opening demo' : 'Enter demo'}<ArrowRight size={18} />
      </button>
      <button className="mf-text-action" onClick={onSignIn} type="button">Sign in</button>
    </div>
  </div>
);

export default HeroIdentity;
