import React, { useId, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroIdentityProps {
  demoLoading: boolean;
  notes: string[];
  onEnterDemo: () => void;
  onSignIn: () => void;
}

const fallbackResponses = [
  'I could not shake the silence.',
  'It made me call my mother.',
  'I felt relieved and guilty at once.',
];

const responseFragment = (note: string | undefined, fallback: string) => {
  if (!note) return fallback;
  const firstThought = note.trim().split(/(?<=[.!?])\s+/)[0];
  if (firstThought.length <= 88) return firstThought;
  const clipped = firstThought.slice(0, 88);
  return `${clipped.slice(0, clipped.lastIndexOf(' ')).trim()}...`;
};

const HeroIdentity: React.FC<HeroIdentityProps> = ({ demoLoading, notes, onEnterDemo, onSignIn }) => {
  const filterId = `hero-ink-${useId().replace(/:/g, '')}`;
  const responses = useMemo(
    () => fallbackResponses.map((fallback, index) => responseFragment(notes[index], fallback)),
    [notes],
  );

  return (
    <div className="hero-identity">
      <div className="hero-identity__residue" aria-hidden="true">
        <span className="hero-rating hero-rating--score">8.7</span>
        <span className="hero-rating hero-rating--percent">92%</span>
        <span className="hero-rating hero-rating--stars">★ ★ ★ ★ ☆</span>
        <span className="hero-rating hero-rating--decimal">4.5</span>
      </div>

      <svg className="hero-identity__ink" viewBox="0 0 900 560" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-18%" y="-30%" width="136%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence baseFrequency="0.009 0.052" numOctaves="4" seed="19" type="fractalNoise" result="fibres" />
            <feDisplacementMap in="SourceGraphic" in2="fibres" scale="34" xChannelSelector="R" yChannelSelector="B" result="wicked" />
            <feGaussianBlur in="wicked" stdDeviation="2.2" result="softened" />
            <feComponentTransfer in="softened">
              <feFuncA type="gamma" amplitude="1.08" exponent="0.82" offset="0" />
            </feComponentTransfer>
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          <path className="hero-ink-shape hero-ink-shape--fig" d="M-42 286 C92 214 191 287 296 232 C402 177 477 218 568 188 C686 148 778 174 949 103 L954 399 C819 371 728 416 614 374 C518 338 444 389 330 348 C217 307 111 365 -42 329 Z" />
          <path className="hero-ink-shape hero-ink-shape--oxide" d="M-58 346 C72 285 163 351 282 304 C391 261 471 304 585 260 C708 213 802 250 954 197 L954 425 C812 393 707 445 586 404 C471 366 371 421 260 378 C145 333 49 390 -58 370 Z" />
          <path className="hero-ink-shape hero-ink-shape--teal" d="M-36 390 C87 345 180 402 307 366 C427 332 514 378 639 342 C756 308 828 332 951 302 L951 451 C824 430 738 468 618 438 C501 409 406 451 289 419 C173 388 78 429 -36 407 Z" />
        </g>
      </svg>

      <div className="hero-identity__responses" aria-hidden="true">
        {responses.map((response, index) => (
          <p className={`hero-response hero-response--${index + 1}`} key={`${response}-${index}`}>
            “{response}”
          </p>
        ))}
      </div>

      <div className="hero-identity__statement">
        <h1 id="landing-title">No two people leave the same film.</h1>
        <p className="hero-identity__conclusion">Find your next through people who felt something familiar.</p>
      </div>

      <svg className="hero-identity__bridge" viewBox="0 0 720 74" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 52 C146 71 232 17 359 39 C485 61 563 18 720 31" pathLength="1" />
      </svg>

      <div className="landing-actions hero-identity__actions">
        <button className="button button--primary" disabled={demoLoading} onClick={onEnterDemo} type="button">
          {demoLoading ? 'Opening demo' : 'Enter demo'}<ArrowRight size={18} />
        </button>
        <button className="landing-text-link" onClick={onSignIn} type="button">Sign in</button>
      </div>
    </div>
  );
};

export default HeroIdentity;
