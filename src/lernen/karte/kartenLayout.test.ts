import { describe, expect, it } from "vitest";
import { lektionById } from "../../data/lektionen";
import { levels } from "../../data/levelPlan";
import { baueKartenLayout, KARTE_BREITE, wegKurve } from "./kartenLayout";

const name = (id: string) => lektionById(id)?.name ?? id;

describe("Karten-Layout", () => {
  it("erzeugt pro Level 3 Lektions- und 1 Boss-Knoten, rein aus den Daten", () => {
    const layout = baueKartenLayout(levels, name);
    expect(layout.hauptpfad).toHaveLength(levels.length * 4);
    for (const level of levels) {
      expect(layout.hauptpfad.filter((k) => k.levelId === level.id && k.typ === "lektion")).toHaveLength(3);
      expect(layout.hauptpfad.filter((k) => k.levelId === level.id && k.typ === "boss")).toHaveLength(1);
    }
  });

  it("wächst automatisch mit zusätzlichen Leveln (keine festen Positionen)", () => {
    const doppelt = [
      ...levels,
      ...levels.map((l) => ({ ...l, id: l.id + 100 })),
    ];
    const klein = baueKartenLayout(levels, name);
    const gross = baueKartenLayout(doppelt, name);
    expect(gross.hauptpfad.length).toBe(klein.hauptpfad.length * 2);
    expect(gross.hoehe).toBeGreaterThan(klein.hoehe);
  });

  it("führt den Weg geordnet von oben nach unten, innerhalb der Kartenbreite", () => {
    const layout = baueKartenLayout(levels, name);
    let vorherigesY = -1;
    for (const k of layout.hauptpfad) {
      expect(k.y).toBeGreaterThan(vorherigesY);
      vorherigesY = k.y;
      expect(k.x).toBeGreaterThan(0);
      expect(k.x).toBeLessThan(KARTE_BREITE);
    }
    expect(layout.hoehe).toBeGreaterThan(vorherigesY);
  });

  it("hängt Side-Quests hinter den Boss ihres Levels, Seite je nach Weglage", () => {
    const layout = baueKartenLayout(levels, name, [
      { aufgabeId: 1, levelId: 2, name: "Side-Quest: Test" },
    ]);
    const quest = layout.questPfade[0];
    const boss = layout.hauptpfad.find((k) => k.id === "boss:2")!;
    expect(quest.von).toEqual({ x: boss.x, y: boss.y });
    expect(quest.knoten.y).toBeGreaterThan(boss.y);
    expect(quest.knoten.x).not.toBe(boss.x);
    expect(layout.knoten).toContainEqual(quest.knoten);
  });

  it("liefert eine gültige SVG-Kurve durch die Wegpunkte", () => {
    const layout = baueKartenLayout(levels, name);
    const d = wegKurve(layout.hauptpfad);
    expect(d.startsWith("M ")).toBe(true);
    expect(d).toContain("Q ");
    expect(d).toContain("L ");
  });

  it("platziert Dekoration deterministisch (gleiche Eingabe → gleiche Karte)", () => {
    const a = baueKartenLayout(levels, name);
    const b = baueKartenLayout(levels, name);
    expect(a.deko).toEqual(b.deko);
    expect(a.deko.length).toBeGreaterThan(0);
  });
});
