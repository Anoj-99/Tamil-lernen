import { useEffect, useRef, useState } from "react";

export type Reihenfolge = "zufaellig" | "der_reihe_nach";

export function mische<T>(liste: T[]): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

// Liefert die Übungsfolge über eine Liste von Elementen. Bei "zufaellig" wird
// einmal gemischt und ohne Wiederholung durchlaufen; am Ende wird neu gemischt.
export function useUebungsfolge<T>(elemente: T[], reihenfolge: Reihenfolge) {
  const sortiere = (liste: T[]) =>
    reihenfolge === "zufaellig" ? mische(liste) : liste;

  const [folge, setFolge] = useState<T[]>(() => sortiere(elemente));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setFolge(reihenfolge === "zufaellig" ? mische(elemente) : elemente);
    setIndex(0);
  }, [elemente, reihenfolge]);

  const weiter = () => {
    if (index + 1 >= folge.length) {
      setFolge(sortiere(elemente));
      setIndex(0);
    } else {
      setIndex(index + 1);
    }
  };

  return {
    aktuell: folge[index] as T | undefined,
    weiter,
    nummer: index + 1,
    gesamt: folge.length,
  };
}

// Gewichtete Zufallswahl eines Index (Gewicht 0 = ausgeschlossen).
export function gewichteteWahl<T>(
  elemente: T[],
  gewichtFuer: (element: T) => number,
  ausserIndex?: number,
): number {
  let summe = 0;
  const gewichte = elemente.map((element, i) => {
    const g = i === ausserIndex ? 0 : Math.max(gewichtFuer(element), 0);
    summe += g;
    return g;
  });
  if (summe <= 0) return Math.max(elemente.length - 1, 0);
  let rest = Math.random() * summe;
  for (let i = 0; i < gewichte.length; i++) {
    rest -= gewichte[i];
    if (rest <= 0) return i;
  }
  return elemente.length - 1;
}

// Wie useUebungsfolge, aber bei "zufaellig" wird gewichtet gezogen
// (Leitner: schwache Zeichen kommen häufiger dran). Das Gewicht wird über
// eine Ref gelesen, damit sich die Frage nicht ändert, wenn sich die
// Gewichte nach einer Antwort ändern.
export function useGewichteteFolge<T>(
  elemente: T[],
  reihenfolge: Reihenfolge,
  gewichtFuer: (element: T) => number,
) {
  const gewichtRef = useRef(gewichtFuer);
  gewichtRef.current = gewichtFuer;

  const [index, setIndex] = useState(() =>
    reihenfolge === "zufaellig" ? gewichteteWahl(elemente, gewichtFuer) : 0,
  );

  useEffect(() => {
    setIndex(
      reihenfolge === "zufaellig"
        ? gewichteteWahl(elemente, gewichtRef.current)
        : 0,
    );
  }, [elemente, reihenfolge]);

  const weiter = () => {
    if (elemente.length === 0) return;
    if (reihenfolge === "der_reihe_nach") {
      setIndex((i) => (i + 1) % elemente.length);
    } else {
      setIndex((i) => gewichteteWahl(elemente, gewichtRef.current, i));
    }
  };

  return {
    aktuell: elemente[index] as T | undefined,
    weiter,
  };
}
