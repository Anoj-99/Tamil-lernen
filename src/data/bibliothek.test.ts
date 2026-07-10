import { describe, expect, it } from "vitest";
import {
  ANZAHL_ZEICHEN_GESAMT,
  meiKlassisch,
  meiZeichen,
  uyirmeiMatrix,
  uyirZeichen,
} from "./bibliothek";

describe("Bibliothek (247 Zeichen)", () => {
  it("umfasst genau 247 Zeichen", () => {
    expect(ANZAHL_ZEICHEN_GESAMT).toBe(247);
    expect(uyirZeichen).toHaveLength(12);
    expect(meiZeichen).toHaveLength(18);
    expect(uyirmeiMatrix).toHaveLength(18);
    for (const zeile of uyirmeiMatrix) {
      expect(zeile.zellen).toHaveLength(12);
    }
  });

  it("hält die klassische Mei-Reihenfolge ein", () => {
    expect(meiKlassisch.map((m) => m.zeichen)).toEqual([
      "க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "ம",
      "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன",
    ]);
    // Jede Klasse ist vollständig vertreten.
    const klassen = meiKlassisch.map((m) => m.klasse);
    expect(klassen.filter((k) => k === "vallinam")).toHaveLength(6);
    expect(klassen.filter((k) => k === "mellinam")).toHaveLength(6);
    expect(klassen.filter((k) => k === "idaiyinam")).toHaveLength(6);
  });

  it("bildet Uyirmei-Zellen korrekt (க + ி = கி)", () => {
    const kaZeile = uyirmeiMatrix[0];
    expect(kaZeile.mei.zeichen).toBe("க");
    expect(kaZeile.zellen[0].zeichen).toBe("க"); // + அ = ohne Zusatzzeichen
    expect(kaZeile.zellen[2].zeichen).toBe("கி");
    expect(kaZeile.zellen[2].latein).toBe("ki");
  });

  it("kennt für gelehrte Zeichen die Ursprungs-Lektion (Deep-Link)", () => {
    const a = uyirZeichen.find((z) => z.zeichen === "அ")!;
    expect(a.lektionId).toBe("1.1");
    const k = meiZeichen.find((z) => z.zeichen === "க்")!;
    expect(k.lektionId).toBe("2.1");
    // Idaiyinam wird noch nicht gelehrt → kein Deep-Link.
    const y = meiZeichen.find((z) => z.zeichen === "ய்")!;
    expect(y.lektionId).toBeNull();
  });
});
