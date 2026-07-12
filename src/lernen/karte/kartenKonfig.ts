// Zentrale Konfiguration der Weltkarte. ALLE Zahlenwerte der Karte leben
// hier – in den Modulen und Komponenten gibt es keine Magic Numbers.
// Werte in "Welt-Pixeln" (die Karte wird per Kamera-Zoom skaliert).

export const KARTE = {
  breite: 1000,
  randOben: 190, // Weg-Start
  randUnten: 240, // Kamera-Grenze unter dem letzten Knoten
  kuesteBreite: 34, // seitlicher Sand-/Küstenstreifen
  seed: 20260711, // fester Seed: gleiche Eingabe → identische Karte
} as const;

export const WELT = {
  // Abstände der Landschafts-Merkmale (Berge, Flüsse, Tempel …) entlang
  // der Reise – unregelmäßig, unabhängig von der Anzahl der Level.
  merkmalAbstandMin: 450,
  merkmalAbstandMax: 1100,
  merkmalEinfluss: 320, // Bogenlängen-Reichweite der Weg-Ausweichung
  ausweichStaerke: 0.5, // wie stark der Weg um Berge/Seen herumbiegt
  merkmalVersatz: 230, // seitlicher Abstand der Merkmale vom Weg
  // Überhang: Weg und Landschaft laufen hinter dem letzten Level weiter,
  // die Kamera endet vorher → die Welt hat kein sichtbares Ende.
  ueberhang: 1400,
} as const;

// Morgenlicht: eine globale Lichtrichtung für die ganze Szene – lange,
// weiche Schatten nach links unten (Sonne morgens im Osten/rechts).
export const LICHT = {
  schattenDx: -0.55, // Schattenversatz relativ zur Objektgröße
  schattenDy: 0.18,
  schattenDeckkraft: 0.13,
} as const;

export const WEG = {
  // Rohpunkte des Random-Walk (vertikaler Abstand variabel)
  segmentMin: 100,
  segmentMax: 190,
  amplitude: 250, // maximale seitliche Auslenkung von der Kartenmitte
  richtungMax: 1.1, // maximale seitliche Steigung (dx/dy) des Walks
  richtungWandel: 0.9, // wie stark die Richtung pro Segment streuen darf
  zurMitteZug: 0.35, // Rückzug zur Mitte nahe der Auslenkungsgrenze
  glaettungSchritte: 14, // Catmull-Rom-Samples pro Segment
  // Geometrie des Steinwegs (organisch: variable Steine statt Muster;
  // Farben kommen aus dem Biom)
  bettBreite: 42,
  steinAbstandMin: 26,
  steinAbstandMax: 46,
  steinRadiusMin: 10,
  steinRadiusMax: 16,
  steinSeitJitter: 6, // seitliche Streuung der Steine im Wegbett
} as const;

export const KNOTEN = {
  startBogenlaenge: 60, // Abstand des ersten Knotens vom Weganfang
  lektionAbstand: 150, // Basis-Bogenlänge zwischen Lektions-Steinen
  bossAbstand: 210, // Basis-Bogenlänge vor/nach einem Level-Stein
  abstandJitter: 0.18, // ±18 % Streuung – keine gleichmäßigen Abstände
  lektionRadius: 26,
  bossRadiusX: 52,
  bossRadiusY: 42,
  questRadius: 24,
  questVersatz: 200, // senkrechter Abstand der Side-Quest vom Weg
  questVersatzJitter: 60,
} as const;

export const KAMERA = {
  minZoomFaktor: 0.85, // relativ zum "Karte passt in die Breite"-Zoom
  maxZoom: 2.4,
  detailAb: 0.9, // ab hier sind Lektions-Steine/Quests sichtbar
  detailZoom: 1.15,
  rand: 70, // wie weit die Karte über den Fensterrand hinaus darf
  flugDauerMs: 700, // programmierte Kamerafahrten
  // Trägheit nach dem Loslassen einer Wischgeste
  traegheitDaempfung: 0.93, // Geschwindigkeitsfaktor pro Frame (~16 ms)
  traegheitStart: 0.15, // px/ms – darunter kein Ausgleiten
  traegheitStopp: 0.02, // px/ms – hier endet das Ausgleiten
  doppelTippMs: 340,
  doppelTippRadius: 48,
  ziehSchwelle: 12, // px – darüber gilt eine Geste als Ziehen, nicht Tipp
} as const;

export const AVATAR = {
  laufBasisMs: 300,
  laufMsProWeltPx: 1.4,
  laufMaxMs: 1400,
  oeffnenVerzoegerungMs: 220, // kurze Pause am Ziel, bevor sich die Ansicht öffnet
  radius: 21,
} as const;

export const CULLING = {
  rand: 350, // Welt-px über/unter dem Sichtfenster, die mitgerendert werden
} as const;

export type KnotenStatus = "gesperrt" | "offen" | "fertig";

export const STATUS_FARBEN: Record<
  KnotenStatus,
  { fuellung: string; rand: string; text: string }
> = {
  fertig: { fuellung: "#34a24f", rand: "#1d7a35", text: "#ffffff" },
  offen: { fuellung: "#f0c96a", rand: "#c99b3f", text: "#5b4514" },
  gesperrt: { fuellung: "#c8c8c4", rand: "#a9a9a4", text: "#77776f" },
};

// Deterministischer Pseudo-Zufallsgenerator (mulberry32). Gleicher Seed →
// gleiche Zahlenfolge → identische Karte bei jedem Rendern und Test.
export function erzeugeZufall(seed: number): () => number {
  let zustand = seed >>> 0;
  return () => {
    zustand = (zustand + 0x6d2b79f5) >>> 0;
    let t = zustand;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
