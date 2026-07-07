import { useCallback, useEffect, useRef, useState } from "react";
import {
  Kombination,
  ligaturVokale,
  strichfolgenKonsonanten,
  strichfolgenVokalzeichen,
  umschliessendeVokale,
} from "../data/tamilSchrift";
import { Reihenfolge, useUebungsfolge } from "./uebungsHelfer";
import { getVokalzeichen, TAMIL_FONT, zeichneVorlage } from "./vorlage";

interface Punkt {
  x: number; // normalisiert 0–1
  y: number;
}

interface Props {
  kombinationen: Kombination[];
  reihenfolge: Reihenfolge;
}

export default function NachzeichnenModus({ kombinationen, reihenfolge }: Props) {
  const { aktuell, weiter } = useUebungsfolge(kombinationen, reihenfolge);
  const rahmenRef = useRef<HTMLDivElement>(null);
  const vorlageRef = useRef<HTMLCanvasElement>(null);
  const malRef = useRef<HTMLCanvasElement>(null);
  const [groesse, setGroesse] = useState(0); // CSS-Pixel (quadratisch)
  const [fontBereit, setFontBereit] = useState(false);
  const [striche, setStriche] = useState<Punkt[][]>([]);
  const aktiverStrich = useRef<Punkt[] | null>(null);

  useEffect(() => {
    let aktiv = true;
    if (typeof document !== "undefined" && document.fonts?.load) {
      document.fonts
        .load(`100px ${TAMIL_FONT}`, "கிஔ")
        .then(() => aktiv && setFontBereit(true))
        .catch(() => aktiv && setFontBereit(true));
    } else {
      setFontBereit(true);
    }
    return () => {
      aktiv = false;
    };
  }, []);

  useEffect(() => {
    const rahmen = rahmenRef.current;
    if (!rahmen) return;
    const beobachter = new ResizeObserver(() => {
      setGroesse(rahmen.clientWidth);
    });
    beobachter.observe(rahmen);
    setGroesse(rahmen.clientWidth);
    return () => beobachter.disconnect();
  }, []);

  // Vorlage (halbtransparentes Zeichen + nummerierte Pfeile) zeichnen.
  useEffect(() => {
    const canvas = vorlageRef.current;
    if (!canvas || !aktuell || !fontBereit || groesse === 0) return;
    zeichneVorlage(canvas, aktuell, groesse);
  }, [aktuell, fontBereit, groesse]);

  // Nutzerstriche zeichnen – auch nach Resize oder Löschen.
  const zeichneStriche = useCallback(
    (alle: Punkt[][]) => {
      const canvas = malRef.current;
      if (!canvas || groesse === 0) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== groesse * dpr) {
        canvas.width = groesse * dpr;
        canvas.height = groesse * dpr;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, groesse, groesse);
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const strich of alle) {
        if (strich.length === 0) continue;
        ctx.beginPath();
        ctx.moveTo(strich[0].x * groesse, strich[0].y * groesse);
        for (const punkt of strich.slice(1)) {
          ctx.lineTo(punkt.x * groesse, punkt.y * groesse);
        }
        if (strich.length === 1) {
          ctx.lineTo(strich[0].x * groesse + 0.1, strich[0].y * groesse);
        }
        ctx.stroke();
      }
    },
    [groesse],
  );

  useEffect(() => {
    zeichneStriche(striche);
  }, [striche, zeichneStriche]);

  const punktAusEvent = (e: React.PointerEvent<HTMLCanvasElement>): Punkt => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const zeichnenStart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    aktiverStrich.current = [punktAusEvent(e)];
    setStriche((s) => [...s, aktiverStrich.current as Punkt[]]);
  };

  const zeichnenBewegung = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!aktiverStrich.current) return;
    e.preventDefault();
    aktiverStrich.current.push(punktAusEvent(e));
    setStriche((s) => [...s.slice(0, -1), [...(aktiverStrich.current as Punkt[])]]);
  };

  const zeichnenEnde = () => {
    aktiverStrich.current = null;
  };

  const loeschen = () => {
    aktiverStrich.current = null;
    setStriche([]);
  };

  const naechsterBuchstabe = () => {
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
