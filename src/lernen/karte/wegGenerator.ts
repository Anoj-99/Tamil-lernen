// EBENE 2: der Weg. Erzeugt einen organischen Pfad durch die Welt –
// unabhängig von Leveln (die Gameplay-Ebene ankert sich später per
// Bogenlänge daran, die Landschafts-Ebene dekoriert daneben).
//
// Der Weg folgt der Landschaft, nicht umgekehrt: Er entsteht als
// begrenzter Richtungs-Random-Walk, der den Merkmalen der Welt (Ebene 0)
// ausweicht – um Berge und Seen biegt er herum, Flüsse quert er über
// kleine Brücken. x schlängelt frei nach links und rechts, y wächst
// streng monoton nach unten – der Spieler läuft also nie "zurück".
// Catmull-Rom-Glättung macht daraus natürliche Kurven mit
// unterschiedlichen Radien; durch den Seed-Zufall gibt es keine
// Wiederholungsmuster und keine perfekte Symmetrie.
import { KARTE, WEG, WELT } from "./kartenKonfig";
import { Welt } from "./weltGenerator";

export interface WegPunkt {
  x: number;
  y: number;
}

export interface Bruecke {
  x: number;
  y: number;
  bogenlaenge: number;
  drehungGrad: number; // folgt der Laufrichtung des Wegs
}

export interface Weg {
  // Dichte, geglättete Punktfolge (für Wegbett, Steine und Avatar-Lauf)
  samples: WegPunkt[];
  // Kumulative Bogenlänge parallel zu samples (bogenlaengen[0] = 0)
  bogenlaengen: number[];
  gesamtLaenge: number;
  // Brücken an den Fluss-Querungen (aus den Welt-Merkmalen abgeleitet)
  bruecken: Bruecke[];
  // Punkt auf dem Weg bei Bogenlänge l (linear interpoliert, geklemmt)
  positionBei(l: number): WegPunkt;
  // Normierte Laufrichtung bei Bogenlänge l
  tangenteBei(l: number): WegPunkt;
}

// Seitliche Ausweich-Steuerung: Merkmale wie Berge und Seen drücken den
// Weg sanft auf die gegenüberliegende Seite – so entsteht der Eindruck,
// dass der Weg natürlich um die Landschaft herumgewachsen ist.
function ausweichung(welt: Welt | undefined, bogenlaenge: number): number {
  if (!welt) return 0;
  let summe = 0;
  for (const m of welt.merkmale) {
    if (m.typ === "fluss") continue; // Flüsse werden gequert, nicht umlaufen
    const abstand = Math.abs(bogenlaenge - m.bogenlaenge);
    if (abstand < WELT.merkmalEinfluss) {
      const naehe = 1 - abstand / WELT.merkmalEinfluss;
      summe += -m.seite * WELT.ausweichStaerke * naehe * m.groesse;
    }
  }
  return summe;
}

// Rohpunkte des Random-Walk, bis der Weg (mindestens) die gewünschte
// Bogenlänge hergibt.
function erzeugeRohpunkte(
  mindestLaenge: number,
  zufall: () => number,
  welt?: Welt,
): WegPunkt[] {
  const mitte = KARTE.breite / 2;
  const punkte: WegPunkt[] = [];
  let x = mitte + (zufall() - 0.5) * WEG.amplitude;
  let y = KARTE.randOben;
  let richtung = (zufall() - 0.5) * WEG.richtungMax;
  let grobLaenge = 0;

  punkte.push({ x, y });
  // 5 % Marge: die Catmull-Rom-Glättung kann die Bogenlänge gegenüber
  // dem groben Polygonzug leicht verkürzen.
  const zielLaenge = mindestLaenge * 1.05 + WEG.segmentMax * 2;
  while (grobLaenge < zielLaenge) {
    // Richtung streuen und begrenzen; nahe der Auslenkungsgrenze sanft
    // zurück zur Mitte ziehen; Landschafts-Merkmalen ausweichen.
    richtung += (zufall() - 0.5) * WEG.richtungWandel;
    richtung += ausweichung(welt, grobLaenge);
    const auslenkung = (x - mitte) / WEG.amplitude;
    richtung -= auslenkung * WEG.zurMitteZug;
    richtung = Math.max(-WEG.richtungMax, Math.min(WEG.richtungMax, richtung));

    const dy = WEG.segmentMin + zufall() * (WEG.segmentMax - WEG.segmentMin);
    const dx = richtung * dy;
    x = Math.max(mitte - WEG.amplitude, Math.min(mitte + WEG.amplitude, x + dx));
    y += dy; // y wächst immer – Hauptrichtung bleibt nach unten
    punkte.push({ x, y });
    grobLaenge += Math.hypot(dx, dy);
  }
  return punkte;
}

// Catmull-Rom-Spline durch die Rohpunkte → dichte, weiche Kurve.
function glaette(punkte: WegPunkt[]): WegPunkt[] {
  if (punkte.length < 3) return [...punkte];
  const ergebnis: WegPunkt[] = [punkte[0]];
  for (let i = 0; i < punkte.length - 1; i++) {
    const p0 = punkte[Math.max(0, i - 1)];
    const p1 = punkte[i];
    const p2 = punkte[i + 1];
    const p3 = punkte[Math.min(punkte.length - 1, i + 2)];
    for (let s = 1; s <= WEG.glaettungSchritte; s++) {
      const t = s / WEG.glaettungSchritte;
      const t2 = t * t;
      const t3 = t2 * t;
      ergebnis.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  return ergebnis;
}

export function erzeugeWeg(
  mindestLaenge: number,
  zufall: () => number,
  welt?: Welt,
): Weg {
  const samples = glaette(erzeugeRohpunkte(mindestLaenge, zufall, welt));

  const bogenlaengen: number[] = [0];
  for (let i = 1; i < samples.length; i++) {
    bogenlaengen.push(
      bogenlaengen[i - 1] +
        Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y),
    );
  }
  const gesamtLaenge = bogenlaengen[bogenlaengen.length - 1];

  // Index des letzten Samples mit Bogenlänge <= l (binäre Suche).
  const indexBei = (l: number): number => {
    let von = 0;
    let bis = bogenlaengen.length - 1;
    while (von < bis) {
      const mitte = Math.ceil((von + bis) / 2);
      if (bogenlaengen[mitte] <= l) von = mitte;
      else bis = mitte - 1;
    }
    return von;
  };

  const positionBei = (l: number): WegPunkt => {
    const geklemmt = Math.max(0, Math.min(gesamtLaenge, l));
    const i = Math.min(indexBei(geklemmt), samples.length - 2);
    const segment = bogenlaengen[i + 1] - bogenlaengen[i];
    const anteil = segment === 0 ? 0 : (geklemmt - bogenlaengen[i]) / segment;
    return {
      x: samples[i].x + (samples[i + 1].x - samples[i].x) * anteil,
      y: samples[i].y + (samples[i + 1].y - samples[i].y) * anteil,
    };
  };

  const tangenteBei = (l: number): WegPunkt => {
    const geklemmt = Math.max(0, Math.min(gesamtLaenge, l));
    const i = Math.min(indexBei(geklemmt), samples.length - 2);
    const dx = samples[i + 1].x - samples[i].x;
    const dy = samples[i + 1].y - samples[i].y;
    const laenge = Math.hypot(dx, dy) || 1;
    return { x: dx / laenge, y: dy / laenge };
  };

  // Brücken: genau dort, wo laut Welt (Ebene 0) ein Fluss den Weg quert.
  const bruecken: Bruecke[] = (welt?.merkmale ?? [])
    .filter((m) => m.typ === "fluss" && m.bogenlaenge <= gesamtLaenge)
    .map((m) => {
      const p = positionBei(m.bogenlaenge);
      const t = tangenteBei(m.bogenlaenge);
      return {
        x: p.x,
        y: p.y,
        bogenlaenge: m.bogenlaenge,
        drehungGrad: (Math.atan2(t.y, t.x) * 180) / Math.PI,
      };
    });

  return { samples, bogenlaengen, gesamtLaenge, bruecken, positionBei, tangenteBei };
}
