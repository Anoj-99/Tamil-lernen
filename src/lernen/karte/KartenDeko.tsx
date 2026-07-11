// Stilisierte Sri-Lanka-Landschaftselemente als SVG-Symbole. Sie werden
// einmal in <defs> definiert und per <use> beliebig oft platziert – so
// bleibt die Karte auch mit vielen hundert Deko-Elementen performant.
// Reine Atmosphäre, keine Spiellogik.
export default function KartenDeko() {
  return (
    <defs>
      {/* Land-Hintergrund: sattes Grün, das nach unten wärmer wird */}
      <linearGradient id="karte-land" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d1f0d1" />
        <stop offset="45%" stopColor="#c2e8bd" />
        <stop offset="100%" stopColor="#e8e4b8" />
      </linearGradient>
      <radialGradient id="karte-lichtung" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#dff5d8" />
        <stop offset="100%" stopColor="#dff5d800" />
      </radialGradient>

      <symbol id="deko-palme" viewBox="-50 -90 100 100">
        <path d="M -4 0 Q -2 -40 4 -62" stroke="#8a5a2b" strokeWidth="9" fill="none" strokeLinecap="round" />
        <g fill="#2e9e4f">
          <path d="M 4 -62 Q -28 -78 -44 -64 Q -20 -66 4 -56 Z" />
          <path d="M 4 -62 Q 36 -78 48 -60 Q 24 -64 4 -56 Z" />
          <path d="M 4 -62 Q -14 -92 -34 -88 Q -12 -78 6 -58 Z" />
          <path d="M 4 -62 Q 22 -92 40 -86 Q 16 -78 2 -58 Z" />
        </g>
        <circle cx="-2" cy="-56" r="5" fill="#7a4a1e" />
        <circle cx="8" cy="-52" r="5" fill="#7a4a1e" />
      </symbol>

      <symbol id="deko-tempel" viewBox="-50 -95 100 100">
        <rect x="-34" y="-30" width="68" height="30" rx="3" fill="#e8d3a3" />
        <rect x="-24" y="-52" width="48" height="24" rx="3" fill="#dfc48d" />
        <rect x="-14" y="-72" width="28" height="22" rx="3" fill="#d4b476" />
        <path d="M 0 -92 L 8 -72 L -8 -72 Z" fill="#c9a45f" />
        <circle cx="0" cy="-90" r="4" fill="#e5b93c" />
        <rect x="-6" y="-18" width="12" height="18" rx="5" fill="#8a5a2b" />
      </symbol>

      <symbol id="deko-elefant" viewBox="-50 -70 100 100">
        <ellipse cx="2" cy="-26" rx="30" ry="22" fill="#9aa5b1" />
        <circle cx="-26" cy="-38" r="14" fill="#9aa5b1" />
        <path d="M -36 -32 Q -44 -18 -36 -6" stroke="#9aa5b1" strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="-30" cy="-42" r="2.4" fill="#333" />
        <ellipse cx="-18" cy="-46" rx="7" ry="9" fill="#8794a2" />
        <rect x="-12" y="-10" width="9" height="12" rx="4" fill="#8794a2" />
        <rect x="12" y="-10" width="9" height="12" rx="4" fill="#8794a2" />
      </symbol>

      <symbol id="deko-affe" viewBox="-50 -70 100 100">
        <circle cx="0" cy="-16" r="15" fill="#8a5a2b" />
        <circle cx="0" cy="-42" r="11" fill="#8a5a2b" />
        <circle cx="0" cy="-40" r="7" fill="#e8c9a0" />
        <circle cx="-11" cy="-46" r="4" fill="#8a5a2b" />
        <circle cx="11" cy="-46" r="4" fill="#8a5a2b" />
        <circle cx="-2.5" cy="-42" r="1.6" fill="#333" />
        <circle cx="2.5" cy="-42" r="1.6" fill="#333" />
        <path d="M 13 -18 Q 30 -26 28 -44" stroke="#8a5a2b" strokeWidth="5" fill="none" strokeLinecap="round" />
      </symbol>

      <symbol id="deko-wasserfall" viewBox="-50 -80 100 100">
        <path d="M -40 -78 L -8 -78 L -2 -10 L -46 -10 Z" fill="#9db3a0" />
        <path d="M 8 -78 L 40 -78 L 46 -10 L 2 -10 Z" fill="#9db3a0" />
        <rect x="-10" y="-78" width="20" height="70" fill="#8fd0f0" />
        <rect x="-6" y="-78" width="5" height="70" fill="#c9ecfb" />
        <ellipse cx="0" cy="-6" rx="26" ry="8" fill="#8fd0f0" />
        <ellipse cx="0" cy="-7" rx="16" ry="4" fill="#c9ecfb" />
      </symbol>

      <symbol id="deko-busch" viewBox="-50 -50 100 100">
        <circle cx="-12" cy="-14" r="14" fill="#3d9e5c" />
        <circle cx="10" cy="-18" r="16" fill="#2e8a4c" />
        <circle cx="22" cy="-8" r="11" fill="#3d9e5c" />
      </symbol>

      <symbol id="deko-blume" viewBox="-50 -50 100 100">
        <g fill="#f27ba0">
          <circle cx="0" cy="-22" r="6" />
          <circle cx="-8" cy="-14" r="6" />
          <circle cx="8" cy="-14" r="6" />
          <circle cx="-5" cy="-5" r="6" />
          <circle cx="5" cy="-5" r="6" />
        </g>
        <circle cx="0" cy="-13" r="5" fill="#ffd34d" />
      </symbol>

      <symbol id="deko-fels" viewBox="-50 -50 100 100">
        <path d="M -26 0 L -18 -22 L 2 -30 L 22 -18 L 28 0 Z" fill="#b8b2a6" />
        <path d="M -10 0 L -4 -26 L 10 -18 L 12 0 Z" fill="#a49e92" />
      </symbol>

      <symbol id="deko-vogel" viewBox="-50 -60 100 100">
        <path d="M -22 -34 Q -10 -46 0 -34 Q 10 -46 22 -34" stroke="#4a7ab5" strokeWidth="5" fill="none" strokeLinecap="round" />
      </symbol>
    </defs>
  );
}
