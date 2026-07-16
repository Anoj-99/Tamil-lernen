// EBENE 3 (Rendering): Level-Steine, Lektions-Steine und Side-Quests.
// Reine Darstellung – Status und Klick-Folgen entscheidet die PfadSeite.
// Level-Steine sind unregelmäßige Natursteine auf kleinen Lichtungen;
// in der Detailansicht wachsen sie sichtbar zu "Plätzen" am Weg heran,
// erst dort erscheinen auch die Lektions-Steine und Quests.
import { memo } from "react";
import { Biom } from "./biome";
import { KNOTEN, KnotenStatus, STATUS_FARBEN } from "./kartenKonfig";
import { KartenKnoten, KartenLayout } from "./kartenLayout";
import { MorgenSchatten } from "./LandschaftEbene";
import { imBild, SichtBereich } from "./sichtfenster";

// Handgeformte, leicht individuelle Steinplateaus (Box −50…50, flachgedrückt
// für die leichte Vogelperspektive). Auswahl per Level-Id – nie zwei
// benachbarte Level mit identischer Form.
const PLATEAU_FORMEN = [
  "M -46 4 Q -50 -16 -30 -26 Q -4 -38 24 -30 Q 48 -22 45 -2 Q 42 16 14 25 Q -18 32 -38 20 Q -47 13 -46 4 Z",
  "M -44 -6 Q -40 -26 -12 -31 Q 18 -36 38 -24 Q 50 -14 46 4 Q 40 22 8 27 Q -24 30 -40 16 Q -48 6 -44 -6 Z",
  "M -48 0 Q -46 -20 -22 -29 Q 6 -37 30 -27 Q 49 -18 47 2 Q 43 20 18 26 Q -14 33 -36 22 Q -49 12 -48 0 Z",
];

const LEKTION_FORMEN = [
  "M -24 2 Q -26 -12 -12 -17 Q 4 -22 17 -15 Q 26 -9 23 3 Q 19 13 4 15 Q -12 17 -21 10 Q -25 7 -24 2 Z",
  "M -22 -4 Q -18 -16 -2 -18 Q 14 -19 21 -10 Q 25 -1 20 8 Q 13 15 -3 14 Q -18 13 -22 4 Z",
];

function StatusZeichen({ x, y, status }: { x: number; y: number; status: KnotenStatus }) {
  if (status === "gesperrt") {
    return (
      <g transform={`translate(${x} ${y})`} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
        <rect x="-9" y="-3" width="18" height="15" rx="3" />
        <path d="M -6 -3 V -8 A 6 6 0 0 1 6 -8 V -3" />
      </g>
    );
  }
  if (status === "fertig") {
    return <path d={`M ${x - 9} ${y} l 6 6 13 -15`} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />;
  }
  return null;
}

interface Props {
  layout: KartenLayout;
  biom: Biom;
  statusFuer: (knoten: KartenKnoten) => KnotenStatus;
  detailFaktor: number; // 0 = Übersicht … 1 = Detailansicht
  bereich: SichtBereich;
  onTippen: (knoten: KartenKnoten) => void;
}

function GameplayEbene({ layout, biom, statusFuer, detailFaktor, bereich, onTippen }: Props) {
  const detailStil = {
    opacity: detailFaktor,
    pointerEvents: detailFaktor > 0.5 ? undefined : ("none" as const),
    transition: "opacity 0.35s ease",
  };

  return (
    <g>
      {/* Side-Quests: gestrichelte Nebenwege (nur in der Detailansicht) */}
      <g style={detailStil}>
        {layout.questPfade
          .filter((q) => imBild(q.knoten.y, bereich))
          .map((q) => {
            const status = statusFuer(q.knoten);
            return (
              <g key={q.knoten.id}>
                <path
                  d={`M ${q.von.x} ${q.von.y} Q ${(q.von.x + q.knoten.x) / 2} ${
                    Math.max(q.von.y, q.knoten.y) + 34
                  } ${q.knoten.x} ${q.knoten.y}`}
                  fill="none"
                  stroke="#b9a479"
                  strokeWidth={12}
                  strokeDasharray="3 16"
                  strokeLinecap="round"
                />
                <g
                  role="button"
                  aria-label={q.knoten.name}
                  className="cursor-pointer"
                  onClick={() => onTippen(q.knoten)}
                >
                  <circle
                    cx={q.knoten.x}
                    cy={q.knoten.y}
                    r={KNOTEN.questRadius}
                    fill={status === "fertig" ? "#d7ecd2" : "#dcebf5"}
                    stroke={status === "fertig" ? STATUS_FARBEN.fertig.rand : "#5f8fd6"}
                    strokeWidth={4}
                    strokeDasharray={status === "fertig" ? undefined : "6 6"}
                  />
                  {status === "fertig" ? (
                    <StatusZeichen x={q.knoten.x} y={q.knoten.y} status={status} />
                  ) : (
                    <g transform={`translate(${q.knoten.x} ${q.knoten.y})`} fill="none" stroke="#315f75" strokeWidth="3" strokeLinecap="round">
                      <path d="M 0 12 V -11 M -7 -9 H 9 L 5 -2 H -7 Z" />
                    </g>
                  )}
                  <text
                    x={q.knoten.x}
                    y={q.knoten.y + KNOTEN.questRadius + 24}
                    textAnchor="middle"
                    fontSize="15"
                    fill="#5b6470"
                  >
                    {q.knoten.name}
                  </text>
                </g>
              </g>
            );
          })}
      </g>

      {/* Lektions-Steine (erscheinen erst beim Hineinzoomen) */}
      <g style={detailStil}>
        {layout.hauptpfad
          .filter((k) => k.typ === "lektion" && imBild(k.y, bereich))
          .map((k, index) => {
            const status = statusFuer(k);
            const farben = STATUS_FARBEN[status];
            const nummer = (k.lektionId ?? "").split(".")[1] ?? String(index + 1);
            const form = LEKTION_FORMEN[index % LEKTION_FORMEN.length];
            const skala = (KNOTEN.lektionRadius * 2) / 50;
            return (
              <g
                key={k.id}
                role="button"
                aria-label={`Lektion: ${k.name}`}
                aria-disabled={status === "gesperrt"}
                className={status === "gesperrt" ? "cursor-not-allowed" : "cursor-pointer"}
                onClick={() => onTippen(k)}
              >
                <MorgenSchatten x={k.x} y={k.y + 6} skala={0.8} />
                <g transform={`translate(${k.x} ${k.y}) scale(${skala})`}>
                  <path d={form} fill={farben.rand} transform="translate(0 3)" />
                  <path d={form} fill={farben.fuellung} />
                </g>
                <g color={farben.text}>
                  {status === "offen" ? (
                    <text x={k.x} y={k.y + 7} textAnchor="middle" fontSize="20" fontWeight="700" fill={farben.text}>{nummer}</text>
                  ) : (
                    <StatusZeichen x={k.x} y={k.y - 1} status={status} />
                  )}
                </g>
                <text x={k.x} y={k.y + KNOTEN.lektionRadius + 19} textAnchor="middle" fontSize="13" fontWeight="650" fill="#4b4c3b">
                  {k.lektionId}
                </text>
              </g>
            );
          })}
      </g>

      {/* Level-Steine: immer sichtbar, wachsen in der Detailansicht zu
          kleinen Plätzen heran */}
      {layout.hauptpfad
        .filter((k) => k.typ === "boss" && imBild(k.y, bereich))
        .map((k) => {
          const status = statusFuer(k);
          const farben = STATUS_FARBEN[status];
          const form = PLATEAU_FORMEN[k.levelId % PLATEAU_FORMEN.length];
          const basisSkala = (KNOTEN.bossRadiusX * 2) / 100;
          const wachstum = 1 + 0.3 * detailFaktor;
          return (
            <g
              key={k.id}
              role="button"
              aria-label={k.name}
              aria-disabled={status === "gesperrt"}
              className={status === "gesperrt" ? "cursor-not-allowed" : "cursor-pointer"}
              onClick={() => onTippen(k)}
            >
              {/* Lichtung unter dem Platz */}
              <ellipse
                cx={k.x}
                cy={k.y + 6}
                rx={KNOTEN.bossRadiusX * 1.5 * wachstum}
                ry={KNOTEN.bossRadiusY * 1.1 * wachstum}
                fill={biom.farben.wiese}
              />
              <MorgenSchatten x={k.x} y={k.y + 14} skala={1.6 * wachstum} />
              <g
                style={{
                  transform: `scale(${wachstum})`,
                  transformOrigin: "center",
                  transformBox: "fill-box",
                  transition: "transform 0.5s ease",
                }}
              >
                <g className={status === "offen" ? "stein-puls" : undefined}>
                  <g transform={`translate(${k.x} ${k.y}) scale(${basisSkala})`}>
                    <path d={form} fill="#5f5a4c" transform="translate(0 12)" opacity="0.72" />
                    <path d={form} fill={farben.rand} transform="translate(0 7)" />
                    <path d={form} fill={farben.fuellung} />
                    <path
                      d="M -26 -16 Q -8 -24 14 -18"
                      stroke="#ffffff"
                      strokeWidth="6"
                      strokeLinecap="round"
                      fill="none"
                      opacity={0.3}
                    />
                    <path d="M -29 8 Q -14 19 4 15 T 28 6" fill="none" stroke={farben.rand} strokeWidth="3" opacity="0.42" />
                    <path d="M 16 -17 l 8 8 l -5 8" fill="none" stroke={farben.rand} strokeWidth="2.3" opacity="0.5" />
                  </g>
                  <g color={farben.text}>
                    {status === "offen" ? (
                      <text x={k.x} y={k.y + 11} textAnchor="middle" fontSize="31" fontWeight="750" fill={farben.text}>{k.levelId}</text>
                    ) : (
                      <StatusZeichen x={k.x} y={k.y - 1} status={status} />
                    )}
                  </g>
                </g>
              </g>
              <text
                x={k.x}
                y={k.y + KNOTEN.bossRadiusY * wachstum + 30}
                textAnchor="middle"
                fontSize="15"
                fontWeight="650"
                fill={status === "gesperrt" ? "#9ca3af" : "#374151"}
                opacity={detailFaktor}
              >
                Level {k.levelId}
              </text>
            </g>
          );
        })}
    </g>
  );
}

export default memo(GameplayEbene);
