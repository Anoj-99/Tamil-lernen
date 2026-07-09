import { useEffect, useMemo, useState } from "react";
import {
  GruppenId,
  lateinLegende,
  uebungsgruppen,
} from "../data/tamilSchrift";
import { istLokalerModus } from "../lib/datenquelle";
import ErkennenModus from "./ErkennenModus";
import FortschrittSeite from "./FortschrittSeite";
import { useKonto } from "./KontoContext";
import LehrerBereich from "./LehrerBereich";
import LektionenSeite from "./LektionenSeite";
import LoginSeite from "./LoginSeite";
import NachzeichnenModus from "./NachzeichnenModus";
import PositionCheckModus from "./PositionCheckModus";
import PruefungModus from "./PruefungModus";
import PunkteLeiste from "./PunkteLeiste";
import { Reihenfolge } from "./uebungsHelfer";
import { useRegeln } from "./useRegeln";

type Modus =
  | "lektionen"
  | "erkennen"
  | "nachzeichnen"
  | "position"
  | "pruefung"
  | "fortschritt"
  | "lehrer";

const MODI: { id: Modus; name: string }[] = [
  { id: "lektionen", name: "Lektionen" },
  { id: "erkennen", name: "Erkennen" },
  { id: "nachzeichnen", name: "Nachzeichnen" },
  { id: "position", name: "Position-Check" },
  { id: "pruefung", name: "Prüfung" },
  { id: "fortschritt", name: "Fortschritt" },
];

const NAV_SPALTEN: Record<number, string> = {
  6: "sm:grid-cols-6",
  7: "sm:grid-cols-7",
};

export default function TamilLernen() {
  const { konto, punkte, laden, logout } = useKonto();
  const { regeln, aktualisiere, zuruecksetzen } = useRegeln();
  const [modus, setModus] = useState<Modus>("erkennen");
  const [gruppenId, setGruppenId] = useState<GruppenId>("vallinam_alle");
  const [reihenfolge, setReihenfolge] = useState<Reihenfolge>("zufaellig");

  const gruppe = useMemo(
    () => uebungsgruppen.find((g) => g.id === gruppenId) ?? uebungsgruppen[0],
    [gruppenId],
  );

  const sichtbareModi = useMemo(
    () =>
      konto?.rolle === "lehrer"
        ? [...MODI, { id: "lehrer" as Modus, name: "Lehrer" }]
        : MODI,
    [konto],
  );

  // Nach einem Benutzerwechsel nicht in einem Tab hängen bleiben, den es
  // für die neue Rolle gar nicht gibt (z.B. "Lehrer" nach Schüler-Login).
  useEffect(() => {
    if (konto && !sichtbareModi.some((m) => m.id === modus)) {
      setModus("erkennen");
    }
  }, [konto, sichtbareModi, modus]);

  if (laden) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 text-slate-500">
        Lade …
      </div>
    );
  }
  if (!konto) {
    return <LoginSeite />;
  }

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold">Tamil-Schrift üben</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 font-medium">
              {konto.username}
            </span>
            {konto.rolle === "lehrer" && (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                Lehrer
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-500 hover:text-slate-900"
            >
              Abmelden
            </button>
          </div>
          {istLokalerModus && (
            <p className="mt-2 text-xs text-amber-700">
              Test-Modus: keine Datenbank verbunden – Fortschritt bleibt nur
              auf diesem Gerät.
            </p>
          )}
        </header>

        <PunkteLeiste punkte={punkte} />

        <nav
          className={`grid grid-cols-2 gap-2 ${NAV_SPALTEN[sichtbareModi.length] ?? "sm:grid-cols-4"}`}
          aria-label="Übungsmodus"
        >
          {sichtbareModi.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModus(m.id)}
              className={`rounded-xl border px-2 py-3 text-sm font-medium sm:text-base ${
                modus === m.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {m.name}
            </button>
          ))}
        </nav>

        {(modus === "erkennen" || modus === "nachzeichnen") && (
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <label
                htmlFor="gruppe"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Übungsgruppe
              </label>
              <select
                id="gruppe"
                value={gruppenId}
                onChange={(e) => setGruppenId(e.target.value as GruppenId)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                {uebungsgruppen.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} – {g.beschreibung}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                Reihenfolge:
              </span>
              {(
                [
                  ["zufaellig", "Zufällig"],
                  ["der_reihe_nach", "Der Reihe nach"],
                ] as [Reihenfolge, string][]
              ).map(([wert, name]) => (
                <button
                  key={wert}
                  type="button"
                  onClick={() => setReihenfolge(wert)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    reihenfolge === wert
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </section>
        )}

        <main>
          {modus === "lektionen" && <LektionenSeite />}
          {modus === "erkennen" && (
            <ErkennenModus
              key={gruppe.id}
              gruppenId={gruppe.id}
              kombinationen={gruppe.kombinationen}
              reihenfolge={reihenfolge}
            />
          )}
          {modus === "nachzeichnen" && (
            <NachzeichnenModus
              key={gruppe.id}
              kombinationen={gruppe.kombinationen}
              reihenfolge={reihenfolge}
            />
          )}
          {modus === "position" && (
            <PositionCheckModus
              initialTyp={gruppenId === "vallinam_alle" ? "vallinam" : "mellinam"}
              reihenfolge={reihenfolge}
              regeln={regeln}
            />
          )}
          {modus === "pruefung" && <PruefungModus regeln={regeln} />}
          {modus === "fortschritt" && <FortschrittSeite />}
          {modus === "lehrer" && konto.rolle === "lehrer" && (
            <LehrerBereich
              regeln={regeln}
              aktualisiere={aktualisiere}
              zuruecksetzen={zuruecksetzen}
            />
          )}
        </main>

        <footer className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="mb-1 font-medium text-slate-700">Umschrift-Legende</p>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {lateinLegende.map((l) => (
              <li key={l.latein}>
                <span className="font-semibold">{l.latein}</span> ={" "}
                {l.erklaerung}
              </li>
            ))}
          </ul>
        </footer>
      </div>
    </div>
  );
}
