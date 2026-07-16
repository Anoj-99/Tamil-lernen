// EBENE 2 (Rendering): das Wegbett, die unregelmäßigen Steinplatten
// (mit Moos), Gras und Blumen am Wegrand sowie Brücken an den
// Fluss-Querungen. Alles kommt vorberechnet und deterministisch aus
// landschaft.ts / wegGenerator.ts – hier wird nur gezeichnet.
import { memo, useMemo } from "react";
import { Biom } from "./biome";
import { WEG } from "./kartenKonfig";
import { WegSchmuck, WegStein } from "./landschaft";
import { imBild, SichtBereich } from "./sichtfenster";
import { Weg, WegPunkt } from "./wegGenerator";

// Geometrie → SVG (nur hier, die Layout-Module kennen kein SVG).
function pfadD(samples: WegPunkt[]): string {
  if (samples.length === 0) return "";
  return (
    `M ${samples[0].x.toFixed(1)} ${samples[0].y.toFixed(1)} ` +
    samples
      .slice(1)
      .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ")
  );
}

function polygonPunkte(form: WegPunkt[]): string {
  return form.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

interface Props {
  weg: Weg;
  biom: Biom;
  steine: WegStein[];
  schmuck: WegSchmuck;
  bereich: SichtBereich;
}

function WegEbene({ weg, biom, steine, schmuck, bereich }: Props) {
  const bettD = useMemo(() => pfadD(weg.samples), [weg]);
  return (
    <g aria-hidden="true">
      {/* Erdiges Wegbett unter den Platten */}
      <path
        d={bettD}
        fill="none"
        stroke={biom.farben.wegBett}
        strokeWidth={WEG.bettBreite}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.78}
      />
      <path d={bettD} fill="none" stroke="#d1b488" strokeWidth={WEG.bettBreite - 18} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />

      {/* Unregelmäßige Steinplatten, teils bemoost */}
      {steine
        .filter((s) => imBild(s.y, bereich))
        .map((s, i) => (
          <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.drehung.toFixed(1)})`}>
            <polygon
              points={polygonPunkte(s.form)}
              fill="#806e55"
              transform="translate(0 4)"
              stroke="#675842"
              strokeWidth="1.8"
            />
            <polygon
              points={polygonPunkte(s.form)}
              fill={biom.farben.wegStein}
              stroke={biom.farben.wegBett}
              strokeWidth="1.4"
            />
            <polyline points={polygonPunkte(s.form.slice(0, 3))} fill="none" stroke="#efe3c8" strokeWidth="1.7" opacity="0.52" />
            <path d="M -7 3 q 6 -7 13 -2" fill="none" stroke="#8f8269" strokeWidth="1.2" opacity="0.55" />
            {s.moos && <path d="M -9 4 q 6 -8 13 -3 q 4 1 7 6 q -10 -4 -20 -3 Z" fill="#667f4d" opacity={0.82} />}
          </g>
        ))}

      {/* Gras und kleine Blumen am Wegrand */}
      {schmuck.gras
        .filter((g) => imBild(g.y, bereich))
        .map((g, i) => (
          <use
            key={`g${i}`}
            href="#deko-gras"
            x={-50}
            y={-50}
            width={100}
            height={100}
            transform={`translate(${g.x} ${g.y}) scale(${g.skala})`}
          />
        ))}
      {schmuck.blumen
        .filter((b) => imBild(b.y, bereich))
        .map((b, i) => (
          <use
            key={`b${i}`}
            href="#deko-blume"
            x={-50}
            y={-50}
            width={100}
            height={100}
            transform={`translate(${b.x} ${b.y}) scale(${b.skala})`}
          />
        ))}

      {/* Brücken – nur dort, wo laut Welt ein Fluss den Weg quert */}
      {weg.bruecken
        .filter((b) => imBild(b.y, bereich))
        .map((b, i) => (
          <use
            key={`br${i}`}
            href="#deko-bruecke"
            x={-50}
            y={-40}
            width={100}
            height={80}
            transform={`translate(${b.x} ${b.y}) rotate(${(b.drehungGrad - 90).toFixed(1)})`}
          />
        ))}
    </g>
  );
}

export default memo(WegEbene);
