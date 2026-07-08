import { useMemo, useState } from "react";
import { GruppenId, Kombination } from "../data/tamilSchrift";
import { EP_WERTE, gewichtFuerFach } from "../lib/punkteLogik";
import { useKonto } from "./KontoContext";
import { mische, Reihenfolge, useGewichteteFolge } from "./uebungsHelfer";
import { useHausaufgaben } from "./useHausaufgaben";
import { leitnerSchluessel, useLernstand } from "./useLernstand";

type Richtung = "tamil_zu_latein" | "latein_zu_tamil";

export function baueOptionen(alle: Kombination[], richtige: Kombination): Kombination[] {
  const kandidaten = alle.filter((k) => k.kombination !== richtige.kombination);
  // Bevorzugt Verwechslungskandidaten: gleicher Konsonant oder gleicher Vokal.
  const aehnlich = kandidaten.filter(
    (k) => k.konsonant === richtige.konsonant || k.vokal === richtige.vokal,
  );
  const uebrige = kandidaten.filter(
    (k) => k.konsonant !== richtige.konsonant && k.vokal !== richtige.vokal,
  );
  const pool = [...mische(aehnlich), ...mische(uebrige)];

  const optionen = [richtige];
  for (const k of pool) {
    if (optionen.length === 4) break;
    const doppelt = optionen.some(
      (o) =>
        o.kombination === k.kombination ||
        o.ausspracheLatein === k.ausspracheLatein,
    );
    if (!doppelt) optionen.push(k);
  }
  return mische(optionen);
}

interface Props {
  gruppenId: GruppenId;
  kombinationen: Kombination[];
  reihenfolge: Reihenfolge;
}

export default function ErkennenModus({ gruppenId, kombinationen, reihenfolge }: Props) {
  const { konto, belohne } = useKonto();
  const { leitner, verbucheAntwort, logFehler } = useLernstand(konto?.username ?? "");
  const { zaehleUebung } = useHausaufgaben(konto?.username ?? "");
  const { aktuell, weiter } = useGewichteteFolge(kombinationen, reihenfolge, (k) =>
    gewichtFuerFach(leitner.get(leitnerSchluessel("erkennen", k.kombination))?.fach),
  );
  const [richtung, setRichtung] = useState<Richtung>("tamil_zu_latein");
  const [gewaehlt, setGewaehlt] = useState<Kombination | null>(null);
  const [punkte, setPunkte] = useState({ richtig: 0, gesamt: 0 });

  const optionen = useMemo(
    () => (aktuell ? baueOptionen(kombinationen, aktuell) : []),
    [kombinationen, aktuell],
  );

  if (!aktuell) return null;

  const beantwortet = gewaehlt !== null;
  const warRichtig = gewaehlt?.kombination === aktuell.kombination;

  const antworten = (option: Kombination) => {
    if (beantwortet) return;
    const richtig = option.kombination === aktuell.kombination;
    setGewaehlt(option);
    setPunkte((p) => ({
      richtig: p.richtig + (richtig ? 1 : 0),
      gesamt: p.gesamt + 1,
    }));
    verbucheAntwort("erkennen", aktuell.kombination, richtig);
    zaehleUebung(gruppenId);
    if (richtig) {
      belohne(EP_WERTE.erkennenRichtig);
    } else {
      logFehler(
        "erkennen",
        aktuell.kombination,
        richtung === "tamil_zu_latein" ? aktuell.ausspracheLatein : aktuell.kombination,
        richtung === "tamil_zu_latein" ? option.ausspracheLatein : option.kombination,
      );
    }
  };

  const naechsteFrage = () => {
    setGewaehlt(null);
    weiter();
  };

  const umschalten = (r: Richtung) => {
    setRichtung(r);
    setGewaehlt(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => umschalten("tamil_zu_latein")}
          className={`rounded-lg border px-3 py-2 text-sm ${
            richtung === "tamil_zu_latein"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700"
          }`}
        >
          Tamil → Aussprache
        </button>
        <button
          type="button"
          onClick={() => umschalten("latein_zu_tamil")}
          className={`rounded-lg border px-3 py-2 text-sm ${
            richtung === "latein_zu_tamil"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700"
          }`}
        >
          Aussprache → Tamil
        </button>
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="mb-2 text-sm text-slate-500">
          {richtung === "tamil_zu_latein"
            ? "Wie wird dieses Zeichen ausgesprochen?"
            : "Welches Zeichen passt zu dieser Aussprache?"}
        </p>
        {richtung === "tamil_zu_latein" ? (
          <div className="tamil-schrift py-2 text-7xl leading-none text-slate-900 sm:text-8xl">
            {aktuell.kombination}
          </div>
        ) : (
          <div className="py-4 text-5xl font-semibold text-slate-900 sm:text-6xl">
            {aktuell.ausspracheLatein}
          </div>
        )}
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        {optionen.map((option) => {
          const istRichtige = option.kombination === aktuell.kombination;
          let farben = "border-slate-300 bg-white text-slate-900 hover:bg-slate-50";
          if (beantwortet && istRichtige) {
            farben = "border-green-600 bg-green-50 text-green-800";
          } else if (beantwortet && option === gewaehlt) {
            farben = "border-red-600 bg-red-50 text-red-800";
          } else if (beantwortet) {
            farben = "border-slate-200 bg-white text-slate-400";
          }
          return (
            <button
              key={option.kombination}
              type="button"
              onClick={() => antworten(option)}
              disabled={beantwortet}
              className={`rounded-xl border-2 px-3 py-4 transition-colors ${farben} ${
                richtung === "tamil_zu_latein"
                  ? "text-2xl font-medium"
                  : "tamil-schrift text-5xl leading-none"
              }`}
            >
              {richtung === "tamil_zu_latein"
                ? option.ausspracheLatein
                : option.kombination}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-[3.5rem] w-full items-center justify-between gap-4">
        <p className="text-sm text-slate-600" aria-live="polite">
          {beantwortet &&
            (warRichtig ? (
              <span className="font-semibold text-green-700">
                Richtig! +{EP_WERTE.erkennenRichtig} EP
              </span>
            ) : (
              <span className="font-semibold text-red-700">
                Leider falsch.{" "}
                <span className="tamil-schrift">{aktuell.kombination}</span> ={" "}
                {aktuell.ausspracheLatein}
              </span>
            ))}
        </p>
        {beantwortet && (
          <button
            type="button"
            onClick={naechsteFrage}
            className="shrink-0 rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700"
          >
            Nächste Frage
          </button>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Diese Session: {punkte.richtig} von {punkte.gesamt} richtig
      </p>
    </div>
  );
}
