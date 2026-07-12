// EBENE 1: Landschaft. Übersetzt die Welt-Beschreibung (Ebene 0) in
// Darstellungsdaten – regelbasiert und deterministisch, ohne Spiellogik:
//   - Merkmale (Berge, Tempel, Dörfer …) stehen seitlich am Weg, dort
//     wo Ebene 0 sie vorsieht; Wasserfälle gibt es nur an Bergen,
//     Häuser nur in Dörfern, Brücken nur an Flüssen (siehe Weg).
//   - Füll-Vegetation folgt dem Biom; um Merkmale herum bleibt die
//     Landschaft offener (Negativraum statt Überladung).
//   - Der Steinweg besteht aus unregelmäßigen Platten mit Moos, Gras
//     und Blumen am Rand – wie ein alt gewachsener Wanderweg.
import { Biom } from "./biome";
import { erzeugeZufall, KARTE, KNOTEN, WEG, WELT } from "./kartenKonfig";
import { Weg } from "./wegGenerator";
import { Welt, WeltMerkmal } from "./weltGenerator";

export interface DekoElement {
  x: number;
  y: number;
  symbol: string;
  skala: number;
  spiegeln: boolean;
}

// Helle Grasflecken/Lichtungen auf der Grundfläche (flache Farbinseln).
export interface Wiese {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

// Ein Fluss quert die Welt an dieser Stelle (Band durch den Wegpunkt).
export interface FlussDarstellung {
  x: number;
  y: number;
  schwung: number; // leichte Biegung des Flusslaufs
}

export interface LandschaftsDaten {
  deko: DekoElement[];
  wiesen: Wiese[];
  fluesse: FlussDarstellung[];
}

// Nähe zum nächsten Welt-Merkmal (0 = weit weg, 1 = direkt daneben).
function merkmalNaehe(merkmale: WeltMerkmal[], l: number): number {
  let naehe = 0;
  for (const m of merkmale) {
    const abstand = Math.abs(l - m.bogenlaenge);
    if (abstand < WELT.merkmalEinfluss) {
      naehe = Math.max(naehe, 1 - abstand / WELT.merkmalEinfluss);
    }
  }
  return naehe;
}

function seitlich(weg: Weg, l: number, seite: number, abstand: number) {
  const p = weg.positionBei(l);
  const t = weg.tangenteBei(l);
  return { x: p.x + -t.y * seite * abstand, y: p.y + t.x * seite * abstand };
}

export function baueLandschaft(weg: Weg, welt: Welt): LandschaftsDaten {
  const zufall = erzeugeZufall(KARTE.seed + 1);
  const deko: DekoElement[] = [];
  const wiesen: Wiese[] = [];
  const fluesse: FlussDarstellung[] = [];

  // 1. Welt-Merkmale an ihre Positionen setzen (Regeln, keine Level).
  for (const m of welt.merkmale) {
    if (m.bogenlaenge > weg.gesamtLaenge) continue;
    if (m.typ === "fluss") {
      const p = weg.positionBei(m.bogenlaenge);
      fluesse.push({ x: p.x, y: p.y, schwung: (zufall() * 2 - 1) * 40 });
      continue;
    }
    const abstand = WELT.merkmalVersatz * (0.8 + zufall() * 0.5);
    const pos = seitlich(weg, m.bogenlaenge, m.seite, abstand);
    const rand = KARTE.kuesteBreite + 40;
    const x = Math.max(rand, Math.min(KARTE.breite - rand, pos.x));
    const spiegeln = m.seite < 0;
    if (m.typ === "berg") {
      deko.push({ x, y: pos.y, symbol: "berg", skala: 1.2 * m.groesse, spiegeln });
      // Regel: Wasserfälle entstehen nur in bergigen Bereichen.
      if (zufall() > 0.4) {
        const wf = seitlich(weg, m.bogenlaenge + 60, m.seite, abstand * 0.55);
        deko.push({ x: wf.x, y: wf.y, symbol: "wasserfall", skala: 0.9, spiegeln });
      }
    } else if (m.typ === "see") {
      deko.push({ x, y: pos.y, symbol: "see", skala: 1.15 * m.groesse, spiegeln });
    } else if (m.typ === "tempel") {
      deko.push({ x, y: pos.y, symbol: "tempel", skala: 1.05 * m.groesse, spiegeln });
    } else if (m.typ === "reisfeld") {
      deko.push({ x, y: pos.y, symbol: "reisfeld", skala: 1.25 * m.groesse, spiegeln });
    } else if (m.typ === "dorf") {
      // Regel: Häuser stehen nur in Dörfern – 1–2 Stück, leicht versetzt.
      deko.push({ x, y: pos.y, symbol: "haus", skala: m.groesse, spiegeln });
      if (zufall() > 0.45) {
        deko.push({
          x: x + (zufall() * 2 - 1) * 90,
          y: pos.y + 50 + zufall() * 40,
          symbol: "haus",
          skala: 0.85 * m.groesse,
          spiegeln: !spiegeln,
        });
      }
    }
  }

  // 2. Füll-Vegetation (Biom-gesteuert). Um Merkmale herum dünner –
  // so bleiben offene Flächen zwischen dichteren Bereichen.
  const biom = welt.biomBei(0);
  const schritt = 1000 / biom.dichteProTausend;
  for (
    let l = schritt * zufall();
    l < weg.gesamtLaenge;
    l += schritt * (0.6 + zufall() * 0.8)
  ) {
    const wurf = zufall();
    if (wurf < merkmalNaehe(welt.merkmale, l) * 0.75) continue;
    const seite = zufall() > 0.5 ? 1 : -1;
    const abstand = WEG.bettBreite + KNOTEN.questVersatz * (0.5 + zufall() * 1.2) * 0.9;
    const pos = seitlich(weg, l, seite, abstand);
    const rand = KARTE.kuesteBreite + 30;
    if (pos.x < rand || pos.x > KARTE.breite - rand) continue;
    deko.push({
      x: pos.x,
      y: pos.y,
      symbol: waehleSymbol(biom, zufall()),
      skala: 0.9 + zufall() * 0.65,
      spiegeln: zufall() > 0.5,
    });
  }

  // 3. Helle Wiesen-Flecken als ruhige, flache Farbinseln.
  for (let l = 200 * zufall(); l < weg.gesamtLaenge; l += 500 + zufall() * 700) {
    const pos = seitlich(weg, l, zufall() > 0.5 ? 1 : -1, 120 + zufall() * 260);
    wiesen.push({
      x: pos.x,
      y: pos.y,
      rx: 90 + zufall() * 130,
      ry: 45 + zufall() * 60,
    });
  }

  return { deko, wiesen, fluesse };
}

function waehleSymbol(biom: Biom, wert: number): string {
  const gesamt = biom.symbole.reduce((s, e) => s + e.gewicht, 0);
  let rest = wert * gesamt;
  for (const eintrag of biom.symbole) {
    rest -= eintrag.gewicht;
    if (rest <= 0) return eintrag.symbol;
  }
  return biom.symbole[biom.symbole.length - 1].symbol;
}

// ---------------------------------------------------------------------------
// Der Steinweg: unregelmäßige Platten, Moos, Gras und Blumen am Rand.
// ---------------------------------------------------------------------------

export interface WegStein {
  x: number;
  y: number;
  drehung: number; // Grad, folgt grob der Laufrichtung
  // Unregelmäßige Plattenform als Eckpunkte relativ zum Mittelpunkt
  // (reine Geometrie – die Weg-Ebene macht daraus ein SVG-Polygon).
  form: { x: number; y: number }[];
  moos: boolean;
}

export interface WegSchmuck {
  gras: { x: number; y: number; skala: number }[];
  blumen: { x: number; y: number; skala: number }[];
}

// Unregelmäßige Steinplatte: 6 Eckpunkte mit Radius-Streuung (leicht
// flachgedrückt für die Schräg-Vogelperspektive).
function steinForm(radius: number, zufall: () => number): { x: number; y: number }[] {
  const ecken = 6;
  const punkte: { x: number; y: number }[] = [];
  for (let i = 0; i < ecken; i++) {
    const winkel = (i / ecken) * Math.PI * 2 + (zufall() - 0.5) * 0.4;
    const r = radius * (0.75 + zufall() * 0.45);
    punkte.push({ x: Math.cos(winkel) * r, y: Math.sin(winkel) * r * 0.78 });
  }
  return punkte;
}

export function baueWegSteine(weg: Weg): WegStein[] {
  const zufall = erzeugeZufall(KARTE.seed + 2);
  const steine: WegStein[] = [];
  for (
    let l = 0;
    l < weg.gesamtLaenge;
    l += WEG.steinAbstandMin + zufall() * (WEG.steinAbstandMax - WEG.steinAbstandMin)
  ) {
    const punkt = weg.positionBei(l);
    const tangente = weg.tangenteBei(l);
    const seitJitter = (zufall() * 2 - 1) * WEG.steinSeitJitter;
    const radius = WEG.steinRadiusMin + zufall() * (WEG.steinRadiusMax - WEG.steinRadiusMin);
    steine.push({
      x: punkt.x + -tangente.y * seitJitter,
      y: punkt.y + tangente.x * seitJitter,
      drehung: (Math.atan2(tangente.y, tangente.x) * 180) / Math.PI + (zufall() * 2 - 1) * 25,
      form: steinForm(radius, zufall),
      moos: zufall() < 0.22,
    });
  }
  return steine;
}

export function baueWegSchmuck(weg: Weg): WegSchmuck {
  const zufall = erzeugeZufall(KARTE.seed + 3);
  const gras: WegSchmuck["gras"] = [];
  const blumen: WegSchmuck["blumen"] = [];
  for (let l = 30; l < weg.gesamtLaenge; l += 70 + zufall() * 120) {
    const seite = zufall() > 0.5 ? 1 : -1;
    const amRand = seitlich(weg, l, seite, WEG.bettBreite * (0.45 + zufall() * 0.35));
    if (zufall() > 0.35) {
      gras.push({ x: amRand.x, y: amRand.y, skala: 0.6 + zufall() * 0.5 });
    } else {
      blumen.push({ x: amRand.x, y: amRand.y, skala: 0.4 + zufall() * 0.3 });
    }
  }
  return { gras, blumen };
}
