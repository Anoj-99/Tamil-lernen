// Die Symbol-Bibliothek der Landschaft: stilisierte Sri-Lanka-Elemente
// als flache Vektor-Symbole (begrenzte, warme Palette – bewusst keine
// Verläufe, kein Glanz). Einmal in <defs> definiert, per <use> beliebig
// oft platziert → performant auch bei hunderten Elementen.
//
// Reine Darstellung: Spätere professionelle Illustrationen ersetzen nur
// diese Symbole – Berechnungen und Datenstrukturen bleiben unberührt.
// Alle Symbole "stehen" auf y=0 ihrer 100×100-Box (Fußpunkt unten).
export default function KartenDeko() {
  return (
    <defs>
      <symbol id="deko-palme" viewBox="-50 -90 100 100">
        <path d="M -5 0 Q -3 -42 5 -64" stroke="#8a5a33" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M -2 -20 L 4 -22 M -4 -34 L 2 -36 M -3 -48 L 3 -50" stroke="#7a4c28" strokeWidth="2.5" strokeLinecap="round" />
        <g fill="#3d9455">
          <path d="M 5 -64 Q -28 -80 -45 -64 Q -20 -68 5 -58 Z" />
          <path d="M 5 -64 Q 37 -80 49 -60 Q 24 -66 5 -58 Z" />
          <path d="M 5 -64 Q -13 -93 -34 -89 Q -12 -80 7 -60 Z" />
          <path d="M 5 -64 Q 23 -93 41 -87 Q 17 -80 3 -60 Z" />
        </g>
        <path d="M 5 -64 Q -20 -74 -36 -66" stroke="#2e7c44" strokeWidth="2" fill="none" />
        <circle cx="-1" cy="-58" r="4.5" fill="#7a4c28" />
        <circle cx="9" cy="-55" r="4.5" fill="#7a4c28" />
      </symbol>

      <symbol id="deko-baum" viewBox="-50 -90 100 100">
        <path d="M -3 0 L -2 -34 M 2 0 L 1 -34" stroke="#8a5a33" strokeWidth="7" strokeLinecap="round" />
        <circle cx="-14" cy="-46" r="17" fill="#3d9455" />
        <circle cx="12" cy="-50" r="19" fill="#2e7c44" />
        <circle cx="-2" cy="-62" r="16" fill="#4aa763" />
        <circle cx="6" cy="-40" r="13" fill="#3d9455" />
      </symbol>

      <symbol id="deko-busch" viewBox="-50 -50 100 100">
        <circle cx="-13" cy="-13" r="13" fill="#4aa763" />
        <circle cx="9" cy="-16" r="15" fill="#2e7c44" />
        <circle cx="21" cy="-8" r="10" fill="#3d9455" />
        <circle cx="-2" cy="-8" r="11" fill="#3d9455" />
      </symbol>

      <symbol id="deko-blume" viewBox="-50 -50 100 100">
        <path d="M 0 0 Q -1 -8 0 -14" stroke="#3d9455" strokeWidth="2" fill="none" />
        <g fill="#e8788f">
          <circle cx="0" cy="-20" r="5" />
          <circle cx="-6" cy="-14" r="5" />
          <circle cx="6" cy="-14" r="5" />
          <circle cx="-4" cy="-7" r="5" />
          <circle cx="4" cy="-7" r="5" />
        </g>
        <circle cx="0" cy="-13" r="4" fill="#f2c14e" />
      </symbol>

      <symbol id="deko-gras" viewBox="-50 -50 100 100">
        <path
          d="M -8 0 Q -10 -14 -14 -18 M -3 0 Q -3 -16 -1 -22 M 3 0 Q 5 -14 9 -19 M 8 0 Q 11 -10 15 -13"
          stroke="#4aa763"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </symbol>

      <symbol id="deko-fels" viewBox="-50 -50 100 100">
        <path d="M -26 0 L -19 -20 L 0 -28 L 21 -17 L 27 0 Z" fill="#b3ab9c" />
        <path d="M -9 0 L -4 -24 L 10 -16 L 12 0 Z" fill="#9d9384" />
        <path d="M -19 -6 L -12 -9" stroke="#8d8375" strokeWidth="2" strokeLinecap="round" />
      </symbol>

      <symbol id="deko-tempel" viewBox="-50 -95 100 100">
        <rect x="-36" y="-28" width="72" height="28" rx="2" fill="#e3cf9d" />
        <rect x="-36" y="-30" width="72" height="5" fill="#cdb379" />
        <rect x="-25" y="-52" width="50" height="24" rx="2" fill="#d8bf85" />
        <rect x="-14" y="-72" width="28" height="20" rx="2" fill="#cdb379" />
        <path d="M 0 -92 L 9 -72 L -9 -72 Z" fill="#c2a666" />
        <circle cx="0" cy="-89" r="3.5" fill="#d9942b" />
        <rect x="-6" y="-18" width="12" height="18" rx="5" fill="#7a4c28" />
        <rect x="-28" y="-22" width="7" height="10" rx="3" fill="#c2a666" />
        <rect x="21" y="-22" width="7" height="10" rx="3" fill="#c2a666" />
      </symbol>

      <symbol id="deko-haus" viewBox="-50 -70 100 100">
        <rect x="-24" y="-28" width="48" height="28" rx="2" fill="#e9dbb8" />
        <path d="M -30 -28 L 0 -52 L 30 -28 Z" fill="#c26b4a" />
        <path d="M -30 -28 L 30 -28" stroke="#a85539" strokeWidth="3" />
        <rect x="-7" y="-16" width="14" height="16" rx="2" fill="#7a4c28" />
        <rect x="-19" y="-22" width="8" height="8" rx="1.5" fill="#a2c4d4" />
        <rect x="11" y="-22" width="8" height="8" rx="1.5" fill="#a2c4d4" />
      </symbol>

      <symbol id="deko-berg" viewBox="-50 -85 100 100">
        <path d="M -44 0 L -10 -70 L 12 -32 L 22 -48 L 46 0 Z" fill="#97a091" />
        <path d="M -10 -70 L 0 -50 L -7 -47 L -18 -54 Z" fill="#eef2ec" />
        <path d="M 22 -48 L 30 -31 L 17 -33 Z" fill="#eef2ec" />
        <path d="M -30 -18 Q -24 -24 -18 -18" stroke="#87907f" strokeWidth="2.5" fill="none" />
      </symbol>

      <symbol id="deko-wasserfall" viewBox="-50 -80 100 100">
        <path d="M -38 -76 L -8 -76 L -3 -12 L -44 -12 Z" fill="#97a091" />
        <path d="M 8 -76 L 38 -76 L 44 -12 L 3 -12 Z" fill="#97a091" />
        <rect x="-9" y="-76" width="18" height="66" fill="#a9d7e8" />
        <rect x="-5" y="-76" width="4" height="66" fill="#d3ecf6" />
        <ellipse cx="0" cy="-7" rx="24" ry="7" fill="#a9d7e8" />
        <ellipse cx="-2" cy="-8" rx="13" ry="3.5" fill="#d3ecf6" />
      </symbol>

      <symbol id="deko-see" viewBox="-50 -50 100 100">
        <path
          d="M -34 -12 Q -30 -30 -8 -28 Q 16 -34 28 -20 Q 40 -8 24 -2 Q 4 4 -16 0 Q -36 -2 -34 -12 Z"
          fill="#a9d7e8"
        />
        <path d="M -18 -16 Q -6 -22 8 -17" stroke="#d3ecf6" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M -30 -26 Q -26 -32 -20 -28" stroke="#4aa763" strokeWidth="3" fill="none" strokeLinecap="round" />
      </symbol>

      <symbol id="deko-reisfeld" viewBox="-50 -60 100 100">
        <g stroke="#8fbf6d" strokeWidth="2" fill="#b5d98a">
          <path d="M -40 -8 Q 0 -16 40 -8 L 36 0 Q 0 -8 -36 0 Z" />
          <path d="M -34 -22 Q 0 -30 34 -22 L 31 -13 Q 0 -21 -31 -13 Z" />
          <path d="M -27 -36 Q 0 -43 27 -36 L 25 -27 Q 0 -34 -25 -27 Z" />
        </g>
        <path d="M -20 -5 L -20 -9 M 0 -8 L 0 -12 M 20 -5 L 20 -9" stroke="#5c9e46" strokeWidth="2" strokeLinecap="round" />
      </symbol>

      <symbol id="deko-elefant" viewBox="-50 -70 100 100">
        <ellipse cx="4" cy="-24" rx="29" ry="21" fill="#9aa5b1" />
        <circle cx="-25" cy="-37" r="13" fill="#9aa5b1" />
        <path d="M -34 -31 Q -42 -18 -35 -6" stroke="#9aa5b1" strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="-28" cy="-41" r="2.2" fill="#3f4650" />
        <ellipse cx="-17" cy="-44" rx="6" ry="8" fill="#8794a2" />
        <rect x="-10" y="-9" width="8" height="10" rx="3.5" fill="#8794a2" />
        <rect x="14" y="-9" width="8" height="10" rx="3.5" fill="#8794a2" />
        <path d="M 30 -30 Q 37 -26 33 -19" stroke="#8794a2" strokeWidth="3" fill="none" strokeLinecap="round" />
      </symbol>

      <symbol id="deko-makake" viewBox="-50 -60 100 100">
        <circle cx="0" cy="-14" r="13" fill="#9c7048" />
        <circle cx="0" cy="-36" r="10" fill="#9c7048" />
        <circle cx="0" cy="-34" r="6.5" fill="#e8cfae" />
        <circle cx="-10" cy="-41" r="3.5" fill="#9c7048" />
        <circle cx="10" cy="-41" r="3.5" fill="#9c7048" />
        <circle cx="-2.4" cy="-36" r="1.4" fill="#3f3428" />
        <circle cx="2.4" cy="-36" r="1.4" fill="#3f3428" />
        <path d="M 11 -16 Q 26 -24 24 -40" stroke="#9c7048" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      </symbol>

      <symbol id="deko-pfau" viewBox="-50 -70 100 100">
        <g fill="#2e86ab">
          <path d="M -4 -18 Q -30 -34 -26 -58 Q -12 -44 -2 -30 Z" opacity="0.85" />
          <path d="M 0 -20 Q -8 -50 8 -64 Q 10 -42 6 -26 Z" opacity="0.85" />
          <path d="M 4 -18 Q 26 -40 38 -34 Q 24 -26 10 -14 Z" opacity="0.85" />
        </g>
        <circle cx="-24" cy="-56" r="3" fill="#f2c14e" />
        <circle cx="7" cy="-61" r="3" fill="#f2c14e" />
        <circle cx="35" cy="-33" r="3" fill="#f2c14e" />
        <path d="M 0 0 Q -2 -10 0 -16" stroke="#1d6f93" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="1" cy="-19" r="5" fill="#1d6f93" />
        <path d="M 1 -24 L 3 -28 M 1 -24 L -1 -28" stroke="#1d6f93" strokeWidth="1.5" />
      </symbol>

      <symbol id="deko-eisvogel" viewBox="-50 -50 100 100">
        <path d="M -6 0 Q -7 -5 -5 -8" stroke="#8a5a33" strokeWidth="2" fill="none" />
        <ellipse cx="-2" cy="-14" rx="8" ry="6.5" fill="#2e86ab" />
        <circle cx="4" cy="-19" r="4.5" fill="#2e86ab" />
        <path d="M 8 -19 L 16 -17" stroke="#d9942b" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="5.4" cy="-20" r="1.1" fill="#173a4a" />
        <ellipse cx="-4" cy="-12" rx="4.5" ry="3" fill="#e8955e" />
      </symbol>

      <symbol id="deko-bruecke" viewBox="-50 -40 100 80">
        <path d="M -34 6 Q 0 -18 34 6" stroke="#8a5a33" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M -34 -2 Q 0 -26 34 -2" stroke="#a06b3d" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M -26 3 L -26 -8 M -13 -2 L -13 -13 M 0 -4 L 0 -15 M 13 -2 L 13 -13 M 26 3 L 26 -8" stroke="#8a5a33" strokeWidth="3" strokeLinecap="round" />
      </symbol>
    </defs>
  );
}
