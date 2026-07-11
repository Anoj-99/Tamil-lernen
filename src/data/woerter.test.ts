import { describe, expect, it } from "vitest";
import { schwierigkeitsStufen, woerter } from "./woerter";

describe("Wort-Bibliothek", () => {
  it("leitet Wörter ohne Duplikate aus den Lektionen ab", () => {
    expect(woerter.length).toBeGreaterThanOrEqual(20);
    const tamil = woerter.map((w) => w.wortTamil);
    expect(tamil).toHaveLength(new Set(tamil).size);
  });

  it("sortiert primär nach Schwierigkeit (= Level)", () => {
    const stufen = woerter.map((w) => w.schwierigkeit);
    expect([...stufen].sort((a, b) => a - b)).toEqual(stufen);
    expect(schwierigkeitsStufen).toEqual([1, 2, 3]);
  });

  it("kennt für jedes Wort die Ursprungs-Lektion (Deep-Link)", () => {
    const amma = woerter.find((w) => w.wortTamil === "அம்மா")!;
    expect(amma.lektionId).toBe("1.1");
    expect(amma.schwierigkeit).toBe(1);
    for (const w of woerter) {
      expect(w.lektionId).toMatch(/^\d\.\d$/);
      expect(w.lautschrift.length).toBeGreaterThan(0);
    }
  });
});
