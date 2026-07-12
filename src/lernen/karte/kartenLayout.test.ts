import { describe, expect, it } from "vitest";
import { lektionById } from "../../data/lektionen";
import { levels } from "../../data/levelPlan";
import { KARTE } from "./kartenKonfig";
import { baueKartenLayout } from "./kartenLayout";

const name = (id: string) => lektionById(id)?.name ?? id;

describe("Karten-Layout (Ebene 3: Gameplay)", () => {
  it("erzeugt pro Level 3 Lektions- und 1 Boss-Knoten, rein aus den Daten", () => {
    const layout = baueKartenLayout(levels, name);
    expect(layout.hauptpfad).toHaveLength(levels.length * 4);
    for (const level of levels) {
      expect(
        layout.hauptpfad.filter((k) => k.levelId === level.id && k.typ === "lektion"),
      ).toHaveLength(3);
      expect(
        layout.hauptpfad.filter((k) => k.levelId === level.id && k.typ === "boss"),
      ).toHaveLength(1);
    }
  });

  it("wächst automatisch mit zusätzlichen Leveln (keine festen Positionen)", () => {
    const doppelt = [...levels, ...levels.map((l) => ({ ...l, id: l.id + 100 }))];
    const klein = baueKartenLayout(levels, name);
    const gross = baueKartenLayout(doppelt, name);
    expect(gross.hauptpfad.length).toBe(klein.hauptpfad.length * 2);
    expect(gross.hoehe).toBeGreaterThan(klein.hoehe);
  });

  it("skaliert auf 100+ Level, Knoten liegen auf dem Weg", () => {
    const viele = Array.from({ length: 100 }, (_, i) => ({
      ...levels[i % levels.length],
      id: i + 1,
    }));
    const layout = baueKartenLayout(viele, name);
    expect(layout.hauptpfad).toHaveLength(400);
    for (const k of layout.hauptpfad) {
      const p = layout.weg.positionBei(k.bogenlaenge);
      expect(p.x).toBeCloseTo(k.x, 5);
      expect(p.y).toBeCloseTo(k.y, 5);
    }
  });

  it("führt den Weg geordnet von oben nach unten, innerhalb der Kartenbreite", () => {
    const layout = baueKartenLayout(levels, name);
    let vorherigesY = -1;
    for (const k of layout.hauptpfad) {
      expect(k.y).toBeGreaterThan(vorherigesY);
      vorherigesY = k.y;
      expect(k.x).toBeGreaterThan(0);
      expect(k.x).toBeLessThan(KARTE.breite);
    }
    expect(layout.hoehe).toBeGreaterThan(vorherigesY);
  });

  it("verteilt Knoten-Abstände unregelmäßig (kein gleichmäßiges Raster)", () => {
    const layout = baueKartenLayout(levels, name);
    const abstaende = layout.hauptpfad
      .slice(1)
      .map((k, i) => k.bogenlaenge - layout.hauptpfad[i].bogenlaenge);
    expect(new Set(abstaende.map((a) => Math.round(a))).size).toBeGreaterThan(2);
  });

  it("hängt Side-Quests per Weg-Tangente seitlich hinter den Boss ihres Levels", () => {
    const layout = baueKartenLayout(levels, name, [
      { aufgabeId: 1, levelId: 2, name: "Side-Quest: Test" },
    ]);
    const quest = layout.questPfade[0];
    const boss = layout.hauptpfad.find((k) => k.id === "boss:2")!;
    // Abzweigpunkt liegt auf dem Weg, kurz hinter dem Boss.
    expect(quest.knoten.bogenlaenge).toBeGreaterThan(boss.bogenlaenge);
    const abzweig = layout.weg.positionBei(quest.knoten.bogenlaenge);
    expect(quest.von).toEqual(abzweig);
    // Der Knoten liegt seitlich versetzt neben dem Weg.
    expect(Math.abs(quest.knoten.x - abzweig.x)).toBeGreaterThan(50);
    expect(layout.knoten).toContainEqual(quest.knoten);
  });

  it("ist deterministisch (gleiche Eingabe → gleiche Karte)", () => {
    const a = baueKartenLayout(levels, name);
    const b = baueKartenLayout(levels, name);
    expect(a.hauptpfad).toEqual(b.hauptpfad);
    expect(a.hoehe).toBe(b.hoehe);
  });
});
