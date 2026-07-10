import { useEffect, useMemo, useState } from "react";
import { datenquelle } from "../lib/datenquelle";
import { levelAus } from "../lib/punkteLogik";
import { Schule, SchuelerUebersicht } from "../lib/typen";
import { useKonto } from "./KontoContext";

// Schulleiter: sieht seinen Schul-Code (für die Lehrer-Registrierung) und
// aggregierte Statistiken der ganzen Schule – bewusst keine Daten einzelner
// Schüler (das ist die Detailansicht der Lehrer).
export default function SchulleiterBereich() {
  const { konto } = useKonto();
  const [schulen, setSchulen] = useState<Schule[]>([]);
  const [konten, setKonten] = useState<SchuelerUebersicht[]>([]);

  useEffect(() => {
    datenquelle.ladeSchulen().then(setSchulen).catch(() => {});
    datenquelle.ladeAlleSchueler().then(setKonten).catch(() => {});
  }, []);

  const schule = useMemo(
    () => schulen.find((s) => s.id === konto?.schuleId),
    [schulen, konto],
  );

  const statistik = useMemo(() => {
    if (!konto?.schuleId) return null;
    const eigene = konten.filter((k) => k.konto.schuleId === konto.schuleId);
    const lehrer = eigene.filter((k) => k.konto.rolle === "lehrer");
    const schueler = eigene.filter((k) => k.konto.rolle === "schueler");
    const summeEp = schueler.reduce((s, k) => s + k.punkte.epGesamt, 0);
    const summeStreak = schueler.reduce((s, k) => s + k.punkte.streakTage, 0);
    const aktiveHeute = schueler.filter(
      (k) => k.punkte.letzterLerntag === new Date().toISOString().slice(0, 10),
    ).length;
    return {
      lehrer: lehrer.length,
      schueler: schueler.length,
      durchschnittEp: schueler.length ? Math.round(summeEp / schueler.length) : 0,
      durchschnittLevel: schueler.length
        ? Math.round((schueler.reduce((s, k) => s + levelAus(k.punkte.epGesamt), 0) / schueler.length) * 10) / 10
        : 0,
      durchschnittStreak: schueler.length
        ? Math.round((summeStreak / schueler.length) * 10) / 10
        : 0,
      aktiveHeute,
    };
  }, [konten, konto]);

  if (!konto) return null;

  if (!konto.schuleId) {
    return (
      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Diesem Schulleiter-Konto ist noch keine Schule zugeordnet – bitte den
        Admin kontaktieren.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
        <h2 className="font-semibold">{schule?.name ?? "Deine Schule"}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Schul-Code für die Lehrer-Registrierung:
        </p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-slate-900">
          {schule?.schulCode ?? "…"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Gib diesen Code an deine Lehrer weiter. Sie registrieren sich damit
          über „Ich bin Lehrer“ auf der Anmeldeseite und erhalten ihren
          eigenen Lehrer-Code für die Schüler.
        </p>
      </section>

      {statistik && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Schul-Statistik</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Lehrer", statistik.lehrer],
              ["Schüler", statistik.schueler],
              ["Heute aktiv", statistik.aktiveHeute],
              ["Ø EP", statistik.durchschnittEp],
              ["Ø Level", statistik.durchschnittLevel],
              ["Ø Streak", `${statistik.durchschnittStreak} Tage`],
            ].map(([name, wert]) => (
              <div key={String(name)} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold">{wert}</p>
                <p className="text-xs text-slate-500">{name}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Aus Datenschutz-Gründen zeigt diese Ansicht nur Durchschnittswerte
            der ganzen Schule – Einzelauswertungen sehen die Lehrer.
          </p>
        </section>
      )}
    </div>
  );
}
