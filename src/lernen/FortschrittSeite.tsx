import { useEffect, useMemo, useState } from "react";
import { konsonanten, uebungsgruppen } from "../data/tamilSchrift";
import { datenquelle } from "../lib/datenquelle";
import { Ampel, ampelFuerFach } from "../lib/punkteLogik";
import { FehlerEintrag, LeitnerEintrag } from "../lib/typen";
import { useKonto } from "./KontoContext";
import { useHausaufgaben } from "./useHausaufgaben";

const AMPEL_FARBEN: Record<Ampel, string> = {
  grau: "bg-slate-300",
  rot: "bg-red-500",
  gelb: "bg-amber-400",
  gruen: "bg-green-500",
};

export const AMPEL_NAMEN: Record<Ampel, string> = {
  grau: "noch nicht geübt",
  rot: "üben",
  gelb: "fast sicher",
  gruen: "sicher",
};

const MODUS_NAMEN: Record<FehlerEintrag["modus"], string> = {
  erkennen: "Erkennen",
  position: "Position-Check",
  pruefung: "Prüfung",
};

// Ampel pro Konsonant: schwächstes (niedrigstes) Fach aller geübten
// Kombinationen und des Position-Checks dieses Konsonanten.
export function ampelProKonsonant(leitner: LeitnerEintrag[]): Map<string, Ampel> {
  const ergebnis = new Map<string, Ampel>();
  for (const k of konsonanten) {
    const eintraege = leitner.filter(
      (l) =>
        (l.modus === "erkennen" && l.zeichen.startsWith(k.zeichen)) ||
        (l.modus === "position" && l.zeichen === k.grundform),
    );
    if (eintraege.length === 0) {
      ergebnis.set(k.grundform, "grau");
    } else {
      const schwaechstesFach = Math.min(...eintraege.map((l) => l.fach));
      ergebnis.set(k.grundform, ampelFuerFach(schwaechstesFach));
    }
  }
  return ergebnis;
}

export function AmpelPunkt({ ampel }: { ampel: Ampel }) {
  return (
    <span
      title={AMPEL_NAMEN[ampel]}
      className={`inline-block h-3 w-3 shrink-0 rounded-full ${AMPEL_FARBEN[ampel]}`}
    />
  );
}

export function formatiereZeitpunkt(iso: string): string {
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) return "";
  return datum.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FortschrittSeite() {
  const { konto } = useKonto();
  const { aufgaben } = useHausaufgaben(konto?.username ?? "");
  const [leitner, setLeitner] = useState<LeitnerEintrag[]>([]);
  const [fehler, setFehler] = useState<FehlerEintrag[]>([]);

  useEffect(() => {
    if (!konto) return;
    let aktiv = true;
    datenquelle
      .ladeLeitner(konto.username)
      .then((l) => aktiv && setLeitner(l))
      .catch(() => {});
    datenquelle
      .ladeFehler(konto.username, 20)
      .then((f) => aktiv && setFehler(f))
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, [konto]);

  const ampeln = useMemo(() => ampelProKonsonant(leitner), [leitner]);

  if (!konto) return null;

  const gruppenName = (id: string) =>
    uebungsgruppen.find((g) => g.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-5">
      {aufgaben.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Deine Hausaufgaben</h2>
          <ul className="flex flex-col gap-2">
            {aufgaben.map(({ aufgabe, fortschritt, erledigt }) => (
              <li key={aufgabe.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {gruppenName(aufgabe.gruppeId)} · {aufgabe.sollAnzahl} Fragen
                    (Erkennen)
                  </span>
                  <span className={erledigt ? "font-semibold text-green-700" : "text-slate-500"}>
                    {Math.min(fortschritt, aufgabe.sollAnzahl)}/{aufgabe.sollAnzahl}
                    {erledigt && " ✓ erledigt"}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${erledigt ? "bg-green-600" : "bg-amber-500"}`}
                    style={{
                      width: `${Math.min((fortschritt / aufgabe.sollAnzahl) * 100, 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-semibold">Buchstaben-Ampel</h2>
        <p className="mb-3 text-sm text-slate-500">
          Zeigt pro Buchstabe dein schwächstes geübtes Zeichen: rot = üben,
          gelb = fast sicher, grün = sicher, grau = noch nicht geübt.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {konsonanten.map((k) => (
            <div
              key={k.grundform}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
            >
              <AmpelPunkt ampel={ampeln.get(k.grundform) ?? "grau"} />
              <span className="tamil-schrift text-xl">{k.grundform}</span>
              <span className="text-xs text-slate-500">{k.latein}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-semibold">Deine letzten Fehler</h2>
        {fehler.length === 0 ? (
          <p className="text-sm text-slate-500">
            Noch keine Fehler aufgezeichnet – weiter so!
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {fehler.map((f, i) => (
              <li key={f.id ?? i} className="flex items-center gap-3 py-2 text-sm">
                <span className="tamil-schrift min-w-12 shrink-0 text-2xl">{f.zeichen}</span>
                <span className="flex-1 text-slate-600">
                  <span className="text-red-700">{f.gegebeneAntwort}</span>
                  {" → richtig: "}
                  <span className="font-medium text-slate-900">
                    {f.richtigeAntwort}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {MODUS_NAMEN[f.modus]} · {formatiereZeitpunkt(f.zeitpunkt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
