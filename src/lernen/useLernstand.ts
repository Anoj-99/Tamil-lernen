import { useCallback, useEffect, useState } from "react";
import { datenquelle } from "../lib/datenquelle";
import { neuesFach } from "../lib/punkteLogik";
import { FehlerEintrag, LeitnerEintrag } from "../lib/typen";

export function leitnerSchluessel(modus: string, zeichen: string): string {
  return `${modus}:${zeichen}`;
}

// Leitner-Fächer und Fehlerverlauf des angemeldeten Benutzers.
export function useLernstand(username: string) {
  const [leitner, setLeitner] = useState<Map<string, LeitnerEintrag>>(new Map());

  useEffect(() => {
    let aktiv = true;
    setLeitner(new Map());
    datenquelle
      .ladeLeitner(username)
      .then((eintraege) => {
        if (!aktiv) return;
        setLeitner(
          new Map(eintraege.map((e) => [leitnerSchluessel(e.modus, e.zeichen), e])),
        );
      })
      .catch(() => {
        // ohne Lernstand geht das Üben trotzdem
      });
    return () => {
      aktiv = false;
    };
  }, [username]);

  const verbucheAntwort = useCallback(
    (modus: "erkennen" | "position", zeichen: string, richtig: boolean) => {
      setLeitner((alt) => {
        const schluessel = leitnerSchluessel(modus, zeichen);
        const bisher = alt.get(schluessel);
        const eintrag: LeitnerEintrag = {
          zeichen,
          modus,
          fach: neuesFach(bisher?.fach, richtig),
          richtigGesamt: (bisher?.richtigGesamt ?? 0) + (richtig ? 1 : 0),
          falschGesamt: (bisher?.falschGesamt ?? 0) + (richtig ? 0 : 1),
        };
        void datenquelle.speichereLeitner(username, eintrag).catch(() => {});
        const neu = new Map(alt);
        neu.set(schluessel, eintrag);
        return neu;
      });
    },
    [username],
  );

  const logFehler = useCallback(
    (
      modus: FehlerEintrag["modus"],
      zeichen: string,
      richtigeAntwort: string,
      gegebeneAntwort: string,
    ) => {
      void datenquelle
        .logFehler({
          username,
          zeichen,
          modus,
          richtigeAntwort,
          gegebeneAntwort,
          zeitpunkt: new Date().toISOString(),
        })
        .catch(() => {});
    },
    [username],
  );

  return { leitner, verbucheAntwort, logFehler };
}
