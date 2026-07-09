import { useEffect, useRef, useState } from "react";
import { mische } from "./uebungsHelfer";

// Zieht Elemente aus einem Vorrat, bis jedes mindestens einmal richtig
// beantwortet wurde. Falsch beantwortete Elemente wandern ans Ende der
// Warteschlange zurück statt zu verschwinden - "Wiederholung bis richtig".
// Hinweis: Der Aufrufer sollte bei wechselndem Inhalt (z.B. andere Lektion)
// eine neue Komponenteninstanz per `key`-Prop erzwingen, statt sich auf das
// Neuerkennen der `elemente`-Referenz zu verlassen.
export function useWiederholungBisRichtig<T>(elemente: T[]) {
  const [warteschlange, setWarteschlange] = useState<T[]>(() => mische(elemente));
  const gesamtRef = useRef(elemente.length);

  useEffect(() => {
    setWarteschlange(mische(elemente));
    gesamtRef.current = elemente.length;
  }, [elemente]);

  const aktuell = warteschlange[0];

  const antworten = (richtig: boolean) => {
    setWarteschlange((alt) => {
      if (alt.length === 0) return alt;
      const [erstes, ...rest] = alt;
      return richtig ? rest : [...rest, erstes];
    });
  };

  return {
    aktuell,
    fertig: warteschlange.length === 0,
    gesamtAnzahl: gesamtRef.current,
    nochOffen: warteschlange.length,
    antworten,
  };
}

// Baut 4 Multiple-Choice-Optionen (1 richtige + 3 aus dem übrigen Vorrat).
export function baueLektionOptionen<T>(
  alle: T[],
  richtige: T,
  schluessel: (t: T) => string,
): T[] {
  const uebrige = mische(alle.filter((t) => schluessel(t) !== schluessel(richtige)));
  return mische([richtige, ...uebrige.slice(0, 3)]);
}

// Mischt eine Liste so, dass (wenn möglich) kein Element auf seiner
// ursprünglichen Position bleibt - für Teil 5 "Verbinden", damit die rechte
// Spalte nie auf gleicher Höhe wie ihr passendes Element in der linken steht.
export function mischeOhneGleicheReihe<T>(elemente: T[]): T[] {
  if (elemente.length < 2) return [...elemente];
  for (let versuch = 0; versuch < 20; versuch++) {
    const kandidat = mische(elemente);
    if (kandidat.every((e, i) => e !== elemente[i])) return kandidat;
  }
  // Fallback, der immer eine Verschiebung garantiert: zyklische Rotation.
  return [...elemente.slice(1), elemente[0]];
}
