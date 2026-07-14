import React, { useId } from 'react';

interface InkBleedProps {
  from: string;
  to: string;
  mix?: string;
  seed?: number;
}

const toneFor = (hex: string) => {
  const value = hex.replace('#', '');
  if (value.length !== 6) return 'light';
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 0.299 + green * 0.587 + blue * 0.114) < 126 ? 'dark' : 'light';
};

const InkBleed: React.FC<InkBleedProps> = ({ from, to, mix, seed = 7 }) => {
  const uid = useId().replace(/:/g, '');
  const edgeId = `ink-edge-${uid}`;
  const bloomId = `ink-bloom-${uid}`;

  return (
    <div className="ink-bleed" style={{ '--ink-from': from, '--ink-to': to } as React.CSSProperties} aria-hidden="true">
      <span className="ink-bleed__tone ink-bleed__tone--from" data-nav-tone={toneFor(from)} />
      <span className="ink-bleed__tone ink-bleed__tone--to" data-nav-tone={toneFor(to)} />
      <svg preserveAspectRatio="none" role="presentation" viewBox="0 0 1440 210">
        <defs>
          <filter id={edgeId} x="-8%" y="-70%" width="116%" height="250%" colorInterpolationFilters="sRGB">
            <feTurbulence baseFrequency="0.004 0.052" numOctaves="4" seed={seed} type="fractalNoise" result="paperFibres" />
            <feDisplacementMap in="SourceGraphic" in2="paperFibres" scale="74" xChannelSelector="R" yChannelSelector="B" result="wickedEdge" />
            <feGaussianBlur in="wickedEdge" stdDeviation="2.2" result="softEdge" />
            <feComponentTransfer in="softEdge">
              <feFuncA type="gamma" amplitude="1.08" exponent="0.82" offset="0" />
            </feComponentTransfer>
          </filter>
          <filter id={bloomId} x="-12%" y="-110%" width="124%" height="320%" colorInterpolationFilters="sRGB">
            <feTurbulence baseFrequency="0.007 0.081" numOctaves="3" seed={seed + 11} type="fractalNoise" result="fineFibres" />
            <feDisplacementMap in="SourceGraphic" in2="fineFibres" scale="38" xChannelSelector="G" yChannelSelector="R" result="feathered" />
            <feGaussianBlur in="feathered" stdDeviation="6.4" />
          </filter>
        </defs>

        <rect width="1440" height="210" fill={from} />
        <path
          d="M-100 80 C95 44 212 109 378 84 C552 57 684 111 844 79 C1022 42 1165 103 1540 58 L1540 230 L-100 230 Z"
          fill={to}
          filter={`url(#${bloomId})`}
          opacity="0.48"
        />
        {mix && (
          <path
            d="M-90 96 C88 52 232 122 402 91 C574 60 720 121 884 88 C1052 54 1210 114 1530 71 L1530 224 L-90 224 Z"
            fill={mix}
            filter={`url(#${bloomId})`}
            opacity="0.38"
          />
        )}
        <path
          d="M-100 108 C72 65 221 132 391 101 C564 70 710 132 872 98 C1042 63 1197 127 1540 83 L1540 230 L-100 230 Z"
          fill={to}
          filter={`url(#${edgeId})`}
        />
        <g fill={to} filter={`url(#${bloomId})`} opacity="0.7">
          <ellipse cx="158" cy="92" rx="88" ry="28" />
          <ellipse cx="487" cy="103" rx="116" ry="23" />
          <ellipse cx="794" cy="91" rx="96" ry="30" />
          <ellipse cx="1136" cy="88" rx="132" ry="25" />
          <ellipse cx="1388" cy="78" rx="102" ry="31" />
        </g>
      </svg>
    </div>
  );
};

export default InkBleed;
