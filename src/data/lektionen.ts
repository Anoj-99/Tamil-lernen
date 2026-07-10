// Statische Inhalte des geführten Anfänger-Curriculums ("Lektionen").
// Struktur: Level (siehe levelPlan.ts) → Lektion → Buchstaben.
// Lehrer-Anpassungen (Beispielwort, Bild) überlagern diese Vorgaben zur
// Laufzeit, siehe useLektionInhalt.ts.
import { konsonanten, vokale } from "./tamilSchrift";

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
  name: string;
  buchstaben: LektionBuchstabe[];
  verbindenPaare: VerbindenPaar[];
}

// Wird bei அ als "Umlaut" angezeigt, da es kein eigenes Vokalzeichen gibt
// (der Konsonant trägt den A-Laut bereits ohne Zusatz).
export const KEIN_UMLAUT = "(kein Zeichen)";

const PLATZHALTER_BILD = "/lektionen/platzhalter.svg";

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

const buchstabenLektion1_2: LektionBuchstabe[] = [
  {
    zeichen: "எ",
    latein: "E",
    beispielwortTamil: "எலி",
    beispielwortDeutsch: "Eli (Maus)",
    bildPfad: PLATZHALTER_BILD,
  },
  {
    zeichen: "ஏ",
    latein: "Ee",
    beispielwortTamil: "ஏணி",
    beispielwortDeutsch: "Eeni (Leiter)",
    bildPfad: PLATZHALTER_BILD,
  },
  {
    zeichen: "ஐ",
    latein: "Ai",
    beispielwortTamil: "ஐந்து",
    beispielwortDeutsch: "Aindhu (fünf)",
    bildPfad: PLATZHALTER_BILD,
  },
  {
    zeichen: "ஒ",
    latein: "O",
    beispielwortTamil: "ஒன்று",
    beispielwortDeutsch: "Ondru (eins)",
    bildPfad: PLATZHALTER_BILD,
  },
  {
    zeichen: "ஓ",
    latein: "Oo",
    beispielwortTamil: "ஓடம்",
    beispielwortDeutsch: "Oodam (Boot)",
    bildPfad: PLATZHALTER_BILD,
  },
  {
    zeichen: "ஔ",
    latein: "Au",
    beispielwortTamil: "ஔடதம்",
    beispielwortDeutsch: "Audadham (Medizin)",
    bildPfad: PLATZHALTER_BILD,
  },
];

// Ayutham (ஃ) plus Wiederholung der langen Vokale aus 1.1/1.2.
const buchstabenLektion1_3: LektionBuchstabe[] = [
  {
    zeichen: "ஃ",
    latein: "Ah",
    beispielwortTamil: "எஃகு",
    beispielwortDeutsch: "Ehku (Stahl)",
    bildPfad: PLATZHALTER_BILD,
  },
  ...buchstabenLektion1_1.filter((b) => ["ஆ", "ஈ", "ஊ"].includes(b.zeichen)),
  ...buchstabenLektion1_2.filter((b) => ["ஏ", "ஓ"].includes(b.zeichen)),
];

// Konsonanten-Lektionen lehren die Grundform mit Pulli (க் …), wie auch die
// Übungsmodi. Beispielwörter enthalten die Grundform in der Wortmitte/-ende.
function konsonantBuchstabe(
  grundform: string,
  beispielwortTamil: string,
  beispielwortDeutsch: string,
): LektionBuchstabe {
  const k = konsonanten.find((k) => k.grundform === grundform)!;
  return {
    zeichen: k.grundform,
    latein: k.latein,
    beispielwortTamil,
    beispielwortDeutsch,
    bildPfad: PLATZHALTER_BILD,
  };
}

const buchstabenVallinam: LektionBuchstabe[] = [
  konsonantBuchstabe("க்", "அக்கா", "Akka (große Schwester)"),
  konsonantBuchstabe("ச்", "பச்சை", "Patschai (grün)"),
  konsonantBuchstabe("ட்", "எட்டு", "Ettu (acht)"),
  konsonantBuchstabe("த்", "முத்து", "Muthu (Perle)"),
  konsonantBuchstabe("ப்", "அப்பா", "Appa (Papa)"),
  konsonantBuchstabe("ற்", "சுற்று", "Suttru (drehen)"),
];

const buchstabenMellinam: LektionBuchstabe[] = [
  konsonantBuchstabe("ங்", "சிங்கம்", "Singam (Löwe)"),
  konsonantBuchstabe("ஞ்", "பஞ்சு", "Pandschu (Baumwolle)"),
  konsonantBuchstabe("ண்", "கண்", "Kann (Auge)"),
  konsonantBuchstabe("ந்", "பந்து", "Pandhu (Ball)"),
  konsonantBuchstabe("ம்", "மரம்", "Maram (Baum)"),
  konsonantBuchstabe("ன்", "மீன்", "Miin (Fisch)"),
];

function verbindenPaareAusVokalen(zeichenListe: string[]): VerbindenPaar[] {
  return zeichenListe.map((z) => {
    const v = vokale.find((v) => v.zeichen === z)!;
    return { zeichen: v.zeichen, umlaut: v.vokalzeichen || KEIN_UMLAUT };
  });
}

// Konsonanten-Lektionen verbinden Grundform (க்) mit der A-Silbe (க):
// Grundform + அ ergibt das Basiszeichen.
function verbindenPaareAusKonsonanten(buchstaben: LektionBuchstabe[]): VerbindenPaar[] {
  return buchstaben.map((b) => {
    const k = konsonanten.find((k) => k.grundform === b.zeichen)!;
    return { zeichen: k.grundform, umlaut: k.zeichen };
  });
}

export const lektionen: Lektion[] = [
  {
    id: "1.1",
    name: "Erste 6 Vokale",
    buchstaben: buchstabenLektion1_1,
    verbindenPaare: verbindenPaareAusVokalen(buchstabenLektion1_1.map((b) => b.zeichen)),
  },
  {
    id: "1.2",
    name: "Letzte 6 Vokale",
    buchstaben: buchstabenLektion1_2,
    verbindenPaare: verbindenPaareAusVokalen(buchstabenLektion1_2.map((b) => b.zeichen)),
  },
  {
    id: "1.3",
    name: "Ayutham & Festigung",
    buchstaben: buchstabenLektion1_3,
    verbindenPaare: verbindenPaareAusVokalen(
      buchstabenLektion1_3.filter((b) => b.zeichen !== "ஃ").map((b) => b.zeichen),
    ),
  },
  {
    id: "2.1",
    name: "Vallinam I",
    buchstaben: buchstabenVallinam.slice(0, 3),
    verbindenPaare: verbindenPaareAusKonsonanten(buchstabenVallinam.slice(0, 3)),
  },
  {
    id: "2.2",
    name: "Vallinam II",
    buchstaben: buchstabenVallinam.slice(3),
    verbindenPaare: verbindenPaareAusKonsonanten(buchstabenVallinam.slice(3)),
  },
  {
    id: "2.3",
    name: "Vallinam-Festigung",
    buchstaben: buchstabenVallinam,
    verbindenPaare: verbindenPaareAusKonsonanten(buchstabenVallinam),
  },
  {
    id: "3.1",
    name: "Mellinam I",
    buchstaben: buchstabenMellinam.slice(0, 3),
    verbindenPaare: verbindenPaareAusKonsonanten(buchstabenMellinam.slice(0, 3)),
  },
  {
    id: "3.2",
    name: "Mellinam II",
    buchstaben: buchstabenMellinam.slice(3),
    verbindenPaare: verbindenPaareAusKonsonanten(buchstabenMellinam.slice(3)),
  },
  {
    id: "3.3",
    name: "Mellinam-Festigung",
    buchstaben: buchstabenMellinam,
    verbindenPaare: verbindenPaareAusKonsonanten(buchstabenMellinam),
  },
];

export function lektionById(id: string): Lektion | undefined {
  return lektionen.find((l) => l.id === id);
}
