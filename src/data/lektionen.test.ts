import { describe, expect, it } from "vitest";
import { KEIN_UMLAUT, lektionById, lektionen } from "./lektionen";
import { buchstabenDesLevels, lektionenDesLevels, levels, maskottchenFuerLevel } from "./levelPlan";

describe("Lektionen-Daten", () => {
  it("hat Lektion 1.1 mit den ersten 6 Vokalen", () => {
    const l = lektionById("1.1")!;
    expect(l.buchstaben.map((b) => b.zeichen)).toEqual([
      "அ",
      "ஆ",
      "இ",
      "ஈ",
      "உ",
      "ஊ",
    ]);
  });

  it("hat für jeden Buchstaben ein Beispielwort und ein Bild", () => {
    for (const lektion of lektionen) {
      for (const b of lektion.buchstaben) {
        expect(b.beispielwortTamil.length).toBeGreaterThan(0);
        expect(b.beispielwortDeutsch.length).toBeGreaterThan(0);
        expect(b.bildPfad).toMatch(/^\/lektionen\/.+\.svg$/);
        expect(b.beispielwortTamil).toContain(b.zeichen);
      }
    }
  });

  it("hat Verbinden-Paare für die Vokal-Lektionen, அ ohne Umlaut-Zeichen", () => {
    const l = lektionen[0];
    expect(l.verbindenPaare).toHaveLength(l.buchstaben.length);
    const a = l.verbindenPaare.find((p) => p.zeichen === "அ")!;
    expect(a.umlaut).toBe(KEIN_UMLAUT);
    const aa = l.verbindenPaare.find((p) => p.zeichen === "ஆ")!;
    expect(aa.umlaut).toBe("ா");
  });

  it("verbindet in Konsonanten-Lektionen Grundform mit A-Silbe", () => {
    const l = lektionById("2.1")!;
    const k = l.verbindenPaare.find((p) => p.zeichen === "க்")!;
    expect(k.umlaut).toBe("க");
  });
});

describe("Level-Plan", () => {
  it("hat pro Level genau 3 existierende Lektionen", () => {
    for (const level of levels) {
      expect(level.lektionIds).toHaveLength(3);
      expect(lektionenDesLevels(level)).toHaveLength(3);
    }
  });

  it("dedupliziert Buchstaben über Festigungs-Lektionen hinweg", () => {
    const level2 = levels.find((l) => l.id === 2)!;
    const zeichen = buchstabenDesLevels(level2).map((b) => b.zeichen);
    expect(zeichen).toHaveLength(new Set(zeichen).size);
    expect(zeichen).toHaveLength(6); // 6 Vallinam-Grundformen
  });

  it("Maskottchen entwickelt sich alle 5 Level weiter", () => {
    expect(maskottchenFuerLevel(1)).toBe("Pfau");
    expect(maskottchenFuerLevel(5)).toBe("Pfau");
    expect(maskottchenFuerLevel(6)).toBe("Affe");
    expect(maskottchenFuerLevel(11)).toBe("Tiger");
    expect(maskottchenFuerLevel(16)).toBe("Elefant");
    expect(maskottchenFuerLevel(99)).toBe("Elefant");
  });
});
