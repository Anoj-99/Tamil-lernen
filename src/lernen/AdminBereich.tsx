import { FormEvent, useEffect, useState } from "react";
import { datenquelle } from "../lib/datenquelle";
import { Schule, SchuelerUebersicht } from "../lib/typen";

// Admin: legt Schulen an und lädt Schulleiter ein. Die "Einladung per
// E-Mail" öffnet das Mail-Programm des Admins mit einem vorbereiteten
// Text (Benutzername + Login-Link) – die App selbst verschickt nichts.
export default function AdminBereich() {
  const [schulen, setSchulen] = useState<Schule[]>([]);
  const [konten, setKonten] = useState<SchuelerUebersicht[]>([]);
  const [schulName, setSchulName] = useState("");
  const [leiterName, setLeiterName] = useState("");
  const [leiterEmail, setLeiterEmail] = useState("");
  const [leiterSchuleId, setLeiterSchuleId] = useState<number | null>(null);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [arbeitet, setArbeitet] = useState(false);

  const laden = () => {
    datenquelle.ladeSchulen().then(setSchulen).catch(() => {});
    datenquelle.ladeAlleSchueler().then(setKonten).catch(() => {});
  };

  useEffect(laden, []);

  const schuleAnlegen = async (e: FormEvent) => {
    e.preventDefault();
    if (!schulName.trim()) return;
    setArbeitet(true);
    setMeldung(null);
    try {
      const schule = await datenquelle.schuleAnlegen(schulName.trim());
      setMeldung(`Schule „${schule.name}“ angelegt – Schul-Code: ${schule.schulCode}`);
      setSchulName("");
      laden();
    } catch (fehler) {
      setMeldung(fehler instanceof Error ? fehler.message : "Fehler beim Anlegen.");
    } finally {
      setArbeitet(false);
    }
  };

  const schulleiterAnlegen = async (e: FormEvent) => {
    e.preventDefault();
    if (!leiterName.trim() || leiterSchuleId === null) return;
    setArbeitet(true);
    setMeldung(null);
    try {
      await datenquelle.schulleiterAnlegen(
        leiterName.trim(),
        leiterSchuleId,
        leiterEmail.trim(),
      );
      setMeldung(`Schulleiter-Konto „${leiterName.trim()}“ angelegt.`);
      laden();
    } catch (fehler) {
      setMeldung(fehler instanceof Error ? fehler.message : "Fehler beim Anlegen.");
    } finally {
      setArbeitet(false);
    }
  };

  const einladungsLink = (username: string, email: string) => {
    const betreff = encodeURIComponent("Dein Akaram-Schulleiter-Zugang");
    const text = encodeURIComponent(
      `Hallo,\n\ndein Schulleiter-Konto für Akaram ist eingerichtet.\n` +
        `Benutzername: ${username}\nAnmeldung: ${window.location.origin}\n\n` +
        `Deinen Schul-Code für die Lehrer-Registrierung findest du nach der Anmeldung im Bereich „Schule“.\n\nViele Grüße`,
    );
    return `mailto:${email}?subject=${betreff}&body=${text}`;
  };

  const schulleiter = konten.filter((k) => k.konto.rolle === "schulleiter");
  const schulName_ = (id: number | null) => schulen.find((s) => s.id === id)?.name ?? "–";

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Schulen</h2>
        <form onSubmit={schuleAnlegen} className="mb-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={schulName}
            onChange={(e) => setSchulName(e.target.value)}
            placeholder="Name der Schule"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Name der Schule"
          />
          <button
            type="submit"
            disabled={arbeitet || !schulName.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:bg-slate-300"
          >
            Schule anlegen
          </button>
        </form>
        {schulen.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Schulen angelegt.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {schulen.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span className="font-medium">{s.name}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-700">
                  {s.schulCode}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Schulleiter einladen</h2>
        <form onSubmit={schulleiterAnlegen} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={leiterName}
              onChange={(e) => setLeiterName(e.target.value)}
              placeholder="Benutzername"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              aria-label="Benutzername des Schulleiters"
            />
            <input
              type="email"
              value={leiterEmail}
              onChange={(e) => setLeiterEmail(e.target.value)}
              placeholder="E-Mail-Adresse"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              aria-label="E-Mail des Schulleiters"
            />
            <select
              value={leiterSchuleId ?? ""}
              onChange={(e) => setLeiterSchuleId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              aria-label="Schule"
            >
              <option value="">Schule wählen …</option>
              {schulen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={arbeitet || !leiterName.trim() || leiterSchuleId === null}
            className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:bg-slate-300"
          >
            Konto anlegen
          </button>
        </form>

        {schulleiter.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {schulleiter.map((s) => (
              <li key={s.konto.username} className="flex flex-wrap items-center gap-2 py-2">
                <span className="font-medium">{s.konto.username}</span>
                <span className="text-slate-500">{schulName_(s.konto.schuleId)}</span>
                {s.konto.email && (
                  <a
                    href={einladungsLink(s.konto.username, s.konto.email)}
                    className="ml-auto rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    ✉️ Einladung mailen
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {meldung && <p className="text-sm text-green-700">{meldung}</p>}
    </div>
  );
}
