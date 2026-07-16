// Die Weltkarte: dünne Komposition der Ebenen und Hooks.
//   Ebene 0 (Welt) → Ebene 1 (Landschaft) → Ebene 2 (Weg) → Ebene 3
//   (Gameplay) → Avatar, dazu Kamera + Gesten + Overlays.
// Reine Darstellung und Interaktion – welche Knoten offen sind und was
// beim Öffnen passiert, entscheidet weiterhin die PfadSeite.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AvatarFigur from "./AvatarFigur";
import GameplayEbene from "./GameplayEbene";
import { KAMERA, KARTE, KnotenStatus } from "./kartenKonfig";
import KartenDeko from "./KartenDeko";
import { KartenKnoten, KartenLayout } from "./kartenLayout";
import LandschaftEbene from "./LandschaftEbene";
import { baueLandschaft, baueWegSchmuck, baueWegSteine } from "./landschaft";
import { sichtbarerBereich } from "./sichtfenster";
import { useAvatarLauf } from "./useAvatarLauf";
import { useGesten } from "./useGesten";
import { useKamera } from "./useKamera";
import WegEbene from "./WegEbene";

export type { KnotenStatus };

// Dezente Papierkörnung als statisches Overlay über dem Viewport
// (screen-space, dadurch performant – kein Filter über der Welt-SVG).
const KOERNUNG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='k'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23k)'/%3E%3C/svg%3E\")";

interface Props {
  layout: KartenLayout;
  statusFuer: (knoten: KartenKnoten) => KnotenStatus;
  avatarEmoji: string;
  startKnotenId: string; // aktueller Fortschritt – hier steht der Avatar
  onKnoten: (knoten: KartenKnoten) => void;
  // Offene Side-Quest hinter dem Fortschritt → Hinweis oben rechts
  hinweisQuest: KartenKnoten | null;
}

export default function PfadKarte({
  layout,
  statusFuer,
  avatarEmoji,
  startKnotenId,
  onKnoten,
  hinweisQuest,
}: Props) {
  const rahmenRef = useRef<HTMLDivElement>(null);
  // Startet bei 0×0: Kamera wird erst nach echter Messung initialisiert.
  const [fenster, setFenster] = useState({ b: 0, h: 0 });

  const kamera = useKamera(fenster, layout.hoehe);
  const avatar = useAvatarLauf(layout, startKnotenId);

  // Fenstergröße beobachten (Smartphone bis Desktop).
  useLayoutEffect(() => {
    const rahmen = rahmenRef.current;
    if (!rahmen) return;
    const messen = () => setFenster({ b: rahmen.clientWidth, h: rahmen.clientHeight });
    messen();
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(rahmen);
    return () => beobachter.disconnect();
  }, []);

  // Start: Kamera zentriert den Avatar in der Übersicht.
  const initialisiert = useRef(false);
  useEffect(() => {
    if (initialisiert.current || fenster.b === 0) return;
    const start =
      layout.knoten.find((k) => k.id === startKnotenId) ?? layout.hauptpfad[0];
    if (!start) return;
    initialisiert.current = true;
    kamera.kameraAuf(start.x, start.y, kamera.passZoom, false);
  }, [fenster, layout, startKnotenId, kamera]);

  const gesten = useGesten(rahmenRef, {
    verschiebe: kamera.verschiebe,
    zoomAufPunkt: kamera.zoomAufPunkt,
    losgelassen: kamera.gleiteAus,
    doppelTipp: (px, py) => {
      const wx = (px - kamera.kamera.tx) / kamera.kamera.s;
      const wy = (py - kamera.kamera.ty) / kamera.kamera.s;
      if (kamera.kamera.s < KAMERA.detailAb) {
        kamera.kameraAuf(wx, wy, KAMERA.detailZoom);
      } else {
        kamera.kameraAuf(wx, wy, kamera.passZoom);
      }
    },
  });

  // Ebene 1/2-Darstellungsdaten – einmal pro Layout berechnet.
  const landschaftsDaten = useMemo(
    () => baueLandschaft(layout.weg, layout.welt),
    [layout],
  );
  const wegSteine = useMemo(() => baueWegSteine(layout.weg), [layout]);
  const wegSchmuck = useMemo(() => baueWegSchmuck(layout.weg), [layout]);
  const biom = layout.welt.biomBei(0);

  const knotenAntippen = (knoten: KartenKnoten) => {
    if (avatar.laeuft || gesten.wurdeGezogen()) return;
    if (statusFuer(knoten) === "gesperrt") return;
    // 1. Kamera zentriert das Ziel, 2. Avatar läuft sichtbar hin,
    // 3. erst danach öffnet sich die Ansicht.
    kamera.kameraAuf(knoten.x, knoten.y, Math.max(kamera.kamera.s, KAMERA.detailAb));
    avatar.laufeZu(knoten, () => onKnoten(knoten));
  };

  const bereich = sichtbarerBereich(kamera.kamera.ty, kamera.kamera.s, fenster.h);
  const detailFaktor = Math.min(
    1,
    Math.max(0, (kamera.kamera.s - KAMERA.detailAb) / (KAMERA.detailZoom - KAMERA.detailAb)),
  );

  return (
    <div
      ref={rahmenRef}
      className="relative h-[82dvh] min-h-[620px] w-full touch-none select-none overflow-hidden rounded-[2rem] border border-emerald-900/20 md:h-[76vh]"
      style={{ background: biom.farben.wasser }}
      {...gesten.handler}
      // Browser können overflow-hidden-Container programmatisch scrollen
      // (z.B. scrollIntoView) – das würde an der Kamera vorbei
      // verschieben, deshalb sofort zurücksetzen.
      onScroll={(e) => {
        e.currentTarget.scrollTop = 0;
        e.currentTarget.scrollLeft = 0;
      }}
      role="application"
      aria-label="Lernpfad-Karte: Reise durch Sri Lanka"
    >
      <div
        style={{
          width: KARTE.breite,
          height: layout.weltHoehe,
          transform: `translate(${kamera.kamera.tx}px, ${kamera.kamera.ty}px) scale(${kamera.kamera.s})`,
          transformOrigin: "0 0",
          transition: kamera.animiert
            ? `transform ${KAMERA.flugDauerMs}ms cubic-bezier(0.33, 1, 0.68, 1)`
            : undefined,
        }}
      >
        <svg
          width={KARTE.breite}
          height={layout.weltHoehe}
          viewBox={`0 0 ${KARTE.breite} ${layout.weltHoehe}`}
          className="block"
        >
          <KartenDeko />
          <LandschaftEbene
            biom={biom}
            daten={landschaftsDaten}
            weltHoehe={layout.weltHoehe}
            bereich={bereich}
          />
          <WegEbene
            weg={layout.weg}
            biom={biom}
            steine={wegSteine}
            schmuck={wegSchmuck}
            bereich={bereich}
          />
          <GameplayEbene
            layout={layout}
            biom={biom}
            statusFuer={statusFuer}
            detailFaktor={detailFaktor}
            bereich={bereich}
            onTippen={knotenAntippen}
          />
          {avatar.position && (
            <AvatarFigur position={avatar.position} laeuft={avatar.laeuft} emoji={avatarEmoji} />
          )}
        </svg>
      </div>

      {/* Papierkörnung über der ganzen Szene */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: KOERNUNG }}
      />

      {/* Hinweis oben rechts: offene Hausaufgabe hinter dem Fortschritt */}
      {hinweisQuest && (
        <button
          type="button"
          onClick={() =>
            kamera.kameraAuf(hinweisQuest.x, hinweisQuest.y, KAMERA.detailZoom)
          }
          className="karte-steinknopf absolute right-3 top-3 min-h-11 rounded-2xl px-4 py-2 text-xs font-semibold text-stone-800 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
        >
          Offene Hausaufgabe
        </button>
      )}

      {/* Kartensymbol unten rechts: zurück zur Übersicht beim Avatar */}
      <button
        type="button"
        onClick={() => {
          const pos = avatar.position ?? { x: KARTE.breite / 2, y: KARTE.randOben };
          kamera.kameraAuf(pos.x, pos.y, kamera.passZoom);
        }}
        aria-label="Zur Übersicht"
        className="karte-steinknopf absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-[45%_55%_48%_52%] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m3.5 5.5 5-2 7 2.5 5-2v14.5l-5 2-7-2.5-5 2z" strokeLinejoin="round" />
          <path d="M8.5 3.5V18M15.5 6v14.5" />
          <path d="M11 9.5c1.6-1.7 4.1-1.5 5.2.3 1.1 1.8.1 4.3-2.7 6.3-2.8-2-3.8-4.5-2.5-6.6Z" fill="currentColor" stroke="none" />
        </svg>
      </button>

      <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1 text-[11px] text-slate-500">
        Ziehen zum Bewegen · Doppeltippen/Kneifen zum Zoomen
      </p>
    </div>
  );
}
