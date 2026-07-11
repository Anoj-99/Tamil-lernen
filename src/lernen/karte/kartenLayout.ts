// Layout der Sri-Lanka-Spielkarte: berechnet aus den Level-Daten
// (levelPlan.ts) die Positionen aller Weg-Knoten, der Dekoration und der
// Side-Quest-Abzweigungen. Rein und ohne Seiteneffekte – die Karte wächst
// automatisch mit, sobald neue Level in levelPlan.ts definiert werden;
// feste Positionen gibt es bewusst nicht.
import { Level } from "../../data/levelPlan";

export const KARTE_BREITE = 1000;
const MITTE = KARTE_BREITE / 2;
const AMPLITUDE = 250; // wie weit sich der Weg nach links/rechts schlängelt
const RAND_OBEN = 190;
const SCHRITT_LEKTION = 135; // Abstand zwischen Lektions-Steinen
const SCHRITT_BOSS = 185; // Abstand vor/nach einem Level-Stein
const RAND_UNTEN = 240;

export type KnotenTyp = "lektion" | "boss" | "quest";

export interface KartenKnoten {
  id: string; // "lektion:1.1" | "boss:1" | "quest:5"
  typ: KnotenTyp;
  x: number;
  y: number;
  levelId: number;
  lektionId?: string;
  aufgabeId?: number;
  name: string;
}

export interface DekoElement {
  x: number;
  y: number;
  symbol: string;
  skala: number;
  spiegeln: boolean;
}

export interface QuestPfad {
  von: { x: number; y: number }; // Abzweigpunkt am Hauptweg
  knoten: KartenKnoten;
}

export interface QuestEingabe {
  aufgabeId: number;
  levelId: number; // erscheint nach dem höchsten benötigten Level
  name: string;
}

export interface KartenLayout {
  knoten: KartenKnoten[]; // alle anklickbaren Knoten (inkl. Quests)
  hauptpfad: KartenKnoten[]; // Lektions- und Boss-Knoten in Weg-Reihenfolge
  questPfade: QuestPfad[];
  deko: DekoElement[];
  hoehe: number;
}

// Deterministischer Pseudo-Zufall, damit die Landschaft bei jedem Rendern
// gleich aussieht (kein echtes Math.random im Layout).
function zufall(saat: number): number {
  const x = Math.sin(saat * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Der Weg schlängelt sich als Sinus-Kurve durch die Landschaft.
function wegX(index: number): number {
  return MITTE + AMPLITUDE * Math.sin(index * 0.72 + 0.4);
}

const DEKO_SYMBOLE = [
  "palme",
  "tempel",
  "elefant",
  "affe",
  "wasserfall",
  "busch",
  "blume",
  "fels",
  "vogel",
];

export function baueKartenLayout(
  levels: Level[],
  lektionsName: (lektionId: string) => string,
  quests: QuestEingabe[] = [],
): KartenLayout {
  const hauptpfad: KartenKnoten[] = [];
  let y = RAND_OBEN;
  let index = 0;

  for (const level of levels) {
    for (const lektionId of level.lektionIds) {
      hauptpfad.push({
        id: `lektion:${lektionId}`,
        typ: "lektion",
        x: wegX(index),
        y,
        levelId: level.id,
        lektionId,
        name: lektionsName(lektionId),
      });
      index++;
      y += SCHRITT_LEKTION;
    }
    y += SCHRITT_BOSS - SCHRITT_LEKTION;
    hauptpfad.push({
      id: `boss:${level.id}`,
      typ: "boss",
      x: wegX(index),
      y,
      levelId: level.id,
      name: `Level ${level.id}: ${level.name}`,
    });
    index++;
    y += SCHRITT_BOSS;
  }

  // Side-Quests zweigen hinter dem Boss-Stein ihres Levels ab. Die Seite
  // ergibt sich aus der Weg-Krümmung (Richtung Karteninneres), dadurch
  // liegen sie mal links, mal rechts – nie starr auf einer Seite.
  const questPfade: QuestPfad[] = [];
  for (const quest of quests) {
    const anker =
      hauptpfad.find((k) => k.typ === "boss" && k.levelId === quest.levelId) ??
      hauptpfad[hauptpfad.length - 1];
    if (!anker) continue;
    const seite = anker.x > MITTE ? -1 : 1;
    const versatz = 0.6 + 0.3 * zufall(quest.aufgabeId);
    questPfade.push({
      von: { x: anker.x, y: anker.y },
      knoten: {
        id: `quest:${quest.aufgabeId}`,
        typ: "quest",
        x: anker.x + seite * 210 * versatz,
        y: anker.y + 90 + 40 * zufall(quest.aufgabeId + 7),
        levelId: anker.levelId,
        aufgabeId: quest.aufgabeId,
        name: quest.name,
      },
    });
  }

  // Dekoration: pro Weg-Knoten 1–2 Elemente seitlich des Weges, per
  // Saat-Zufall platziert – reine Atmosphäre ohne Spiellogik.
  const deko: DekoElement[] = [];
  hauptpfad.forEach((knoten, i) => {
    const anzahl = 1 + Math.floor(zufall(i * 3 + 1) * 2);
    for (let n = 0; n < anzahl; n++) {
      const saat = i * 17 + n * 5;
      const seite = zufall(saat) > 0.5 ? 1 : -1;
      const abstand = 190 + zufall(saat + 1) * 190;
      const x = Math.max(50, Math.min(KARTE_BREITE - 50, knoten.x + seite * abstand));
      deko.push({
        x,
        y: knoten.y + (zufall(saat + 2) - 0.5) * 120,
        symbol: DEKO_SYMBOLE[Math.floor(zufall(saat + 3) * DEKO_SYMBOLE.length)],
        skala: 0.75 + zufall(saat + 4) * 0.6,
        spiegeln: zufall(saat + 5) > 0.5,
      });
    }
  });

  return {
    knoten: [...hauptpfad, ...questPfade.map((q) => q.knoten)],
    hauptpfad,
    questPfade,
    deko,
    hoehe: y + RAND_UNTEN,
  };
}

// Glatte SVG-Kurve durch die Weg-Punkte (quadratische Segmente durch die
// Mittelpunkte – der klassische "smooth polyline"-Trick).
export function wegKurve(punkte: { x: number; y: number }[]): string {
  if (punkte.length === 0) return "";
  if (punkte.length === 1) return `M ${punkte[0].x} ${punkte[0].y}`;
  let d = `M ${punkte[0].x} ${punkte[0].y}`;
  for (let i = 1; i < punkte.length - 1; i++) {
    const mx = (punkte[i].x + punkte[i + 1].x) / 2;
    const my = (punkte[i].y + punkte[i + 1].y) / 2;
    d += ` Q ${punkte[i].x} ${punkte[i].y} ${mx} ${my}`;
  }
  const letzter = punkte[punkte.length - 1];
  d += ` L ${letzter.x} ${letzter.y}`;
  return d;
}
