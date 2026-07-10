import { useEffect, useMemo, useState } from "react";
import { LektionBuchstabe, lektionen } from "../data/lektionen";
import { datenquelle } from "../lib/datenquelle";
import {
  CHALLENGE_FRAGEN,
  CHALLENGE_PUNKTE_PRO_RICHTIGE,
  challengeHeuteGemacht,
  EP_WERTE,
  verbucheChallenge,
} from "../lib/punkteLogik";
import { useFehlerFeedback } from "./fehlerFeedback";
import { useKonto } from "./KontoContext";
import { baueLektionOptionen } from "./lektionHelfer";
import { sprachausgabeVerfuegbar, sprich } from "./sprache";
import { mische } from "./uebungsHelfer";

// Drei Quiz-Typen laut Spezifikation: Multiple Choice, Wort↔Bild/Bedeutung
// und "Höre den Laut und finde das Zeichen".
type FrageTyp = "mc_zeichen" | "mc_laut" | "wort" | "hoeren";

interface Frage {
  typ: FrageTyp;
  buchstabe: LektionBuchstabe;
}

const PLATZHALTER = "/lektionen/platzhalter.svg";

function baueFragen(pool: LektionBuchstabe[]): Frage[] {
  const typen: FrageTyp[] = [
    "mc_zeichen",
    "mc_zeichen",
    "mc_laut",
    "mc_laut",
    "wort",
    "wort",
    "wort",
    "hoeren",
    "hoeren",
    "hoeren",
  ];
  // Ohne Sprachausgabe werden Hör-Fragen zu normalen Multiple-Choice-Fragen.
  const nutzbareTypen = typen.map((t) =>
    t === "hoeren" && !sprachausgabeVerfuegbar ? ("mc_laut" as const) : t,
  );
  const buchstaben = mische(pool);
  return nutzbareTypen
    .slice(0, CHALLENGE_FRAGEN)
    .map((typ, i) => ({ typ, buchstabe: buchstaben[i % buchstaben.length] }));
}

// Die tägliche Challenge: 10 gemischte Fragen aus dem bereits gelernten
// Stoff. Richtige Antworten geben Challenge-Punkte (Währung für den
// Streak-Freikauf), der Abschluss zusätzlich EP.
export default function DailyChallenge() {
  const { konto, punkte, belohne, wendePunkteAn } = useKonto();
  const [gelernteLektionen, setGelernteLektionen] = useState<Set<string> | null>(null);
  const [phase, setPhase] = useState<"start" | "laufend" | "fertig">("start");
  const [fragen, setFragen] = useState<Frage[]>([]);
  const [index, setIndex] = useState(0);
  const [richtige, setRichtige] = useState(0);
  const [gewaehlt, setGewaehlt] = useState<LektionBuchstabe | null>(null);
  const { klasse: zitterKlasse, ausloesen: fehlerAusloesen } = useFehlerFeedback();

  // Hör-Fragen spielen den Laut automatisch ab, sobald sie erscheinen.
  useEffect(() => {
    const f = fragen[index];
    if (phase === "laufend" && f?.typ === "hoeren") sprich(f.buchstabe.zeichen);
  }, [phase, fragen, index]);

  useEffect(() => {
    if (!konto) return;
    let aktiv = true;
    datenquelle
      .ladeLektionFortschritt(konto.username)
      .then((liste) => {
        if (!aktiv) return;
        setGelernteLektionen(
          new Set(liste.filter((f) => f.teil === 6).map((f) => f.lektionId)),
        );
      })
      .catch(() => {
        if (aktiv) setGelernteLektionen(new Set());
      });
    return () => {
      aktiv = false;
    };
  }, [konto]);

  // Fragen-Vorrat: alle Buchstaben aus abgeschlossenen Lektionen; wer noch
  // nichts abgeschlossen hat, übt mit der ersten Lektion.
  const pool = useMemo(() => {
    if (!gelernteLektionen) return [];
    const gesehen = new Set<string>();
    const ergebnis: LektionBuchstabe[] = [];
    for (const lektion of lektionen) {
      if (!gelernteLektionen.has(lektion.id)) continue;
      for (const b of lektion.buchstaben) {
        if (!gesehen.has(b.zeichen)) {
          gesehen.add(b.zeichen);
          ergebnis.push(b);
        }
      }
    }
    return ergebnis.length >= 4 ? ergebnis : lektionen[0].buchstaben;
  }, [gelernteLektionen]);

  if (!konto || gelernteLektionen === null) {
    return <p className="text-center text-slate-500">Lade Challenge …</p>;
  }

  if (challengeHeuteGemacht(punkte) && phase !== "fertig") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-3xl">✅</p>
        <h2 className="mt-1 text-lg font-semibold">Heute schon geschafft!</h2>
        <p className="mt-2 text-sm text-slate-600">
          Die nächste Daily Challenge wartet morgen auf dich.
        </p>
        <p className="mt-3 text-sm font-medium text-slate-800">
          ⚡ {punkte.challengePunkte} Challenge-Punkte gesammelt
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Mit Challenge-Punkten kannst du einen gerissenen Streak freikaufen.
        </p>
      </section>
    );
  }

  const starten = () => {
    setFragen(baueFragen(pool));
    setIndex(0);
    setRichtige(0);
    setGewaehlt(null);
    setPhase("laufend");
  };

  if (phase === "start") {
    return (
      <section className="rounded-2xl border-2 border-violet-300 bg-violet-50 p-6 text-center">
        <p className="text-3xl">⚡</p>
        <h2 className="mt-1 text-lg font-semibold">Daily Challenge</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          {CHALLENGE_FRAGEN} gemischte Fragen aus deinem gelernten Stoff –
          Multiple Choice, Wörter zuordnen und Hör-Fragen. Jede richtige
          Antwort bringt {CHALLENGE_PUNKTE_PRO_RICHTIGE} Challenge-Punkte, der
          Abschluss +{EP_WERTE.challengeAbgeschlossen} EP.
        </p>
        <button
          type="button"
          onClick={starten}
          className="mt-4 rounded-lg bg-violet-600 px-6 py-2.5 font-medium text-white hover:bg-violet-500"
        >
          Challenge starten
        </button>
      </section>
    );
  }

  if (phase === "fertig") {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-green-300 bg-green-50 p-8 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="text-xl font-bold text-green-800">Challenge geschafft!</h2>
        <p className="text-sm text-slate-600">
          {richtige} von {fragen.length} richtig · +
          {richtige * CHALLENGE_PUNKTE_PRO_RICHTIGE} Challenge-Punkte · +
          {EP_WERTE.challengeAbgeschlossen} EP
        </p>
        <p className="text-sm font-medium text-slate-800">
          ⚡ Kontostand: {punkte.challengePunkte} Challenge-Punkte
        </p>
      </section>
    );
  }

  const frage = fragen[index];
  if (!frage) return null;
  const optionen = baueLektionOptionen(pool, frage.buchstabe, (b) => b.zeichen);

  const antworten = (option: LektionBuchstabe) => {
    if (gewaehlt) return;
    setGewaehlt(option);
    const richtig = option.zeichen === frage.buchstabe.zeichen;
    if (!richtig) fehlerAusloesen();
    const neueRichtige = richtige + (richtig ? 1 : 0);
    setRichtige(neueRichtige);
    setTimeout(() => {
      setGewaehlt(null);
      if (index + 1 >= fragen.length) {
        belohne(EP_WERTE.challengeAbgeschlossen);
        wendePunkteAn((alt) => verbucheChallenge(alt, neueRichtige));
        setPhase("fertig");
      } else {
        setIndex((i) => i + 1);
      }
    }, richtig ? 600 : 1200);
  };

  const frageText: Record<FrageTyp, string> = {
    mc_zeichen: "Wie wird dieses Zeichen ausgesprochen?",
    mc_laut: "Welches Zeichen passt zu diesem Laut?",
    wort: "Welches Wort passt zum Bild bzw. zur Bedeutung?",
    hoeren: "Höre den Laut – welches Zeichen ist es?",
  };

  const hatEchtesBild = frage.buchstabe.bildPfad !== PLATZHALTER;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between text-sm text-slate-600">
        <span>
          Frage {index + 1} von {fragen.length}
        </span>
        <span>Richtig: {richtige}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-violet-500 transition-all"
          style={{ width: `${(index / fragen.length) * 100}%` }}
        />
      </div>

      <div className={`w-full rounded-2xl border border-slate-200 bg-white p-6 text-center ${zitterKlasse}`}>
        <p className="mb-2 text-sm text-slate-500">{frageText[frage.typ]}</p>
        {frage.typ === "mc_zeichen" && (
          <div className="tamil-schrift py-2 text-7xl leading-none text-slate-900">
            {frage.buchstabe.zeichen}
          </div>
        )}
        {frage.typ === "mc_laut" && (
          <div className="py-4 text-5xl font-semibold text-slate-900">
            {frage.buchstabe.latein}
          </div>
        )}
        {frage.typ === "wort" &&
          (hatEchtesBild ? (
            <img
              src={frage.buchstabe.bildPfad}
              alt=""
              className="mx-auto h-32 w-32 object-contain"
            />
          ) : (
            <div className="py-4 text-2xl font-semibold text-slate-900">
              {frage.buchstabe.beispielwortDeutsch}
            </div>
          ))}
        {frage.typ === "hoeren" && (
          <button
            type="button"
            onClick={() => sprich(frage.buchstabe.zeichen)}
            className="mx-auto my-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-violet-300 bg-violet-50 text-3xl hover:bg-violet-100"
            aria-label="Laut abspielen"
          >
            🔊
          </button>
        )}
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        {optionen.map((option) => {
          const istRichtige = option.zeichen === frage.buchstabe.zeichen;
          let farben = "border-slate-300 bg-white text-slate-900 hover:bg-slate-50";
          if (gewaehlt && istRichtige) farben = "border-green-600 bg-green-50 text-green-800";
          else if (gewaehlt && option === gewaehlt) farben = "border-red-600 bg-red-50 text-red-800";
          else if (gewaehlt) farben = "border-slate-200 bg-white text-slate-400";

          const inhalt =
            frage.typ === "mc_zeichen"
              ? option.latein
              : frage.typ === "wort"
                ? option.beispielwortTamil
                : option.zeichen;
          const schrift =
            frage.typ === "mc_zeichen"
              ? "text-2xl font-medium"
              : frage.typ === "wort"
                ? "tamil-schrift text-2xl leading-snug"
                : "tamil-schrift text-4xl leading-none";

          return (
            <button
              key={option.zeichen}
              type="button"
              onClick={() => antworten(option)}
              disabled={!!gewaehlt}
              className={`rounded-xl border-2 px-3 py-4 transition-colors ${farben} ${schrift}`}
            >
              {inhalt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
