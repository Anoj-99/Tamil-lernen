// Der Avatar-Lauf: bewegt den Avatar entlang der Bogenlänge des Wegs
// (folgt also echten Kurven, vor- und rückwärts) – niemals teleportiert.
// Side-Quests liegen neben dem Weg: dorthin führt ein gerades Endstück
// ab dem Abzweigpunkt, zurück entsprechend zuerst zum Weg.
import { useCallback, useEffect, useRef, useState } from "react";
import { AVATAR } from "./kartenKonfig";
import { KartenKnoten, KartenLayout } from "./kartenLayout";
import { WegPunkt } from "./wegGenerator";

// Sanftes Ein- und Auslaufen (easeInOutQuad).
function eased(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function useAvatarLauf(layout: KartenLayout, startKnotenId: string) {
  const [position, setPosition] = useState<WegPunkt | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const knotenId = useRef(startKnotenId);
  const anim = useRef<number | null>(null);

  // Beim (Neu-)Aufbau der Karte steht der Avatar am aktuellen Fortschritt.
  const initialisiert = useRef(false);
  useEffect(() => {
    if (initialisiert.current) return;
    const start = layout.knoten.find((k) => k.id === startKnotenId) ?? layout.hauptpfad[0];
    if (!start) return;
    initialisiert.current = true;
    knotenId.current = start.id;
    setPosition({ x: start.x, y: start.y });
  }, [layout, startKnotenId]);

  useEffect(
    () => () => {
      if (anim.current) cancelAnimationFrame(anim.current);
    },
    [],
  );

  const laufeZu = useCallback(
    (ziel: KartenKnoten, amZiel: () => void) => {
      const start = layout.knoten.find((k) => k.id === knotenId.current);
      if (!start || start.id === ziel.id) {
        knotenId.current = ziel.id;
        setPosition({ x: ziel.x, y: ziel.y });
        amZiel();
        return;
      }

      // Drei Abschnitte, von denen je nach Start/Ziel welche leer sind:
      // 1. von einer Quest gerade zurück auf den Weg
      // 2. auf dem Weg entlang der Bogenlänge (vor- oder rückwärts)
      // 3. vom Weg gerade zu einer Quest
      const questStart = start.typ === "quest" ? start : null;
      const questZiel = ziel.typ === "quest" ? ziel : null;
      const vonL = start.bogenlaenge;
      const zielL = ziel.bogenlaenge;

      const startAbzweig = layout.weg.positionBei(vonL);
      const zielAbzweig = layout.weg.positionBei(zielL);
      const laengeStartAst = questStart
        ? Math.hypot(questStart.x - startAbzweig.x, questStart.y - startAbzweig.y)
        : 0;
      const laengeWeg = Math.abs(zielL - vonL);
      const laengeZielAst = questZiel
        ? Math.hypot(questZiel.x - zielAbzweig.x, questZiel.y - zielAbzweig.y)
        : 0;
      const gesamt = laengeStartAst + laengeWeg + laengeZielAst;

      const positionBeiFortschritt = (strecke: number): WegPunkt => {
        if (questStart && strecke < laengeStartAst) {
          const t = laengeStartAst === 0 ? 1 : strecke / laengeStartAst;
          return {
            x: questStart.x + (startAbzweig.x - questStart.x) * t,
            y: questStart.y + (startAbzweig.y - questStart.y) * t,
          };
        }
        const aufWeg = strecke - laengeStartAst;
        if (aufWeg < laengeWeg) {
          const richtung = zielL >= vonL ? 1 : -1;
          return layout.weg.positionBei(vonL + richtung * aufWeg);
        }
        if (questZiel) {
          const rest = aufWeg - laengeWeg;
          const t = laengeZielAst === 0 ? 1 : Math.min(1, rest / laengeZielAst);
          return {
            x: zielAbzweig.x + (questZiel.x - zielAbzweig.x) * t,
            y: zielAbzweig.y + (questZiel.y - zielAbzweig.y) * t,
          };
        }
        return { x: ziel.x, y: ziel.y };
      };

      setLaeuft(true);
      const dauer = Math.min(
        AVATAR.laufMaxMs,
        AVATAR.laufBasisMs + gesamt * AVATAR.laufMsProWeltPx,
      );
      const startZeit = performance.now();
      const schritt = (jetzt: number) => {
        const t = Math.min(1, (jetzt - startZeit) / dauer);
        setPosition(positionBeiFortschritt(eased(t) * gesamt));
        if (t < 1) {
          anim.current = requestAnimationFrame(schritt);
        } else {
          setPosition({ x: ziel.x, y: ziel.y });
          knotenId.current = ziel.id;
          setLaeuft(false);
          window.setTimeout(amZiel, AVATAR.oeffnenVerzoegerungMs);
        }
      };
      anim.current = requestAnimationFrame(schritt);
    },
    [layout],
  );

  return { position, laeuft, laufeZu };
}
