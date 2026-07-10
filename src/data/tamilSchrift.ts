// Datengrundlage für die Tamil-Schrift-Lern-App (/lernen).
// Umfang Version 1: 12 Uyir-Vokale, 6 Vallinam- und 6 Mellinam-Konsonanten.
// Idaiyinam-Buchstaben (ய ர ல வ ழ ள) sind bewusst NICHT enthalten.

export type KonsonantTyp = "vallinam" | "mellinam";

// Positionswerte laut Lehr-PDF: Die Grundform mit Pulli steht nie am
// Wortanfang. "anfang_mitte_ende" bleibt als waehlbarer Wert fuer
// Lehrer-Anpassungen erhalten.
export type PositionsWert = "nur_mitte" | "mitte_und_ende" | "anfang_mitte_ende";

export type WortPosition = "anfang" | "mitte" | "ende";

export interface Vokal {
  zeichen: string; // eigenständiger Vokal, z.B. "இ"
  vokalzeichen: string; // Zeichen am Konsonanten, z.B. "ி" ("" bei அ)
  latein: string; // z.B. "i"
  lang: boolean;
}

export interface Konsonant {
  zeichen: string; // Basiszeichen ohne Pulli, z.B. "க"
  grundform: string; // mit Pulli, z.B. "க்"
  typ: KonsonantTyp;
  latein: string; // z.B. "k"
  lautDeutsch: string; // Aussprache-Hilfe auf Deutsch
  position: PositionsWert;
  positionHinweis: string | null; // Sonderregel-Text, falls vorhanden
}

// Struktur laut Vorgabe – eine Konsonant-Vokal-Kombination.
export interface Kombination {
  konsonant: string; // Grundform mit Pulli, z.B. "க்"
  konsonantTyp: KonsonantTyp;
  vokal: string; // z.B. "இ"
  kombination: string; // z.B. "கி"
  ausspracheLatein: string; // z.B. "ki"
  position: PositionsWert;
  positionHinweis: string | null;
}

export const PULLI = "்"; // ்

export const vokale: Vokal[] = [
  { zeichen: "அ", vokalzeichen: "", latein: "a", lang: false },
  { zeichen: "ஆ", vokalzeichen: "ா", latein: "aa", lang: true },
  { zeichen: "இ", vokalzeichen: "ி", latein: "i", lang: false },
  { zeichen: "ஈ", vokalzeichen: "ீ", latein: "ii", lang: true },
  { zeichen: "உ", vokalzeichen: "ு", latein: "u", lang: false },
  { zeichen: "ஊ", vokalzeichen: "ூ", latein: "uu", lang: true },
  { zeichen: "எ", vokalzeichen: "ெ", latein: "e", lang: false },
  { zeichen: "ஏ", vokalzeichen: "ே", latein: "ee", lang: true },
  { zeichen: "ஐ", vokalzeichen: "ை", latein: "ai", lang: false },
  { zeichen: "ஒ", vokalzeichen: "ொ", latein: "o", lang: false },
  { zeichen: "ஓ", vokalzeichen: "ோ", latein: "oo", lang: true },
  { zeichen: "ஔ", vokalzeichen: "ௌ", latein: "au", lang: false },
];

export const konsonanten: Konsonant[] = [
  {
    zeichen: "க",
    grundform: "க்",
    typ: "vallinam",
    latein: "k",
    lautDeutsch: "k / g / h",
    position: "nur_mitte",
    positionHinweis: null,
  },
  {
    zeichen: "ச",
    grundform: "ச்",
    typ: "vallinam",
    latein: "tsch",
    lautDeutsch: "tsch (teils s)",
    position: "nur_mitte",
    positionHinweis: null,
  },
  {
    zeichen: "ட",
    grundform: "ட்",
    typ: "vallinam",
    latein: "d",
    lautDeutsch: "d / t (Zunge zurückgerollt)",
    position: "nur_mitte",
    positionHinweis: null,
  },
  {
    zeichen: "த",
    grundform: "த்",
    typ: "vallinam",
    latein: "th",
    lautDeutsch: "th (Zunge an den Zähnen)",
    position: "nur_mitte",
    positionHinweis: null,
  },
  {
    zeichen: "ப",
    grundform: "ப்",
    typ: "vallinam",
    latein: "p",
    lautDeutsch: "p / b",
    position: "nur_mitte",
    positionHinweis: null,
  },
  {
    zeichen: "ற",
    grundform: "ற்",
    typ: "vallinam",
    latein: "r",
    lautDeutsch: "r / tr / dr (stark gerollt)",
    position: "nur_mitte",
    positionHinweis:
      "Falls ற் am Wortanfang stehen soll, wird ein zusätzliches இ davorgesetzt.",
  },
  {
    zeichen: "ங",
    grundform: "ங்",
    typ: "mellinam",
    latein: "ng",
    lautDeutsch: "ng (wie in „singen“)",
    position: "nur_mitte",
    positionHinweis:
      "Kombinationen mit ங kommen in echten Wörtern kaum vor.",
  },
  {
    zeichen: "ஞ",
    grundform: "ஞ்",
    typ: "mellinam",
    latein: "nj",
    lautDeutsch: "nj (wie in „Kognak“)",
    position: "nur_mitte",
    positionHinweis:
      "Als volle Silbe steht ஞ nur am Wortanfang (z. B. ஞாயிறு = Sonntag) – die Grundform ஞ் dagegen nur in der Wortmitte.",
  },
  {
    zeichen: "ண",
    grundform: "ண்",
    typ: "mellinam",
    latein: "N",
    lautDeutsch: "N (Zunge zurückgerollt)",
    position: "mitte_und_ende",
    positionHinweis: null,
  },
  {
    zeichen: "ந",
    grundform: "ந்",
    typ: "mellinam",
    latein: "n",
    lautDeutsch: "n (Zunge hinter den Zähnen)",
    position: "nur_mitte",
    positionHinweis:
      "Als volle Silbe (ந, நா, நி …) ist ந das einzige N, das am Wortanfang stehen darf – die Grundform ந் steht nur in der Mitte.",
  },
  {
    zeichen: "ம",
    grundform: "ம்",
    typ: "mellinam",
    latein: "m",
    lautDeutsch: "m",
    position: "mitte_und_ende",
    positionHinweis: null,
  },
  {
    zeichen: "ன",
    grundform: "ன்",
    typ: "mellinam",
    latein: "ṉ",
    lautDeutsch: "n (Zunge in der Mitte)",
    position: "mitte_und_ende",
    positionHinweis: null,
  },
];

// Kleine Legende für die Lateinschrift-Umschrift (wird im UI angezeigt).
export const lateinLegende: { latein: string; erklaerung: string }[] = [
  { latein: "n", erklaerung: "ந் – Zunge hinter den Zähnen" },
  { latein: "N", erklaerung: "ண் – Zunge zurückgerollt" },
  { latein: "ṉ", erklaerung: "ன் – Zunge in der Mitte" },
  { latein: "r", erklaerung: "ற் – stark gerollt" },
];

export function bildeKombination(k: Konsonant, v: Vokal): Kombination {
  return {
    konsonant: k.grundform,
    konsonantTyp: k.typ,
    vokal: v.zeichen,
    kombination: k.zeichen + v.vokalzeichen,
    ausspracheLatein: k.latein + v.latein,
    position: k.position,
    positionHinweis: k.positionHinweis,
  };
}

// ---------------------------------------------------------------------------
// Übungsgruppen (Filter für alle Modi)
// ---------------------------------------------------------------------------

export type GruppenId = "vallinam_alle" | "mellinam_neu" | "mellinam_wdh";

export interface Uebungsgruppe {
  id: GruppenId;
  name: string;
  beschreibung: string;
  kombinationen: Kombination[];
}

const ersteSechsVokale = vokale.slice(0, 6); // அ ஆ இ ஈ உ ஊ
const letzteSechsVokale = vokale.slice(6); // எ ஏ ஐ ஒ ஓ ஔ
const vallinamKonsonanten = konsonanten.filter((k) => k.typ === "vallinam");
const mellinamKonsonanten = konsonanten.filter((k) => k.typ === "mellinam");

function kombiniere(ks: Konsonant[], vs: Vokal[]): Kombination[] {
  return ks.flatMap((k) => vs.map((v) => bildeKombination(k, v)));
}

export const uebungsgruppen: Uebungsgruppe[] = [
  {
    id: "vallinam_alle",
    name: "Vallinam + alle 12 Uyir",
    beschreibung: "க ச ட த ப ற mit allen 12 Vokalen (72 Kombinationen)",
    kombinationen: kombiniere(vallinamKonsonanten, vokale),
  },
  {
    id: "mellinam_neu",
    name: "Mellinam + letzte 6 Uyir",
    beschreibung: "ங ஞ ண ந ம ன mit எ ஏ ஐ ஒ ஓ ஔ (36 Kombinationen)",
    kombinationen: kombiniere(mellinamKonsonanten, letzteSechsVokale),
  },
  {
    id: "mellinam_wdh",
    name: "Mellinam + erste 6 Uyir (Wiederholung)",
    beschreibung: "ங ஞ ண ந ம ன mit அ ஆ இ ஈ உ ஊ (36 Kombinationen)",
    kombinationen: kombiniere(mellinamKonsonanten, ersteSechsVokale),
  },
];

// ---------------------------------------------------------------------------
// Positionsregeln (Modus "Position-Check")
// ---------------------------------------------------------------------------

export function erlaubtePositionen(position: PositionsWert): WortPosition[] {
  switch (position) {
    case "nur_mitte":
      return ["mitte"];
    case "mitte_und_ende":
      return ["mitte", "ende"];
    case "anfang_mitte_ende":
      return ["anfang", "mitte", "ende"];
  }
}

// Anzeigenamen fuer die Lehrer-Ansicht.
export const positionsWertNamen: Record<PositionsWert, string> = {
  nur_mitte: "Nur Mitte",
  mitte_und_ende: "Mitte und Ende",
  anfang_mitte_ende: "Anfang, Mitte und Ende",
};

export function positionsErklaerung(grundform: string, wert: PositionsWert): string {
  switch (wert) {
    case "nur_mitte":
      return `${grundform} darf nur in der Mitte eines Wortes stehen – nicht am Anfang und nicht am Ende.`;
    case "mitte_und_ende":
      return `${grundform} darf nur in der Mitte oder am Ende stehen, niemals am Anfang.`;
    case "anfang_mitte_ende":
      return `${grundform} darf am Anfang, in der Mitte und am Ende eines Wortes stehen.`;
  }
}

// ---------------------------------------------------------------------------
// Strichfolge-Daten (Modus "Nachzeichnen")
// ---------------------------------------------------------------------------
// Jeder Schritt markiert den Startpunkt eines Strichs mit Nummer und einem
// Pfeil für die Zugrichtung. Koordinaten in Prozent (0–100) der Zeichenbox,
// Winkel in Grad (0 = nach rechts, 90 = nach unten, 180 = nach links,
// 270 = nach oben). `punkt: true` = einzelner Punkt (z.B. Pulli), ohne Pfeil.

export interface StrichSchritt {
  x: number;
  y: number;
  winkel: number;
  punkt?: boolean;
}

// Strichfolgen für die eigenständigen Vokale (plus Ayutham ஃ: drei Punkte).
export const strichfolgenVokale: Record<string, StrichSchritt[]> = {
  ஃ: [
    { x: 20, y: 15, winkel: 0, punkt: true },
    { x: 20, y: 85, winkel: 0, punkt: true },
    { x: 80, y: 50, winkel: 0, punkt: true },
  ],
  அ: [
    { x: 30, y: 30, winkel: 180 },
    { x: 55, y: 20, winkel: 90 },
    { x: 62, y: 60, winkel: 0 },
  ],
  ஆ: [
    { x: 25, y: 30, winkel: 180 },
    { x: 45, y: 20, winkel: 90 },
    { x: 50, y: 60, winkel: 0 },
    { x: 82, y: 20, winkel: 90 },
  ],
  இ: [
    { x: 55, y: 25, winkel: 180 },
    { x: 30, y: 60, winkel: 0 },
  ],
  ஈ: [
    { x: 30, y: 25, winkel: 0 },
    { x: 62, y: 45, winkel: 90 },
    { x: 85, y: 25, winkel: 270 },
  ],
  உ: [{ x: 35, y: 20, winkel: 0 }],
  ஊ: [
    { x: 28, y: 20, winkel: 0 },
    { x: 70, y: 40, winkel: 90 },
  ],
  எ: [{ x: 60, y: 20, winkel: 180 }],
  ஏ: [
    { x: 55, y: 15, winkel: 180 },
    { x: 30, y: 55, winkel: 90 },
  ],
  ஐ: [
    { x: 55, y: 15, winkel: 180 },
    { x: 30, y: 45, winkel: 0 },
    { x: 65, y: 55, winkel: 90 },
  ],
  ஒ: [
    { x: 40, y: 20, winkel: 180 },
    { x: 55, y: 45, winkel: 90 },
  ],
  ஓ: [
    { x: 40, y: 20, winkel: 180 },
    { x: 50, y: 45, winkel: 90 },
    { x: 80, y: 20, winkel: 90 },
  ],
  ஔ: [
    { x: 30, y: 20, winkel: 180 },
    { x: 40, y: 45, winkel: 90 },
    { x: 70, y: 25, winkel: 90 },
  ],
};

// Strichfolgen für die Konsonanten-Basiszeichen (ohne Pulli).
export const strichfolgenKonsonanten: Record<string, StrichSchritt[]> = {
  க: [{ x: 16, y: 12, winkel: 90 }],
  ச: [{ x: 68, y: 16, winkel: 180 }],
  ட: [{ x: 10, y: 8, winkel: 90 }],
  த: [
    { x: 28, y: 12, winkel: 0 },
    { x: 52, y: 32, winkel: 90 },
  ],
  ப: [{ x: 15, y: 14, winkel: 90 }],
  ற: [
    { x: 22, y: 22, winkel: 90 },
    { x: 28, y: 52, winkel: 0 },
  ],
  ங: [
    { x: 14, y: 28, winkel: 90 },
    { x: 53, y: 28, winkel: 90 },
    { x: 86, y: 12, winkel: 90 },
  ],
  ஞ: [
    { x: 30, y: 14, winkel: 0 },
    { x: 15, y: 62, winkel: 0 },
  ],
  ண: [
    { x: 45, y: 18, winkel: 180 },
    { x: 84, y: 30, winkel: 90 },
  ],
  ந: [
    { x: 20, y: 20, winkel: 90 },
    { x: 60, y: 18, winkel: 90 },
  ],
  ம: [
    { x: 30, y: 20, winkel: 180 },
    { x: 84, y: 20, winkel: 90 },
  ],
  ன: [
    { x: 40, y: 18, winkel: 180 },
    { x: 78, y: 35, winkel: 90 },
  ],
};

// Strichfolgen für die Vokalzeichen am Konsonanten. Die x-Werte beziehen sich
// auf die Teilbox des Vokalzeichens, die y-Werte auf die gesamte Zeichenbox.
export const strichfolgenVokalzeichen: Record<string, StrichSchritt[]> = {
  "ா": [{ x: 50, y: 20, winkel: 90 }], // ா
  "ி": [{ x: 40, y: 15, winkel: 0 }], // ி
  "ீ": [{ x: 35, y: 15, winkel: 0 }], // ீ
  "ு": [{ x: 40, y: 55, winkel: 0 }], // ு (verschmilzt oft)
  "ூ": [{ x: 35, y: 55, winkel: 0 }], // ூ (verschmilzt oft)
  "ெ": [{ x: 55, y: 20, winkel: 180 }], // ெ
  "ே": [{ x: 55, y: 15, winkel: 180 }], // ே
  "ை": [
    { x: 55, y: 30, winkel: 180 }, // ை
    { x: 55, y: 65, winkel: 180 },
  ],
  // ொ/ோ/ௌ werden aus ெ/ே + rechtem Teil zusammengesetzt (siehe Modus).
};

// Rechter Teil von ௌ (ௗ-ähnliches Zeichen).
export const strichfolgeAuZeichen: StrichSchritt[] = [
  { x: 40, y: 25, winkel: 90 },
];

// Vokale, deren Zeichen VOR dem Konsonanten steht (kombu-Formen).
export const vorangestellteVokalzeichen = new Set(["எ", "ஏ", "ஐ"]);
// Vokale, die um den Konsonanten herum geschrieben werden.
export const umschliessendeVokale = new Set(["ஒ", "ஓ", "ஔ"]);
// Vokale, deren Zeichen mit dem Konsonanten verschmilzt (Ligatur).
export const ligaturVokale = new Set(["உ", "ஊ"]);

// ---------------------------------------------------------------------------
// Vorbereitung Stufe 2: Übungswörter (noch leer, nur Struktur)
// ---------------------------------------------------------------------------

export interface UebungsWort {
  wortTamil: string;
  wortLatein: string;
  wortDeutsch: string;
  silben: Kombination[]; // Kombinations-Objekte, aus denen das Wort besteht
}

export const uebungsWoerter: UebungsWort[] = [];
