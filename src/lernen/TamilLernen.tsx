import { useMemo, useState } from "react";
import {
  GruppenId,
  lateinLegende,
  uebungsgruppen,
} from "../data/tamilSchrift";
import ErkennenModus from "./ErkennenModus";
import NachzeichnenModus from "./NachzeichnenModus";
import PositionCheckModus from "./PositionCheckModus";
import { Reihenfolge } from "./uebungsHelfer";

type Modus = "erkennen" | "nachzeichnen" | "position";

const MODI: { id: Modus; name: string }[] = [
  { id: "erkennen", name: "Erkennen" },
  { id: "nachzeichnen", name: "Nachzeichnen" },
  { id: "position", name: "Position-Check" },
];

export default function TamilLernen() {
  const [modus, setModus] = useState<Modus>("erkennen");
  const [gruppenId, setGruppenId] = useState<GruppenId>("vallinam_alle");
  const [reihenfolge, setReihenfolge] = useState<Reihenfolge>("zufaellig");

  const gruppe = useMemo(
    () => uebungsgruppen.find((g) => g.id === gruppenId) ?? uebungsgruppen[0],
    [gruppenId],
  );

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold">Tamil-Schrift üben</h1>
          <p className="mt-1 text-sm text-slate-500">
            Konsonant-Vokal-Kombinationen · Fortschritt wird nicht gespeichert
          </p>
        </header>

        <nav className="grid grid-cols-3 gap-2" aria-label="Übungsmodus">
          {MODI.map((m) => (
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

        {modus !== "position" && (
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
          {modus === "erkennen" && (
            <ErkennenModus
              key={gruppe.id}
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
