import { Lektion } from "../data/lektionen";
import { EP_WERTE } from "../lib/punkteLogik";
import { useKonto } from "./KontoContext";
import TeilCheckpoint from "./TeilCheckpoint";
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

interface Props {
  lektion: Lektion;
  zurueck: () => void;
}

// Eine einzelne Lektion mit ihren 6 Teilen, aufgerufen vom Lernpfad.
export default function LektionAnsicht({ lektion, zurueck }: Props) {
  const { konto, belohne } = useKonto();
  const { abgeschlosseneTeile, aktuellerTeil, teilAbschliessen, laden } = useLektionFortschritt(
    konto?.username ?? "",
    lektion.id,
  );
  const { buchstaben, laden: inhaltLaden } = useLektionInhalt(lektion);

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

  if (!konto) return null;

  if (laden || inhaltLaden) {
    return <p className="text-center text-slate-500">Lade Fortschritt …</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={zurueck}
          className="mb-2 text-sm text-slate-500 hover:text-slate-900"
        >
          ← Zurück zum Pfad
        </button>
        <h2 className="text-center text-lg font-semibold">{lektion.name}</h2>
        <p className="mb-2 text-center text-xs text-slate-500">
          {buchstaben.length} Buchstaben in dieser Lektion
        </p>
        <LektionsFortschrittsleiste
          aktuellerTeil={aktuellerTeil}
          abgeschlosseneTeile={abgeschlosseneTeile}
        />
      </div>

      {aktuellerTeil > 6 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-300 bg-green-50 p-8 text-center">
          <p className="text-lg font-semibold text-green-800">Lektion abgeschlossen! 🎉</p>
          <p className="text-sm text-green-700">
            Alle Teile von „{lektion.name}" mindestens einmal richtig gemeistert.
          </p>
          <button
            type="button"
            onClick={zurueck}
            className="mt-1 rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700"
          >
            Zurück zum Pfad
          </button>
        </div>
      ) : aktuellerTeil === 1 ? (
        <TeilVorstellung buchstaben={buchstaben} weiter={() => teilFertig(1)} />
      ) : aktuellerTeil === 2 ? (
        <TeilErkennen
          key={`${lektion.id}-2`}
          buchstaben={buchstaben}
          richtung="zeichen_zu_laut"
          weiter={() => teilFertig(2)}
        />
      ) : aktuellerTeil === 3 ? (
        <TeilErkennen
          key={`${lektion.id}-3`}
          buchstaben={buchstaben}
          richtung="laut_zu_zeichen"
          weiter={() => teilFertig(3)}
        />
      ) : aktuellerTeil === 4 ? (
        <TeilNachzeichnen
          key={`${lektion.id}-4`}
          buchstaben={buchstaben}
          weiter={() => teilFertig(4)}
        />
      ) : aktuellerTeil === 5 ? (
        <TeilVerbinden
          key={`${lektion.id}-5`}
          paare={lektion.verbindenPaare}
          weiter={() => teilFertig(5)}
        />
      ) : (
        <TeilCheckpoint
          key={`${lektion.id}-6`}
          buchstaben={buchstaben}
          verbindenPaare={lektion.verbindenPaare}
          weiter={() => teilFertig(6)}
        />
      )}
    </div>
  );
}
