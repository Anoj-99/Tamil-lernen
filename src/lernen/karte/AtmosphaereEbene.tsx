import { memo } from "react";
import { Biom } from "./biome";
import { KARTE } from "./kartenKonfig";

interface Props {
  biom: Biom;
  weltHoehe: number;
}

// Ferne Silhouetten liegen bewusst im Weltkoordinatensystem: beim Schwenken
// bleiben sie Teil der Illustration, wirken durch Kontrast und Groesse aber
// deutlich weiter entfernt als Weg und Gameplay.
function AtmosphaereEbene({ biom, weltHoehe }: Props) {
  const staffeln = Math.ceil(weltHoehe / 780);
  return (
    <g aria-hidden="true" opacity="0.62">
      {Array.from({ length: staffeln }, (_, i) => {
        const y = i * 780 + 130;
        const spiegel = i % 2 === 1 ? -1 : 1;
        return (
          <g key={i} transform={`translate(${spiegel < 0 ? KARTE.breite : 0} 0) scale(${spiegel} 1)`}>
            <path
              d={`M 0 ${y + 180} L 0 ${y + 90} Q 85 ${y + 24} 170 ${y + 96} Q 265 ${y - 18} 366 ${y + 100} Q 470 ${y + 20} 590 ${y + 116} Q 710 ${y + 45} 820 ${y + 126} Q 920 ${y + 74} 1000 ${y + 128} L 1000 ${y + 210} Z`}
              fill={biom.farben.bergeFern}
              opacity="0.72"
            />
            <path
              d={`M 0 ${y + 190} Q 80 ${y + 142} 160 ${y + 181} Q 248 ${y + 120} 330 ${y + 178} Q 430 ${y + 124} 525 ${y + 188} Q 628 ${y + 133} 720 ${y + 185} Q 830 ${y + 128} 1000 ${y + 183} L 1000 ${y + 240} L 0 ${y + 240} Z`}
              fill={biom.farben.baumlinie}
              opacity="0.55"
            />
          </g>
        );
      })}
    </g>
  );
}

export default memo(AtmosphaereEbene);
