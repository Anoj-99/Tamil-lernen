// Zeichnet die Nachzeichnen-Vorlage: das Zielzeichen halbtransparent plus
// nummerierte Pfeile für die Strichrichtung.
import {
  Kombination,
  strichfolgeAuZeichen,
  strichfolgenKonsonanten,
  strichfolgenVokalzeichen,
  StrichSchritt,
  umschliessendeVokale,
  vorangestellteVokalzeichen,
} from "../data/tamilSchrift";

export const TAMIL_FONT = '"Noto Sans Tamil", sans-serif';
const MESS_GROESSE = 100; // px, Basisgröße für Textvermessung

export interface PfeilPunkt {
  x: number;
  y: number;
  winkel: number;
  nummer: number;
  punkt?: boolean;
}

function inkMetrik(ctx: CanvasRenderingContext2D, text: string, fontPx: number) {
  ctx.font = `${fontPx}px ${TAMIL_FONT}`;
  const m = ctx.measureText(text);
  const links = m.actualBoundingBoxLeft ?? 0;
  const rechts = m.actualBoundingBoxRight ?? m.width;
  const oben = m.actualBoundingBoxAscent ?? fontPx * 0.8;
  const unten = m.actualBoundingBoxDescent ?? fontPx * 0.2;
  return {
    advance: m.width,
    links,
    rechts,
    oben,
    unten,
    breite: links + rechts,
    hoehe: oben + unten,
  };
}

export function getVokalzeichen(k: Kombination): string {
  const konsZeichen = k.konsonant.slice(0, 1);
  return k.kombination.slice(konsZeichen.length);
}

// Berechnet die Pfeil-Schritte (in Canvas-Pixeln) für eine Kombination.
// Die Konsonanten-Schritte sind in Prozent der Ink-Box des Konsonanten
// angegeben, die Vokalzeichen-Schritte in Prozent ihres Breiten-Segments
// (x) bzw. der gesamten Zeichenbox (y).
function berechnePfeile(
  ctx: CanvasRenderingContext2D,
  k: Kombination,
  fontPx: number,
  ursprungX: number, // Stift-Ursprung (Pen-Origin) des gezeichneten Textes
  grundlinieY: number,
): PfeilPunkt[] {
  const konsZeichen = k.konsonant.slice(0, 1); // Basiszeichen ohne Pulli
  const combo = inkMetrik(ctx, k.kombination, fontPx);
  const kons = inkMetrik(ctx, konsZeichen, fontPx);

  const comboOben = grundlinieY - combo.oben;
  const pfeile: PfeilPunkt[] = [];
  let nummer = 1;

  const advKons = kons.advance;
  const advCombo = combo.advance;
  let konsStart = 0;
  let zeichenSegmente: {
    schritte: StrichSchritt[];
    start: number;
    breite: number;
  }[] = [];

  const vokalSchritte = strichfolgenVokalzeichen[getVokalzeichen(k)] ?? [];

  if (k.vokal === "அ") {
    zeichenSegmente = [];
  } else if (vorangestellteVokalzeichen.has(k.vokal)) {
    const zeichenBreite = Math.max(advCombo - advKons, 0);
    konsStart = zeichenBreite;
    zeichenSegmente = [
      { schritte: vokalSchritte, start: 0, breite: zeichenBreite },
    ];
  } else if (umschliessendeVokale.has(k.vokal)) {
    const linksZeichen = k.vokal === "ஓ" ? "ே" : "ெ";
    const linksSchritte = strichfolgenVokalzeichen[linksZeichen] ?? [];
    const rechtsSchritte =
      k.vokal === "ஔ"
        ? strichfolgeAuZeichen
        : (strichfolgenVokalzeichen["ா"] ?? []);
    const advMitLinks = inkMetrik(ctx, konsZeichen + linksZeichen, fontPx).advance;
    const linksBreite = Math.max(advMitLinks - advKons, 0);
    const rechtsBreite = Math.max(advCombo - advKons - linksBreite, 0);
    konsStart = linksBreite;
    zeichenSegmente = [
      { schritte: linksSchritte, start: 0, breite: linksBreite },
      {
        schritte: rechtsSchritte,
        start: linksBreite + advKons,
        breite: rechtsBreite,
      },
    ];
  } else {
    // Nachgestellte Zeichen (ஆ இ ஈ உ ஊ)
    zeichenSegmente = [
      {
        schritte: vokalSchritte,
        start: advKons,
        breite: Math.max(advCombo - advKons, 0),
      },
    ];
  }

  // 1) Striche des Konsonanten.
  for (const s of strichfolgenKonsonanten[konsZeichen] ?? []) {
    pfeile.push({
      x: ursprungX + konsStart - kons.links + (s.x / 100) * kons.breite,
      y: grundlinieY - kons.oben + (s.y / 100) * kons.hoehe,
      winkel: s.winkel,
      nummer: nummer++,
      punkt: s.punkt,
    });
  }

  // 2) Striche der Vokalzeichen.
  for (const segment of zeichenSegmente) {
    for (const s of segment.schritte) {
      pfeile.push({
        x: ursprungX + segment.start + (s.x / 100) * segment.breite,
        y: comboOben + (s.y / 100) * combo.hoehe,
        winkel: s.winkel,
        nummer: nummer++,
        punkt: s.punkt,
      });
    }
  }

  return pfeile;
}

function zeichnePfeil(
  ctx: CanvasRenderingContext2D,
  p: PfeilPunkt,
  skala: number,
) {
  const r = 11 * skala;
  ctx.fillStyle = "#d97706";
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 2.5 * skala;

  if (!p.punkt) {
    const rad = (p.winkel * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const start = {
      x: p.x + dx * (r + 2 * skala),
      y: p.y + dy * (r + 2 * skala),
    };
    const ende = {
      x: p.x + dx * (r + 20 * skala),
      y: p.y + dy * (r + 20 * skala),
    };
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(ende.x, ende.y);
    ctx.stroke();
    const spitze = 7 * skala;
    ctx.beginPath();
    ctx.moveTo(ende.x + dx * spitze, ende.y + dy * spitze);
    ctx.lineTo(ende.x - dy * spitze * 0.6, ende.y + dx * spitze * 0.6);
    ctx.lineTo(ende.x + dy * spitze * 0.6, ende.y - dx * spitze * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${13 * skala}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(p.nummer), p.x, p.y + 0.5 * skala);
}

// Zeichnet die komplette Vorlage in das Canvas (cssGroesse = CSS-Kantenlänge).
export function zeichneVorlage(
  canvas: HTMLCanvasElement,
  kombination: Kombination,
  cssGroesse: number,
) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = cssGroesse * dpr;
  canvas.height = cssGroesse * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssGroesse, cssGroesse);

  // Zeichen einpassen: max. 72 % der Box.
  const basis = inkMetrik(ctx, kombination.kombination, MESS_GROESSE);
  const maxAusdehnung = cssGroesse * 0.72;
  const skalierung = Math.min(
    maxAusdehnung / Math.max(basis.breite, 1),
    maxAusdehnung / Math.max(basis.hoehe, 1),
  );
  const fontPx = MESS_GROESSE * skalierung;
  const metrik = inkMetrik(ctx, kombination.kombination, fontPx);

  const ursprungX = cssGroesse / 2 - metrik.breite / 2 + metrik.links;
  const grundlinieY = cssGroesse / 2 - metrik.hoehe / 2 + metrik.oben;

  ctx.font = `${fontPx}px ${TAMIL_FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(15, 23, 42, 0.2)";
  ctx.fillText(kombination.kombination, ursprungX, grundlinieY);

  const skala = Math.max(cssGroesse / 380, 0.6);
  for (const pfeil of berechnePfeile(
    ctx,
    kombination,
    fontPx,
    ursprungX,
    grundlinieY,
  )) {
    zeichnePfeil(ctx, pfeil, skala);
  }
}
