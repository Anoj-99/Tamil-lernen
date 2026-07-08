import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { datenquelle } from "../lib/datenquelle";
import { Konto } from "../lib/typen";

const SITZUNG_KEY = "tamil_lernen_benutzer";

interface KontoContextWert {
  konto: Konto | null;
  laden: boolean;
  loginFehler: string | null;
  login(username: string): Promise<void>;
  logout(): void;
}

const KontoContext = createContext<KontoContextWert | null>(null);

export function KontoProvider({ children }: { children: ReactNode }) {
  const [konto, setKonto] = useState<Konto | null>(null);
  const [laden, setLaden] = useState(true);
  const [loginFehler, setLoginFehler] = useState<string | null>(null);

  const login = useCallback(async (username: string) => {
    setLoginFehler(null);
    try {
      const neuesKonto = await datenquelle.loginOderAnlegen(username);
      setKonto(neuesKonto);
      localStorage.setItem(SITZUNG_KEY, username);
    } catch (fehler) {
      setLoginFehler(
        `Anmeldung fehlgeschlagen: ${fehler instanceof Error ? fehler.message : "unbekannter Fehler"}`,
      );
    }
  }, []);

  const logout = useCallback(() => {
    setKonto(null);
    localStorage.removeItem(SITZUNG_KEY);
  }, []);

  // Gemerkten Benutzer beim Start automatisch wieder anmelden.
  useEffect(() => {
    const gemerkt = localStorage.getItem(SITZUNG_KEY);
    if (!gemerkt) {
      setLaden(false);
      return;
    }
    let aktiv = true;
    datenquelle
      .loginOderAnlegen(gemerkt)
      .then((k) => {
        if (aktiv) setKonto(k);
      })
      .catch(() => {
        if (aktiv) localStorage.removeItem(SITZUNG_KEY);
      })
      .finally(() => {
        if (aktiv) setLaden(false);
      });
    return () => {
      aktiv = false;
    };
  }, []);

  return (
    <KontoContext.Provider value={{ konto, laden, loginFehler, login, logout }}>
      {children}
    </KontoContext.Provider>
  );
}

export function useKonto(): KontoContextWert {
  const wert = useContext(KontoContext);
  if (!wert) throw new Error("useKonto muss innerhalb von KontoProvider verwendet werden");
  return wert;
}
