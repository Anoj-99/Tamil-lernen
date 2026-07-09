import {
  Kombination,
  ligaturVokale,
  strichfolgenKonsonanten,
  strichfolgenVokalzeichen,
  umschliessendeVokale,
} from "../data/tamilSchrift";
import { EP_WERTE } from "../lib/punkteLogik";
import { useKonto } from "./KontoContext";
import { Reihenfolge, useUebungsfolge } from "./uebungsHelfer";
import { useZeichenCanvas } from "./useZeichenCanvas";
import { getVokalzeichen, zeichneVorlage } from "./vorlage";

interface Props {
  kombinationen: Kombination[];
  reihenfolge: Reihenfolge;
}

export default function NachzeichnenModus({ kombinationen, reihenfolge }: Props) {
  const { belohne } = useKonto();
  const { aktuell, weiter } = useUebungsfolge(kombinationen, reihenfolge);
  const {
    rahmenRef,
    vorlageRef,
    malRef,
    striche,
    zeichnenStart,
    zeichnenBewegung,
    zeichnenEnde,
    loeschen,
  } = useZeichenCanvas(aktuell, zeichneVorlage);

  const naechsterBuchstabe = () => {
    // Nur belohnen, wenn tatsächlich etwas gezeichnet wurde.
    if (striche.length > 0) belohne(EP_WERTE.nachzeichnenFertig);
    loeschen();
    weiter();
  };

  if (!aktuell) return null;

  const schrittzahl =
    (strichfolgenKonsonanten[aktuell.konsonant.slice(0, 1)]?.length ?? 0) +
    (aktuell.vokal === "அ"
      ? 0
      : umschliessendeVokale.has(aktuell.vokal)
        ? 2
        : (strichfolgenVokalzeichen[getVokalzeichen(aktuell)]?.length ?? 1));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-lg text-slate-800">
          <span className="tamil-schrift text-2xl">{aktuell.kombination}</span>{" "}
          = <span className="tamil-schrift">{aktuell.konsonant}</span> +{" "}
          <span className="tamil-schrift">{aktuell.vokal}</span> · gesprochen:{" "}
          <span className="font-semibold">{aktuell.ausspracheLatein}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {schrittzahl} {schrittzahl === 1 ? "Strich" : "Striche"} – den Pfeilen
          1, 2, 3 … folgen. Erst der Konsonant, dann das Vokalzeichen.
        </p>
        {ligaturVokale.has(aktuell.vokal) && (
          <p className="mt-1 text-sm text-amber-700">
            Bei {aktuell.vokal} verschmilzt das Vokalzeichen mit dem Konsonanten
            – orientiere dich an der Vorlage.
          </p>
        )}
      </div>

      <div
        ref={rahmenRef}
        className="relative aspect-square w-full max-w-md rounded-2xl border-2 border-dashed border-slate-300 bg-white"
      >
        <canvas
          ref={vorlageRef}
          className="absolute inset-0 h-full w-full"
          style={{ width: "100%", height: "100%" }}
        />
        <canvas
          ref={malRef}
          className="absolute inset-0 h-full w-full cursor-crosshair"
          style={{ width: "100%", height: "100%", touchAction: "none" }}
          onPointerDown={zeichnenStart}
          onPointerMove={zeichnenBewegung}
          onPointerUp={zeichnenEnde}
          onPointerCancel={zeichnenEnde}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={loeschen}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50"
        >
          Löschen
        </button>
        <button
          type="button"
          onClick={naechsterBuchstabe}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
