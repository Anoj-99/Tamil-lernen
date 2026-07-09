// Statische Inhalte des geführten Anfänger-Curriculums ("Lektionen").
// Struktur: Stufe → Lektion → Buchstaben. Lehrer-Anpassungen (Beispielwort,
// Bild) überlagern diese Vorgaben zur Laufzeit, siehe useLektionInhalt.ts.
import { vokale } from "./tamilSchrift";

export interface LektionBuchstabe {
  zeichen: string; // z.B. "அ"
  latein: string; // z.B. "A"
  beispielwortTamil: string; // z.B. "அம்மா"
  beispielwortDeutsch: string; // Lautschrift, z.B. "Amma"
  bildPfad: string; // Platzhalter-Bild, vom Lehrer ersetzbar
}

export interface VerbindenPaar {
  zeichen: string; // eigenständiger Vokal, z.B. "ஆ"
  umlaut: string; // Vokalzeichen am Konsonanten, "" bei அ
}

export interface Lektion {
  id: string; // "1.1"
  stufeId: string; // "1"
  name: string;
  buchstaben: LektionBuchstabe[];
  verbindenPaare: VerbindenPaar[];
}

export interface Stufe {
  id: string;
  name: string;
  lektionIds: string[];
}

// Wird bei அ als "Umlaut" angezeigt, da es kein eigenes Vokalzeichen gibt
// (der Konsonant trägt den A-Laut bereits ohne Zusatz).
export const KEIN_UMLAUT = "(kein Zeichen)";

const buchstabenLektion1_1: LektionBuchstabe[] = [
  {
    zeichen: "அ",
    latein: "A",
    beispielwortTamil: "அம்மா",
    beispielwortDeutsch: "Amma",
    bildPfad: "/lektionen/amma.svg",
  },
  {
    zeichen: "ஆ",
    latein: "Aa",
    beispielwortTamil: "ஆமை",
    beispielwortDeutsch: "Aamai",
    bildPfad: "/lektionen/aamai.svg",
  },
  {
    zeichen: "இ",
    latein: "I",
    beispielwortTamil: "இலை",
    beispielwortDeutsch: "Ilai",
    bildPfad: "/lektionen/ilai.svg",
  },
  {
    zeichen: "ஈ",
    latein: "Ii",
    beispielwortTamil: "ஈட்டி",
    beispielwortDeutsch: "Iitti",
    bildPfad: "/lektionen/iitti.svg",
  },
  {
    zeichen: "உ",
    latein: "U",
    beispielwortTamil: "உப்பு",
    beispielwortDeutsch: "Uppu",
    bildPfad: "/lektionen/uppu.svg",
  },
  {
    zeichen: "ஊ",
    latein: "Uu",
    beispielwortTamil: "ஊசி",
    beispielwortDeutsch: "Uusi",
    bildPfad: "/lektionen/uusi.svg",
  },
];

function verbindenPaareAus(zeichenListe: string[]): VerbindenPaar[] {
  return zeichenListe.map((z) => {
    const v = vokale.find((v) => v.zeichen === z)!;
    return { zeichen: v.zeichen, umlaut: v.vokalzeichen || KEIN_UMLAUT };
  });
}

export const lektionen: Lektion[] = [
  {
    id: "1.1",
    stufeId: "1",
    name: "Erste 6 Vokale",
    buchstaben: buchstabenLektion1_1,
    verbindenPaare: verbindenPaareAus(buchstabenLektion1_1.map((b) => b.zeichen)),
  },
  // Lektion 1.2 (letzte 6 Vokale) folgt in einer späteren Ausbaustufe -
  // Struktur ist bereits vorbereitet (Stufe 1 erwartet zwei Lektionen).
];

export const stufen: Stufe[] = [
  { id: "1", name: "Uyir Ezhuttukal (Vokale)", lektionIds: ["1.1"] },
];

export function lektionById(id: string): Lektion | undefined {
  return lektionen.find((l) => l.id === id);
}

export function stufeById(id: string): Stufe | undefined {
  return stufen.find((s) => s.id === id);
}

// Alle Buchstaben einer Stufe, über alle ihre Lektionen hinweg (für den
// Stufen-Checkpoint und das Einmischen in spätere Stufen-Checkpoints).
export function buchstabenDerStufe(stufeId: string): LektionBuchstabe[] {
  const stufe = stufeById(stufeId);
  if (!stufe) return [];
  return stufe.lektionIds.flatMap((id) => lektionById(id)?.buchstaben ?? []);
}

// Die Stufe, die vor der übergebenen kommt (für das Einmischen alter
// Buchstaben in den nächsten Stufen-Checkpoint) - noch ungenutzt, solange es
// nur eine Stufe gibt, aber bereits vorbereitet.
export function vorherigeStufe(stufeId: string): Stufe | undefined {
  const index = stufen.findIndex((s) => s.id === stufeId);
  return index > 0 ? stufen[index - 1] : undefined;
}
