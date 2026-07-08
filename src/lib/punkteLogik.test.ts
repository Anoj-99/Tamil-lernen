import { describe, expect, it } from "vitest";
import {
  ampelFuerFach,
  gewichtFuerFach,
  levelAus,
  levelFortschritt,
  neuesFach,
  verbucheEp,
} from "./punkteLogik";
import { isoWoche, PunkteStand } from "./typen";

function stand(teil: Partial<PunkteStand>): PunkteStand {
  return {
    epGesamt: 0,
    epHeute: 0,
    heuteDatum: "2026-07-08",
    streakTage: 0,
    letzterLerntag: null,
    freezeVerfuegbar: true,
    freezeWoche: isoWoche(new Date(2026, 6, 8)),
    ...teil,
  };
}

const heute = new Date(2026, 6, 8); // 8. Juli 2026 (Mittwoch)

describe("verbucheEp", () => {
  it("zählt EP gesamt und für heute", () => {
    const neu = verbucheEp(stand({ epGesamt: 10, epHeute: 4 }), 3, heute);
    expect(neu.epGesamt).toBe(13);
    expect(neu.epHeute).toBe(7);
  });

  it("setzt das Tagesziel bei Datumswechsel zurück", () => {
    const neu = verbucheEp(
      stand({ epHeute: 15, heuteDatum: "2026-07-07" }),
      2,
      heute,
    );
    expect(neu.epHeute).toBe(2);
    expect(neu.heuteDatum).toBe("2026-07-08");
  });

  it("startet den Streak beim ersten Lernen", () => {
    const neu = verbucheEp(stand({}), 2, heute);
    expect(neu.streakTage).toBe(1);
    expect(neu.letzterLerntag).toBe("2026-07-08");
  });

  it("erhöht den Streak nach einem Lerntag gestern", () => {
    const neu = verbucheEp(
      stand({ streakTage: 4, letzterLerntag: "2026-07-07" }),
      2,
      heute,
    );
    expect(neu.streakTage).toBe(5);
  });

  it("lässt den Streak am selben Tag unverändert", () => {
    const neu = verbucheEp(
      stand({ streakTage: 4, letzterLerntag: "2026-07-08" }),
      2,
      heute,
    );
    expect(neu.streakTage).toBe(4);
  });

  it("rettet den Streak mit einem Freeze bei genau einem Fehltag", () => {
    const neu = verbucheEp(
      stand({ streakTage: 6, letzterLerntag: "2026-07-06", freezeVerfuegbar: true }),
      2,
      heute,
    );
    expect(neu.streakTage).toBe(7);
    expect(neu.freezeVerfuegbar).toBe(false);
  });

  it("setzt den Streak ohne Freeze zurück", () => {
    const neu = verbucheEp(
      stand({ streakTage: 6, letzterLerntag: "2026-07-06", freezeVerfuegbar: false }),
      2,
      heute,
    );
    expect(neu.streakTage).toBe(1);
  });

  it("füllt den Freeze in einer neuen Kalenderwoche wieder auf", () => {
    const neu = verbucheEp(
      stand({
        letzterLerntag: "2026-07-07",
        freezeVerfuegbar: false,
        freezeWoche: "2026-W27",
      }),
      2,
      heute, // W28
    );
    expect(neu.freezeVerfuegbar).toBe(true);
    expect(neu.freezeWoche).toBe(isoWoche(heute));
  });
});

describe("Level", () => {
  it("berechnet Level und Fortschritt aus Gesamt-EP", () => {
    expect(levelAus(0)).toBe(1);
    expect(levelAus(99)).toBe(1);
    expect(levelAus(100)).toBe(2);
    expect(levelAus(250)).toBe(3);
    expect(levelFortschritt(250)).toBe(50);
  });
});

describe("Leitner", () => {
  it("bewegt richtige Antworten ein Fach weiter, gedeckelt bei 5", () => {
    expect(neuesFach(undefined, true)).toBe(1);
    expect(neuesFach(2, true)).toBe(3);
    expect(neuesFach(5, true)).toBe(5);
  });

  it("wirft falsche Antworten zurück in Fach 1", () => {
    expect(neuesFach(4, false)).toBe(1);
  });

  it("gewichtet niedrige Fächer höher", () => {
    expect(gewichtFuerFach(1)).toBeGreaterThan(gewichtFuerFach(3));
    expect(gewichtFuerFach(undefined)).toBeGreaterThan(gewichtFuerFach(5));
  });

  it("leitet die Ampel aus dem Fach ab", () => {
    expect(ampelFuerFach(undefined)).toBe("grau");
    expect(ampelFuerFach(1)).toBe("rot");
    expect(ampelFuerFach(3)).toBe("gelb");
    expect(ampelFuerFach(5)).toBe("gruen");
  });
});
