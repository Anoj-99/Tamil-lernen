import { useEffect, useMemo, useState } from "react";
import { VerbindenPaar } from "../data/lektionen";
import { baueLektionOptionen, useWiederholungBisRichtig } from "./lektionHelfer";
import { mische } from "./uebungsHelfer";
import { EffektiverBuchstabe } from "./useLektionInhalt";
import TeilVerbinden from "./TeilVerbinden";

type Richtung = "zeichen_zu_laut" | "laut_zu_zeichen";

interface EinzelFrage {
  buchstabe: EffektiverBuchstabe;
  richtung: Richtung;
}

// Wählt bis zu `anzahl` zufällige Buchstaben für die angegebene Richtung.
function waehleFragen(
  buchstaben: EffektiverBuchstabe[],
  richtung: Richtung,
  anzahl: number,
): EinzelFrage[] {
  return mische(buchstaben)
    .slice(0, Math.min(anzahl, buchstaben.length))
    .map((buchstabe) => ({ buchstabe, richtung }));
}

interface Props {
  buchstaben: EffektiverBuchstabe[];
  verbindenPaare: VerbindenPaar[];
  weiter: () => void;
}

// Teil 6: Zufallsmix aus Teil 2 (3 Fragen), Teil 3 (3 Fragen) und Teil 5
// (eine Verbinden-Runde mit 3 zufälligen Paaren). Wie die Einzelteile mit
// Sperre - Wiederholung bis alles mindestens einmal richtig war.
export default function TeilCheckpoint({ buchstaben, verbindenPaare, weiter }: Props) {
  const fragen = useMemo(
    () =>
      mische([
        ...waehleFragen(buchstaben, "zeichen_zu_laut", 3),
        ...waehleFragen(buchstaben, "laut_zu_zeichen", 3),
      ]),
    [buchstaben],
  );
  const verbindenAuswahl = useMemo(
    () => mische(verbindenPaare).slice(0, Math.min(3, verbindenPaare.length)),
    [verbindenPaare],
  );

  const { aktuell, fertig, gesamtAnzahl, nochOffen, antworten } =
    useWiederholungBisRichtig(fragen);
  const [gewaehlt, setGewaehlt] = useState<EffektiverBuchstabe | null>(null);
  const [phase, setPhase] = useState<"fragen" | "verbinden">("fragen");

  useEffect(() => {
    if (fertig) setPhase("verbinden");
  }, [fertig]);

  if (phase === "verbinden") {
    return <TeilVerbinden paare={verbindenAuswahl} weiter={weiter} />;
  }
  if (!aktuell) return null;

  const optionen = baueLektionOptionen(buchstaben, aktuell.buchstabe, (b) => b.zeichen);
  const beantwortet = gewaehlt !== null;
  const richtig = gewaehlt?.zeichen === aktuell.buchstabe.zeichen;

  const naechste = () => {
    antworten(gewaehlt!.zeichen === aktuell.buchstabe.zeichen);
    setGewaehlt(null);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm text-slate-500">
        Checkpoint: noch {nochOffen} von {gesamtAnzahl} Fragen (danach eine Verbinden-Runde)
      </p>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="mb-2 text-sm text-slate-500">
          {aktuell.richtung === "zeichen_zu_laut"
            ? "Wie wird dieses Zeichen ausgesprochen?"
            : "Welches Zeichen passt zu diesem Laut?"}
        </p>
        {aktuell.richtung === "zeichen_zu_laut" ? (
          <div className="tamil-schrift py-2 text-7xl leading-none text-slate-900 sm:text-8xl">
            {aktuell.buchstabe.zeichen}
          </div>
        ) : (
          <div className="py-4 text-5xl font-semibold text-slate-900">
            {aktuell.buchstabe.latein}
          </div>
        )}
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        {optionen.map((option) => {
          const istRichtige = option.zeichen === aktuell.buchstabe.zeichen;
          let farben = "border-slate-300 bg-white text-slate-900 hover:bg-slate-50";
          if (beantwortet && istRichtige) farben = "border-green-600 bg-green-50 text-green-800";
          else if (beantwortet && option === gewaehlt)
            farben = "border-red-600 bg-red-50 text-red-800";
          else if (beantwortet) farben = "border-slate-200 bg-white text-slate-400";

          return (
            <button
              key={option.zeichen}
              type="button"
              onClick={() => !beantwortet && setGewaehlt(option)}
              disabled={beantwortet}
              className={`rounded-xl border-2 px-3 py-4 transition-colors ${farben} ${
                aktuell.richtung === "zeichen_zu_laut"
                  ? "text-2xl font-medium"
                  : "tamil-schrift text-5xl leading-none"
              }`}
            >
              {aktuell.richtung === "zeichen_zu_laut" ? option.latein : option.zeichen}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-[3.5rem] w-full items-center justify-between gap-4">
        <p className="text-sm text-slate-600" aria-live="polite">
          {beantwortet &&
            (richtig ? (
              <span className="font-semibold text-green-700">Richtig!</span>
            ) : (
              <span className="font-semibold text-red-700">
                Leider falsch. Kommt gleich nochmal dran.
              </span>
            ))}
        </p>
        {beantwortet && (
          <button
            type="button"
            onClick={naechste}
            className="shrink-0 rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700"
          >
            Weiter
          </button>
        )}
      </div>
    </div>
  );
}
