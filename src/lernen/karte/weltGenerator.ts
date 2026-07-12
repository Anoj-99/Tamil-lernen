// EBENE 0: der World Generator. Beschreibt die Welt selbst – Regionen
// (Biome), markante Landschafts-Merkmale und die Atmosphäre. Er kennt
// keinerlei Spiellogik und keine Level: Merkmale werden regelbasiert
// entlang der Reise-Bogenlänge verteilt, unabhängig davon, ob die App
// 10 oder 250+ Level hat.
//
// Alle anderen Ebenen bauen hierauf auf:
//   Weg (Ebene 2)      → weicht Bergen/Seen aus, quert Flüsse per Brücke
//   Landschaft (Ebene 1)→ rendert die Merkmale + Vegetation regelbasiert
//   Gameplay (Ebene 3)  → ankert Level am Weg
//
// Erweiterungspunkte (bewusst vorbereitet, noch nicht implementiert):
// biomBei() für Regionen/Themenwelten, atmosphaere für Tageszeit,
// Jahreszeiten/Feste und Umgebungsgeräusche.
import { Biom, biomFuerLevel } from "./biome";
import { erzeugeZufall, WELT } from "./kartenKonfig";

export type MerkmalTyp = "berg" | "fluss" | "see" | "tempel" | "reisfeld" | "dorf";

export interface WeltMerkmal {
  typ: MerkmalTyp;
  bogenlaenge: number; // Position entlang des Reise-Korridors
  seite: -1 | 1; // links/rechts des Korridors (Flüsse queren ihn)
  groesse: number; // relative Größe (Skalierung der Darstellung)
}

export interface Atmosphaere {
  tageszeit: "morgen"; // Version 1: immer Morgen (warmes Licht)
  // später: jahreszeit, fest (Pongal, Deepavali, …), wetter, ambience
}

export interface Welt {
  merkmale: WeltMerkmal[];
  laenge: number;
  biomBei(bogenlaenge: number): Biom;
  atmosphaere: Atmosphaere;
}

// Relative Häufigkeit der Merkmale (regelbasiert, nie pro Level).
const MERKMAL_GEWICHTE: { typ: MerkmalTyp; gewicht: number }[] = [
  { typ: "berg", gewicht: 3 },
  { typ: "fluss", gewicht: 3 },
  { typ: "see", gewicht: 2 },
  { typ: "tempel", gewicht: 2 },
  { typ: "reisfeld", gewicht: 3 },
  { typ: "dorf", gewicht: 2 },
];

function waehleTyp(wert: number): MerkmalTyp {
  const gesamt = MERKMAL_GEWICHTE.reduce((s, e) => s + e.gewicht, 0);
  let rest = wert * gesamt;
  for (const eintrag of MERKMAL_GEWICHTE) {
    rest -= eintrag.gewicht;
    if (rest <= 0) return eintrag.typ;
  }
  return MERKMAL_GEWICHTE[0].typ;
}

export function erzeugeWelt(laenge: number, seed: number): Welt {
  const zufall = erzeugeZufall(seed);
  const merkmale: WeltMerkmal[] = [];

  // Merkmale in unregelmäßigen Abständen über die ganze Welt verteilen;
  // zwischen dichten Stellen bleiben bewusst offene Landschaften.
  let l = WELT.merkmalAbstandMin * (0.5 + zufall());
  while (l < laenge) {
    merkmale.push({
      typ: waehleTyp(zufall()),
      bogenlaenge: l,
      seite: zufall() > 0.5 ? 1 : -1,
      groesse: 0.8 + zufall() * 0.7,
    });
    l +=
      WELT.merkmalAbstandMin +
      zufall() * (WELT.merkmalAbstandMax - WELT.merkmalAbstandMin);
  }

  return {
    merkmale,
    laenge,
    // Version 1: eine Region (Sri Lanka). Später entscheidet hier die
    // Bogenlänge über die Region (Küste → Reisfelder → Hochland …),
    // mit fließenden Übergängen zwischen den Biomen.
    biomBei: () => biomFuerLevel(1),
    atmosphaere: { tageszeit: "morgen" },
  };
}
