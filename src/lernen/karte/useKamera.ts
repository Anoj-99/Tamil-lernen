// Die Kamera der Weltkarte: Transform-Zustand, Begrenzung auf die Welt,
// programmierte Kamerafahrten (weiche CSS-Transition) und Trägheit nach
// Wischgesten (rAF-Ausgleiten mit Dämpfung).
import { useCallback, useEffect, useRef, useState } from "react";
import { KAMERA, KARTE } from "./kartenKonfig";

export interface Kamera {
  tx: number;
  ty: number;
  s: number;
}

export interface Fenster {
  b: number;
  h: number;
}

// Kamera so begrenzen, dass die Karte nicht aus dem Fenster driftet.
function klemme(kamera: Kamera, fenster: Fenster, weltHoehe: number): Kamera {
  const inhaltB = KARTE.breite * kamera.s;
  const inhaltH = weltHoehe * kamera.s;
  const txA = KAMERA.rand;
  const txB = fenster.b - inhaltB - KAMERA.rand;
  const tyA = KAMERA.rand;
  const tyB = fenster.h - inhaltH - KAMERA.rand;
  return {
    ...kamera,
    tx: Math.min(Math.max(kamera.tx, Math.min(txA, txB)), Math.max(txA, txB)),
    ty: Math.min(Math.max(kamera.ty, Math.min(tyA, tyB)), Math.max(tyA, tyB)),
  };
}

export function useKamera(fenster: Fenster, weltHoehe: number) {
  const [kamera, setKamera] = useState<Kamera>({ tx: 0, ty: 0, s: 1 });
  const [animiert, setAnimiert] = useState(false);
  const traegheitAnim = useRef<number | null>(null);

  const passZoom = Math.max(0.3, (fenster.b - 24) / KARTE.breite);
  const minZoom = passZoom * KAMERA.minZoomFaktor;

  const stoppeTraegheit = useCallback(() => {
    if (traegheitAnim.current !== null) {
      cancelAnimationFrame(traegheitAnim.current);
      traegheitAnim.current = null;
    }
  }, []);

  useEffect(() => stoppeTraegheit, [stoppeTraegheit]);

  // Weltpunkt in die Fenstermitte holen (weiche Kamerafahrt).
  const kameraAuf = useCallback(
    (wx: number, wy: number, s: number, mitAnimation = true) => {
      stoppeTraegheit();
      const zoom = Math.min(KAMERA.maxZoom, Math.max(minZoom, s));
      setAnimiert(mitAnimation);
      setKamera(
        klemme(
          { tx: fenster.b / 2 - wx * zoom, ty: fenster.h / 2 - wy * zoom, s: zoom },
          fenster,
          weltHoehe,
        ),
      );
    },
    [fenster, weltHoehe, minZoom, stoppeTraegheit],
  );

  // Zoom um einen Fensterpunkt herum (Mausrad, Pinch, Doppeltipp).
  const zoomAufPunkt = useCallback(
    (px: number, py: number, faktor: number) => {
      stoppeTraegheit();
      setAnimiert(false);
      setKamera((alt) => {
        const s = Math.min(KAMERA.maxZoom, Math.max(minZoom, alt.s * faktor));
        const wx = (px - alt.tx) / alt.s;
        const wy = (py - alt.ty) / alt.s;
        return klemme({ tx: px - wx * s, ty: py - wy * s, s }, fenster, weltHoehe);
      });
    },
    [fenster, weltHoehe, minZoom, stoppeTraegheit],
  );

  // Direkte Verschiebung während einer Zieh-Geste.
  const verschiebe = useCallback(
    (dx: number, dy: number) => {
      stoppeTraegheit();
      setAnimiert(false);
      setKamera((alt) =>
        klemme({ ...alt, tx: alt.tx + dx, ty: alt.ty + dy }, fenster, weltHoehe),
      );
    },
    [fenster, weltHoehe, stoppeTraegheit],
  );

  // Trägheit: nach dem Loslassen gleitet die Kamera sanft aus.
  const gleiteAus = useCallback(
    (vx: number, vy: number) => {
      if (Math.hypot(vx, vy) < KAMERA.traegheitStart) return;
      stoppeTraegheit();
      setAnimiert(false);
      let gvx = vx;
      let gvy = vy;
      let letzteZeit = performance.now();
      const schritt = (jetzt: number) => {
        const dt = Math.min(jetzt - letzteZeit, 48);
        letzteZeit = jetzt;
        setKamera((alt) =>
          klemme(
            { ...alt, tx: alt.tx + gvx * dt, ty: alt.ty + gvy * dt },
            fenster,
            weltHoehe,
          ),
        );
        const daempfung = Math.pow(KAMERA.traegheitDaempfung, dt / 16);
        gvx *= daempfung;
        gvy *= daempfung;
        if (Math.hypot(gvx, gvy) > KAMERA.traegheitStopp) {
          traegheitAnim.current = requestAnimationFrame(schritt);
        } else {
          traegheitAnim.current = null;
        }
      };
      traegheitAnim.current = requestAnimationFrame(schritt);
    },
    [fenster, weltHoehe, stoppeTraegheit],
  );

  return {
    kamera,
    animiert,
    passZoom,
    kameraAuf,
    zoomAufPunkt,
    verschiebe,
    gleiteAus,
    stoppeTraegheit,
  };
}
