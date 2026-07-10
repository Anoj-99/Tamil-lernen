import { FormEvent, useMemo, useState } from "react";
import { istLokalerModus } from "../lib/datenquelle";
import { useKonto } from "./KontoContext";

const NAME_MUSTER = /^[\p{L}\p{N}._-]{2,24}$/u;

// Liest den Lehrer-Code aus der URL (?code=XYZ), den Schüler per QR-Scan
// mit der Handy-Kamera öffnen. Der Code wird dann automatisch übernommen.
function codeAusUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("code") ?? "";
}

export default function LoginSeite() {
  const { login, loginMitLehrerCode, registriereLehrer, loginFehler } = useKonto();
  const startCode = useMemo(codeAusUrl, []);
  const [name, setName] = useState("");
  const [lehrerCode, setLehrerCode] = useState(startCode);
  const [zeigeLehrerRegistrierung, setZeigeLehrerRegistrierung] = useState(false);
  const [schulCode, setSchulCode] = useState("");
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [sendet, setSendet] = useState(false);

  const absenden = async (e: FormEvent) => {
    e.preventDefault();
    const bereinigt = name.trim();
    if (!NAME_MUSTER.test(bereinigt)) {
      setHinweis(
        "Bitte 2–24 Zeichen verwenden: Buchstaben, Zahlen, Punkt, Unterstrich oder Bindestrich.",
      );
      return;
    }
    setHinweis(null);
    setSendet(true);
    if (zeigeLehrerRegistrierung && schulCode.trim()) {
      await registriereLehrer(bereinigt, schulCode.trim().toUpperCase());
    } else if (lehrerCode.trim()) {
      await loginMitLehrerCode(bereinigt, lehrerCode.trim().toUpperCase());
    } else {
      await login(bereinigt);
    }
    setSendet(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 text-slate-900">
      <div className="w-full max-w-sm">
        <img
          src="/logo/akaram-logo-full.png"
          alt="Akaram – Tamil-Schrift lernen"
          className="mx-auto mb-3 h-40 w-auto"
        />
        <p className="mb-6 text-center text-sm text-slate-500">
          Gib deinen Benutzernamen ein – ein neuer Name legt automatisch ein
          neues Konto an. Kein Passwort nötig.
        </p>
        <form
          onSubmit={absenden}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <label htmlFor="benutzername" className="text-sm font-medium text-slate-700">
            Benutzername
          </label>
          <input
            id="benutzername"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            autoComplete="username"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-slate-900"
            placeholder="z.B. anoj"
          />

          {!zeigeLehrerRegistrierung && (
            <>
              <label htmlFor="lehrercode" className="text-sm font-medium text-slate-700">
                Lehrer-Code{" "}
                <span className="font-normal text-slate-400">
                  (aus dem QR-Code – leer lassen zum freien Lernen)
                </span>
              </label>
              <input
                id="lehrercode"
                type="text"
                value={lehrerCode}
                onChange={(e) => setLehrerCode(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-base uppercase outline-none focus:border-slate-900"
                placeholder="z.B. K7NP2X"
              />
              {startCode && (
                <p className="text-xs text-green-700">
                  Lehrer-Code aus dem QR-Code übernommen – du wirst deiner
                  Klasse zugeordnet.
                </p>
              )}
            </>
          )}

          {zeigeLehrerRegistrierung && (
            <>
              <label htmlFor="schulcode" className="text-sm font-medium text-slate-700">
                Schul-Code des Schulleiters
              </label>
              <input
                id="schulcode"
                type="text"
                value={schulCode}
                onChange={(e) => setSchulCode(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-base uppercase outline-none focus:border-slate-900"
                placeholder="z.B. B4WQ9T"
              />
            </>
          )}

          {(hinweis || loginFehler) && (
            <p className="text-sm text-red-700">{hinweis ?? loginFehler}</p>
          )}
          <button
            type="submit"
            disabled={sendet}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-700 disabled:bg-slate-300"
          >
            {sendet
              ? "Anmelden …"
              : zeigeLehrerRegistrierung
                ? "Als Lehrer registrieren"
                : "Los geht's"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setZeigeLehrerRegistrierung((z) => !z)}
          className="mt-3 w-full text-center text-xs text-slate-500 underline hover:text-slate-900"
        >
          {zeigeLehrerRegistrierung
            ? "← Zurück zur normalen Anmeldung"
            : "Ich bin Lehrer und habe einen Schul-Code"}
        </button>

        {istLokalerModus && (
          <p className="mt-4 text-center text-xs text-amber-700">
            Test-Modus: Es ist keine Datenbank verbunden – Konten und
            Fortschritt werden nur auf diesem Gerät gespeichert.
          </p>
        )}
      </div>
    </div>
  );
}
