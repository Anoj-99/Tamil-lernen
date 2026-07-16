// EBENE 1 (Rendering): Grundfläche, Wiesen, Flüsse und Dekoration.
// Kennt keine Level – nur Biom-Farben und die vorberechneten
// Landschafts-Daten. Flache Farben (keine Verläufe), einheitliches
// Morgenlicht mit langen weichen Schatten. Die Welt füllt die volle
// Breite und läuft oben wie unten aus dem Bild – kein sichtbares Ende.
import { memo } from "react";
import AtmosphaereEbene from "./AtmosphaereEbene";
import { Biom } from "./biome";
import { KARTEN_ASSETS, LandschaftAssetId } from "./kartenAssets";
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
      {/* Land in voller Breite; die unregelmaessigen, transparenten Bahnen
          brechen die bisher sterile Flaeche wie lasierende Gouache auf. */}
      <rect x="0" y="0" width={KARTE.breite} height={weltHoehe} fill={biom.farben.grund} />
      <path d={`M 70 0 Q 250 360 120 760 T 190 1540 T 100 ${weltHoehe}`} fill="none" stroke="#b4c790" strokeWidth="185" opacity="0.34" />
      <path d={`M 930 0 Q 720 410 890 850 T 780 1690 T 900 ${weltHoehe}`} fill="none" stroke="#829d70" strokeWidth="170" opacity="0.2" />
      <rect x="0" y="0" width={KARTE.kuesteBreite} height={weltHoehe} fill={biom.farben.wasser} />
      <rect
        x={KARTE.breite - KARTE.kuesteBreite}
        y="0"
        width={KARTE.kuesteBreite}
        height={weltHoehe}
        fill={biom.farben.wasser}
      />
      {/* angeschnittene Vordergrund-Cluster erzeugen Tiefe, ohne den Weg
          zu verdecken; sie wiederholen sich in grossen, ruhigen Abstaenden. */}
      {Array.from({ length: Math.ceil(weltHoehe / 1050) }, (_, i) => {
        const y = i * 1050 + 520;
        const links = i % 2 === 0;
        return (
          <g key={`v${i}`} opacity="0.88" className="karte-wind">
            <use href="#deko-palme" x={-50} y={-90} width={100} height={100} transform={`translate(${links ? 62 : 938} ${y}) scale(${links ? 2.25 : -2.25} 2.25)`} />
            <use href="#deko-baum" x={-50} y={-90} width={100} height={100} transform={`translate(${links ? 8 : 992} ${y + 80}) scale(${links ? 2.55 : -2.55} 2.55)`} />
          </g>
        );
      })}
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

      {daten.boden
        .filter((f) => imBild(f.y, bereich))
        .map((f, i) => (
          <ellipse
            key={`boden-${i}`}
            cx={f.x}
            cy={f.y}
            rx={f.rx}
            ry={f.ry}
            transform={`rotate(${f.drehung} ${f.x} ${f.y})`}
            fill={f.hell ? "#d0d7a4" : "#718860"}
            opacity={f.hell ? 0.24 : 0.16}
          />
        ))}

      {/* Ferne Kulisse liegt hinter Landmarken, Vegetation und Gameplay. */}
      <AtmosphaereEbene biom={biom} weltHoehe={weltHoehe} />

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
      {[...daten.deko]
        .filter((d) => imBild(d.y, bereich))
        .sort((a, b) => a.y - b.y)
        .map((d, i) => {
          const asset = KARTEN_ASSETS[d.symbol as LandschaftAssetId];
          return (
            <g key={i} className={d.symbol === "palme" || d.symbol === "baum" ? "karte-wind" : undefined}>
              <MorgenSchatten x={d.x} y={d.y} skala={d.skala * 1.12} />
              {asset?.src ? (
                <image
                  href={asset.src}
                  x={d.x - asset.fussX * d.skala}
                  y={d.y - asset.fussY * d.skala}
                  width={asset.breite * d.skala}
                  height={asset.hoehe * d.skala}
                  preserveAspectRatio="xMidYMax meet"
                  transform={d.spiegeln ? `translate(${d.x * 2} 0) scale(-1 1)` : undefined}
                />
              ) : (
                <use
                  href={`#deko-${d.symbol}`}
                  x={-50}
                  y={-90}
                  width={100}
                  height={100}
                  transform={`translate(${d.x} ${d.y}) scale(${d.spiegeln ? -d.skala : d.skala} ${d.skala})`}
                />
              )}
            </g>
          );
        })}
    </g>
  );
}

export default memo(LandschaftEbene);
