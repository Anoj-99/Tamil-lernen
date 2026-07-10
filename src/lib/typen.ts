// Gemeinsame Typen für Konten, Punkte und Lernstand.
import { PositionsWert } from "../data/tamilSchrift";

// Rollen-Hierarchie: Admin lädt Schulleiter ein, Schulleiter geben ihren
// Schul-Code an Lehrer weiter, Lehrer binden Schüler über ihren Lehrer-Code
// (QR). Konten ohne Schule sind selbstständige Lerner.
export type Rolle = "admin" | "schulleiter" | "lehrer" | "schueler";

export interface Konto {
  username: string;
  rolle: Rolle;
  schuleId: number | null;
  lehrerUsername: string | null; // nur Schüler: der gebundene Lehrer
  lehrerCode: string | null; // nur Lehrer: eigener Code für Schüler-QR
  email: string | null; // nur Schulleiter (Einladung durch den Admin)
}

export function einfachesKonto(username: string, rolle: Rolle): Konto {
  return {
    username,
    rolle,
    schuleId: null,
    lehrerUsername: null,
    lehrerCode: null,
    email: null,
  };
}

export interface Schule {
  id: number;
  name: string;
  schulCode: string; // gibt der Schulleiter an seine Lehrer weiter
  erstelltAm: string;
}

export interface PunkteStand {
  epGesamt: number;
  epHeute: number;
  heuteDatum: string; // ISO-Datum "2026-07-08"
  streakTage: number;
  letzterLerntag: string | null; // ISO-Datum
  freezeVerfuegbar: boolean;
  freezeWoche: string; // ISO-Woche "2026-W28", in der der Freeze zuletzt aufgefüllt wurde
  challengePunkte: number; // Währung aus der Daily Challenge (für Streak-Freikauf)
  letzteChallenge: string | null; // ISO-Datum der letzten abgeschlossenen Daily Challenge
  gerissenerStreak: number; // zuletzt verlorener Streak, freikaufbar (0 = keiner)
}

export interface RegelEintrag {
  buchstabe: string; // Grundform mit Pulli, z.B. "க்"
  positionWert: PositionsWert;
  positionHinweis: string | null;
  vomLehrerAngepasst: boolean;
}

export interface FehlerEintrag {
  id?: number;
  username: string;
  zeichen: string;
  modus: "erkennen" | "position" | "pruefung";
  richtigeAntwort: string;
  gegebeneAntwort: string;
  zeitpunkt: string; // ISO-Zeitstempel
}

export interface LeitnerEintrag {
  zeichen: string;
  modus: "erkennen" | "position";
  fach: number; // 1..5
  richtigGesamt: number;
  falschGesamt: number;
}

// Ein Teil eines Hausaufgaben-Pakets: eine Pool-Aufgabe mit Fragen-Anzahl.
export interface HausaufgabenTeil {
  poolId: string; // Referenz in data/hausaufgabenPool.ts
  anzahl: number;
}

export interface Hausaufgabe {
  id: number;
  zugewiesenVon: string;
  zugewiesenAn: string; // "alle" oder ein Benutzername
  thema: string;
  deadline: string | null; // ISO-Zeitstempel; danach bleibt sie bearbeitbar
  teile: HausaufgabenTeil[];
  erstelltAm: string;
}

export interface HausaufgabenStatus {
  hausaufgabeId: number;
  username: string;
  fortschritt: number;
  erledigtAm: string | null;
}

export interface PruefungsErgebnis {
  id?: number;
  username: string;
  fragenGesamt: number;
  fehler: number;
  bestanden: boolean;
  zeitpunkt: string;
}

export interface SchuelerUebersicht {
  konto: Konto;
  punkte: PunkteStand;
}

export function leererPunkteStand(): PunkteStand {
  return {
    epGesamt: 0,
    epHeute: 0,
    heuteDatum: heuteIso(),
    streakTage: 0,
    letzterLerntag: null,
    freezeVerfuegbar: true,
    freezeWoche: isoWoche(new Date()),
    challengePunkte: 0,
    letzteChallenge: null,
    gerissenerStreak: 0,
  };
}

export function heuteIso(datum: Date = new Date()): string {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag}`;
}

// ISO-8601-Kalenderwoche, z.B. "2026-W28".
export function isoWoche(datum: Date): string {
  const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  const wochentag = d.getUTCDay() || 7; // Montag = 1 … Sonntag = 7
  d.setUTCDate(d.getUTCDate() + 4 - wochentag); // auf den Donnerstag der Woche
  const jahresanfang = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const woche = Math.ceil(((d.getTime() - jahresanfang.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(woche).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Lektionen (geführtes Anfänger-Curriculum)
// ---------------------------------------------------------------------------

// Fortschritt eines Schülers durch die Teile einer Lektion (1 = Vorstellung
// gesehen, 2..6 = jeweiliger Teil mit allem mind. einmal richtig).
export interface LektionFortschritt {
  username: string;
  lektionId: string; // z.B. "1.1"
  teil: number; // 1..6
  abgeschlossenAm: string;
}

// Vom Lehrer überschriebener Inhalt zu einem einzelnen Buchstaben (Beispielwort
// oder Bild), überlagert die statischen Vorgaben aus data/lektionen.ts.
export interface LektionInhaltUeberschreibung {
  zeichen: string;
  beispielwortTamil: string | null;
  beispielwortDeutsch: string | null;
  bildUrl: string | null;
}

// Bestandener Boss-Test eines Levels (Gatekeeper am Lernpfad). Der Test
// endet immer mit "bestanden" – falsche Fragen werden wiederholt, bis jede
// einmal richtig war. ersteRundeFehler misst, wie schwer es war.
export interface LevelFortschritt {
  username: string;
  levelId: number;
  bestandenAm: string; // ISO-Zeitstempel
  fragenGesamt: number;
  ersteRundeFehler: number;
}
