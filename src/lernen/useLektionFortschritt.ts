import { useCallback, useEffect, useState } from "react";
import { Stufe } from "../data/lektionen";
import { datenquelle } from "../lib/datenquelle";
import { LektionFortschritt } from "../lib/typen";

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

// Ist die ganze Stufe (über alle ihre Lektionen hinweg) fertig, d.h. jede
// Lektion hat Teil 6 abgeschlossen? Für die aktuell offene Lektion wird der
// lokal bereits bekannte Stand verwendet (kein Race mit dem gerade erst
// losgeschickten Speichern), für andere Lektionen der Stufe der geladene.
export function useStufeAbgeschlossen(
  username: string,
  stufe: Stufe | undefined,
  aktuelleLektionId: string,
  aktuelleLektionFertig: boolean,
): boolean {
  const [fortschritt, setFortschritt] = useState<LektionFortschritt[]>([]);

  useEffect(() => {
    if (!username || !stufe) return;
    let aktiv = true;
    datenquelle
      .ladeLektionFortschritt(username)
      .then((liste) => {
        if (aktiv) setFortschritt(liste);
      })
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, [username, stufe]);

  if (!stufe) return false;
  return stufe.lektionIds.every((id) =>
    id === aktuelleLektionId
      ? aktuelleLektionFertig
      : fortschritt.some((f) => f.lektionId === id && f.teil === 6),
  );
}
