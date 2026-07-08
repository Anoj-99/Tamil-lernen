import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { datenquelle } from "../lib/datenquelle";
import { verbucheEp } from "../lib/punkteLogik";
import { Konto, leererPunkteStand, PunkteStand } from "../lib/typen";

const SITZUNG_KEY = "tamil_lernen_benutzer";

interface KontoContextWert {
  konto: Konto | null;
  punkte: PunkteStand;
  laden: boolean;
  loginFehler: string | null;
  login(username: string): Promise<void>;
  logout(): void;
  belohne(ep: number): void;
}

const KontoContext = createContext<KontoContextWert | null>(null);

export function KontoProvider({ children }: { children: ReactNode }) {
  const [konto, setKonto] = useState<Konto | null>(null);
  const [punkte, setPunkte] = useState<PunkteStand>(leererPunkteStand);
  const [laden, setLaden] = useState(true);
  const [loginFehler, setLoginFehler] = useState<string | null>(null);

  const login = useCallback(async (username: string) => {
    setLoginFehler(null);
    try {
      const neuesKonto = await datenquelle.loginOderAnlegen(username);
      const stand = await datenquelle.ladePunkte(username);
      setKonto(neuesKonto);
      setPunkte(stand);
      localStorage.setItem(SITZUNG_KEY, username);
    } catch (fehler) {
      setLoginFehler(
        `Anmeldung fehlgeschlagen: ${fehler instanceof Error ? fehler.message : "unbekannter Fehler"}`,
      );
    }
  }, []);

  const logout = useCallback(() => {
    setKonto(null);
    setPunkte(leererPunkteStand());
    localStorage.removeItem(SITZUNG_KEY);
  }, []);

  // EP gutschreiben: sofort im UI, Speicherung läuft im Hintergrund.
  const belohne = useCallback(
    (ep: number) => {
      if (!konto) return;
      setPunkte((alt) => {
        const neu = verbucheEp(alt, ep);
        void datenquelle.speicherePunkte(konto.username, neu).catch(() => {
          // Speichern fehlgeschlagen (z.B. offline) – Stand bleibt im UI.
        });
        return neu;
      });
    },
    [konto],
  );

  // Gemerkten Benutzer beim Start automatisch wieder anmelden.
  useEffect(() => {
    const gemerkt = localStorage.getItem(SITZUNG_KEY);
    if (!gemerkt) {
      setLaden(false);
      return;
    }
    let aktiv = true;
    (async () => {
      try {
        const k = await datenquelle.loginOderAnlegen(gemerkt);
        const stand = await datenquelle.ladePunkte(gemerkt);
        if (aktiv) {
          setKonto(k);
          setPunkte(stand);
        }
      } catch {
        if (aktiv) localStorage.removeItem(SITZUNG_KEY);
      } finally {
        if (aktiv) setLaden(false);
      }
    })();
    return () => {
      aktiv = false;
    };
  }, []);

  return (
    <KontoContext.Provider
      value={{ konto, punkte, laden, loginFehler, login, logout, belohne }}
    >
      {children}
    </KontoContext.Provider>
  );
}

export function useKonto(): KontoContextWert {
  const wert = useContext(KontoContext);
  if (!wert) throw new Error("useKonto muss innerhalb von KontoProvider verwendet werden");
  return wert;
}
