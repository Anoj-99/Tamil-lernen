// Reine Punkte-, Streak- und Leitner-Logik (ohne Seiteneffekte, testbar).
import { heuteIso, isoWoche, PunkteStand } from "./typen";

export const TAGESZIEL_EP = 20;
export const EP_PRO_LEVEL = 100;

export const EP_WERTE = {
  erkennenRichtig: 2,
  positionRichtig: 3,
  nachzeichnenFertig: 1,
  gruppeGeschafft: 20,
  pruefungBestanden: 50,
  lektionTeilGeschafft: 5,
  lektionAbgeschlossen: 25,
  bossTestBestanden: 40,
  challengeAbgeschlossen: 15,
} as const;

export function levelAus(epGesamt: number): number {
  return Math.floor(epGesamt / EP_PRO_LEVEL) + 1;
}

export function levelFortschritt(epGesamt: number): number {
  return epGesamt % EP_PRO_LEVEL;
}

function verschiebeTage(jetzt: Date, tage: number): string {
  const d = new Date(jetzt);
  d.setDate(d.getDate() + tage);
  return heuteIso(d);
}

// Verbucht EP inkl. Tageswechsel, Streak-Fortschreibung und Freeze:
// - Lücke von genau einem Tag + verfügbarer Freeze → Streak bleibt erhalten,
//   Freeze wird verbraucht.
// - Der Freeze füllt sich zu Beginn jeder neuen Kalenderwoche wieder auf.
export function verbucheEp(
  stand: PunkteStand,
  ep: number,
  jetzt: Date = new Date(),
): PunkteStand {
  const heute = heuteIso(jetzt);
  const gestern = verschiebeTage(jetzt, -1);
  const vorgestern = verschiebeTage(jetzt, -2);
  const woche = isoWoche(jetzt);

  let freezeVerfuegbar = stand.freezeVerfuegbar;
  let freezeWoche = stand.freezeWoche;
  if (woche !== stand.freezeWoche) {
    freezeVerfuegbar = true;
    freezeWoche = woche;
  }

  let streakTage = stand.streakTage;
  let gerissenerStreak = stand.gerissenerStreak;
  if (stand.letzterLerntag === heute) {
    // heute schon gelernt – Streak unverändert
  } else if (stand.letzterLerntag === gestern) {
    streakTage += 1;
  } else if (stand.letzterLerntag === vorgestern && freezeVerfuegbar) {
    streakTage += 1;
    freezeVerfuegbar = false;
  } else {
    // Streak gerissen – den verlorenen Stand merken, er kann mit
    // Challenge-Punkten freigekauft werden (siehe streakFreikaufen).
    if (stand.streakTage > 1) gerissenerStreak = stand.streakTage;
    streakTage = 1;
  }
  // Sobald der neue Streak den verlorenen einholt, verfällt der Freikauf.
  if (gerissenerStreak > 0 && streakTage >= gerissenerStreak) gerissenerStreak = 0;

  const epHeute = (stand.heuteDatum === heute ? stand.epHeute : 0) + ep;

  return {
    ...stand,
    epGesamt: stand.epGesamt + ep,
    epHeute,
    heuteDatum: heute,
    streakTage,
    letzterLerntag: heute,
    freezeVerfuegbar,
    freezeWoche,
    gerissenerStreak,
  };
}

// ---------------------------------------------------------------------------
// Daily Challenge & Streak-Freikauf
// ---------------------------------------------------------------------------

export const CHALLENGE_PUNKTE_PRO_RICHTIGE = 2;
export const CHALLENGE_FRAGEN = 10;

export function challengeHeuteGemacht(stand: PunkteStand, jetzt: Date = new Date()): boolean {
  return stand.letzteChallenge === heuteIso(jetzt);
}

// Verbucht eine abgeschlossene Daily Challenge (nur die Challenge-Punkte –
// EP laufen separat über verbucheEp/belohne).
export function verbucheChallenge(
  stand: PunkteStand,
  richtige: number,
  jetzt: Date = new Date(),
): PunkteStand {
  return {
    ...stand,
    challengePunkte: stand.challengePunkte + richtige * CHALLENGE_PUNKTE_PRO_RICHTIGE,
    letzteChallenge: heuteIso(jetzt),
  };
}

// Kosten steigen mit der Länge des verlorenen Streaks (gedeckelt).
export function streakFreikaufKosten(gerissenerStreak: number): number {
  return Math.min(10 + gerissenerStreak * 2, 60);
}

export function kannStreakFreikaufen(stand: PunkteStand): boolean {
  return (
    stand.gerissenerStreak > 0 &&
    stand.challengePunkte >= streakFreikaufKosten(stand.gerissenerStreak)
  );
}

// Stellt den gerissenen Streak wieder her: die verlorenen Tage werden auf
// den aktuellen Streak aufgeschlagen, die Challenge-Punkte abgezogen.
export function streakFreikaufen(stand: PunkteStand): PunkteStand {
  if (!kannStreakFreikaufen(stand)) return stand;
  return {
    ...stand,
    challengePunkte: stand.challengePunkte - streakFreikaufKosten(stand.gerissenerStreak),
    streakTage: stand.streakTage + stand.gerissenerStreak,
    gerissenerStreak: 0,
  };
}

// ---------------------------------------------------------------------------
// Leitner-System (5 Fächer)
// ---------------------------------------------------------------------------

export const LEITNER_MAX_FACH = 5;

export function neuesFach(altesFach: number | undefined, richtig: boolean): number {
  if (!richtig) return 1;
  return Math.min((altesFach ?? 0) + 1, LEITNER_MAX_FACH);
}

// Auswahlgewicht: Ungeübtes und niedrige Fächer kommen häufiger dran.
export function gewichtFuerFach(fach: number | undefined): number {
  switch (fach) {
    case 1:
      return 8;
    case 2:
      return 5;
    case 3:
      return 3;
    case 4:
      return 2;
    case 5:
      return 1;
    default:
      return 6; // noch nie geübt
  }
}

export type Ampel = "grau" | "rot" | "gelb" | "gruen";

export function ampelFuerFach(fach: number | undefined): Ampel {
  if (fach === undefined) return "grau";
  if (fach <= 2) return "rot";
  if (fach === 3) return "gelb";
  return "gruen";
}

// ---------------------------------------------------------------------------
// Prüfungssimulation (Fahrschul-Prinzip)
// ---------------------------------------------------------------------------

export const PRUEFUNG = {
  fragen: 20,
  maxFehler: 3,
  serieFuerReif: 5, // so viele bestandene Prüfungen in Folge = "prüfungsreif"
} as const;

// letzteBestanden: neueste Prüfung zuerst.
export function istPruefungsreif(letzteBestanden: boolean[]): boolean {
  if (letzteBestanden.length < PRUEFUNG.serieFuerReif) return false;
  return letzteBestanden.slice(0, PRUEFUNG.serieFuerReif).every(Boolean);
}
