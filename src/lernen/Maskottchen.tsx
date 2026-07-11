import { MASKOTTCHEN_EVOLUTION, maskottchenFuerLevel } from "../data/levelPlan";

// Das Tier-Maskottchen begleitet den Schüler über den Pfad und jubelt bei
// Erfolg. Alle 5 Level entwickelt es sich zu einer neuen Spezies aus
// Sri Lanka weiter: Pfau → Affe → Tiger → Elefant (siehe levelPlan.ts).
const EMOJI: Record<(typeof MASKOTTCHEN_EVOLUTION)[number], string> = {
  Pfau: "🦚",
  Affe: "🐒",
  Tiger: "🐯",
  Elefant: "🐘",
};

interface Props {
  levelId: number; // aktuelles Level des Schülers (bestimmt die Spezies)
  stimmung?: "idle" | "jubel";
  gross?: boolean;
  beschriftung?: boolean; // Name der Spezies anzeigen
}

export function maskottchenEmoji(levelId: number): string {
  return EMOJI[maskottchenFuerLevel(levelId)];
}

export default function Maskottchen({
  levelId,
  stimmung = "idle",
  gross = false,
  beschriftung = false,
}: Props) {
  const name = maskottchenFuerLevel(levelId);
  return (
    <div className="flex flex-col items-center" aria-label={`Maskottchen: ${name}`}>
      <span
        className={`inline-block ${gross ? "text-6xl" : "text-3xl"} ${
          stimmung === "jubel" ? "maskottchen-jubel" : "maskottchen-idle"
        }`}
        role="img"
      >
        {EMOJI[name]}
      </span>
      {beschriftung && <span className="mt-1 text-xs text-slate-500">{name}</span>}
    </div>
  );
}
