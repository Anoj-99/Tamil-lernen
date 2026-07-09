import { useEffect, useRef, useState } from "react";
import { VerbindenPaar } from "../data/lektionen";
import { mischeOhneGleicheReihe } from "./lektionHelfer";
import { mische } from "./uebungsHelfer";

interface Linie {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  status: "offen" | "richtig" | "falsch";
}

interface Props {
  paare: VerbindenPaar[];
  weiter: () => void;
}

// Teil 5 (und die Mini-Version in Teil 6): Buchstaben links, Umlaute rechts,
// beide gemischt und ohne Übereinstimmung auf gleicher Höhe. Tippen auf
// einen Buchstaben, dann auf einen Umlaut verbindet beide mit einer Linie;
// erneutes Tippen auf den bereits verbundenen Umlaut löst die Verbindung.
// Bei "Prüfen" bleiben richtige Paare fest, falsche werden neu gemischt.
export default function TeilVerbinden({ paare, weiter }: Props) {
  const [offen, setOffen] = useState<VerbindenPaar[]>(paare);
  const [links, setLinks] = useState<VerbindenPaar[]>(() => mische(paare));
  const [rechts, setRechts] = useState<VerbindenPaar[]>(() => mischeOhneGleicheReihe(links));
  const [verbindungen, setVerbindungen] = useState<Map<string, string>>(new Map()); // linksZeichen -> rechtsZeichen(-Quelle)
  const [ausgewaehlt, setAusgewaehlt] = useState<string | null>(null);
  const [geprueft, setGeprueft] = useState<Map<string, boolean> | null>(null);

  const rahmenRef = useRef<HTMLDivElement>(null);
  const linksRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const rechtsRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [linien, setLinien] = useState<Linie[]>([]);

  // Linienkoordinaten relativ zum Rahmen neu berechnen.
  useEffect(() => {
    const berechne = () => {
      const rahmen = rahmenRef.current;
      if (!rahmen) return;
      const basis = rahmen.getBoundingClientRect();
      const neu: Linie[] = [];
      verbindungen.forEach((rechtsZeichen, linksZeichen) => {
        const a = linksRefs.current.get(linksZeichen);
        const b = rechtsRefs.current.get(rechtsZeichen);
        if (!a || !b) return;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const status = geprueft
          ? geprueft.get(linksZeichen)
            ? "richtig"
            : "falsch"
          : "offen";
        neu.push({
          x1: ra.right - basis.left,
          y1: ra.top - basis.top + ra.height / 2,
          x2: rb.left - basis.left,
          y2: rb.top - basis.top + rb.height / 2,
          status,
        });
      });
      setLinien(neu);
    };
    berechne();
    window.addEventListener("resize", berechne);
    return () => window.removeEventListener("resize", berechne);
  }, [verbindungen, links, rechts, geprueft]);

  const waehleLinks = (zeichen: string) => {
    if (geprueft) return;
    setAusgewaehlt((alt) => (alt === zeichen ? null : zeichen));
  };

  const waehleRechts = (paar: VerbindenPaar) => {
    if (geprueft) return;
    if (ausgewaehlt) {
      setVerbindungen((alt) => {
        const neu = new Map(alt);
        // Falls dieser Umlaut schon woanders verbunden war, dort lösen.
        for (const [l, r] of neu) {
          if (r === paar.zeichen && l !== ausgewaehlt) neu.delete(l);
        }
        neu.set(ausgewaehlt, paar.zeichen);
        return neu;
      });
      setAusgewaehlt(null);
      return;
    }
    // Ohne Auswahl links: Tippen auf einen verbundenen Umlaut löst ihn.
    setVerbindungen((alt) => {
      const neu = new Map(alt);
      for (const [l, r] of neu) {
        if (r === paar.zeichen) neu.delete(l);
      }
      return neu;
    });
  };

  const alleVerbunden = verbindungen.size === links.length;

  const pruefen = () => {
    const ergebnis = new Map<string, boolean>();
    for (const paar of links) {
      ergebnis.set(paar.zeichen, verbindungen.get(paar.zeichen) === paar.zeichen);
    }
    setGeprueft(ergebnis);
  };

  const naechsteRunde = () => {
    if (!geprueft) return;
    const nochOffen = offen.filter((p) => !geprueft.get(p.zeichen));
    setGeprueft(null);
    setVerbindungen(new Map());
    setAusgewaehlt(null);
    if (nochOffen.length === 0) {
      weiter();
    } else {
      const neueLinks = mische(nochOffen);
      setOffen(nochOffen);
      setLinks(neueLinks);
      setRechts(mischeOhneGleicheReihe(neueLinks));
    }
  };

  const anzahlRichtig = geprueft ? [...geprueft.values()].filter(Boolean).length : 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm text-slate-500">
        Noch {offen.length} von {paare.length} Paare zu meistern
      </p>
      <p className="text-center text-sm text-slate-500">
        Tippe zuerst einen Buchstaben, dann den passenden Umlaut an.
      </p>

      <div ref={rahmenRef} className="relative w-full max-w-sm">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          {linien.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={
                l.status === "richtig" ? "#16a34a" : l.status === "falsch" ? "#dc2626" : "#1d4ed8"
              }
              strokeWidth={3}
            />
          ))}
        </svg>

        <div className="grid grid-cols-2 gap-x-10 gap-y-4">
          <div className="flex flex-col gap-4">
            {links.map((paar) => {
              const verbunden = verbindungen.has(paar.zeichen);
              const istAusgewaehlt = ausgewaehlt === paar.zeichen;
              let farben = "border-slate-300 bg-white text-slate-900";
              if (istAusgewaehlt) farben = "border-slate-900 bg-slate-900 text-white";
              else if (verbunden) farben = "border-blue-400 bg-blue-50 text-blue-900";
              return (
                <button
                  key={paar.zeichen}
                  ref={(el) => {
                    if (el) linksRefs.current.set(paar.zeichen, el);
                  }}
                  type="button"
                  onClick={() => waehleLinks(paar.zeichen)}
                  disabled={!!geprueft}
                  className={`tamil-schrift rounded-xl border-2 px-4 py-3 text-center text-3xl transition-colors ${farben}`}
                >
                  {paar.zeichen}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-4">
            {rechts.map((paar) => {
              const verbunden = [...verbindungen.values()].includes(paar.zeichen);
              return (
                <button
                  key={paar.zeichen}
                  ref={(el) => {
                    if (el) rechtsRefs.current.set(paar.zeichen, el);
                  }}
                  type="button"
                  onClick={() => waehleRechts(paar)}
                  disabled={!!geprueft}
                  className={`tamil-schrift rounded-xl border-2 px-4 py-3 text-center text-3xl transition-colors ${
                    verbunden
                      ? "border-blue-400 bg-blue-50 text-blue-900"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                >
                  {paar.umlaut}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!geprueft ? (
        <button
          type="button"
          onClick={pruefen}
          disabled={!alleVerbunden}
          className="rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Prüfen
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-slate-700" aria-live="polite">
            {anzahlRichtig} von {links.length} richtig verbunden.
          </p>
          <button
            type="button"
            onClick={naechsteRunde}
            className="rounded-lg bg-slate-900 px-6 py-2.5 text-white hover:bg-slate-700"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
