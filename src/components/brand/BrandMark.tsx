import React from 'react';

interface BrandMarkProps {
  className?: string;
  title?: string;
}

const BrandMark: React.FC<BrandMarkProps> = ({ className = 'brand-mark', title }) => (
  <svg
    aria-hidden={title ? undefined : true}
    aria-label={title}
    className={className}
    fill="none"
    role={title ? 'img' : undefined}
    viewBox="0 0 36 36"
    xmlns="http://www.w3.org/2000/svg"
  >
    {title && <title>{title}</title>}
    <path d="M12 4H6.5v28H12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    <path d="M24 4h5.5v28H24" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    <path d="M10 18h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    <circle cx="18" cy="18" fill="var(--color-accent, #D76358)" r="4.5" />
  </svg>
);

export default BrandMark;
