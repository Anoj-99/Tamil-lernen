import { useState } from "react";
import { EffektiverBuchstabe } from "./useLektionInhalt";
import { sprachausgabeVerfuegbar, sprichBuchstabeUndWort } from "./sprache";

interface Props {
  buchstaben: EffektiverBuchstabe[];
  weiter: () => void;
}

// Hebt das Zielzeichen im Beispielwort fett hervor (erstes Vorkommen).
function BeispielwortFett({ wort, zeichen }: { wort: string; zeichen: string }) {
  const index = wort.indexOf(zeichen);
  if (index === -1) return <>{wort}</>;
  return (
    <>
      {wort.slice(0, index)}
      <strong>{wort.slice(index, index + zeichen.length)}</strong>
      {wort.slice(index + zeichen.length)}
    </>
  );
}

// Teil 1: Buchstabe + Laut groß, Bild + Beispielwort darunter, optional Audio.
export default function TeilVorstellung({ buchstaben, weiter }: Props) {
  const [index, setIndex] = useState(0);
  const aktuell = buchstaben[index];
  if (!aktuell) return null;

  const letzter = index === buchstaben.length - 1;

  const weiterKlick = () => {
    if (letzter) {
      weiter();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm text-slate-500">
        Buchstabe {index + 1} von {buchstaben.length}
      </p>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div className="tamil-schrift text-7xl font-bold leading-none text-slate-900 sm:text-8xl">
          {aktuell.zeichen}
        </div>
        <p className="mt-2 text-2xl font-semibold text-slate-700">{aktuell.latein}</p>

        <div className="mx-auto mt-5 h-40 w-40 overflow-hidden rounded-xl bg-slate-50">
          <img
            src={aktuell.bildPfad}
            alt={aktuell.beispielwortDeutsch}
            className="h-full w-full object-contain"
          />
        </div>

        <p className="tamil-schrift mt-4 text-3xl text-slate-900">
          <BeispielwortFett wort={aktuell.beispielwortTamil} zeichen={aktuell.zeichen} />
        </p>
        <p className="text-slate-500">({aktuell.beispielwortDeutsch})</p>

        {sprachausgabeVerfuegbar && (
          <button
            type="button"
            onClick={() => sprichBuchstabeUndWort(aktuell.zeichen, aktuell.beispielwortTamil)}
            aria-label="Aussprache anhören"
            className="mt-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl hover:bg-slate-50"
          >
            🔊
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={weiterKlick}
        className="rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700"
      >
        {letzter ? "Weiter zu Teil 2" : "Nächster Buchstabe"}
      </button>
    </div>
  );
}
