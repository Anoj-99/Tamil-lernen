import { useEffect, useMemo, useRef, useState } from "react";
import {
  erlaubtePositionen,
  Konsonant,
  konsonanten,
  Kombination,
  uebungsgruppen,
  WortPosition,
} from "../data/tamilSchrift";
import { datenquelle } from "../lib/datenquelle";
import { EP_WERTE, istPruefungsreif, PRUEFUNG } from "../lib/punkteLogik";
import { PruefungsErgebnis, RegelEintrag } from "../lib/typen";
import { baueOptionen } from "./ErkennenModus";
import { formatiereZeitpunkt } from "./FortschrittSeite";
import { useKonto } from "./KontoContext";
import { mische } from "./uebungsHelfer";
import { useLernstand } from "./useLernstand";

const POSITIONEN: { wert: WortPosition; name: string }[] = [
  { wert: "anfang", name: "Anfang" },
  { wert: "mitte", name: "Mitte" },
  { wert: "ende", name: "Ende" },
];

type Frage =
  | {
      art: "erkennen";
      richtung: "tamil_zu_latein" | "latein_zu_tamil";
      kombination: Kombination;
      optionen: Kombination[];
    }
  | { art: "position"; konsonant: Konsonant; richtige: WortPosition[] };

interface FalscheAntwort {
  zeichen: string;
  richtig: string;
  gegeben: string;
}

function baueFragen(regeln: Map<string, RegelEintrag>): Frage[] {
  const alleKombinationen = uebungsgruppen.flatMap((g) => g.kombinationen);
  const fragen: Frage[] = [];
  // ~30 % Position-Fragen, Rest Erkennen in zufälliger Richtung.
  const positionAnzahl = Math.round(PRUEFUNG.fragen * 0.3);
  const positionPool = mische(konsonanten);
  for (let i = 0; i < positionAnzahl; i++) {
    const konsonant = positionPool[i % positionPool.length];
    const wert =
      regeln.get(konsonant.grundform)?.positionWert ?? konsonant.position;
    fragen.push({ art: "position", konsonant, richtige: erlaubtePositionen(wert) });
  }
  const erkennenPool = mische(alleKombinationen);
  for (let i = 0; fragen.length < PRUEFUNG.fragen; i++) {
    const kombination = erkennenPool[i % erkennenPool.length];
    fragen.push({
      art: "erkennen",
      richtung: Math.random() < 0.5 ? "tamil_zu_latein" : "latein_zu_tamil",
      kombination,
      optionen: baueOptionen(alleKombinationen, kombination),
    });
  }
  return mische(fragen);
}

interface Props {
  regeln: Map<string, RegelEintrag>;
}

export default function PruefungModus({ regeln }: Props) {
  const { konto, belohne } = useKonto();
  const { verbucheAntwort, logFehler } = useLernstand(konto?.username ?? "");

  const [phase, setPhase] = useState<"start" | "laufend" | "ergebnis">("start");
  const [fragen, setFragen] = useState<Frage[]>([]);
  const [index, setIndex] = useState(0);
  const [falsche, setFalsche] = useState<FalscheAntwort[]>([]);
  const [historie, setHistorie] = useState<PruefungsErgebnis[]>([]);

  // Zwischenzustand der aktuellen Frage
  const [gewaehlteOption, setGewaehlteOption] = useState<Kombination | null>(null);
  const [gewaehltePositionen, setGewaehltePositionen] = useState<Set<WortPosition>>(
    new Set(),
  );
  const [positionGeprueft, setPositionGeprueft] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ladeHistorie = useMemo(
    () => () => {
      if (!konto) return;
      datenquelle
        .ladePruefungen(konto.username, 10)
        .then(setHistorie)
        .catch(() => {});
    },
    [konto],
  );

  useEffect(() => {
    ladeHistorie();
  }, [ladeHistorie]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  if (!konto) return null;

  const starten = () => {
    setFragen(baueFragen(regeln));
    setIndex(0);
    setFalsche([]);
    setGewaehlteOption(null);
    setGewaehltePositionen(new Set());
    setPositionGeprueft(false);
    setPhase("laufend");
  };

  const abschliessen = (alleFalschen: FalscheAntwort[]) => {
    const bestanden = alleFalschen.length <= PRUEFUNG.maxFehler;
    if (bestanden) belohne(EP_WERTE.pruefungBestanden);
    void datenquelle
      .pruefungSpeichern({
        username: konto.username,
        fragenGesamt: PRUEFUNG.fragen,
        fehler: alleFalschen.length,
        bestanden,
        zeitpunkt: new Date().toISOString(),
      })
      .then(ladeHistorie)
      .catch(() => {});
    setPhase("ergebnis");
  };

  const weiterNach = (verzoegerung: number, neueFalsche: FalscheAntwort[]) => {
    timerRef.current = setTimeout(() => {
      if (index + 1 >= fragen.length) {
        abschliessen(neueFalsche);
      } else {
        setIndex(index + 1);
        setGewaehlteOption(null);
        setGewaehltePositionen(new Set());
        setPositionGeprueft(false);
      }
    }, verzoegerung);
  };

  const frage = fragen[index];

  const beantworteErkennen = (option: Kombination) => {
    if (frage?.art !== "erkennen" || gewaehlteOption) return;
    setGewaehlteOption(option);
    const richtig = option.kombination === frage.kombination.kombination;
    verbucheAntwort("erkennen", frage.kombination.kombination, richtig);
    let neueFalsche = falsche;
    if (!richtig) {
      const eintrag: FalscheAntwort = {
        zeichen: frage.kombination.kombination,
        richtig:
          frage.richtung === "tamil_zu_latein"
            ? frage.kombination.ausspracheLatein
            : frage.kombination.kombination,
        gegeben:
          frage.richtung === "tamil_zu_latein"
            ? option.ausspracheLatein
            : option.kombination,
      };
      neueFalsche = [...falsche, eintrag];
      setFalsche(neueFalsche);
      logFehler("pruefung", eintrag.zeichen, eintrag.richtig, eintrag.gegeben);
    }
    weiterNach(900, neueFalsche);
  };

  const pruefePosition = () => {
    if (frage?.art !== "position" || positionGeprueft || gewaehltePositionen.size === 0)
      return;
    setPositionGeprueft(true);
    const korrekt =
      frage.richtige.length === gewaehltePositionen.size &&
      frage.richtige.every((p) => gewaehltePositionen.has(p));
    verbucheAntwort("position", frage.konsonant.grundform, korrekt);
    let neueFalsche = falsche;
    if (!korrekt) {
      const namen = (liste: WortPosition[]) =>
        POSITIONEN.filter((p) => liste.includes(p.wert))
          .map((p) => p.name)
          .join(", ");
      const eintrag: FalscheAntwort = {
        zeichen: frage.konsonant.grundform,
        richtig: namen(frage.richtige),
        gegeben: namen([...gewaehltePositionen]),
      };
      neueFalsche = [...falsche, eintrag];
      setFalsche(neueFalsche);
      logFehler("pruefung", eintrag.zeichen, eintrag.richtig, eintrag.gegeben);
    }
    weiterNach(1200, neueFalsche);
  };

  // ---------------------------------------------------------------- Start
  if (phase === "start") {
    const reif = istPruefungsreif(historie.map((h) => h.bestanden));
    return (
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
          <h2 className="text-lg font-semibold">Prüfungssimulation</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            {PRUEFUNG.fragen} gemischte Fragen aus allen Gruppen (Erkennen in
            beide Richtungen und Position-Check). Bestanden mit höchstens{" "}
            {PRUEFUNG.maxFehler} Fehlern – dafür gibt es +
            {EP_WERTE.pruefungBestanden} EP.
          </p>
          {reif && (
            <p className="mt-3 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-800">
              🎓 Prüfungsreif – {PRUEFUNG.serieFuerReif} bestandene Prüfungen in
              Folge!
            </p>
          )}
          <div className="mt-4">
            <button
              type="button"
              onClick={starten}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700"
            >
              Prüfung starten
            </button>
          </div>
        </section>

        {historie.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 font-semibold">Deine letzten Prüfungen</h3>
            <ul className="divide-y divide-slate-100 text-sm">
              {historie.map((h, i) => (
                <li key={h.id ?? i} className="flex items-center gap-3 py-2">
                  <span
                    className={`font-semibold ${h.bestanden ? "text-green-700" : "text-red-700"}`}
                  >
                    {h.bestanden ? "Bestanden" : "Nicht bestanden"}
                  </span>
                  <span className="flex-1 text-slate-600">
                    {h.fehler} {h.fehler === 1 ? "Fehler" : "Fehler"} bei{" "}
                    {h.fragenGesamt} Fragen
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatiereZeitpunkt(h.zeitpunkt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------- Ergebnis
  if (phase === "ergebnis") {
    const bestanden = falsche.length <= PRUEFUNG.maxFehler;
    return (
      <div className="flex flex-col gap-4">
        <section
          className={`rounded-2xl border p-5 text-center ${
            bestanden
              ? "border-green-300 bg-green-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <h2
            className={`text-xl font-bold ${bestanden ? "text-green-800" : "text-red-800"}`}
          >
            {bestanden
              ? `Bestanden! +${EP_WERTE.pruefungBestanden} EP`
              : "Leider nicht bestanden."}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {falsche.length} von {PRUEFUNG.fragen} Fragen falsch (erlaubt:{" "}
            {PRUEFUNG.maxFehler}).
          </p>
          <button
            type="button"
            onClick={() => setPhase("start")}
            className="mt-4 rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700"
          >
            Zur Übersicht
          </button>
        </section>

        {falsche.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 font-semibold">Diese Fragen waren falsch</h3>
            <ul className="divide-y divide-slate-100 text-sm">
              {falsche.map((f, i) => (
                <li key={i} className="flex items-center gap-3 py-2">
                  <span className="tamil-schrift w-12 text-2xl">{f.zeichen}</span>
                  <span className="flex-1 text-slate-600">
                    <span className="text-red-700">{f.gegeben}</span>
                    {" → richtig: "}
                    <span className="font-medium text-slate-900">{f.richtig}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------- Laufend
  if (!frage) return null;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between text-sm text-slate-600">
        <span>
          Frage {index + 1} von {fragen.length}
        </span>
        <span className={falsche.length > PRUEFUNG.maxFehler ? "text-red-700" : ""}>
          Fehler: {falsche.length} / {PRUEFUNG.maxFehler} erlaubt
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${(index / fragen.length) * 100}%` }}
        />
      </div>

      {frage.art === "erkennen" ? (
        <>
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="mb-2 text-sm text-slate-500">
              {frage.richtung === "tamil_zu_latein"
                ? "Wie wird dieses Zeichen ausgesprochen?"
                : "Welches Zeichen passt zu dieser Aussprache?"}
            </p>
            {frage.richtung === "tamil_zu_latein" ? (
              <div className="tamil-schrift py-2 text-7xl leading-none text-slate-900">
                {frage.kombination.kombination}
              </div>
            ) : (
              <div className="py-4 text-5xl font-semibold text-slate-900">
                {frage.kombination.ausspracheLatein}
              </div>
            )}
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            {frage.optionen.map((option) => {
              const beantwortet = gewaehlteOption !== null;
              const istRichtige =
                option.kombination === frage.kombination.kombination;
              let farben = "border-slate-300 bg-white text-slate-900 hover:bg-slate-50";
              if (beantwortet && istRichtige) {
                farben = "border-green-600 bg-green-50 text-green-800";
              } else if (beantwortet && option === gewaehlteOption) {
                farben = "border-red-600 bg-red-50 text-red-800";
              } else if (beantwortet) {
                farben = "border-slate-200 bg-white text-slate-400";
              }
              return (
                <button
                  key={option.kombination}
                  type="button"
                  onClick={() => beantworteErkennen(option)}
                  disabled={gewaehlteOption !== null}
                  className={`rounded-xl border-2 px-3 py-4 transition-colors ${farben} ${
                    frage.richtung === "tamil_zu_latein"
                      ? "text-2xl font-medium"
                      : "tamil-schrift text-4xl leading-none"
                  }`}
                >
                  {frage.richtung === "tamil_zu_latein"
                    ? option.ausspracheLatein
                    : option.kombination}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="mb-2 text-sm text-slate-500">
              An welchen Positionen darf dieser Buchstabe stehen?
              (Mehrfachauswahl)
            </p>
            <div className="tamil-schrift py-2 text-7xl leading-none text-slate-900">
              {frage.konsonant.grundform}
            </div>
            <p className="text-sm text-slate-500">{frage.konsonant.lautDeutsch}</p>
          </div>
          <div className="grid w-full grid-cols-3 gap-3">
            {POSITIONEN.map(({ wert, name }) => {
              const istGewaehlt = gewaehltePositionen.has(wert);
              const istRichtig = frage.richtige.includes(wert);
              let farben = istGewaehlt
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
              if (positionGeprueft) {
                if (istRichtig) farben = "border-green-600 bg-green-50 text-green-800";
                else if (istGewaehlt) farben = "border-red-600 bg-red-50 text-red-800";
                else farben = "border-slate-200 bg-white text-slate-400";
              }
              return (
                <button
                  key={wert}
                  type="button"
                  disabled={positionGeprueft}
                  onClick={() =>
                    setGewaehltePositionen((alt) => {
                      const neu = new Set(alt);
                      if (neu.has(wert)) neu.delete(wert);
                      else neu.add(wert);
                      return neu;
                    })
                  }
                  className={`rounded-xl border-2 px-3 py-4 text-lg font-medium transition-colors ${farben}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
          {!positionGeprueft && (
            <button
              type="button"
              onClick={pruefePosition}
              disabled={gewaehltePositionen.size === 0}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Antwort festlegen
            </button>
          )}
        </>
      )}
    </div>
  );
}
