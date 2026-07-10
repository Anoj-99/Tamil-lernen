// Der Lernpfad: Level → genau 3 Lektionen → Boss-Test als Gatekeeper.
// Ein Level ist erst bestanden, wenn der Boss-Test geschafft ist (jede
// Frage mindestens einmal richtig, siehe BossTest.tsx). Erst dann wird
// das nächste Level am Pfad freigeschaltet.
import { Lektion, LektionBuchstabe, lektionById } from "./lektionen";

export interface Level {
  id: number; // 1, 2, 3, …
  name: string;
  lektionIds: [string, string, string]; // genau 3 Lektionen pro Level
}

export const levels: Level[] = [
  { id: 1, name: "Die Vokale (Uyir)", lektionIds: ["1.1", "1.2", "1.3"] },
  { id: 2, name: "Vallinam-Konsonanten", lektionIds: ["2.1", "2.2", "2.3"] },
  { id: 3, name: "Mellinam-Konsonanten", lektionIds: ["3.1", "3.2", "3.3"] },
];

export function levelById(id: number): Level | undefined {
  return levels.find((l) => l.id === id);
}

export function lektionenDesLevels(level: Level): Lektion[] {
  return level.lektionIds
    .map((id) => lektionById(id))
    .filter((l): l is Lektion => l !== undefined);
}

// Alle Buchstaben eines Levels, ohne Duplikate (Festigungs-Lektionen
// wiederholen Buchstaben der vorherigen Lektionen desselben Levels).
export function buchstabenDesLevels(level: Level): LektionBuchstabe[] {
  const gesehen = new Set<string>();
  const ergebnis: LektionBuchstabe[] = [];
  for (const lektion of lektionenDesLevels(level)) {
    for (const b of lektion.buchstaben) {
      if (!gesehen.has(b.zeichen)) {
        gesehen.add(b.zeichen);
        ergebnis.push(b);
      }
    }
  }
  return ergebnis;
}

export function levelFuerLektion(lektionId: string): Level | undefined {
  return levels.find((l) => l.lektionIds.includes(lektionId as Level["lektionIds"][number]));
}

// ---------------------------------------------------------------------------
// Maskottchen-Evolution: alle 5 Level eine neue Spezies (Sri-Lanka-Tiere).
// Die Illustrationen folgen in Phase 5, die Zuordnung steht bereits fest.
// ---------------------------------------------------------------------------

export const MASKOTTCHEN_EVOLUTION = ["Pfau", "Affe", "Tiger", "Elefant"] as const;

export function maskottchenFuerLevel(levelId: number): (typeof MASKOTTCHEN_EVOLUTION)[number] {
  const stufe = Math.floor((levelId - 1) / 5);
  return MASKOTTCHEN_EVOLUTION[Math.min(stufe, MASKOTTCHEN_EVOLUTION.length - 1)];
}
