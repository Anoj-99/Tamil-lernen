import { useMemo, useState } from "react";
import { buchstabenDerStufe, lektionen, lektionById, stufen } from "../data/lektionen";
import { useKonto } from "./KontoContext";
import TeilErkennen from "./TeilErkennen";
import TeilNachzeichnen from "./TeilNachzeichnen";
import TeilVerbinden from "./TeilVerbinden";
import TeilVorstellung from "./TeilVorstellung";
import { useLektionFortschritt } from "./useLektionFortschritt";
import { useLektionInhalt } from "./useLektionInhalt";

const TEIL_NAMEN: Record<number, string> = {
  1: "Vorstellung",
  2: "Erkennen (Zeichen → Laut)",
  3: "Erkennen (Laut → Zeichen)",
  4: "Nachzeichnen",
  5: "Verbinden",
  6: "Checkpoint",
};

// Platzhalter, bis die jeweilige Phase den echten Teil ersetzt.
function TeilPlatzhalter({ teil, weiter }: { teil: number; weiter: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-sm text-slate-500">
        Teil {teil} — {TEIL_NAMEN[teil]}
      </p>
      <p className="text-slate-400">Kommt in Kürze.</p>
      <button
        type="button"
        onClick={weiter}
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700"
      >
        Weiter (Platzhalter)
      </button>
    </div>
  );
}

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
  const { konto } = useKonto();
  const [lektionId, setLektionId] = useState(lektionen[0]?.id ?? "");
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
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-300 bg-green-50 p-8 text-center">
              <p className="text-lg font-semibold text-green-800">
                Lektion abgeschlossen! 🎉
              </p>
              <p className="text-sm text-green-700">
                Alle Teile von „{lektion.name}" mindestens einmal richtig gemeistert.
              </p>
            </div>
          ) : aktuellerTeil === 1 ? (
            <TeilVorstellung buchstaben={buchstaben} weiter={() => teilAbschliessen(1)} />
          ) : aktuellerTeil === 2 ? (
            <TeilErkennen
              key={`${lektionId}-2`}
              buchstaben={buchstaben}
              richtung="zeichen_zu_laut"
              weiter={() => teilAbschliessen(2)}
            />
          ) : aktuellerTeil === 3 ? (
            <TeilErkennen
              key={`${lektionId}-3`}
              buchstaben={buchstaben}
              richtung="laut_zu_zeichen"
              weiter={() => teilAbschliessen(3)}
            />
          ) : aktuellerTeil === 4 ? (
            <TeilNachzeichnen
              key={`${lektionId}-4`}
              buchstaben={buchstaben}
              weiter={() => teilAbschliessen(4)}
            />
          ) : aktuellerTeil === 5 ? (
            <TeilVerbinden
              key={`${lektionId}-5`}
              paare={lektion?.verbindenPaare ?? []}
              weiter={() => teilAbschliessen(5)}
            />
          ) : (
            <TeilPlatzhalter
              teil={aktuellerTeil}
              weiter={() => teilAbschliessen(aktuellerTeil)}
            />
          )}
        </>
      )}
    </div>
  );
}
