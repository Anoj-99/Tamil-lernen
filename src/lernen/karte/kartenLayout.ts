// EBENE 3: Gameplay. Ankert Level-, Lektions- und Side-Quest-Knoten per
// Bogenlänge an den Weg (Ebene 2), der wiederum der Welt (Ebene 0)
// folgt. Alles wird aus den Daten generiert (levelPlan.ts +
// Hausaufgaben) – feste Koordinaten gibt es nicht, neue Level
// verlängern Weg und Welt automatisch.
import { Level } from "../../data/levelPlan";
import { erzeugeZufall, KARTE, KNOTEN, WELT } from "./kartenKonfig";
import { erzeugeWeg, Weg } from "./wegGenerator";
import { erzeugeWelt, Welt } from "./weltGenerator";

export type KnotenTyp = "lektion" | "boss" | "quest";

export interface KartenKnoten {
  id: string; // "lektion:1.1" | "boss:1" | "quest:5"
  typ: KnotenTyp;
  x: number;
  y: number;
  bogenlaenge: number; // Position auf dem Weg (Quests: ihr Abzweigpunkt)
  levelId: number;
  lektionId?: string;
  aufgabeId?: number;
  name: string;
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
  welt: Welt; // Ebene 0 – Merkmale, Biome, Atmosphäre
  weg: Weg; // Ebene 2 – für Wegbett, Landschaft und Avatar-Lauf
  knoten: KartenKnoten[]; // alle anklickbaren Knoten (inkl. Quests)
  hauptpfad: KartenKnoten[]; // Lektions- und Boss-Knoten in Weg-Reihenfolge
  questPfade: QuestPfad[];
  // Kamera-Grenze: bis kurz hinter den letzten Knoten scrollbar …
  hoehe: number;
  // … die Welt selbst ist höher (Überhang) – sie hat kein sichtbares Ende.
  weltHoehe: number;
}

// Abstand mit ±Jitter – bewusst keine gleichmäßigen Knoten-Abstände.
function mitJitter(basis: number, zufall: () => number): number {
  return basis * (1 + (zufall() * 2 - 1) * KNOTEN.abstandJitter);
}

export function baueKartenLayout(
  levels: Level[],
  lektionsName: (lektionId: string) => string,
  quests: QuestEingabe[] = [],
): KartenLayout {
  const zufall = erzeugeZufall(KARTE.seed);

  // 1. Bogenlängen aller Knoten bestimmen (Weg-unabhängig).
  interface Anker {
    id: string;
    typ: "lektion" | "boss";
    bogenlaenge: number;
    levelId: number;
    lektionId?: string;
    name: string;
  }
  const anker: Anker[] = [];
  let l = KNOTEN.startBogenlaenge;
  for (const level of levels) {
    for (const lektionId of level.lektionIds) {
      anker.push({
        id: `lektion:${lektionId}`,
        typ: "lektion",
        bogenlaenge: l,
        levelId: level.id,
        lektionId,
        name: lektionsName(lektionId),
      });
      l += mitJitter(KNOTEN.lektionAbstand, zufall);
    }
    l += mitJitter(KNOTEN.bossAbstand - KNOTEN.lektionAbstand, zufall);
    anker.push({
      id: `boss:${level.id}`,
      typ: "boss",
      bogenlaenge: l,
      levelId: level.id,
      name: `Level ${level.id}: ${level.name}`,
    });
    l += mitJitter(KNOTEN.bossAbstand, zufall);
  }

  // 2. Welt (Ebene 0) und Weg (Ebene 2) erzeugen – beide mit Überhang
  // hinter dem letzten Level, damit die Reise nie sichtbar endet –
  // und die Knoten per Bogenlänge daran ankern.
  const gesamtLaenge = l + WELT.ueberhang;
  const welt = erzeugeWelt(gesamtLaenge, KARTE.seed);
  const weg = erzeugeWeg(gesamtLaenge, zufall, welt);
  const hauptpfad: KartenKnoten[] = anker.map((a) => {
    const p = weg.positionBei(a.bogenlaenge);
    return { ...a, x: p.x, y: p.y };
  });

  // 3. Side-Quests: zweigen hinter dem Boss-Stein ihres Levels ab. Die
  // Seite ergibt sich aus der Weg-Tangente (senkrecht, Richtung
  // Karteninneres) – dadurch mal links, mal rechts, nie starr.
  const questPfade: QuestPfad[] = [];
  for (const quest of quests) {
    const boss =
      hauptpfad.find((k) => k.typ === "boss" && k.levelId === quest.levelId) ??
      hauptpfad[hauptpfad.length - 1];
    if (!boss) continue;
    const abzweigLaenge = boss.bogenlaenge + KNOTEN.questRadius * 2;
    const von = weg.positionBei(abzweigLaenge);
    const tangente = weg.tangenteBei(abzweigLaenge);
    // Senkrechte zur Laufrichtung; von zwei Möglichkeiten die zur
    // Kartenmitte zeigende wählen (bleibt sicher auf der Insel).
    let nx = -tangente.y;
    let ny = tangente.x;
    if ((KARTE.breite / 2 - von.x) * nx < 0) {
      nx = -nx;
      ny = -ny;
    }
    const questZufall = erzeugeZufall(KARTE.seed + quest.aufgabeId);
    const versatz =
      KNOTEN.questVersatz + (questZufall() * 2 - 1) * KNOTEN.questVersatzJitter;
    questPfade.push({
      von,
      knoten: {
        id: `quest:${quest.aufgabeId}`,
        typ: "quest",
        x: von.x + nx * versatz,
        y: von.y + ny * versatz,
        bogenlaenge: abzweigLaenge,
        levelId: boss.levelId,
        aufgabeId: quest.aufgabeId,
        name: quest.name,
      },
    });
  }

  return {
    welt,
    weg,
    knoten: [...hauptpfad, ...questPfade.map((q) => q.knoten)],
    hauptpfad,
    questPfade,
    hoehe: weg.positionBei(l).y + KARTE.randUnten,
    weltHoehe: weg.positionBei(weg.gesamtLaenge).y,
  };
}
