import { useCallback, useEffect, useState } from "react";
import { Konsonant, konsonanten } from "../data/tamilSchrift";
import { datenquelle } from "../lib/datenquelle";
import { RegelEintrag } from "../lib/typen";

export function standardRegel(k: Konsonant): RegelEintrag {
  return {
    buchstabe: k.grundform,
    positionWert: k.position,
    positionHinweis: k.positionHinweis,
    vomLehrerAngepasst: false,
  };
}

function standardRegeln(): Map<string, RegelEintrag> {
  return new Map(konsonanten.map((k) => [k.grundform, standardRegel(k)]));
}

// Effektive Positionsregeln: Standardwerte laut Lehr-PDF, überlagert von
// eventuellen Lehrer-Anpassungen aus der Datenbank.
export function useRegeln() {
  const [regeln, setRegeln] = useState<Map<string, RegelEintrag>>(standardRegeln);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    let aktiv = true;
    datenquelle
      .ladeRegeln()
      .then((gespeicherte) => {
        if (!aktiv) return;
        setRegeln(() => {
          const neu = standardRegeln();
          for (const eintrag of gespeicherte) {
            if (neu.has(eintrag.buchstabe)) neu.set(eintrag.buchstabe, eintrag);
          }
          return neu;
        });
      })
      .catch(() => {
        // Bei Ladefehlern gelten die Standardregeln.
      })
      .finally(() => {
        if (aktiv) setLaden(false);
      });
    return () => {
      aktiv = false;
    };
  }, []);

  const aktualisiere = useCallback(async (eintrag: RegelEintrag) => {
    const angepasst = { ...eintrag, vomLehrerAngepasst: true };
    await datenquelle.speichereRegel(angepasst);
    setRegeln((alt) => {
      const neu = new Map(alt);
      neu.set(angepasst.buchstabe, angepasst);
      return neu;
    });
  }, []);

  const zuruecksetzen = useCallback(async (buchstabe: string) => {
    await datenquelle.loescheRegel(buchstabe);
    const standard = konsonanten.find((k) => k.grundform === buchstabe);
    if (!standard) return;
    setRegeln((alt) => {
      const neu = new Map(alt);
      neu.set(buchstabe, standardRegel(standard));
      return neu;
    });
  }, []);

  return { regeln, laden, aktualisiere, zuruecksetzen };
}
