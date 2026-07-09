import { useCallback, useEffect, useRef, useState } from "react";
import { TAMIL_FONT } from "./vorlage";

interface Punkt {
  x: number; // normalisiert 0–1
  y: number;
}

// Gemeinsame Canvas-/Zeichen-Logik für "Nachzeichnen": Größenmessung per
// ResizeObserver, Vorlage zeichnen (sobald der Tamil-Font geladen ist) und
// Freihand-Striche per Pointer-Events aufnehmen. `zeichnen` bekommt das
// jeweilige Datum (Kombination oder einzelner Vokal) und malt die Vorlage.
export function useZeichenCanvas<T>(
  datum: T | undefined,
  zeichnen: (canvas: HTMLCanvasElement, datum: T, groesse: number) => void,
) {
  const rahmenRef = useRef<HTMLDivElement>(null);
  const vorlageRef = useRef<HTMLCanvasElement>(null);
  const malRef = useRef<HTMLCanvasElement>(null);
  const [groesse, setGroesse] = useState(0);
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
    const beobachter = new ResizeObserver(() => setGroesse(rahmen.clientWidth));
    beobachter.observe(rahmen);
    setGroesse(rahmen.clientWidth);
    return () => beobachter.disconnect();
  }, []);

  useEffect(() => {
    const canvas = vorlageRef.current;
    if (!canvas || datum === undefined || !fontBereit || groesse === 0) return;
    zeichnen(canvas, datum, groesse);
  }, [datum, fontBereit, groesse, zeichnen]);

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

  return {
    rahmenRef,
    vorlageRef,
    malRef,
    striche,
    zeichnenStart,
    zeichnenBewegung,
    zeichnenEnde,
    loeschen,
  };
}
