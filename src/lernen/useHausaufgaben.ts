import { useCallback, useEffect, useState } from "react";
import { datenquelle } from "../lib/datenquelle";
import { Hausaufgabe } from "../lib/typen";

export interface MeineAufgabe {
  aufgabe: Hausaufgabe;
  fortschritt: number; // richtig beantwortete Fragen über alle Teile
  gesamt: number; // Summe der Fragen-Anzahlen aller Teile
  erledigt: boolean;
  erledigtAm: string | null;
}

export function aufgabenGesamt(aufgabe: Hausaufgabe): number {
  return aufgabe.teile.reduce((summe, t) => summe + t.anzahl, 0);
}

// Hausaufgaben des angemeldeten Schülers ("alle" oder direkt zugewiesen)
// samt Bearbeitungsstand. Der Fortschritt wird in der Side-Quest-Ansicht
// (HausaufgabenAnsicht) gezählt, nicht mehr in den freien Übungsmodi.
export function useHausaufgaben(username: string) {
  const [aufgaben, setAufgaben] = useState<MeineAufgabe[]>([]);
  const [laden, setLaden] = useState(true);

  const neuLaden = useCallback(() => {
    if (!username) return;
    setLaden(true);
    Promise.all([datenquelle.ladeHausaufgaben(), datenquelle.ladeHausaufgabenStatus()])
      .then(([alle, status]) => {
        const meine = alle.filter(
          (h) => h.zugewiesenAn === "alle" || h.zugewiesenAn === username,
        );
        setAufgaben(
          meine.map((aufgabe) => {
            const s = status.find(
              (x) => x.hausaufgabeId === aufgabe.id && x.username === username,
            );
            const gesamt = aufgabenGesamt(aufgabe);
            return {
              aufgabe,
              fortschritt: s?.fortschritt ?? 0,
              gesamt,
              erledigt: (s?.fortschritt ?? 0) >= gesamt && gesamt > 0,
              erledigtAm: s?.erledigtAm ?? null,
            };
          }),
        );
      })
      .catch(() => {
        // ohne Hausaufgaben läuft das Lernen normal weiter
      })
      .finally(() => setLaden(false));
  }, [username]);

  useEffect(neuLaden, [neuLaden]);

  // Verbucht richtige Antworten aus der Side-Quest auf eine Aufgabe.
  const zaehleFortschritt = useCallback(
    (hausaufgabeId: number, anzahl: number) => {
      if (!username || anzahl <= 0) return;
      setAufgaben((alt) =>
        alt.map((a) => {
          if (a.aufgabe.id !== hausaufgabeId || a.erledigt) return a;
          const fortschritt = Math.min(a.fortschritt + anzahl, a.gesamt);
          const erledigt = fortschritt >= a.gesamt;
          const erledigtAm = erledigt ? new Date().toISOString() : null;
          void datenquelle
            .speichereHausaufgabenStatus({
              hausaufgabeId,
              username,
              fortschritt,
              erledigtAm,
            })
            .catch(() => {});
          return { ...a, fortschritt, erledigt, erledigtAm };
        }),
      );
    },
    [username],
  );

  return { aufgaben, laden, zaehleFortschritt, neuLaden };
}
