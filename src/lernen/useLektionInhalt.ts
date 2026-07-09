import { useEffect, useMemo, useState } from "react";
import { Lektion, LektionBuchstabe } from "../data/lektionen";
import { datenquelle } from "../lib/datenquelle";
import { LektionInhaltUeberschreibung } from "../lib/typen";

export interface EffektiverBuchstabe extends LektionBuchstabe {
  vomLehrerAngepasst: boolean;
}

function anwenden(
  basis: LektionBuchstabe,
  ueberschreibung: LektionInhaltUeberschreibung | undefined,
): EffektiverBuchstabe {
  if (!ueberschreibung) return { ...basis, vomLehrerAngepasst: false };
  return {
    ...basis,
    beispielwortTamil: ueberschreibung.beispielwortTamil ?? basis.beispielwortTamil,
    beispielwortDeutsch: ueberschreibung.beispielwortDeutsch ?? basis.beispielwortDeutsch,
    bildPfad: ueberschreibung.bildUrl ?? basis.bildPfad,
    vomLehrerAngepasst: true,
  };
}

// Lektionsinhalte inkl. eventueller Lehrer-Anpassungen (Beispielwort/Bild).
export function useLektionInhalt(lektion: Lektion | undefined) {
  const [ueberschreibungen, setUeberschreibungen] = useState<
    Map<string, LektionInhaltUeberschreibung>
  >(new Map());
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    let aktiv = true;
    datenquelle
      .ladeLektionUeberschreibungen()
      .then((liste) => {
        if (!aktiv) return;
        setUeberschreibungen(new Map(liste.map((u) => [u.zeichen, u])));
      })
      .catch(() => {
        // ohne Anpassungen gelten die Standardinhalte
      })
      .finally(() => {
        if (aktiv) setLaden(false);
      });
    return () => {
      aktiv = false;
    };
  }, []);

  // Referenzstabil halten, solange sich Lektion/Anpassungen nicht ändern -
  // Teil-Komponenten hängen ihre Übungswarteschlangen an diese Referenz.
  const buchstaben = useMemo<EffektiverBuchstabe[]>(
    () => lektion?.buchstaben.map((b) => anwenden(b, ueberschreibungen.get(b.zeichen))) ?? [],
    [lektion, ueberschreibungen],
  );

  return { buchstaben, laden };
}
