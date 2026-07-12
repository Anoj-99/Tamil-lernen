import { describe, expect, it } from "vitest";
import { erzeugeZufall, KARTE, WELT } from "./kartenKonfig";
import { erzeugeWeg } from "./wegGenerator";
import { erzeugeWelt } from "./weltGenerator";

describe("World Generator (Ebene 0)", () => {
  it("ist deterministisch und verteilt Merkmale unregelmäßig", () => {
    const a = erzeugeWelt(10000, KARTE.seed);
    const b = erzeugeWelt(10000, KARTE.seed);
    expect(a.merkmale).toEqual(b.merkmale);
    expect(a.merkmale.length).toBeGreaterThan(5);
    const abstaende = a.merkmale
      .slice(1)
      .map((m, i) => m.bogenlaenge - a.merkmale[i].bogenlaenge);
    expect(new Set(abstaende.map(Math.round)).size).toBeGreaterThan(2);
    for (const abstand of abstaende) {
      expect(abstand).toBeGreaterThanOrEqual(WELT.merkmalAbstandMin);
      expect(abstand).toBeLessThanOrEqual(WELT.merkmalAbstandMax);
    }
  });

  it("skaliert längenbasiert – unabhängig von der Anzahl der Level", () => {
    const kurz = erzeugeWelt(5000, KARTE.seed);
    const lang = erzeugeWelt(200000, KARTE.seed); // ~250 Level
    expect(lang.merkmale.length).toBeGreaterThan(kurz.merkmale.length * 20);
    expect(lang.atmosphaere.tageszeit).toBe("morgen");
    expect(lang.biomBei(150000).id).toBe("sriLanka");
  });

  it("erzeugt Brücken genau an den Fluss-Querungen des Wegs", () => {
    const welt = erzeugeWelt(12000, KARTE.seed);
    const weg = erzeugeWeg(12000, erzeugeZufall(KARTE.seed), welt);
    const fluesse = welt.merkmale.filter(
      (m) => m.typ === "fluss" && m.bogenlaenge <= weg.gesamtLaenge,
    );
    expect(weg.bruecken).toHaveLength(fluesse.length);
    for (const bruecke of weg.bruecken) {
      const punkt = weg.positionBei(bruecke.bogenlaenge);
      expect(bruecke.x).toBeCloseTo(punkt.x, 5);
      expect(bruecke.y).toBeCloseTo(punkt.y, 5);
    }
    // Ohne Welt gibt es keine Brücken (Regel: nur über Gewässer).
    expect(erzeugeWeg(3000, erzeugeZufall(KARTE.seed)).bruecken).toHaveLength(0);
  });

  it("Weg weicht Merkmalen aus, bleibt aber monoton nach unten", () => {
    const welt = erzeugeWelt(15000, KARTE.seed);
    const weg = erzeugeWeg(15000, erzeugeZufall(KARTE.seed), welt);
    let vorherigesY = -Infinity;
    for (let l = 0; l <= weg.gesamtLaenge; l += 120) {
      const p = weg.positionBei(l);
      expect(p.y).toBeGreaterThan(vorherigesY - 1);
      vorherigesY = p.y;
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(KARTE.breite);
    }
  });
});
