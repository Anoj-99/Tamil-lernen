import { useMemo, useState } from "react";
import {
  erlaubtePositionen,
  konsonanten,
  KonsonantTyp,
  positionsErklaerung,
  WortPosition,
} from "../data/tamilSchrift";
import { Reihenfolge, useUebungsfolge } from "./uebungsHelfer";

const POSITIONEN: { wert: WortPosition; name: string }[] = [
  { wert: "anfang", name: "Anfang" },
  { wert: "mitte", name: "Mitte" },
  { wert: "ende", name: "Ende" },
];

interface Props {
  initialTyp: KonsonantTyp;
  reihenfolge: Reihenfolge;
}

export default function PositionCheckModus({ initialTyp, reihenfolge }: Props) {
  const [typ, setTyp] = useState<KonsonantTyp>(initialTyp);
  const auswahlPool = useMemo(
    () => konsonanten.filter((k) => k.typ === typ),
    [typ],
  );
  const { aktuell, weiter } = useUebungsfolge(auswahlPool, reihenfolge);
  const [gewaehlt, setGewaehlt] = useState<Set<WortPosition>>(new Set());
  const [geprueft, setGeprueft] = useState(false);
  const [punkte, setPunkte] = useState({ richtig: 0, gesamt: 0 });

  if (!aktuell) return null;

  const richtige = erlaubtePositionen(aktuell.position);
  const warRichtig =
    geprueft &&
    richtige.length === gewaehlt.size &&
    richtige.every((p) => gewaehlt.has(p));

  const umschaltenPosition = (p: WortPosition) => {
    if (geprueft) return;
    setGewaehlt((alt) => {
      const neu = new Set(alt);
      if (neu.has(p)) neu.delete(p);
      else neu.add(p);
      return neu;
    });
  };

  const pruefen = () => {
    if (gewaehlt.size === 0 || geprueft) return;
    const korrekt =
      richtige.length === gewaehlt.size && richtige.every((p) => gewaehlt.has(p));
    setPunkte((alt) => ({
      richtig: alt.richtig + (korrekt ? 1 : 0),
      gesamt: alt.gesamt + 1,
    }));
    setGeprueft(true);
  };

  const naechster = () => {
    setGewaehlt(new Set());
    setGeprueft(false);
    weiter();
  };

  const gruppeWechseln = (neuerTyp: KonsonantTyp) => {
    setTyp(neuerTyp);
    setGewaehlt(new Set());
    setGeprueft(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {(["vallinam", "mellinam"] as KonsonantTyp[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => gruppeWechseln(t)}
            className={`rounded-lg border px-3 py-2 text-sm capitalize ${
              typ === t
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {t === "vallinam" ? "Vallinam (hart)" : "Mellinam (weich)"}
          </button>
        ))}
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="mb-2 text-sm text-slate-500">
          An welchen Positionen darf dieser Buchstabe in einem Wort stehen?
          (Mehrfachauswahl möglich)
        </p>
        <div className="tamil-schrift py-2 text-7xl leading-none text-slate-900 sm:text-8xl">
          {aktuell.grundform}
        </div>
        <p className="text-sm text-slate-500">{aktuell.lautDeutsch}</p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        {POSITIONEN.map(({ wert, name }) => {
          const istGewaehlt = gewaehlt.has(wert);
          const istRichtig = richtige.includes(wert);
          let farben = istGewaehlt
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
          if (geprueft) {
            if (istRichtig) {
              farben = "border-green-600 bg-green-50 text-green-800";
            } else if (istGewaehlt) {
              farben = "border-red-600 bg-red-50 text-red-800";
            } else {
              farben = "border-slate-200 bg-white text-slate-400";
            }
          }
          return (
            <button
              key={wert}
              type="button"
              onClick={() => umschaltenPosition(wert)}
              disabled={geprueft}
              className={`rounded-xl border-2 px-3 py-4 text-lg font-medium transition-colors ${farben}`}
            >
              {name}
              {geprueft && istRichtig && " ✓"}
            </button>
          );
        })}
      </div>

      {!geprueft ? (
        <button
          type="button"
          onClick={pruefen}
          disabled={gewaehlt.size === 0}
          className="rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Prüfen
        </button>
      ) : (
        <div className="flex w-full flex-col items-center gap-3">
          <div
            className={`w-full rounded-xl border p-4 text-sm ${
              warRichtig
                ? "border-green-300 bg-green-50 text-green-900"
                : "border-red-300 bg-red-50 text-red-900"
            }`}
            aria-live="polite"
          >
            <p className="font-semibold">
              {warRichtig ? "Richtig!" : "Leider falsch."}
            </p>
            <p className="mt-1">{positionsErklaerung(aktuell)}</p>
            {aktuell.positionHinweis && (
              <p className="mt-1 font-medium">
                Hinweis: {aktuell.positionHinweis}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={naechster}
            className="rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700"
          >
            Nächster Buchstabe
          </button>
        </div>
      )}

      <p className="text-sm text-slate-500">
        Diese Session: {punkte.richtig} von {punkte.gesamt} richtig
      </p>
    </div>
  );
}
