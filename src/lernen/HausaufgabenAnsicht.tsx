import { useMemo, useState } from "react";
import { poolAufgabeById } from "../data/hausaufgabenPool";
import { LektionBuchstabe } from "../data/lektionen";
import { useFehlerFeedback } from "./fehlerFeedback";
import { baueLektionOptionen } from "./lektionHelfer";
import { mische } from "./uebungsHelfer";
import { aufgabenGesamt, MeineAufgabe } from "./useHausaufgaben";

type Richtung = "zeichen_zu_laut" | "laut_zu_zeichen";

interface Frage {
  buchstabe: LektionBuchstabe;
  optionenPool: LektionBuchstabe[];
  richtung: Richtung;
}

// Baut aus dem Paket der Hausaufgabe die Fragenliste: pro Teil so viele
// Fragen wie vom Lehrer festgelegt, abwechselnd in beide Richtungen.
function baueFragen(aufgabe: MeineAufgabe["aufgabe"]): Frage[] {
  const fragen: Frage[] = [];
  for (const teil of aufgabe.teile) {
    const pool = poolAufgabeById(teil.poolId);
    if (!pool || pool.buchstaben.length === 0) continue;
    const gemischt = mische(pool.buchstaben);
    for (let i = 0; i < teil.anzahl; i++) {
      fragen.push({
        buchstabe: gemischt[i % gemischt.length],
        optionenPool: pool.buchstaben,
        richtung: i % 2 === 0 ? "zeichen_zu_laut" : "laut_zu_zeichen",
      });
    }
  }
  return mische(fragen);
}

interface Props {
  meineAufgabe: MeineAufgabe;
  zurueck: () => void;
  zaehleFortschritt: (hausaufgabeId: number, anzahl: number) => void;
}

// Die Side-Quest vom Pfad: arbeitet das Hausaufgaben-Paket als
// Multiple-Choice-Quiz ab. Nur richtige Antworten zählen als Fortschritt;
// nach der Deadline bleibt die Aufgabe bearbeitbar (der Lehrer sieht, ob
// die Deadline eingehalten wurde).
export default function HausaufgabenAnsicht({ meineAufgabe, zurueck, zaehleFortschritt }: Props) {
  const { aufgabe } = meineAufgabe;
  const gesamt = aufgabenGesamt(aufgabe);
  const offen = Math.max(gesamt - meineAufgabe.fortschritt, 0);
  const alleFragen = useMemo(() => baueFragen(aufgabe), [aufgabe]);
  // Nur so viele Fragen stellen, wie noch offen sind (Fortsetzen möglich).
  const [fragen] = useState<Frage[]>(() => alleFragen.slice(0, offen));
  const [index, setIndex] = useState(0);
  const [richtige, setRichtige] = useState(0);
  const [gewaehlt, setGewaehlt] = useState<LektionBuchstabe | null>(null);
  const { klasse: zitterKlasse, ausloesen: fehlerAusloesen } = useFehlerFeedback();

  const deadlineText = aufgabe.deadline
    ? new Date(aufgabe.deadline).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const deadlineVorbei = aufgabe.deadline ? new Date(aufgabe.deadline) < new Date() : false;

  if (meineAufgabe.erledigt || index >= fragen.length) {
    const fertig = meineAufgabe.erledigt || richtige >= offen;
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-3xl">{fertig ? "🎉" : "📌"}</p>
        <h2 className="text-lg font-semibold">
          {fertig ? "Hausaufgabe erledigt!" : "Runde beendet"}
        </h2>
        {!fertig && (
          <p className="text-sm text-slate-600">
            {richtige} richtige Antworten gezählt – der Rest wartet noch in
            dieser Side-Quest.
          </p>
        )}
        <button
          type="button"
          onClick={zurueck}
          className="mt-1 rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700"
        >
          Zurück zum Pfad
        </button>
      </section>
    );
  }

  const frage = fragen[index];
  const optionen = baueLektionOptionen(frage.optionenPool, frage.buchstabe, (b) => b.zeichen);

  const antworten = (option: LektionBuchstabe) => {
    if (gewaehlt) return;
    setGewaehlt(option);
    const richtig = option.zeichen === frage.buchstabe.zeichen;
    if (richtig) {
      setRichtige((r) => r + 1);
      zaehleFortschritt(aufgabe.id, 1);
    } else {
      fehlerAusloesen();
    }
    setTimeout(() => {
      setGewaehlt(null);
      setIndex((i) => i + 1);
    }, richtig ? 600 : 1200);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full">
        <button
          type="button"
          onClick={zurueck}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Zurück zum Pfad
        </button>
        <h2 className="mt-1 text-center text-lg font-semibold">📌 {aufgabe.thema}</h2>
        <p className="text-center text-xs text-slate-500">
          Hausaufgabe von {aufgabe.zugewiesenVon}
          {deadlineText && (
            <span className={deadlineVorbei ? "text-red-600" : ""}>
              {" "}
              · bis {deadlineText}
              {deadlineVorbei && " (abgelaufen – zählt trotzdem)"}
            </span>
          )}
        </p>
      </div>

      <div className="flex w-full items-center justify-between text-sm text-slate-600">
        <span>
          Frage {index + 1} von {fragen.length}
        </span>
        <span>
          Gesamt: {Math.min(meineAufgabe.fortschritt + richtige, gesamt)}/{gesamt}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{
            width: `${((meineAufgabe.fortschritt + richtige) / Math.max(gesamt, 1)) * 100}%`,
          }}
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
    </div>
  );
}

