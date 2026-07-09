import { describe, expect, it } from "vitest";
import { baueLektionOptionen, mischeOhneGleicheReihe } from "./lektionHelfer";

describe("baueLektionOptionen", () => {
  const alle = [
    { zeichen: "அ" },
    { zeichen: "ஆ" },
    { zeichen: "இ" },
    { zeichen: "ஈ" },
    { zeichen: "உ" },
    { zeichen: "ஊ" },
  ];

  it("liefert 4 Optionen, darunter immer die richtige", () => {
    const richtige = alle[2];
    const optionen = baueLektionOptionen(alle, richtige, (a) => a.zeichen);
    expect(optionen).toHaveLength(4);
    expect(optionen).toContainEqual(richtige);
  });

  it("hat keine doppelten Zeichen in den Optionen", () => {
    const richtige = alle[0];
    const optionen = baueLektionOptionen(alle, richtige, (a) => a.zeichen);
    const zeichenMenge = new Set(optionen.map((o) => o.zeichen));
    expect(zeichenMenge.size).toBe(4);
  });
});

describe("mischeOhneGleicheReihe", () => {
  it("kein Element bleibt auf seiner ursprünglichen Position", () => {
    const liste = [1, 2, 3, 4, 5, 6];
    for (let i = 0; i < 30; i++) {
      const gemischt = mischeOhneGleicheReihe(liste);
      expect(gemischt).toHaveLength(liste.length);
      gemischt.forEach((e, idx) => expect(e).not.toBe(liste[idx]));
    }
  });

  it("bleibt bei einem einzelnen Element unverändert (kein Ausweg möglich)", () => {
    expect(mischeOhneGleicheReihe([1])).toEqual([1]);
  });

  it("enthält weiterhin genau dieselben Elemente", () => {
    const liste = ["அ", "ஆ", "இ"];
    const gemischt = mischeOhneGleicheReihe(liste);
    expect([...gemischt].sort()).toEqual([...liste].sort());
  });
});
