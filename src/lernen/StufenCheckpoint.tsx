import { useEffect, useMemo, useState } from "react";
import { LektionBuchstabe, Stufe, buchstabenDerStufe, vorherigeStufe } from "../data/lektionen";
import { datenquelle } from "../lib/datenquelle";
import { EP_WERTE } from "../lib/punkteLogik";
import { StufenCheckpointErgebnis, StufenCheckpointKonfig } from "../lib/typen";
import { useKonto } from "./KontoContext";
import { baueLektionOptionen } from "./lektionHelfer";
import { mische } from "./uebungsHelfer";
import { EffektiverBuchstabe } from "./useLektionInhalt";

type Richtung = "zeichen_zu_laut" | "laut_zu_zeichen";

interface Frage {
  buchstabe: EffektiverBuchstabe;
  richtung: Richtung;
}

function alsEffektiv(b: LektionBuchstabe): EffektiverBuchstabe {
  return { ...b, vomLehrerAngepasst: false };
}

function baueFragen(pool: EffektiverBuchstabe[]): Frage[] {
  const fragen = pool.flatMap((buchstabe) => [
    { buchstabe, richtung: "zeichen_zu_laut" as const },
    { buchstabe, richtung: "laut_zu_zeichen" as const },
  ]);
  return mische(fragen);
}

interface Props {
  stufe: Stufe;
  weiter: () => void;
}

// Stufen-Checkpoint: gemischte Fragen über die ganze Stufe (plus ein paar
// Buchstaben der Vorstufe, laut Lehrer-Konfiguration), bestanden mit einer
// Toleranz statt hundertprozentiger Pflicht - im Unterschied zu den strengen
// Teil-Checkpoints innerhalb einer Lektion.
export default function StufenCheckpoint({ stufe, weiter }: Props) {
  const { konto, belohne } = useKonto();
  const [konfig, setKonfig] = useState<StufenCheckpointKonfig | null>(null);
  const [historie, setHistorie] = useState<StufenCheckpointErgebnis[]>([]);
  const [phase, setPhase] = useState<"start" | "laufend" | "ergebnis">("start");
  const [fragen, setFragen] = useState<Frage[]>([]);
  const [index, setIndex] = useState(0);
  const [richtigeAnzahl, setRichtigeAnzahl] = useState(0);
  const [gewaehlt, setGewaehlt] = useState<EffektiverBuchstabe | null>(null);

  useEffect(() => {
    datenquelle.ladeCheckpointKonfig(stufe.id).then(setKonfig).catch(() => {});
    if (konto) {
      datenquelle
        .ladeCheckpoints(konto.username, stufe.id)
        .then(setHistorie)
        .catch(() => {});
    }
  }, [stufe.id, konto]);

  const pool = useMemo(() => {
    const eigene = buchstabenDerStufe(stufe.id).map(alsEffektiv);
    const vorstufe = vorherigeStufe(stufe.id);
    const anzahlAlt = konfig?.anzahlVorherigeBuchstaben ?? 0;
    const alte =
      vorstufe && anzahlAlt > 0
        ? mische(buchstabenDerStufe(vorstufe.id)).slice(0, anzahlAlt).map(alsEffektiv)
        : [];
    return [...eigene, ...alte];
  }, [stufe.id, konfig]);

  if (!konto || !konfig) return null;

  const starten = () => {
    setFragen(baueFragen(pool));
    setIndex(0);
    setRichtigeAnzahl(0);
    setGewaehlt(null);
    setPhase("laufend");
  };

  const frage = fragen[index];

  const abschliessen = (finaleRichtige: number) => {
    const bestanden = (finaleRichtige / fragen.length) * 100 >= konfig.toleranzProzent;
    if (bestanden) belohne(EP_WERTE.stufenCheckpointBestanden);
    void datenquelle
      .checkpointSpeichern({
        username: konto.username,
        stufeId: stufe.id,
        bestanden,
        richtig: finaleRichtige,
        gesamt: fragen.length,
        zeitpunkt: new Date().toISOString(),
      })
      .then(() => datenquelle.ladeCheckpoints(konto.username, stufe.id))
      .then(setHistorie)
      .catch(() => {});
    setPhase("ergebnis");
  };

  const antworten = (option: EffektiverBuchstabe) => {
    if (gewaehlt) return;
    setGewaehlt(option);
    const richtig = option.zeichen === frage.buchstabe.zeichen;
    const neueRichtige = richtigeAnzahl + (richtig ? 1 : 0);
    setRichtigeAnzahl(neueRichtige);
    setTimeout(() => {
      if (index + 1 >= fragen.length) {
        abschliessen(neueRichtige);
      } else {
        setIndex((i) => i + 1);
        setGewaehlt(null);
      }
    }, 700);
  };

  if (phase === "start") {
    return (
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
          <h2 className="text-lg font-semibold">Stufen-Checkpoint: {stufe.name}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            {pool.length * 2} gemischte Fragen über die Stufe
            {konfig.anzahlVorherigeBuchstaben > 0 && vorherigeStufe(stufe.id)
              ? " (inkl. ein paar Buchstaben der vorherigen Stufe)"
              : ""}
            . Bestanden ab {konfig.toleranzProzent} % richtigen Antworten – dafür gibt es +
            {EP_WERTE.stufenCheckpointBestanden} EP.
          </p>
          <button
            type="button"
            onClick={starten}
            className="mt-4 rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700"
          >
            Checkpoint starten
          </button>
        </section>
        {historie.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 font-semibold">Bisherige Versuche</h3>
            <ul className="divide-y divide-slate-100 text-sm">
              {historie.map((h, i) => (
                <li key={h.id ?? i} className="flex items-center gap-3 py-2">
                  <span className={h.bestanden ? "font-semibold text-green-700" : "font-semibold text-red-700"}>
                    {h.bestanden ? "Bestanden" : "Nicht bestanden"}
                  </span>
                  <span className="text-slate-600">
                    {h.richtig} von {h.gesamt} richtig
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (phase === "ergebnis") {
    const bestanden = (richtigeAnzahl / fragen.length) * 100 >= konfig.toleranzProzent;
    return (
      <section
        className={`flex flex-col items-center gap-3 rounded-2xl border p-8 text-center ${
          bestanden ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
        }`}
      >
        <h2 className={`text-xl font-bold ${bestanden ? "text-green-800" : "text-red-800"}`}>
          {bestanden ? `Bestanden! +${EP_WERTE.stufenCheckpointBestanden} EP` : "Noch nicht bestanden."}
        </h2>
        <p className="text-sm text-slate-600">
          {richtigeAnzahl} von {fragen.length} richtig ({konfig.toleranzProzent} % nötig).
        </p>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={starten}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50"
          >
            Nochmal versuchen
          </button>
          {bestanden && (
            <button
              type="button"
              onClick={weiter}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700"
            >
              Weiter
            </button>
          )}
        </div>
      </section>
    );
  }

  if (!frage) return null;
  const optionen = baueLektionOptionen(pool, frage.buchstabe, (b) => b.zeichen);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between text-sm text-slate-600">
        <span>
          Frage {index + 1} von {fragen.length}
        </span>
        <span>Richtig: {richtigeAnzahl}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${(index / fragen.length) * 100}%` }}
        />
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center">
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
