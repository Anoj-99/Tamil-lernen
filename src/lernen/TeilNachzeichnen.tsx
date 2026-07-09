import { useState } from "react";
import { EffektiverBuchstabe } from "./useLektionInhalt";
import { useZeichenCanvas } from "./useZeichenCanvas";
import { zeichneVorlageVokal } from "./vorlage";

interface Props {
  buchstaben: EffektiverBuchstabe[];
  weiter: () => void;
}

// Teil 4: Nachzeichnen der eigenständigen Vokale (kein Konsonant beteiligt,
// daher die einfachere zeichneVorlageVokal-Vorlage statt zeichneVorlage).
export default function TeilNachzeichnen({ buchstaben, weiter }: Props) {
  const [index, setIndex] = useState(0);
  const aktuell = buchstaben[index]?.zeichen;
  const {
    rahmenRef,
    vorlageRef,
    malRef,
    striche,
    zeichnenStart,
    zeichnenBewegung,
    zeichnenEnde,
    loeschen,
  } = useZeichenCanvas(aktuell, zeichneVorlageVokal);

  if (!buchstaben[index]) return null;
  const letzter = index === buchstaben.length - 1;

  const naechsterBuchstabe = () => {
    loeschen();
    if (letzter) weiter();
    else setIndex((i) => i + 1);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-sm text-slate-500">
          Buchstabe {index + 1} von {buchstaben.length}
        </p>
        <p className="text-lg text-slate-800">
          <span className="tamil-schrift text-2xl">{buchstaben[index].zeichen}</span> ·
          gesprochen: <span className="font-semibold">{buchstaben[index].latein}</span>
        </p>
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
          {letzter ? "Weiter zu Teil 5" : "Nächster Buchstabe"}
        </button>
      </div>

      {striche.length === 0 && (
        <p className="text-xs text-slate-400">Zeichne den Buchstaben in das Feld oben.</p>
      )}
    </div>
  );
}
