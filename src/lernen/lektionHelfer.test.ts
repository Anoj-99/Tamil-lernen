import { describe, expect, it } from "vitest";
import { baueLektionOptionen } from "./lektionHelfer";

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
