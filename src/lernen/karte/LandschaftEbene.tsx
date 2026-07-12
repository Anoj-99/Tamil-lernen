// EBENE 1 (Rendering): Grundfläche, Wiesen, Flüsse und Dekoration.
// Kennt keine Level – nur Biom-Farben und die vorberechneten
// Landschafts-Daten. Flache Farben (keine Verläufe), einheitliches
// Morgenlicht mit langen weichen Schatten. Die Welt füllt die volle
// Breite und läuft oben wie unten aus dem Bild – kein sichtbares Ende.
import { memo } from "react";
import { Biom } from "./biome";
import { KARTE, LICHT } from "./kartenKonfig";
import { LandschaftsDaten } from "./landschaft";
import { imBild, SichtBereich } from "./sichtfenster";

interface Props {
  biom: Biom;
  daten: LandschaftsDaten;
  weltHoehe: number;
  bereich: SichtBereich;
}

// Langer, weicher Morgen-Schatten unter einem Objekt.
export function MorgenSchatten({ x, y, skala }: { x: number; y: number; skala: number }) {
  return (
    <ellipse
      cx={x + 34 * skala * LICHT.schattenDx}
      cy={y + 4 * skala * LICHT.schattenDy}
      rx={32 * skala}
      ry={8 * skala}
      fill="#3f4a38"
      opacity={LICHT.schattenDeckkraft}
    />
  );
}

function LandschaftEbene({ biom, daten, weltHoehe, bereich }: Props) {
  return (
    <g aria-hidden="true">
      {/* Land in voller Breite; Meer nur als seitliche Streifen */}
      <rect x="0" y="0" width={KARTE.breite} height={weltHoehe} fill={biom.farben.grund} />
      <rect x="0" y="0" width={KARTE.kuesteBreite} height={weltHoehe} fill={biom.farben.wasser} />
      <rect
        x={KARTE.breite - KARTE.kuesteBreite}
        y="0"
        width={KARTE.kuesteBreite}
        height={weltHoehe}
        fill={biom.farben.wasser}
      />
      <rect x={KARTE.kuesteBreite} y="0" width={16} height={weltHoehe} fill={biom.farben.kueste} />
      <rect
        x={KARTE.breite - KARTE.kuesteBreite - 16}
        y="0"
        width={16}
        height={weltHoehe}
        fill={biom.farben.kueste}
      />

      {/* Helle Wiesen-Flecken (ruhige, flache Farbinseln) */}
      {daten.wiesen
        .filter((w) => imBild(w.y, bereich))
        .map((w, i) => (
          <ellipse key={i} cx={w.x} cy={w.y} rx={w.rx} ry={w.ry} fill={biom.farben.wiese} />
        ))}

      {/* Flüsse: queren die Welt genau durch ihren Wegpunkt (dort steht
          die Brücke der Weg-Ebene) */}
      {daten.fluesse
        .filter((f) => imBild(f.y, bereich))
        .map((f, i) => {
          const d =
            `M -20 ${f.y + f.schwung} ` +
            `Q ${f.x / 2} ${f.y - f.schwung * 0.6} ${f.x} ${f.y} ` +
            `Q ${(f.x + KARTE.breite) / 2} ${f.y + f.schwung} ${KARTE.breite + 20} ${f.y - f.schwung * 0.5}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={biom.farben.wasser} strokeWidth={26} strokeLinecap="round" />
              <path d={d} fill="none" stroke={biom.farben.wasserHell} strokeWidth={7} strokeLinecap="round" />
            </g>
          );
        })}

      {/* Dekoration mit einheitlichem Morgen-Schatten */}
      {daten.deko
        .filter((d) => imBild(d.y, bereich))
        .map((d, i) => (
          <g key={i}>
            <MorgenSchatten x={d.x} y={d.y} skala={d.skala} />
            <use
              href={`#deko-${d.symbol}`}
              x={-50}
              y={-90}
              width={100}
              height={100}
              transform={`translate(${d.x} ${d.y}) scale(${d.spiegeln ? -d.skala : d.skala} ${d.skala})`}
            />
          </g>
        ))}
    </g>
  );
}

export default memo(LandschaftEbene);
