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
        <path d="M -4 0 Q -3 -25 -8 -42 M 3 0 Q 5 -28 13 -43" stroke="#65472f" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M -43 -44 Q -39 -63 -22 -65 Q -19 -84 1 -79 Q 17 -90 28 -70 Q 46 -66 43 -47 Q 49 -32 30 -27 Q 13 -20 -1 -29 Q -17 -20 -31 -31 Q -47 -30 -43 -44 Z" fill="#285d3d" />
        <path d="M -35 -51 Q -25 -68 -10 -61 Q -3 -78 12 -69 Q 27 -73 34 -57 Q 19 -60 12 -48 Q -4 -54 -13 -43 Q -25 -49 -35 -51 Z" fill="#4f7b43" />
        <path d="M -28 -39 Q -12 -48 0 -39 Q 15 -51 31 -38 Q 17 -24 -1 -30 Q -16 -23 -28 -39 Z" fill="#356c42" />
        <path d="M -23 -60 q 7 -6 15 -2 M 13 -61 q 7 -6 15 0" stroke="#7f9a55" strokeWidth="2" fill="none" opacity="0.65" />
      </symbol>

      <symbol id="deko-busch" viewBox="-50 -50 100 100">
        <path d="M -38 0 Q -44 -14 -29 -20 Q -26 -35 -9 -30 Q 2 -43 14 -28 Q 32 -31 34 -16 Q 45 -8 35 0 Z" fill="#2c6541" />
        <path d="M -31 -7 Q -21 -21 -8 -13 Q 1 -28 14 -17 Q 24 -22 31 -9 Q 15 -12 8 -4 Q -8 -13 -17 -3 Z" fill="#56804a" />
        <path d="M -24 -19 l 4 -3 M 5 -22 l 5 -4 M 22 -12 l 5 -1" stroke="#8ba05e" strokeWidth="2" strokeLinecap="round" />
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
        <path d="M -30 0 L -25 -18 L -9 -35 L 13 -31 L 30 -15 L 35 0 Z" fill="#686b5d" />
        <path d="M -25 -18 L -9 -35 L -2 -10 L -8 0 L -30 0 Z" fill="#8c8875" />
        <path d="M -9 -35 L 13 -31 L 20 -15 L -2 -10 Z" fill="#aaa28a" />
        <path d="M 20 -15 L 30 -15 L 35 0 L -8 0 L -2 -10 Z" fill="#777466" />
        <path d="M -22 -3 q 8 -8 16 -1 M 12 -25 l 5 7" stroke="#516246" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </symbol>

      <symbol id="deko-tempel" viewBox="-50 -95 100 100">
        <path d="M -42 0 L -38 -10 L 38 -10 L 44 0 Z" fill="#8b795f" />
        <rect x="-36" y="-34" width="72" height="25" rx="2" fill="#c9ab77" />
        <path d="M -41 -34 L -29 -45 L 29 -45 L 41 -34 Z" fill="#8f5136" />
        <path d="M -32 -47 L -23 -57 L 23 -57 L 32 -47 Z" fill="#b46b3e" />
        <path d="M -19 -57 L -13 -68 L 13 -68 L 19 -57 Z" fill="#d18a4c" />
        <path d="M -10 -68 L -6 -78 L 6 -78 L 10 -68 Z M -4 -78 L 0 -91 L 4 -78 Z" fill="#e0a75d" />
        <g fill="#75523a"><rect x="-7" y="-26" width="14" height="17" rx="5" /><rect x="-28" y="-28" width="5" height="19" /><rect x="23" y="-28" width="5" height="19" /></g>
        <path d="M -33 -42 H 33 M -26 -54 H 26 M -14 -65 H 14" stroke="#e8c58b" strokeWidth="2" />
        <path d="M -20 -40 v 7 M -9 -40 v 7 M 9 -40 v 7 M 20 -40 v 7" stroke="#633f2e" strokeWidth="2" />
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
        <path d="M -50 0 L -45 -18 L -30 -33 L -15 -72 L 2 -45 L 16 -62 L 31 -29 L 48 0 Z" fill="#596b58" />
        <path d="M -15 -72 L 2 -45 L -5 -22 L -28 -18 Z" fill="#7d8670" />
        <path d="M 16 -62 L 31 -29 L 18 -18 L 5 -29 Z" fill="#87907b" />
        <path d="M -50 0 Q -34 -22 -18 -10 Q -3 -29 10 -9 Q 29 -22 48 0 Z" fill="#315f40" />
        <path d="M -37 -4 q 8 -10 18 -3 M 13 -7 q 9 -11 20 -2" stroke="#71834d" strokeWidth="3" fill="none" />
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
        <g stroke="#617a48" strokeWidth="2" fill="#91a95f">
          <path d="M -46 -6 Q 0 -20 46 -7 L 39 3 Q 0 -10 -41 3 Z" />
          <path d="M -39 -23 Q 0 -36 39 -24 L 34 -13 Q 0 -25 -35 -12 Z" />
          <path d="M -31 -39 Q 0 -49 31 -39 L 27 -29 Q 0 -39 -28 -28 Z" />
        </g>
        <path d="M -38 -3 Q 0 -15 39 -5 M -31 -18 Q 0 -30 32 -20 M -23 -34 Q 0 -42 24 -35" stroke="#d1c982" strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M -25 -2 l -2 -10 M -9 -6 l -1 -11 M 9 -5 l 2 -10 M 27 -2 l 2 -9" stroke="#486b3c" strokeWidth="2" strokeLinecap="round" />
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
