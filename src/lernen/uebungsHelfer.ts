import { useEffect, useState } from "react";

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
