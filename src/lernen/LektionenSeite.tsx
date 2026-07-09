import { useMemo, useState } from "react";
import { buchstabenDerStufe, lektionen, lektionById, stufen } from "../data/lektionen";
import { EP_WERTE } from "../lib/punkteLogik";
import { useKonto } from "./KontoContext";
import StufenCheckpoint from "./StufenCheckpoint";
import TeilCheckpoint from "./TeilCheckpoint";
import TeilErkennen from "./TeilErkennen";
import TeilNachzeichnen from "./TeilNachzeichnen";
import TeilVerbinden from "./TeilVerbinden";
import TeilVorstellung from "./TeilVorstellung";
import { useLektionFortschritt, useStufeAbgeschlossen } from "./useLektionFortschritt";
import { useLektionInhalt } from "./useLektionInhalt";

const TEIL_NAMEN: Record<number, string> = {
  1: "Vorstellung",
  2: "Erkennen (Zeichen → Laut)",
  3: "Erkennen (Laut → Zeichen)",
  4: "Nachzeichnen",
  5: "Verbinden",
  6: "Checkpoint",
};

function LektionsFortschrittsleiste({
  aktuellerTeil,
  abgeschlosseneTeile,
}: {
  aktuellerTeil: number;
  abgeschlosseneTeile: Set<number>;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[1, 2, 3, 4, 5, 6].map((teil) => (
        <div
          key={teil}
          title={`Teil ${teil}: ${TEIL_NAMEN[teil]}`}
          className={`h-2 flex-1 max-w-12 rounded-full ${
            abgeschlosseneTeile.has(teil)
              ? "bg-green-600"
              : teil === aktuellerTeil
                ? "bg-amber-500"
                : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function LektionenSeite() {
  const { konto, belohne } = useKonto();
  const [lektionId, setLektionId] = useState(lektionen[0]?.id ?? "");
  const [checkpointGeschafft, setCheckpointGeschafft] = useState(false);
  const lektion = lektionById(lektionId);
  const { abgeschlosseneTeile, aktuellerTeil, teilAbschliessen, laden } = useLektionFortschritt(
    konto?.username ?? "",
    lektionId,
  );
  const { buchstaben, laden: inhaltLaden } = useLektionInhalt(lektion);

  const stufe = useMemo(
    () => stufen.find((s) => s.id === lektion?.stufeId),
    [lektion],
  );
  const buchstabenStufe = useMemo(
    () => (stufe ? buchstabenDerStufe(stufe.id) : []),
    [stufe],
  );
  const stufeAbgeschlossen = useStufeAbgeschlossen(
    konto?.username ?? "",
    stufe,
    lektionId,
    aktuellerTeil > 6,
  );

  // Vergibt EP für jeden gemeisterten Teil, plus einen Bonus, sobald die
  // ganze Lektion (Teil 6) geschafft ist. Der Nachfrage-Guard verhindert
  // doppelte EP, falls teilFertig für einen bereits erledigten Teil erneut
  // aufgerufen würde.
  const teilFertig = (teil: number) => {
    if (!abgeschlosseneTeile.has(teil)) {
      belohne(EP_WERTE.lektionTeilGeschafft);
      if (teil === 6) belohne(EP_WERTE.lektionAbgeschlossen);
    }
    teilAbschliessen(teil);
  };

  if (!konto || lektionen.length === 0) return null;

  if (laden || inhaltLaden) {
    return <p className="text-center text-slate-500">Lade Fortschritt …</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {lektionen.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {lektionen.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLektionId(l.id)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                l.id === lektionId
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}

      {lektion && (
        <>
          <div>
            <h2 className="text-center text-lg font-semibold">{lektion.name}</h2>
            <p className="mb-2 text-center text-xs text-slate-500">
              {buchstabenStufe.length} Buchstaben in dieser Stufe
            </p>
            <LektionsFortschrittsleiste
              aktuellerTeil={aktuellerTeil}
              abgeschlosseneTeile={abgeschlosseneTeile}
            />
          </div>

          {aktuellerTeil > 6 ? (
            stufe && stufeAbgeschlossen && !checkpointGeschafft ? (
              <StufenCheckpoint stufe={stufe} weiter={() => setCheckpointGeschafft(true)} />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-300 bg-green-50 p-8 text-center">
                <p className="text-lg font-semibold text-green-800">
                  {stufe && stufeAbgeschlossen
                    ? `Stufe „${stufe.name}" abgeschlossen! 🏆`
                    : "Lektion abgeschlossen! 🎉"}
                </p>
                <p className="text-sm text-green-700">
                  Alle Teile von „{lektion.name}" mindestens einmal richtig gemeistert.
                </p>
              </div>
            )
          ) : aktuellerTeil === 1 ? (
            <TeilVorstellung buchstaben={buchstaben} weiter={() => teilFertig(1)} />
          ) : aktuellerTeil === 2 ? (
            <TeilErkennen
              key={`${lektionId}-2`}
              buchstaben={buchstaben}
              richtung="zeichen_zu_laut"
              weiter={() => teilFertig(2)}
            />
          ) : aktuellerTeil === 3 ? (
            <TeilErkennen
              key={`${lektionId}-3`}
              buchstaben={buchstaben}
              richtung="laut_zu_zeichen"
              weiter={() => teilFertig(3)}
            />
          ) : aktuellerTeil === 4 ? (
            <TeilNachzeichnen
              key={`${lektionId}-4`}
              buchstaben={buchstaben}
              weiter={() => teilFertig(4)}
            />
          ) : aktuellerTeil === 5 ? (
            <TeilVerbinden
              key={`${lektionId}-5`}
              paare={lektion?.verbindenPaare ?? []}
              weiter={() => teilFertig(5)}
            />
          ) : (
            <TeilCheckpoint
              key={`${lektionId}-6`}
              buchstaben={buchstaben}
              verbindenPaare={lektion?.verbindenPaare ?? []}
              weiter={() => teilFertig(6)}
            />
          )}
        </>
      )}
    </div>
  );
}
