import { useCallback, useEffect, useState } from "react";
import { datenquelle } from "../lib/datenquelle";

// Fortschritt eines Schülers durch die 6 Teile einer Lektion. Teil n ist erst
// erreichbar, wenn Teil n-1 abgeschlossen ist (feste Reihenfolge).
export function useLektionFortschritt(username: string, lektionId: string) {
  const [abgeschlosseneTeile, setAbgeschlosseneTeile] = useState<Set<number>>(new Set());
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    if (!username) return;
    let aktiv = true;
    setLaden(true);
    datenquelle
      .ladeLektionFortschritt(username)
      .then((liste) => {
        if (!aktiv) return;
        setAbgeschlosseneTeile(
          new Set(liste.filter((f) => f.lektionId === lektionId).map((f) => f.teil)),
        );
      })
      .catch(() => {
        // ohne Fortschritt startet die Lektion einfach bei Teil 1
      })
      .finally(() => {
        if (aktiv) setLaden(false);
      });
    return () => {
      aktiv = false;
    };
  }, [username, lektionId]);

  const teilAbschliessen = useCallback(
    (teil: number) => {
      setAbgeschlosseneTeile((alt) => new Set(alt).add(teil));
      void datenquelle.lektionTeilAbschliessen(username, lektionId, teil).catch(() => {});
    },
    [username, lektionId],
  );

  // Erster noch nicht abgeschlossener Teil (1..6), oder 7 wenn alles fertig.
  let aktuellerTeil = 1;
  while (aktuellerTeil <= 6 && abgeschlosseneTeile.has(aktuellerTeil)) aktuellerTeil++;

  return { abgeschlosseneTeile, aktuellerTeil, teilAbschliessen, laden };
}
