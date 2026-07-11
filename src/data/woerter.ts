// Die Wort-Bibliothek: alle Beispielwörter des Curriculums, primär nach
// Schwierigkeitsgrad sortiert (= Level, in dem das Wort gelehrt wird).
// Eine thematische Sortierung (Essen, Familie, Verben …) folgt später.
import { lektionenDesLevels, levels } from "./levelPlan";

export interface WortEintrag {
  wortTamil: string;
  lautschrift: string; // z.B. "Amma"
  schwierigkeit: number; // = Level-Id, in dem das Wort vorkommt
  lektionId: string; // Deep-Link zur Lektion (Instant Review)
  zeichen: string; // der Buchstabe, dessen Beispielwort es ist
}

function baueWoerter(): WortEintrag[] {
  const gesehen = new Set<string>();
  const woerter: WortEintrag[] = [];
  for (const level of levels) {
    for (const lektion of lektionenDesLevels(level)) {
      for (const b of lektion.buchstaben) {
        if (!b.beispielwortTamil || gesehen.has(b.beispielwortTamil)) continue;
        gesehen.add(b.beispielwortTamil);
        woerter.push({
          wortTamil: b.beispielwortTamil,
          lautschrift: b.beispielwortDeutsch,
          schwierigkeit: level.id,
          lektionId: lektion.id,
          zeichen: b.zeichen,
        });
      }
    }
  }
  return woerter.sort((a, b) => a.schwierigkeit - b.schwierigkeit);
}

export const woerter: WortEintrag[] = baueWoerter();

export const schwierigkeitsStufen: number[] = [
  ...new Set(woerter.map((w) => w.schwierigkeit)),
];
