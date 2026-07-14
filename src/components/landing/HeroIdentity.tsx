import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroIdentityProps {
  demoLoading: boolean;
  onEnterDemo: () => void;
  onSignIn: () => void;
}

const HeroIdentity: React.FC<HeroIdentityProps> = ({ demoLoading, onEnterDemo, onSignIn }) => (
  <div className="hero-welcome">
    <div className="hero-welcome__statement">
      <h1 id="landing-title">
        No two people leave the{' '}
        <span className="hero-welcome__register">
          <span className="hero-welcome__register-main">same film.</span>
          <span aria-hidden="true" className="hero-welcome__register-echo hero-welcome__register-echo--fig">same film.</span>
          <span aria-hidden="true" className="hero-welcome__register-echo hero-welcome__register-echo--oxide">same film.</span>
        </span>
      </h1>
      <p className="hero-welcome__conclusion">Find your next through people who felt something familiar.</p>
    </div>

    <div className="landing-actions hero-welcome__actions">
      <button className="button button--primary" disabled={demoLoading} onClick={onEnterDemo} type="button">
        {demoLoading ? 'Opening demo' : 'Enter demo'}<ArrowRight size={18} />
      </button>
      <button className="landing-text-link" onClick={onSignIn} type="button">Sign in</button>
    </div>
  </div>
);

export default HeroIdentity;
