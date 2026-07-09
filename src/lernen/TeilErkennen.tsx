import { EffektiverBuchstabe } from "./useLektionInhalt";
import { baueLektionOptionen, useWiederholungBisRichtig } from "./lektionHelfer";
import { useEffect, useState } from "react";

type Richtung = "zeichen_zu_laut" | "laut_zu_zeichen";

interface Props {
  buchstaben: EffektiverBuchstabe[];
  richtung: Richtung;
  weiter: () => void;
}

// Teil 2/3: Multiple Choice in eine feste Richtung, mit Sperre - erst wenn
// jeder Buchstabe mindestens einmal richtig beantwortet wurde, geht es weiter.
export default function TeilErkennen({ buchstaben, richtung, weiter }: Props) {
  const { aktuell, fertig, gesamtAnzahl, nochOffen, antworten } =
    useWiederholungBisRichtig(buchstaben);
  const [gewaehlt, setGewaehlt] = useState<EffektiverBuchstabe | null>(null);

  useEffect(() => {
    if (fertig) weiter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fertig]);

  if (fertig || !aktuell) return null;

  const optionen = baueLektionOptionen(buchstaben, aktuell, (b) => b.zeichen);
  const beantwortet = gewaehlt !== null;
  const richtig = gewaehlt?.zeichen === aktuell.zeichen;

  const waehlen = (option: EffektiverBuchstabe) => {
    if (beantwortet) return;
    setGewaehlt(option);
  };

  const naechste = () => {
    antworten(gewaehlt!.zeichen === aktuell.zeichen);
    setGewaehlt(null);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm text-slate-500">
        Noch {nochOffen} von {gesamtAnzahl} zu meistern
      </p>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="mb-2 text-sm text-slate-500">
          {richtung === "zeichen_zu_laut"
            ? "Wie wird dieses Zeichen ausgesprochen?"
            : "Welches Zeichen passt zu diesem Laut?"}
        </p>
        {richtung === "zeichen_zu_laut" ? (
          <div className="tamil-schrift py-2 text-7xl leading-none text-slate-900 sm:text-8xl">
            {aktuell.zeichen}
          </div>
        ) : (
          <div className="py-4 text-5xl font-semibold text-slate-900">{aktuell.latein}</div>
        )}
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        {optionen.map((option) => {
          const istRichtige = option.zeichen === aktuell.zeichen;
          let farben = "border-slate-300 bg-white text-slate-900 hover:bg-slate-50";
          if (beantwortet && istRichtige) farben = "border-green-600 bg-green-50 text-green-800";
          else if (beantwortet && option === gewaehlt)
            farben = "border-red-600 bg-red-50 text-red-800";
          else if (beantwortet) farben = "border-slate-200 bg-white text-slate-400";

          return (
            <button
              key={option.zeichen}
              type="button"
              onClick={() => waehlen(option)}
              disabled={beantwortet}
              className={`rounded-xl border-2 px-3 py-4 transition-colors ${farben} ${
                richtung === "zeichen_zu_laut"
                  ? "text-2xl font-medium"
                  : "tamil-schrift text-5xl leading-none"
              }`}
            >
              {richtung === "zeichen_zu_laut" ? option.latein : option.zeichen}
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
