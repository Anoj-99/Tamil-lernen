import { useCallback, useEffect, useState } from "react";
import { datenquelle } from "../lib/datenquelle";
import { Hausaufgabe } from "../lib/typen";

export interface MeineAufgabe {
  aufgabe: Hausaufgabe;
  fortschritt: number;
  erledigt: boolean;
}

// Hausaufgaben des angemeldeten Schülers ("alle" oder direkt zugewiesen)
// samt eigenem Bearbeitungsstand. zaehleUebung() zählt eine beantwortete
// Frage auf alle offenen Aufgaben der passenden Übungsgruppe.
export function useHausaufgaben(username: string) {
  const [aufgaben, setAufgaben] = useState<MeineAufgabe[]>([]);

  useEffect(() => {
    if (!username) return;
    let aktiv = true;
    Promise.all([datenquelle.ladeHausaufgaben(), datenquelle.ladeHausaufgabenStatus()])
      .then(([alle, status]) => {
        if (!aktiv) return;
        const meine = alle.filter(
          (h) => h.zugewiesenAn === "alle" || h.zugewiesenAn === username,
        );
        setAufgaben(
          meine.map((aufgabe) => {
            const s = status.find(
              (x) => x.hausaufgabeId === aufgabe.id && x.username === username,
            );
            return {
              aufgabe,
              fortschritt: s?.fortschritt ?? 0,
              erledigt: (s?.fortschritt ?? 0) >= aufgabe.sollAnzahl,
            };
          }),
        );
      })
      .catch(() => {
        // ohne Hausaufgaben läuft das Üben normal weiter
      });
    return () => {
      aktiv = false;
    };
  }, [username]);

  const zaehleUebung = useCallback(
    (gruppeId: string) => {
      if (!username) return;
      setAufgaben((alt) =>
        alt.map((a) => {
          if (a.aufgabe.gruppeId !== gruppeId || a.erledigt) return a;
          const fortschritt = a.fortschritt + 1;
          const erledigt = fortschritt >= a.aufgabe.sollAnzahl;
          void datenquelle
            .speichereHausaufgabenStatus({
              hausaufgabeId: a.aufgabe.id,
              username,
              fortschritt,
              erledigtAm: erledigt ? new Date().toISOString() : null,
            })
            .catch(() => {});
          return { ...a, fortschritt, erledigt };
        }),
      );
    },
    [username],
  );

  return { aufgaben, zaehleUebung };
}
