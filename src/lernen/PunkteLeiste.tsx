import {
  EP_PRO_LEVEL,
  kannStreakFreikaufen,
  levelAus,
  levelFortschritt,
  streakFreikaufen,
  streakFreikaufKosten,
  TAGESZIEL_EP,
} from "../lib/punkteLogik";
import { heuteIso, PunkteStand } from "../lib/typen";
import { useKonto } from "./KontoContext";

// Kompakte Übersicht: Level mit Fortschrittsbalken, Tagesziel und Streak.
export default function PunkteLeiste({ punkte }: { punkte: PunkteStand }) {
  const { wendePunkteAn } = useKonto();
  const level = levelAus(punkte.epGesamt);
  const fortschritt = levelFortschritt(punkte.epGesamt);
  const epHeute = punkte.heuteDatum === heuteIso() ? punkte.epHeute : 0;
  const tageszielProzent = Math.min((epHeute / TAGESZIEL_EP) * 100, 100);

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Level {level}
        </p>
        <p className="mt-1 text-lg font-bold">{punkte.epGesamt} EP</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900"
            style={{ width: `${(fortschritt / EP_PRO_LEVEL) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {EP_PRO_LEVEL - fortschritt} EP bis Level {level + 1}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Tagesziel
        </p>
        <p className="mt-1 text-lg font-bold">
          {epHeute} / {TAGESZIEL_EP} EP
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${
              tageszielProzent >= 100 ? "bg-green-600" : "bg-amber-500"
            }`}
            style={{ width: `${tageszielProzent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {tageszielProzent >= 100 ? "Geschafft für heute!" : "Heute gesammelt"}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Streak
        </p>
        <p className="mt-1 text-lg font-bold">
          🔥 {punkte.streakTage} {punkte.streakTage === 1 ? "Tag" : "Tage"}
          <span className="ml-2 text-sm font-medium text-violet-700">
            ⚡ {punkte.challengePunkte}
          </span>
        </p>
        {punkte.gerissenerStreak > 0 ? (
          <div className="mt-2">
            <p className="text-xs text-red-600">
              Streak von {punkte.gerissenerStreak} Tagen gerissen!
            </p>
            <button
              type="button"
              onClick={() => wendePunkteAn(streakFreikaufen)}
              disabled={!kannStreakFreikaufen(punkte)}
              className="mt-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Freikaufen für ⚡ {streakFreikaufKosten(punkte.gerissenerStreak)}
            </button>
            {!kannStreakFreikaufen(punkte) && (
              <p className="mt-1 text-xs text-slate-400">
                Sammle Challenge-Punkte in der Daily Challenge.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            {punkte.freezeVerfuegbar
              ? "❄️ Freeze verfügbar – ein verpasster Tag wird verziehen."
              : "Freeze diese Woche schon verbraucht."}
          </p>
        )}
      </div>
    </section>
  );
}
