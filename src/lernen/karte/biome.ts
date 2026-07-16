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
    himmel: string;
    bergeFern: string;
    baumlinie: string;
  };
  symbole: BiomSymbol[]; // Füll-Vegetation (Merkmale kommen aus Ebene 0)
  dichteProTausend: number; // Füll-Deko pro 1000 Welt-px Weglänge
}

export const BIOME: Record<string, Biom> = {
  sriLanka: {
    id: "sriLanka",
    farben: {
      grund: "#879e6d",
      wiese: "#b8c981",
      kueste: "#d8c99a",
      wasser: "#4f8789",
      wasserHell: "#a9cbc2",
      wegBett: "#8c704d",
      wegStein: "#c9b99a",
      himmel: "#c9d8c0",
      bergeFern: "#7f927e",
      baumlinie: "#657c62",
    },
    symbole: [
      { symbol: "palme", gewicht: 5 },
      { symbol: "baum", gewicht: 4 },
      { symbol: "busch", gewicht: 4 },
      { symbol: "blume", gewicht: 3 },
      { symbol: "fels", gewicht: 2 },
    ],
    dichteProTausend: 21,
  },
};

// Welches Biom gilt für ein Level? Aktuell überall Sri Lanka; später
// entscheidet hier die Region (z.B. Küste → Reisfelder → Hochland).
export function biomFuerLevel(_levelId: number): Biom {
  return BIOME.sriLanka;
}
