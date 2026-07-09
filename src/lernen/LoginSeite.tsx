import { FormEvent, useState } from "react";
import { istLokalerModus } from "../lib/datenquelle";
import { useKonto } from "./KontoContext";

const NAME_MUSTER = /^[\p{L}\p{N}._-]{2,24}$/u;

export default function LoginSeite() {
  const { login, loginFehler } = useKonto();
  const [name, setName] = useState("");
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
    await login(bereinigt);
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
          {(hinweis || loginFehler) && (
            <p className="text-sm text-red-700">{hinweis ?? loginFehler}</p>
          )}
          <button
            type="submit"
            disabled={sendet}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-700 disabled:bg-slate-300"
          >
            {sendet ? "Anmelden …" : "Los geht's"}
          </button>
        </form>
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
