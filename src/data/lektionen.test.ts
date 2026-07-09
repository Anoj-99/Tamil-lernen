import { describe, expect, it } from "vitest";
import { buchstabenDerStufe, KEIN_UMLAUT, lektionById, lektionen, stufen } from "./lektionen";

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
    for (const b of lektionen[0].buchstaben) {
      expect(b.beispielwortTamil.length).toBeGreaterThan(0);
      expect(b.beispielwortDeutsch.length).toBeGreaterThan(0);
      expect(b.bildPfad).toMatch(/^\/lektionen\/.+\.svg$/);
      expect(b.beispielwortTamil.startsWith(b.zeichen)).toBe(true);
    }
  });

  it("hat Verbinden-Paare für alle Buchstaben, அ ohne Umlaut-Zeichen", () => {
    const l = lektionen[0];
    expect(l.verbindenPaare).toHaveLength(l.buchstaben.length);
    const a = l.verbindenPaare.find((p) => p.zeichen === "அ")!;
    expect(a.umlaut).toBe(KEIN_UMLAUT);
    const aa = l.verbindenPaare.find((p) => p.zeichen === "ஆ")!;
    expect(aa.umlaut).toBe("ா");
  });

  it("Stufe 1 kennt ihre Lektion(en)", () => {
    const stufe1 = stufen.find((s) => s.id === "1")!;
    expect(stufe1.lektionIds).toContain("1.1");
    expect(buchstabenDerStufe("1").length).toBe(6);
  });
});
