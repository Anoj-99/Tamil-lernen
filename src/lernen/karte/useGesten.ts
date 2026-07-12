// Gesten-Erkennung der Weltkarte: Ziehen (Maus/ein Finger), Pinch-Zoom
// (zwei Finger), Mausrad/Trackpad und Doppeltipp/-klick. Meldet reine
// Absichten – was damit passiert, entscheidet die Kamera bzw. PfadKarte.
import { PointerEvent as ReactPointerEvent, RefObject, useEffect, useRef } from "react";
import { KAMERA } from "./kartenKonfig";

interface GestenZiele {
  verschiebe(dx: number, dy: number): void;
  zoomAufPunkt(px: number, py: number, faktor: number): void;
  doppelTipp(px: number, py: number): void;
  losgelassen(vx: number, vy: number): void; // Geschwindigkeit in px/ms
}

export function useGesten(
  rahmenRef: RefObject<HTMLDivElement | null>,
  ziele: GestenZiele,
) {
  const zeiger = useRef<Map<number, { x: number; y: number }>>(new Map());
  const zugDistanz = useRef(0);
  const letzterTap = useRef<{ zeit: number; x: number; y: number } | null>(null);
  const geschwindigkeit = useRef({ vx: 0, vy: 0, zeit: 0 });
  const zieleRef = useRef(ziele);
  zieleRef.current = ziele;

  // Mausrad/Trackpad: bewusst manuell registriert – React-Wheel-Listener
  // sind passiv, preventDefault würde sonst nicht greifen.
  useEffect(() => {
    const rahmen = rahmenRef.current;
    if (!rahmen) return;
    const beiRad = (e: WheelEvent) => {
      e.preventDefault();
      const r = rahmen.getBoundingClientRect();
      zieleRef.current.zoomAufPunkt(
        e.clientX - r.left,
        e.clientY - r.top,
        Math.exp(-e.deltaY * 0.0016),
      );
    };
    rahmen.addEventListener("wheel", beiRad, { passive: false });
    return () => rahmen.removeEventListener("wheel", beiRad);
  }, [rahmenRef]);

  const beiRunter = (e: ReactPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.current.size === 1) {
      zugDistanz.current = 0;
      geschwindigkeit.current = { vx: 0, vy: 0, zeit: performance.now() };
    }
  };

  const beiBewegung = (e: ReactPointerEvent) => {
    const vorher = zeiger.current.get(e.pointerId);
    if (!vorher) return;
    const aktuell = { x: e.clientX, y: e.clientY };

    if (zeiger.current.size === 1) {
      const dx = aktuell.x - vorher.x;
      const dy = aktuell.y - vorher.y;
      zugDistanz.current += Math.abs(dx) + Math.abs(dy);
      zieleRef.current.verschiebe(dx, dy);
      // Geschwindigkeit exponentiell glätten (für die Trägheit).
      const jetzt = performance.now();
      const dt = Math.max(jetzt - geschwindigkeit.current.zeit, 1);
      geschwindigkeit.current = {
        vx: 0.7 * (dx / dt) + 0.3 * geschwindigkeit.current.vx,
        vy: 0.7 * (dy / dt) + 0.3 * geschwindigkeit.current.vy,
        zeit: jetzt,
      };
    } else if (zeiger.current.size === 2) {
      const [a, b] = [...zeiger.current.entries()];
      const anderer = a[0] === e.pointerId ? b[1] : a[1];
      const abstandVorher = Math.hypot(vorher.x - anderer.x, vorher.y - anderer.y);
      const abstandJetzt = Math.hypot(aktuell.x - anderer.x, aktuell.y - anderer.y);
      zugDistanz.current += KAMERA.ziehSchwelle; // Pinch ist nie ein Tipp
      if (abstandVorher > 0) {
        const r = rahmenRef.current?.getBoundingClientRect();
        zieleRef.current.zoomAufPunkt(
          (aktuell.x + anderer.x) / 2 - (r?.left ?? 0),
          (aktuell.y + anderer.y) / 2 - (r?.top ?? 0),
          abstandJetzt / abstandVorher,
        );
      }
    }
    zeiger.current.set(e.pointerId, aktuell);
  };

  const beiHoch = (e: ReactPointerEvent) => {
    zeiger.current.delete(e.pointerId);
    if (zugDistanz.current > KAMERA.ziehSchwelle) {
      letzterTap.current = null;
      // Wischgeste beendet → Kamera darf ausgleiten.
      if (zeiger.current.size === 0) {
        const alter = performance.now() - geschwindigkeit.current.zeit;
        if (alter < 80) {
          zieleRef.current.losgelassen(
            geschwindigkeit.current.vx,
            geschwindigkeit.current.vy,
          );
        }
      }
      return;
    }
    // Doppeltipp/-klick erkennen.
    const jetzt = performance.now();
    const tap = { zeit: jetzt, x: e.clientX, y: e.clientY };
    const letzter = letzterTap.current;
    if (
      letzter &&
      jetzt - letzter.zeit < KAMERA.doppelTippMs &&
      Math.hypot(tap.x - letzter.x, tap.y - letzter.y) < KAMERA.doppelTippRadius
    ) {
      letzterTap.current = null;
      const r = rahmenRef.current?.getBoundingClientRect();
      zieleRef.current.doppelTipp(tap.x - (r?.left ?? 0), tap.y - (r?.top ?? 0));
    } else {
      letzterTap.current = tap;
    }
  };

  const beiAbbruch = (e: ReactPointerEvent) => {
    zeiger.current.delete(e.pointerId);
  };

  // Guard für Knoten-Klicks: nach einer Zieh-Geste kein Klick auslösen.
  const wurdeGezogen = () => zugDistanz.current > KAMERA.ziehSchwelle;

  return {
    handler: {
      onPointerDown: beiRunter,
      onPointerMove: beiBewegung,
      onPointerUp: beiHoch,
      onPointerCancel: beiAbbruch,
    },
    wurdeGezogen,
  };
}
