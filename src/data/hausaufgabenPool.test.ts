import { describe, expect, it } from "vitest";
import { hausaufgabenPool, poolAufgabeById, poolThemen } from "./hausaufgabenPool";

describe("Hausaufgaben-Pool", () => {
  it("enthält alle Lektionen und Übungsgruppen mit Fragen-Vorrat", () => {
    expect(hausaufgabenPool.length).toBeGreaterThanOrEqual(12); // 9 Lektionen + 3 Gruppen
    for (const p of hausaufgabenPool) {
      expect(p.buchstaben.length).toBeGreaterThan(0);
      expect(p.standardAnzahl).toBeGreaterThan(0);
      expect(p.thema.length).toBeGreaterThan(0);
    }
  });

  it("ist nach Themen sortierbar und per ID auffindbar", () => {
    expect(poolThemen).toContain("Die Vokale (Uyir)");
    expect(poolThemen).toContain("Konsonant-Vokal-Kombinationen");
    expect(poolAufgabeById("lektion:1.1")?.buchstaben).toHaveLength(6);
    expect(poolAufgabeById("gruppe:vallinam_alle")?.buchstaben).toHaveLength(72);
    expect(poolAufgabeById("gibt-es-nicht")).toBeUndefined();
  });
});
