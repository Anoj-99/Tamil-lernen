import { useMemo, useState } from "react";
import { LektionBuchstabe } from "../data/lektionen";
import { buchstabenDesLevels, Level } from "../data/levelPlan";
import { datenquelle } from "../lib/datenquelle";
import { EP_WERTE } from "../lib/punkteLogik";
import { useFehlerFeedback } from "./fehlerFeedback";
import { useKonto } from "./KontoContext";
import { baueLektionOptionen } from "./lektionHelfer";
import { mische } from "./uebungsHelfer";

type Richtung = "zeichen_zu_laut" | "laut_zu_zeichen";

interface Frage {
  buchstabe: LektionBuchstabe;
  richtung: Richtung;
}

function frageSchluessel(f: Frage): string {
  return `${f.buchstabe.zeichen}:${f.richtung}`;
}

interface Props {
  level: Level;
  zurueck: () => void;
  bestanden: () => void;
}

// Boss-Test am Ende eines Levels: gemischte Fragen über alle 3 Lektionen.
// Es gibt keine Leben und keine Toleranz-Prozente - falsch beantwortete
// Fragen wandern in eine Warteschlange und kommen am Ende erneut, so lange,
// bis jede Frage einmal richtig beantwortet wurde. Erst dann ist das Level
// bestanden und das nächste am Pfad freigeschaltet.
export default function BossTest({ level, zurueck, bestanden }: Props) {
  const { konto, belohne } = useKonto();
  const pool = useMemo(() => buchstabenDesLevels(level), [level]);
  const alleFragen = useMemo<Frage[]>(
    () =>
      mische(
        pool.flatMap((buchstabe) => [
          { buchstabe, richtung: "zeichen_zu_laut" as const },
          { buchstabe, richtung: "laut_zu_zeichen" as const },
        ]),
      ),
    [pool],
  );

  const [phase, setPhase] = useState<"start" | "laufend" | "geschafft">("start");
  const [warteschlange, setWarteschlange] = useState<Frage[]>(alleFragen);
  const [falscheSchluessel, setFalscheSchluessel] = useState<Set<string>>(new Set());
  const [gewaehlt, setGewaehlt] = useState<LektionBuchstabe | null>(null);
  const { klasse: zitterKlasse, ausloesen: fehlerAusloesen } = useFehlerFeedback();

  if (!konto) return null;

  const gesamt = alleFragen.length;
  const geschafft = gesamt - warteschlange.length;
  const frage = warteschlange[0];

  const abschliessen = (ersteRundeFehler: number) => {
    belohne(EP_WERTE.bossTestBestanden);
    void datenquelle
      .speichereLevelFortschritt({
        username: konto.username,
        levelId: level.id,
        bestandenAm: new Date().toISOString(),
        fragenGesamt: gesamt,
        ersteRundeFehler,
      })
      .catch(() => {});
    setPhase("geschafft");
  };

  const antworten = (option: LektionBuchstabe) => {
    if (gewaehlt || !frage) return;
    setGewaehlt(option);
    const richtig = option.zeichen === frage.buchstabe.zeichen;
    if (!richtig) fehlerAusloesen();
    const neueFalsche = new Set(falscheSchluessel);
    if (!richtig) neueFalsche.add(frageSchluessel(frage));
    setFalscheSchluessel(neueFalsche);
    setTimeout(() => {
      setGewaehlt(null);
      // Falsch beantwortete Fragen kommen ans Ende der Warteschlange
      // zurück - der Test endet erst, wenn alles einmal richtig war.
      const [erste, ...rest] = warteschlange;
      const neu = richtig ? rest : [...rest, erste];
      setWarteschlange(neu);
      if (neu.length === 0) abschliessen(neueFalsche.size);
    }, richtig ? 600 : 1200);
  };

  if (phase === "start") {
    return (
      <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
        <p className="text-3xl">🏆</p>
        <h2 className="mt-1 text-lg font-semibold">Boss-Test: {level.name}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          {gesamt} gemischte Fragen über alle 3 Lektionen dieses Levels. Falsch
          beantwortete Fragen kommen am Ende erneut – der Test ist erst
          geschafft, wenn du jede Frage einmal richtig beantwortet hast. Dafür
          gibt es +{EP_WERTE.bossTestBestanden} EP und das nächste Level wird
          freigeschaltet.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={zurueck}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50"
          >
            Zurück zum Pfad
          </button>
          <button
            type="button"
            onClick={() => setPhase("laufend")}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white hover:bg-amber-500"
          >
            Boss-Test starten
          </button>
        </div>
      </section>
    );
  }

  if (phase === "geschafft") {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-green-300 bg-green-50 p-8 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="text-xl font-bold text-green-800">
          Level {level.id} bestanden! +{EP_WERTE.bossTestBestanden} EP
        </h2>
        <p className="text-sm text-slate-600">
          {falscheSchluessel.size === 0
            ? "Alle Fragen im ersten Anlauf richtig – stark!"
            : `${falscheSchluessel.size} von ${gesamt} Fragen brauchten einen zweiten Anlauf.`}
        </p>
        <button
          type="button"
          onClick={bestanden}
          className="mt-2 rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700"
        >
          Weiter auf dem Pfad
        </button>
      </section>
    );
  }

  if (!frage) return null;
  const optionen = baueLektionOptionen(pool, frage.buchstabe, (b) => b.zeichen);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between text-sm text-slate-600">
        <span>
          Geschafft: {geschafft} von {gesamt}
        </span>
        <span>Noch offen: {warteschlange.length}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${(geschafft / gesamt) * 100}%` }}
        />
      </div>

      <div className={`w-full rounded-2xl border border-slate-200 bg-white p-6 text-center ${zitterKlasse}`}>
        <p className="mb-2 text-sm text-slate-500">
          {frage.richtung === "zeichen_zu_laut"
            ? "Wie wird dieses Zeichen ausgesprochen?"
            : "Welches Zeichen passt zu diesem Laut?"}
        </p>
        {frage.richtung === "zeichen_zu_laut" ? (
          <div className="tamil-schrift py-2 text-7xl leading-none text-slate-900">
            {frage.buchstabe.zeichen}
          </div>
        ) : (
          <div className="py-4 text-5xl font-semibold text-slate-900">{frage.buchstabe.latein}</div>
        )}
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        {optionen.map((option) => {
          const istRichtige = option.zeichen === frage.buchstabe.zeichen;
          let farben = "border-slate-300 bg-white text-slate-900 hover:bg-slate-50";
          if (gewaehlt && istRichtige) farben = "border-green-600 bg-green-50 text-green-800";
          else if (gewaehlt && option === gewaehlt) farben = "border-red-600 bg-red-50 text-red-800";
          else if (gewaehlt) farben = "border-slate-200 bg-white text-slate-400";
          return (
            <button
              key={option.zeichen}
              type="button"
              onClick={() => antworten(option)}
              disabled={!!gewaehlt}
              className={`rounded-xl border-2 px-3 py-4 transition-colors ${farben} ${
                frage.richtung === "zeichen_zu_laut"
                  ? "text-2xl font-medium"
                  : "tamil-schrift text-4xl leading-none"
              }`}
            >
              {frage.richtung === "zeichen_zu_laut" ? option.latein : option.zeichen}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Falsche Antworten kommen am Ende noch einmal – bis alles sitzt.
      </p>
    </div>
  );
}
