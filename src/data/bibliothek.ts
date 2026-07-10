// Die Bibliothek: alle 247 Zeichen der tamilischen Schrift in klassischer
// Reihenfolge – 12 Uyir (Vokale), 1 Ayutham (ஃ), 18 Mei (Konsonanten-
// Grundformen) und 216 Uyirmei (18 × 12 Kombinationen).
//
// Die Übungsmodi decken bisher nur 12 der 18 Konsonanten ab (Vallinam +
// Mellinam); die 6 Idaiyinam-Konsonanten (ய ர ல வ ழ ள) sind hier fürs
// Nachschlagen definiert und bekommen später eigene Lektionen.
import { lektionen } from "./lektionen";
import { konsonanten, vokale } from "./tamilSchrift";

export interface MeiEintrag {
  zeichen: string; // Basiszeichen, z.B. "க"
  grundform: string; // mit Pulli, z.B. "க்"
  latein: string;
  lautDeutsch: string;
  klasse: "vallinam" | "mellinam" | "idaiyinam";
}

const idaiyinam: MeiEintrag[] = [
  { zeichen: "ய", grundform: "ய்", latein: "y", lautDeutsch: "j (wie in „ja“)", klasse: "idaiyinam" },
  { zeichen: "ர", grundform: "ர்", latein: "r", lautDeutsch: "r (einfach getippt)", klasse: "idaiyinam" },
  { zeichen: "ல", grundform: "ல்", latein: "l", lautDeutsch: "l (Zunge an den Zähnen)", klasse: "idaiyinam" },
  { zeichen: "வ", grundform: "வ்", latein: "v", lautDeutsch: "w / v", klasse: "idaiyinam" },
  { zeichen: "ழ", grundform: "ழ்", latein: "zh", lautDeutsch: "zh (Zunge weit zurückgebogen)", klasse: "idaiyinam" },
  { zeichen: "ள", grundform: "ள்", latein: "ḷ", lautDeutsch: "L (Zunge zurückgerollt)", klasse: "idaiyinam" },
];

// Klassische Reihenfolge der 18 Mei: க ங ச ஞ ட ண த ந ப ம ய ர ல வ ழ ள ற ன.
const MEI_REIHENFOLGE = [
  "க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "ம",
  "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன",
];

export const meiKlassisch: MeiEintrag[] = MEI_REIHENFOLGE.map((zeichen) => {
  const bekannt = konsonanten.find((k) => k.zeichen === zeichen);
  if (bekannt) {
    return {
      zeichen: bekannt.zeichen,
      grundform: bekannt.grundform,
      latein: bekannt.latein,
      lautDeutsch: bekannt.lautDeutsch,
      klasse: bekannt.typ,
    };
  }
  return idaiyinam.find((k) => k.zeichen === zeichen)!;
});

export type ZeichenKategorie = "uyir" | "ayutham" | "mei" | "uyirmei";

export interface BibliothekZeichen {
  zeichen: string;
  latein: string;
  lautDeutsch: string | null;
  kategorie: ZeichenKategorie;
  lektionId: string | null; // Deep-Link zur Lektion, in der es gelehrt wird
}

// Zeichen → Lektion, in der es zuerst gelehrt wird (für den Deep-Link
// "Zur Lektion" aus der Bibliothek).
const lektionFuerZeichen = new Map<string, string>();
for (const lektion of lektionen) {
  for (const b of lektion.buchstaben) {
    if (!lektionFuerZeichen.has(b.zeichen)) {
      lektionFuerZeichen.set(b.zeichen, lektion.id);
    }
  }
}

export const uyirZeichen: BibliothekZeichen[] = vokale.map((v) => ({
  zeichen: v.zeichen,
  latein: v.latein.charAt(0).toUpperCase() + v.latein.slice(1),
  lautDeutsch: null,
  kategorie: "uyir",
  lektionId: lektionFuerZeichen.get(v.zeichen) ?? null,
}));

export const ayuthamZeichen: BibliothekZeichen = {
  zeichen: "ஃ",
  latein: "Ah",
  lautDeutsch: "kurzer Hauchlaut (Aytham)",
  kategorie: "ayutham",
  lektionId: lektionFuerZeichen.get("ஃ") ?? null,
};

export const meiZeichen: BibliothekZeichen[] = meiKlassisch.map((m) => ({
  zeichen: m.grundform,
  latein: m.latein,
  lautDeutsch: m.lautDeutsch,
  kategorie: "mei",
  lektionId: lektionFuerZeichen.get(m.grundform) ?? null,
}));

// Die Uyirmei-Matrix: 18 Zeilen (Mei, klassische Reihenfolge) × 12 Spalten
// (Uyir). Zelle = Basiszeichen + Vokalzeichen, z.B. க + ி = கி.
export interface UyirmeiZeile {
  mei: MeiEintrag;
  zellen: BibliothekZeichen[];
}

export const uyirmeiMatrix: UyirmeiZeile[] = meiKlassisch.map((mei) => ({
  mei,
  zellen: vokale.map((v) => ({
    zeichen: mei.zeichen + v.vokalzeichen,
    latein: mei.latein + v.latein,
    lautDeutsch: null,
    kategorie: "uyirmei" as const,
    lektionId: lektionFuerZeichen.get(mei.zeichen + v.vokalzeichen) ?? null,
  })),
}));

export const ANZAHL_ZEICHEN_GESAMT =
  uyirZeichen.length + 1 + meiZeichen.length + uyirmeiMatrix.length * 12; // 247
