import { describe, expect, it } from "vitest";
import {
  bildeKombination,
  erlaubtePositionen,
  konsonanten,
  strichfolgenKonsonanten,
  strichfolgenVokale,
  uebungsgruppen,
  uebungsWoerter,
  vokale,
} from "./tamilSchrift";

describe("tamilSchrift-Daten", () => {
  it("enthält 12 Vokale und 12 Konsonanten (6 Vallinam, 6 Mellinam)", () => {
    expect(vokale).toHaveLength(12);
    expect(konsonanten).toHaveLength(12);
    expect(konsonanten.filter((k) => k.typ === "vallinam")).toHaveLength(6);
    expect(konsonanten.filter((k) => k.typ === "mellinam")).toHaveLength(6);
  });

  it("bildet Kombinationen korrekt (Beispiel கி = ki)", () => {
    const ka = konsonanten.find((k) => k.grundform === "க்")!;
    const i = vokale.find((v) => v.zeichen === "இ")!;
    const kombi = bildeKombination(ka, i);
    expect(kombi.kombination).toBe("கி");
    expect(kombi.ausspracheLatein).toBe("ki");
    expect(kombi.konsonant).toBe("க்");
    expect(kombi.konsonantTyp).toBe("vallinam");
  });

  it("hat die richtigen Gruppengrößen (72 / 36 / 36)", () => {
    const groessen = Object.fromEntries(
      uebungsgruppen.map((g) => [g.id, g.kombinationen.length]),
    );
    expect(groessen).toEqual({
      vallinam_alle: 72,
      mellinam_neu: 36,
      mellinam_wdh: 36,
    });
  });

  it("hat eindeutige Kombinationen und Aussprachen je Gruppe", () => {
    for (const gruppe of uebungsgruppen) {
      const zeichen = new Set(gruppe.kombinationen.map((k) => k.kombination));
      const aussprachen = new Set(
        gruppe.kombinationen.map((k) => k.ausspracheLatein),
      );
      expect(zeichen.size).toBe(gruppe.kombinationen.length);
      expect(aussprachen.size).toBe(gruppe.kombinationen.length);
    }
  });

  it("weist die Positionsregeln laut Lehr-PDF zu", () => {
    const positionVon = (grundform: string) =>
      konsonanten.find((k) => k.grundform === grundform)?.position;
    for (const g of ["க்", "ச்", "ட்", "த்", "ப்", "ற்", "ங்", "ஞ்", "ந்"]) {
      expect(positionVon(g)).toBe("nur_mitte");
    }
    for (const g of ["ண்", "ம்", "ன்"]) {
      expect(positionVon(g)).toBe("mitte_und_ende");
    }
  });

  it("liefert die erlaubten Positionen je Wert", () => {
    expect(erlaubtePositionen("nur_mitte")).toEqual(["mitte"]);
    expect(erlaubtePositionen("mitte_und_ende")).toEqual(["mitte", "ende"]);
    expect(erlaubtePositionen("anfang_mitte_ende")).toEqual([
      "anfang",
      "mitte",
      "ende",
    ]);
  });

  it("hat für ற் den அ-Präfix-Hinweis", () => {
    const ra = konsonanten.find((k) => k.grundform === "ற்")!;
    expect(ra.positionHinweis).toContain("அ");
  });

  it("hat Strichfolgen für alle Vokale und Konsonanten", () => {
    for (const v of vokale) {
      expect(strichfolgenVokale[v.zeichen]?.length).toBeGreaterThan(0);
    }
    for (const k of konsonanten) {
      expect(strichfolgenKonsonanten[k.zeichen]?.length).toBeGreaterThan(0);
    }
  });

  it("hat ein (noch leeres) Wörter-Array für Stufe 2", () => {
    expect(Array.isArray(uebungsWoerter)).toBe(true);
    expect(uebungsWoerter).toHaveLength(0);
  });
});
