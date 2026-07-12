// Biom-Definitionen für die Landschafts-Ebene. Ein Biom beschreibt nur
// das Aussehen einer Region – flache, warme Morgen-Palette (bewusst
// begrenzt, keine Verläufe) plus Deko-Symbole mit Gewichten. Keine
// Spiellogik. Neue Themenwelten/Regionen/Jahreszeiten sind später
// weitere Biome plus die Zuordnung in weltGenerator.biomBei() – ohne
// Umbau der Karte; Übergänge zwischen Biomen sollen fließend erfolgen.

export interface BiomSymbol {
  symbol: string; // Symbol-Id in KartenDeko.tsx (ohne "deko-"-Präfix)
  gewicht: number; // relative Häufigkeit
}

export interface Biom {
  id: string;
  farben: {
    grund: string; // Grundfläche des Landes (flach, kein Verlauf)
    wiese: string; // hellere Grasflecken/Lichtungen
    kueste: string; // seitlicher Sandstreifen
    wasser: string; // Meer und Flüsse/Seen
    wasserHell: string; // Glanzfläche auf Wasser
    wegBett: string; // Erdreich unter den Wegplatten
    wegStein: string; // die Steinplatten des Wanderwegs
  };
  symbole: BiomSymbol[]; // Füll-Vegetation (Merkmale kommen aus Ebene 0)
  dichteProTausend: number; // Füll-Deko pro 1000 Welt-px Weglänge
}

export const BIOME: Record<string, Biom> = {
  sriLanka: {
    id: "sriLanka",
    farben: {
      grund: "#c3deae",
      wiese: "#dcefc4",
      kueste: "#eedfae",
      wasser: "#a9d7e8",
      wasserHell: "#d3ecf6",
      wegBett: "#bfa478",
      wegStein: "#ece0c4",
    },
    symbole: [
      { symbol: "palme", gewicht: 5 },
      { symbol: "baum", gewicht: 4 },
      { symbol: "busch", gewicht: 4 },
      { symbol: "blume", gewicht: 3 },
      { symbol: "fels", gewicht: 2 },
      { symbol: "elefant", gewicht: 1 },
      { symbol: "makake", gewicht: 1 },
      { symbol: "pfau", gewicht: 1 },
      { symbol: "eisvogel", gewicht: 1 },
    ],
    dichteProTausend: 13,
  },
};

// Welches Biom gilt für ein Level? Aktuell überall Sri Lanka; später
// entscheidet hier die Region (z.B. Küste → Reisfelder → Hochland).
export function biomFuerLevel(_levelId: number): Biom {
  return BIOME.sriLanka;
}
