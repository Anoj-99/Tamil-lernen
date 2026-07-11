import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KARTE_BREITE,
  KartenKnoten,
  KartenLayout,
  wegKurve,
} from "./kartenLayout";
import KartenDeko from "./KartenDeko";

export type KnotenStatus = "gesperrt" | "offen" | "fertig";

interface Kamera {
  tx: number;
  ty: number;
  s: number;
}

interface Props {
  layout: KartenLayout;
  statusFuer: (knoten: KartenKnoten) => KnotenStatus;
  avatarEmoji: string;
  startKnotenId: string; // aktueller Fortschritt – hier steht der Avatar
  onKnoten: (knoten: KartenKnoten) => void;
  // Offene Side-Quest hinter dem Fortschritt → Hinweis oben rechts
  hinweisQuest: KartenKnoten | null;
}

const DETAIL_AB = 0.9; // ab diesem Zoom erscheinen die Lektions-Steine
const DETAIL_ZOOM = 1.15;
const MAX_ZOOM = 2.4;

// Die Spielkarte: eine frei schwenk- und zoombare Sri-Lanka-Welt. Sie ist
// rein darstellend – welche Knoten offen/gesperrt sind und was beim Öffnen
// passiert, entscheidet weiterhin die PfadSeite (bestehende Logik).
export default function PfadKarte({
  layout,
  statusFuer,
  avatarEmoji,
  startKnotenId,
  onKnoten,
  hinweisQuest,
}: Props) {
  const rahmenRef = useRef<HTMLDivElement>(null);
  // Startet bei 0×0: Die Kamera wird erst initialisiert, wenn die echte
  // Containergröße gemessen wurde (sonst zentriert sie an der falschen
  // Stelle, z.B. auf schmalen Handy-Displays).
  const [fenster, setFenster] = useState({ b: 0, h: 0 });
  const [kamera, setKamera] = useState<Kamera>({ tx: 0, ty: 0, s: 0.6 });
  const [animiert, setAnimiert] = useState(false);
  const [avatarKnotenId, setAvatarKnotenId] = useState(startKnotenId);
  const [avatarPos, setAvatarPos] = useState<{ x: number; y: number } | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  const zeiger = useRef<Map<number, { x: number; y: number }>>(new Map());
  const bewegt = useRef(0); // zurückgelegte Drag-Distanz seit pointerdown
  const letzterTap = useRef<{ zeit: number; x: number; y: number } | null>(null);
  const laufAnim = useRef<number | null>(null);

  const passZoom = Math.max(0.3, (fenster.b - 24) / KARTE_BREITE);
  const minZoom = passZoom * 0.85;

  const knotenById = useMemo(() => {
    const m = new Map<string, KartenKnoten>();
    for (const k of layout.knoten) m.set(k.id, k);
    return m;
  }, [layout]);

  // Kamera so setzen, dass ein Weltpunkt in der Mitte des Fensters liegt.
  const kameraAuf = useCallback(
    (wx: number, wy: number, s: number, mitAnimation = true) => {
      const geklemmt = Math.min(MAX_ZOOM, Math.max(minZoom, s));
      setAnimiert(mitAnimation);
      setKamera(
        klemmeKamera(
          { tx: fenster.b / 2 - wx * geklemmt, ty: fenster.h / 2 - wy * geklemmt, s: geklemmt },
          fenster,
          layout.hoehe,
        ),
      );
    },
    [fenster, layout.hoehe, minZoom],
  );

  // Fenstergröße beobachten (responsiv: Handy bis Desktop).
  useLayoutEffect(() => {
    const rahmen = rahmenRef.current;
    if (!rahmen) return;
    const messen = () =>
      setFenster({ b: rahmen.clientWidth, h: rahmen.clientHeight });
    messen();
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(rahmen);
    return () => beobachter.disconnect();
  }, []);

  // Start: Avatar steht beim aktuellen Fortschritt, Kamera zentriert ihn
  // in der Übersicht (nur Level-Steine sichtbar).
  const initialisiert = useRef(false);
  useEffect(() => {
    const start = knotenById.get(startKnotenId) ?? layout.hauptpfad[0];
    if (!start) return;
    if (!initialisiert.current) {
      setAvatarKnotenId(start.id);
      setAvatarPos({ x: start.x, y: start.y });
    }
    if (fenster.b > 0 && !initialisiert.current) {
      initialisiert.current = true;
      kameraAuf(start.x, start.y, passZoom, false);
    }
  }, [startKnotenId, knotenById, layout, fenster, kameraAuf, passZoom]);

  // Mausrad-/Trackpad-Zoom (bewusst manuell registriert: React-Wheel-Listener
  // sind passiv, preventDefault würde sonst nicht greifen).
  useEffect(() => {
    const rahmen = rahmenRef.current;
    if (!rahmen) return;
    const beiRad = (e: WheelEvent) => {
      e.preventDefault();
      const faktor = Math.exp(-e.deltaY * 0.0016);
      const r = rahmen.getBoundingClientRect();
      zoomAufPunkt(e.clientX - r.left, e.clientY - r.top, faktor);
    };
    rahmen.addEventListener("wheel", beiRad, { passive: false });
    return () => rahmen.removeEventListener("wheel", beiRad);
  });

  const zoomAufPunkt = (px: number, py: number, faktor: number) => {
    setAnimiert(false);
    setKamera((alt) => {
      const s = Math.min(MAX_ZOOM, Math.max(minZoom, alt.s * faktor));
      const wx = (px - alt.tx) / alt.s;
      const wy = (py - alt.ty) / alt.s;
      return klemmeKamera(
        { tx: px - wx * s, ty: py - wy * s, s },
        fenster,
        layout.hoehe,
      );
    });
  };

  // --- Gesten: Ziehen (1 Finger/Maus), Pinch (2 Finger), Doppeltipp -------

  const beiZeigerRunter = (e: ReactPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.current.size === 1) bewegt.current = 0;
    setAnimiert(false);
  };

  const beiZeigerBewegung = (e: ReactPointerEvent) => {
    const vorher = zeiger.current.get(e.pointerId);
    if (!vorher) return;
    const aktuell = { x: e.clientX, y: e.clientY };

    if (zeiger.current.size === 1) {
      const dx = aktuell.x - vorher.x;
      const dy = aktuell.y - vorher.y;
      bewegt.current += Math.abs(dx) + Math.abs(dy);
      setKamera((alt) =>
        klemmeKamera({ ...alt, tx: alt.tx + dx, ty: alt.ty + dy }, fenster, layout.hoehe),
      );
    } else if (zeiger.current.size === 2) {
      const [a, b] = [...zeiger.current.entries()];
      const anderer = a[0] === e.pointerId ? b[1] : a[1];
      const abstandVorher = Math.hypot(vorher.x - anderer.x, vorher.y - anderer.y);
      const abstandJetzt = Math.hypot(aktuell.x - anderer.x, aktuell.y - anderer.y);
      bewegt.current += 10;
      if (abstandVorher > 0) {
        const r = rahmenRef.current?.getBoundingClientRect();
        const mx = (aktuell.x + anderer.x) / 2 - (r?.left ?? 0);
        const my = (aktuell.y + anderer.y) / 2 - (r?.top ?? 0);
        zoomAufPunkt(mx, my, abstandJetzt / abstandVorher);
      }
    }
    zeiger.current.set(e.pointerId, aktuell);
  };

  const beiZeigerHoch = (e: ReactPointerEvent) => {
    zeiger.current.delete(e.pointerId);
    if (bewegt.current > 12) {
      letzterTap.current = null;
      return;
    }
    // Doppeltipp/-klick: zwischen Übersicht und Detailansicht wechseln.
    const jetzt = performance.now();
    const tap = { zeit: jetzt, x: e.clientX, y: e.clientY };
    const letzter = letzterTap.current;
    if (
      letzter &&
      jetzt - letzter.zeit < 340 &&
      Math.hypot(tap.x - letzter.x, tap.y - letzter.y) < 48
    ) {
      letzterTap.current = null;
      const r = rahmenRef.current?.getBoundingClientRect();
      const px = tap.x - (r?.left ?? 0);
      const py = tap.y - (r?.top ?? 0);
      const wx = (px - kamera.tx) / kamera.s;
      const wy = (py - kamera.ty) / kamera.s;
      if (kamera.s < DETAIL_AB) {
        kameraAuf(wx, wy, DETAIL_ZOOM);
      } else {
        kameraAuf(wx, wy, passZoom);
      }
    } else {
      letzterTap.current = tap;
    }
  };

  // --- Avatar läuft den Weg entlang (niemals teleportieren) ---------------

  const routeZu = (ziel: KartenKnoten): { x: number; y: number }[] => {
    const pfadIndex = (id: string) => layout.hauptpfad.findIndex((k) => k.id === id);
    const questAnker = (k: KartenKnoten) =>
      layout.questPfade.find((q) => q.knoten.id === k.id)?.von;

    const start = knotenById.get(avatarKnotenId);
    // Startpunkt auf dem Hauptweg (steht der Avatar auf einer Quest, ist
    // ihr Abzweigpunkt der Einstieg zurück auf den Weg).
    let startIndex: number;
    const vorweg: { x: number; y: number }[] = [];
    if (start && start.typ === "quest") {
      const anker = questAnker(start);
      startIndex = layout.hauptpfad.findIndex(
        (k) => anker && k.x === anker.x && k.y === anker.y,
      );
      if (startIndex < 0) startIndex = 0;
    } else {
      startIndex = start ? pfadIndex(start.id) : 0;
      if (startIndex < 0) startIndex = 0;
    }

    let zielIndex: number;
    const nachweg: { x: number; y: number }[] = [];
    if (ziel.typ === "quest") {
      const anker = questAnker(ziel);
      zielIndex = layout.hauptpfad.findIndex(
        (k) => anker && k.x === anker.x && k.y === anker.y,
      );
      if (zielIndex < 0) zielIndex = layout.hauptpfad.length - 1;
      nachweg.push({ x: ziel.x, y: ziel.y });
    } else {
      zielIndex = pfadIndex(ziel.id);
      if (zielIndex < 0) zielIndex = 0;
    }

    const dazwischen =
      startIndex <= zielIndex
        ? layout.hauptpfad.slice(startIndex, zielIndex + 1)
        : layout.hauptpfad.slice(zielIndex, startIndex + 1).reverse();

    return [...vorweg, ...dazwischen.map((k) => ({ x: k.x, y: k.y })), ...nachweg];
  };

  const knotenAntippen = (knoten: KartenKnoten) => {
    if (laeuft || bewegt.current > 12) return;
    if (statusFuer(knoten) === "gesperrt") return;

    // Steht der Avatar schon dort, direkt öffnen.
    if (knoten.id === avatarKnotenId) {
      onKnoten(knoten);
      return;
    }

    // 1. Kamera zentriert das Ziel, 2. Avatar läuft sichtbar hin,
    // 3. erst danach öffnet sich die Ansicht.
    const punkte = routeZu(knoten);
    if (punkte.length < 2) {
      setAvatarKnotenId(knoten.id);
      setAvatarPos({ x: knoten.x, y: knoten.y });
      onKnoten(knoten);
      return;
    }
    setLaeuft(true);
    kameraAuf(knoten.x, knoten.y, Math.max(kamera.s, DETAIL_AB));

    const laengen: number[] = [];
    let gesamt = 0;
    for (let i = 1; i < punkte.length; i++) {
      const l = Math.hypot(punkte[i].x - punkte[i - 1].x, punkte[i].y - punkte[i - 1].y);
      laengen.push(l);
      gesamt += l;
    }
    const dauer = Math.min(1400, 300 + gesamt * 1.4);
    const startZeit = performance.now();

    const schritt = (jetzt: number) => {
      const t = Math.min(1, (jetzt - startZeit) / dauer);
      // sanftes Ein-/Auslaufen
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      let rest = eased * gesamt;
      let i = 0;
      while (i < laengen.length && rest > laengen[i]) {
        rest -= laengen[i];
        i++;
      }
      if (i >= laengen.length) {
        setAvatarPos({ ...punkte[punkte.length - 1] });
      } else {
        const anteil = laengen[i] === 0 ? 1 : rest / laengen[i];
        setAvatarPos({
          x: punkte[i].x + (punkte[i + 1].x - punkte[i].x) * anteil,
          y: punkte[i].y + (punkte[i + 1].y - punkte[i].y) * anteil,
        });
      }
      if (t < 1) {
        laufAnim.current = requestAnimationFrame(schritt);
      } else {
        setAvatarKnotenId(knoten.id);
        setLaeuft(false);
        window.setTimeout(() => onKnoten(knoten), 220);
      }
    };
    laufAnim.current = requestAnimationFrame(schritt);
  };

  useEffect(
    () => () => {
      if (laufAnim.current) cancelAnimationFrame(laufAnim.current);
    },
    [],
  );

  // --- Rendern -------------------------------------------------------------

  const detailSichtbar = kamera.s >= DETAIL_AB;

  // Nur rendern, was (großzügig) im Bild ist – so bleibt die Karte auch
  // mit vielen hundert Leveln flüssig.
  const sichtbarVonY = (-kamera.ty) / kamera.s - 350;
  const sichtbarBisY = (fenster.h - kamera.ty) / kamera.s + 350;
  const imBild = (y: number) => y >= sichtbarVonY && y <= sichtbarBisY;

  const hauptWeg = useMemo(() => wegKurve(layout.hauptpfad), [layout]);

  const steinFarben = (status: KnotenStatus) => {
    switch (status) {
      case "fertig":
        return { fuellung: "#34a24f", rand: "#1d7a35", text: "#ffffff" };
      case "offen":
        return { fuellung: "#f0c96a", rand: "#c99b3f", text: "#5b4514" };
      default:
        return { fuellung: "#c8c8c4", rand: "#a9a9a4", text: "#77776f" };
    }
  };

  return (
    <div
      ref={rahmenRef}
      className="relative h-[68vh] min-h-80 w-full touch-none select-none overflow-hidden rounded-3xl border border-emerald-200 bg-[#bfe6f5]"
      onPointerDown={beiZeigerRunter}
      onPointerMove={beiZeigerBewegung}
      onPointerUp={beiZeigerHoch}
      onPointerCancel={(e) => zeiger.current.delete(e.pointerId)}
      // Browser können overflow-hidden-Container programmatisch scrollen
      // (z.B. scrollIntoView bei Fokus) – das würde an der Kamera vorbei
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
          width: KARTE_BREITE,
          height: layout.hoehe,
          transform: `translate(${kamera.tx}px, ${kamera.ty}px) scale(${kamera.s})`,
          transformOrigin: "0 0",
          transition: animiert ? "transform 0.7s cubic-bezier(0.33, 1, 0.68, 1)" : undefined,
        }}
      >
        <svg
          width={KARTE_BREITE}
          height={layout.hoehe}
          viewBox={`0 0 ${KARTE_BREITE} ${layout.hoehe}`}
          className="block"
        >
          <KartenDeko />

          {/* Insel-Grund: Land mit weichem Küstenrand im Wasser */}
          <rect x="0" y="0" width={KARTE_BREITE} height={layout.hoehe} fill="#bfe6f5" />
          <rect
            x="26"
            y="26"
            width={KARTE_BREITE - 52}
            height={layout.hoehe - 52}
            rx="80"
            fill="#efe0b0"
          />
          <rect
            x="44"
            y="44"
            width={KARTE_BREITE - 88}
            height={layout.hoehe - 88}
            rx="66"
            fill="url(#karte-land)"
          />

          {/* Dekoration (reine Atmosphäre) */}
          {layout.deko.filter((d) => imBild(d.y)).map((d, i) => (
            <use
              key={i}
              href={`#deko-${d.symbol}`}
              x={-50}
              y={-90}
              width={100}
              height={100}
              transform={`translate(${d.x} ${d.y}) scale(${d.spiegeln ? -d.skala : d.skala} ${d.skala})`}
              opacity={0.92}
            />
          ))}

          {/* Der Steinweg */}
          <path d={hauptWeg} fill="none" stroke="#c8b088" strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={hauptWeg}
            fill="none"
            stroke="#e6d9bb"
            strokeWidth={26}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0.5 34"
          />

          {/* Side-Quest-Nebenwege (nur in der Detailansicht) */}
          <g
            style={{
              opacity: detailSichtbar ? 1 : 0,
              pointerEvents: detailSichtbar ? undefined : "none",
              transition: "opacity 0.35s ease",
            }}
          >
            {layout.questPfade.filter((q) => imBild(q.knoten.y)).map((q) => {
              const status = statusFuer(q.knoten);
              const farben = steinFarben(status === "gesperrt" ? "gesperrt" : status);
              return (
                <g key={q.knoten.id}>
                  <path
                    d={`M ${q.von.x} ${q.von.y} Q ${(q.von.x + q.knoten.x) / 2} ${q.von.y + 70} ${q.knoten.x} ${q.knoten.y}`}
                    fill="none"
                    stroke="#c8b088"
                    strokeWidth={14}
                    strokeDasharray="4 18"
                    strokeLinecap="round"
                  />
                  <g
                    role="button"
                    aria-label={`Side-Quest: ${q.knoten.name}`}
                    className="cursor-pointer"
                    onClick={() => knotenAntippen(q.knoten)}
                  >
                    <circle
                      cx={q.knoten.x}
                      cy={q.knoten.y}
                      r={24}
                      fill={status === "fertig" ? "#d3f0d9" : "#dbeafe"}
                      stroke={status === "fertig" ? "#34a24f" : "#5f8fd6"}
                      strokeWidth={4}
                      strokeDasharray={status === "fertig" ? undefined : "6 6"}
                    />
                    <text x={q.knoten.x} y={q.knoten.y + 8} textAnchor="middle" fontSize="22">
                      {status === "fertig" ? "✓" : "📌"}
                    </text>
                    <text
                      x={q.knoten.x}
                      y={q.knoten.y + 48}
                      textAnchor="middle"
                      fontSize="15"
                      fill={farben.rand}
                    >
                      {q.knoten.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Lektions-Steine (erscheinen erst beim Hineinzoomen) */}
          <g
            style={{
              opacity: detailSichtbar ? 1 : 0,
              pointerEvents: detailSichtbar ? undefined : "none",
              transition: "opacity 0.35s ease",
            }}
          >
            {layout.hauptpfad
              .filter((k) => k.typ === "lektion" && imBild(k.y))
              .map((k, index) => {
                const status = statusFuer(k);
                const farben = steinFarben(status);
                const nummer = (k.lektionId ?? "").split(".")[1] ?? String(index + 1);
                return (
                  <g
                    key={k.id}
                    role="button"
                    aria-label={`Lektion: ${k.name}`}
                    aria-disabled={status === "gesperrt"}
                    className={status === "gesperrt" ? "cursor-not-allowed" : "cursor-pointer"}
                    onClick={() => knotenAntippen(k)}
                  >
                    <ellipse cx={k.x} cy={k.y + 6} rx={27} ry={22} fill={farben.rand} />
                    <ellipse cx={k.x} cy={k.y} rx={27} ry={22} fill={farben.fuellung} />
                    <text
                      x={k.x}
                      y={k.y + 7}
                      textAnchor="middle"
                      fontSize="20"
                      fontWeight="700"
                      fill={farben.text}
                    >
                      {status === "gesperrt" ? "🔒" : status === "fertig" ? "✓" : nummer}
                    </text>
                    <text x={k.x} y={k.y + 44} textAnchor="middle" fontSize="15" fill="#4b5563">
                      {k.name}
                    </text>
                  </g>
                );
              })}
          </g>

          {/* Level-Steine (immer sichtbar, deutlich größer) */}
          {layout.hauptpfad
            .filter((k) => k.typ === "boss" && imBild(k.y))
            .map((k) => {
              const status = statusFuer(k);
              const farben = steinFarben(status);
              return (
                <g
                  key={k.id}
                  role="button"
                  aria-label={k.name}
                  aria-disabled={status === "gesperrt"}
                  className={status === "gesperrt" ? "cursor-not-allowed" : "cursor-pointer"}
                  onClick={() => knotenAntippen(k)}
                >
                  <g className={status === "offen" ? "stein-puls" : undefined}>
                    <ellipse cx={k.x} cy={k.y + 10} rx={52} ry={42} fill={farben.rand} />
                    <ellipse cx={k.x} cy={k.y} rx={52} ry={42} fill={farben.fuellung} />
                    <ellipse cx={k.x - 12} cy={k.y - 14} rx={20} ry={10} fill="#ffffff" opacity={0.25} />
                    <text x={k.x} y={k.y + 12} textAnchor="middle" fontSize="34">
                      {status === "gesperrt" ? "🔒" : status === "fertig" ? "🏆" : "⚔️"}
                    </text>
                  </g>
                  <text
                    x={k.x}
                    y={k.y + 72}
                    textAnchor="middle"
                    fontSize="19"
                    fontWeight="600"
                    fill={status === "gesperrt" ? "#9ca3af" : "#374151"}
                  >
                    {k.name}
                  </text>
                </g>
              );
            })}

          {/* Der Avatar (läuft sichtbar den Weg entlang) */}
          {avatarPos && (
            <g transform={`translate(${avatarPos.x} ${avatarPos.y - 34})`} aria-label="Dein Begleiter">
              <ellipse cx="0" cy="36" rx="14" ry="5" fill="#00000022" />
              {/* Wipp-Animation auf einer inneren Gruppe, damit die
                  CSS-Transformation die Positions-Transformation nicht
                  überschreibt (SVG: CSS transform schlägt Attribut). */}
              <g className={laeuft ? undefined : "karte-avatar-bob"}>
                <circle cx="0" cy="0" r="21" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
                <text x="0" y="9" textAnchor="middle" fontSize="26">
                  {avatarEmoji}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Hinweis oben rechts: offene Hausaufgabe hinter dem Fortschritt */}
      {hinweisQuest && (
        <button
          type="button"
          onClick={() => kameraAuf(hinweisQuest.x, hinweisQuest.y, DETAIL_ZOOM)}
          className="absolute right-3 top-3 rounded-full border border-blue-300 bg-white/95 px-3 py-1.5 text-xs font-medium text-blue-800 shadow hover:bg-blue-50"
        >
          📌 Offene Hausaufgabe
        </button>
      )}

      {/* Kartensymbol unten rechts: zurück zur kompletten Übersicht */}
      <button
        type="button"
        onClick={() => {
          const avatar = avatarPos ?? { x: KARTE_BREITE / 2, y: 200 };
          kameraAuf(avatar.x, avatar.y, passZoom);
        }}
        aria-label="Zur Übersicht"
        className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white/95 text-xl shadow hover:bg-slate-50"
      >
        🗺️
      </button>

      <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1 text-[11px] text-slate-500">
        Ziehen zum Bewegen · Doppeltippen/Kneifen zum Zoomen
      </p>
    </div>
  );
}

// Kamera so begrenzen, dass die Karte nicht aus dem Fenster driftet.
function klemmeKamera(
  kamera: Kamera,
  fenster: { b: number; h: number },
  hoehe: number,
): Kamera {
  const inhaltB = KARTE_BREITE * kamera.s;
  const inhaltH = hoehe * kamera.s;
  const rand = 70;
  const txA = rand;
  const txB = fenster.b - inhaltB - rand;
  const tyA = rand;
  const tyB = fenster.h - inhaltH - rand;
  return {
    ...kamera,
    tx: Math.min(Math.max(kamera.tx, Math.min(txA, txB)), Math.max(txA, txB)),
    ty: Math.min(Math.max(kamera.ty, Math.min(tyA, tyB)), Math.max(tyA, tyB)),
  };
}
