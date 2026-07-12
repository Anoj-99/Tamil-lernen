import { describe, expect, it } from "vitest";
import { erzeugeZufall, KARTE, WEG } from "./kartenKonfig";
import { erzeugeWeg } from "./wegGenerator";

describe("Weggenerator (Ebene 2)", () => {
  it("ist deterministisch: gleicher Seed → identischer Weg", () => {
    const a = erzeugeWeg(3000, erzeugeZufall(KARTE.seed));
    const b = erzeugeWeg(3000, erzeugeZufall(KARTE.seed));
    expect(a.samples).toEqual(b.samples);
    expect(a.gesamtLaenge).toBe(b.gesamtLaenge);
  });

  it("führt streng nach unten (nie zurücklaufen), x bleibt auf der Insel", () => {
    const weg = erzeugeWeg(8000, erzeugeZufall(KARTE.seed));
    // Auf Anker-Ebene (alle 100 Bogenlängen-Einheiten) wächst y monoton.
    let vorherigesY = -Infinity;
    for (let l = 0; l <= weg.gesamtLaenge; l += 100) {
      const p = weg.positionBei(l);
      expect(p.y).toBeGreaterThan(vorherigesY - 1); // minimale Kurven-Toleranz
      vorherigesY = p.y;
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(KARTE.breite);
    }
    // Ende liegt deutlich tiefer als der Anfang.
    expect(weg.positionBei(weg.gesamtLaenge).y).toBeGreaterThan(
      weg.positionBei(0).y + 5000,
    );
  });

  it("ist organisch: keine gleichmäßigen Segmente, keine Sinus-Symmetrie", () => {
    const weg = erzeugeWeg(6000, erzeugeZufall(KARTE.seed));
    // Seitliche Auslenkung an festen Abständen gemessen: Die Abstände
    // zwischen Richtungswechseln (Vorzeichenwechsel der x-Ablenkung)
    // dürfen nicht alle gleich sein.
    const abweichungen: number[] = [];
    for (let l = 0; l <= weg.gesamtLaenge; l += 50) {
      abweichungen.push(weg.positionBei(l).x - KARTE.breite / 2);
    }
    const wechselAbstaende: number[] = [];
    let letzterWechsel = 0;
    for (let i = 1; i < abweichungen.length; i++) {
      if (Math.sign(abweichungen[i]) !== Math.sign(abweichungen[i - 1])) {
        wechselAbstaende.push(i - letzterWechsel);
        letzterWechsel = i;
      }
    }
    expect(wechselAbstaende.length).toBeGreaterThan(2); // schlängelt wirklich
    expect(new Set(wechselAbstaende).size).toBeGreaterThan(1); // unregelmäßig
  });

  it("liefert Bogenlängen-Zugriff und normierte Tangenten", () => {
    const weg = erzeugeWeg(2000, erzeugeZufall(KARTE.seed));
    expect(weg.gesamtLaenge).toBeGreaterThanOrEqual(2000);
    const halb = weg.positionBei(weg.gesamtLaenge / 2);
    expect(halb.y).toBeGreaterThan(KARTE.randOben);
    const t = weg.tangenteBei(weg.gesamtLaenge / 2);
    expect(Math.hypot(t.x, t.y)).toBeCloseTo(1, 5);
    expect(t.y).toBeGreaterThan(0); // Hauptrichtung nach unten
    // Klemmen außerhalb des Bereichs
    expect(weg.positionBei(-50)).toEqual(weg.positionBei(0));
    expect(weg.positionBei(weg.gesamtLaenge + 50)).toEqual(
      weg.positionBei(weg.gesamtLaenge),
    );
  });

  it("skaliert auf sehr lange Wege (250+ Level)", () => {
    // 250 Level ≈ 250 * (3*150 + 2*210) ≈ 220k Bogenlänge
    const weg = erzeugeWeg(220000, erzeugeZufall(KARTE.seed));
    expect(weg.gesamtLaenge).toBeGreaterThanOrEqual(220000);
    expect(weg.samples.length).toBeGreaterThan(1000);
    // Zugriff bleibt korrekt (binäre Suche statt linear)
    const p = weg.positionBei(123456);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(KARTE.breite);
  });

  it("variiert die Segmentlängen des Random-Walk", () => {
    expect(WEG.segmentMin).toBeLessThan(WEG.segmentMax);
  });
});
