// Austauschbare Asset-Schnittstelle fuer die Weltkarte. Die Logik kennt
// ausschliesslich semantische Symbolnamen; Produktionsillustrationen koennen
// spaeter hier als WebP/PNG registriert werden, ohne Generatoren anzufassen.
export type LandschaftAssetId =
  | "palme"
  | "baum"
  | "busch"
  | "fels"
  | "tempel"
  | "haus"
  | "berg"
  | "wasserfall"
  | "see"
  | "reisfeld"
  | "elefant"
  | "makake"
  | "pfau"
  | "eisvogel";

export interface LandschaftAsset {
  id: LandschaftAssetId;
  // Sobald vorhanden: URL zu einer transparenten PNG-/WebP-Illustration.
  // undefined bedeutet: handillustrierter SVG-Fallback aus KartenDeko.tsx.
  src?: string;
  breite: number;
  hoehe: number;
  fussX: number;
  fussY: number;
  alt: string;
}

export const KARTEN_ASSETS: Record<LandschaftAssetId, LandschaftAsset> = {
  palme: { id: "palme", breite: 132, hoehe: 170, fussX: 66, fussY: 166, alt: "Kokospalme" },
  baum: { id: "baum", breite: 150, hoehe: 152, fussX: 75, fussY: 148, alt: "Tropischer Baum" },
  busch: { id: "busch", breite: 116, hoehe: 72, fussX: 58, fussY: 68, alt: "Tropischer Busch" },
  fels: { id: "fels", breite: 100, hoehe: 68, fussX: 50, fussY: 64, alt: "Verwitterter Fels" },
  tempel: { id: "tempel", breite: 220, hoehe: 210, fussX: 110, fussY: 204, alt: "Tamilischer Hindu-Tempel" },
  haus: { id: "haus", breite: 170, hoehe: 125, fussX: 85, fussY: 120, alt: "Traditionelles Haus" },
  berg: { id: "berg", breite: 320, hoehe: 200, fussX: 160, fussY: 194, alt: "Berge im Hochland" },
  wasserfall: { id: "wasserfall", breite: 150, hoehe: 180, fussX: 75, fussY: 176, alt: "Ruhiger Wasserfall" },
  see: { id: "see", breite: 210, hoehe: 100, fussX: 105, fussY: 76, alt: "Ruhiges Wasser" },
  reisfeld: { id: "reisfeld", breite: 250, hoehe: 130, fussX: 125, fussY: 124, alt: "Terrassiertes Reisfeld" },
  elefant: { id: "elefant", breite: 128, hoehe: 98, fussX: 64, fussY: 94, alt: "Sri-lankischer Elefant" },
  makake: { id: "makake", breite: 72, hoehe: 86, fussX: 36, fussY: 82, alt: "Makak" },
  pfau: { id: "pfau", breite: 88, hoehe: 104, fussX: 44, fussY: 100, alt: "Pfau" },
  eisvogel: { id: "eisvogel", breite: 58, hoehe: 48, fussX: 29, fussY: 44, alt: "Eisvogel" },
};

