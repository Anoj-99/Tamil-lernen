import { useEffect, useState } from "react";
import { Lektion, LektionBuchstabe, lektionen } from "../data/lektionen";
import {
  Konsonant,
  konsonanten,
  PositionsWert,
  uebungsgruppen,
} from "../data/tamilSchrift";
import { datenquelle } from "../lib/datenquelle";
import { levelAus } from "../lib/punkteLogik";
import {
  FehlerEintrag,
  LeitnerEintrag,
  LektionInhaltUeberschreibung,
  RegelEintrag,
  SchuelerUebersicht,
} from "../lib/typen";
import {
  AmpelPunkt,
  ampelProKonsonant,
  formatiereZeitpunkt,
} from "./FortschrittSeite";
import { useKonto } from "./KontoContext";
import { anwenden } from "./useLektionInhalt";
import { Hausaufgabe, HausaufgabenStatus } from "../lib/typen";

const POSITION_OPTIONEN: [PositionsWert, string][] = [
  ["nur_mitte", "Nur Mitte"],
  ["mitte_und_ende", "Mitte und Ende"],
  ["anfang_mitte_ende", "Anfang, Mitte und Ende"],
];

type LehrerTab = "regeln" | "lektionen" | "schueler" | "hausaufgaben";

interface Props {
  regeln: Map<string, RegelEintrag>;
  aktualisiere(eintrag: RegelEintrag): Promise<void>;
  zuruecksetzen(buchstabe: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Tab 1: Regeln bearbeiten
// ---------------------------------------------------------------------------

function RegelZeile({
  konsonant,
  regel,
  aktualisiere,
  zuruecksetzen,
}: {
  konsonant: Konsonant;
  regel: RegelEintrag;
  aktualisiere: Props["aktualisiere"];
  zuruecksetzen: Props["zuruecksetzen"];
}) {
  const [wert, setWert] = useState<PositionsWert>(regel.positionWert);
  const [hinweis, setHinweis] = useState(regel.positionHinweis ?? "");
  const [speichert, setSpeichert] = useState(false);

  useEffect(() => {
    setWert(regel.positionWert);
    setHinweis(regel.positionHinweis ?? "");
  }, [regel]);

  const geaendert =
    wert !== regel.positionWert || hinweis !== (regel.positionHinweis ?? "");

  const speichern = async () => {
    setSpeichert(true);
    try {
      await aktualisiere({
        buchstabe: konsonant.grundform,
        positionWert: wert,
        positionHinweis: hinweis.trim() === "" ? null : hinweis.trim(),
        vomLehrerAngepasst: true,
      });
    } finally {
      setSpeichert(false);
    }
  };

  const ruecksetzen = async () => {
    setSpeichert(true);
    try {
      await zuruecksetzen(konsonant.grundform);
    } finally {
      setSpeichert(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="tamil-schrift w-12 text-3xl">{konsonant.grundform}</span>
        <span className="w-20 text-sm text-slate-500">{konsonant.latein}</span>
        <select
          value={wert}
          onChange={(e) => setWert(e.target.value as PositionsWert)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
          aria-label={`Position für ${konsonant.grundform}`}
        >
          {POSITION_OPTIONEN.map(([w, name]) => (
            <option key={w} value={w}>
              {name}
            </option>
          ))}
        </select>
        {regel.vomLehrerAngepasst && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            angepasst
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={hinweis}
          onChange={(e) => setHinweis(e.target.value)}
          placeholder="Hinweistext (optional)"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          aria-label={`Hinweis für ${konsonant.grundform}`}
        />
        <button
          type="button"
          onClick={speichern}
          disabled={!geaendert || speichert}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:bg-slate-300"
        >
          Speichern
        </button>
        {regel.vomLehrerAngepasst && (
          <button
            type="button"
            onClick={ruecksetzen}
            disabled={speichert}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600"
          >
            Zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Schüler mit Punkten, Ampel und Fehlern
// ---------------------------------------------------------------------------

interface SchuelerDetail {
  leitner: LeitnerEintrag[];
  fehler: FehlerEintrag[];
}

function SchuelerListe({ schueler }: { schueler: SchuelerUebersicht[] }) {
  const [offen, setOffen] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, SchuelerDetail>>({});

  const umschalten = async (username: string) => {
    const neuOffen = offen === username ? null : username;
    setOffen(neuOffen);
    if (neuOffen && !details[username]) {
      try {
        const [leitner, fehler] = await Promise.all([
          datenquelle.ladeLeitner(username),
          datenquelle.ladeFehler(username, 10),
        ]);
        setDetails((alt) => ({ ...alt, [username]: { leitner, fehler } }));
      } catch {
        setDetails((alt) => ({ ...alt, [username]: { leitner: [], fehler: [] } }));
      }
    }
  };

  const nurSchueler = schueler.filter((s) => s.konto.rolle === "schueler");
  const sortiert = [...nurSchueler].sort(
    (a, b) => b.punkte.epGesamt - a.punkte.epGesamt,
  );

  if (sortiert.length === 0) {
    return (
      <p className="text-sm text-slate-500">Noch keine Schüler angemeldet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sortiert.map((s, platz) => {
        const detail = details[s.konto.username];
        const ampeln = detail ? ampelProKonsonant(detail.leitner) : null;
        return (
          <div key={s.konto.username} className="rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => umschalten(s.konto.username)}
              className="flex w-full flex-wrap items-center gap-3 px-3 py-2.5 text-left"
            >
              <span className="w-6 text-sm font-semibold text-slate-400">
                {platz + 1}.
              </span>
              <span className="flex-1 font-medium">{s.konto.username}</span>
              <span className="text-sm text-slate-600">
                {s.punkte.epGesamt} EP · Level {levelAus(s.punkte.epGesamt)} · 🔥{" "}
                {s.punkte.streakTage}
              </span>
              <span className="text-slate-400">{offen === s.konto.username ? "▴" : "▾"}</span>
            </button>
            {offen === s.konto.username && (
              <div className="border-t border-slate-100 px-3 py-3">
                {!detail ? (
                  <p className="text-sm text-slate-400">Lade …</p>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {konsonanten.map((k) => (
                        <span
                          key={k.grundform}
                          className="flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5"
                        >
                          <AmpelPunkt ampel={ampeln?.get(k.grundform) ?? "grau"} />
                          <span className="tamil-schrift text-base">{k.grundform}</span>
                        </span>
                      ))}
                    </div>
                    {detail.fehler.length === 0 ? (
                      <p className="text-sm text-slate-500">Keine Fehler aufgezeichnet.</p>
                    ) : (
                      <ul className="divide-y divide-slate-100 text-sm">
                        {detail.fehler.map((f, i) => (
                          <li key={f.id ?? i} className="flex items-center gap-2 py-1.5">
                            <span className="tamil-schrift min-w-10 shrink-0 text-xl">{f.zeichen}</span>
                            <span className="flex-1 text-slate-600">
                              <span className="text-red-700">{f.gegebeneAntwort}</span>
                              {" → "}
                              <span className="font-medium text-slate-900">
                                {f.richtigeAntwort}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs text-slate-400">
                              {formatiereZeitpunkt(f.zeitpunkt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Lektionen (Beispielwörter/Bilder + Stufen-Checkpoint-Toleranz)
// ---------------------------------------------------------------------------

function BuchstabeInhaltZeile({
  basis,
  ueberschreibung,
  aktualisiere,
  zuruecksetzen,
}: {
  basis: LektionBuchstabe;
  ueberschreibung: LektionInhaltUeberschreibung | undefined;
  aktualisiere: (u: LektionInhaltUeberschreibung) => Promise<void>;
  zuruecksetzen: (zeichen: string) => Promise<void>;
}) {
  const effektiv = anwenden(basis, ueberschreibung);
  const [tamil, setTamil] = useState(effektiv.beispielwortTamil);
  const [deutsch, setDeutsch] = useState(effektiv.beispielwortDeutsch);
  const [speichert, setSpeichert] = useState(false);
  const [ladeBild, setLadeBild] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    setTamil(effektiv.beispielwortTamil);
    setDeutsch(effektiv.beispielwortDeutsch);
    // effektiv wird aus basis+ueberschreibung neu gebaut - beide als Deps
    // reichen, effektiv selbst ist jedes Mal ein neues Objekt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basis, ueberschreibung]);

  const geaendert =
    tamil !== effektiv.beispielwortTamil || deutsch !== effektiv.beispielwortDeutsch;

  const speichern = async () => {
    setSpeichert(true);
    setFehler(null);
    try {
      await aktualisiere({
        zeichen: basis.zeichen,
        beispielwortTamil: tamil,
        beispielwortDeutsch: deutsch,
        bildUrl: ueberschreibung?.bildUrl ?? null,
      });
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSpeichert(false);
    }
  };

  const bildAendern = async (datei: File) => {
    setLadeBild(true);
    setFehler(null);
    try {
      const url = await datenquelle.bildHochladen(basis.zeichen, datei);
      await aktualisiere({
        zeichen: basis.zeichen,
        beispielwortTamil: tamil,
        beispielwortDeutsch: deutsch,
        bildUrl: url,
      });
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Hochladen fehlgeschlagen");
    } finally {
      setLadeBild(false);
    }
  };

  const ruecksetzen = async () => {
    setSpeichert(true);
    try {
      await zuruecksetzen(basis.zeichen);
    } finally {
      setSpeichert(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="tamil-schrift w-12 text-3xl">{basis.zeichen}</span>
        <span className="w-14 text-sm text-slate-500">{basis.latein}</span>
        <img
          src={effektiv.bildPfad}
          alt={effektiv.beispielwortDeutsch}
          className="h-12 w-12 rounded-lg border border-slate-200 object-contain"
        />
        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          {ladeBild ? "Lädt hoch …" : "Bild ändern"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={ladeBild}
            onChange={(e) => {
              const datei = e.target.files?.[0];
              e.target.value = "";
              if (datei) void bildAendern(datei);
            }}
          />
        </label>
        {ueberschreibung && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            angepasst
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={tamil}
          onChange={(e) => setTamil(e.target.value)}
          placeholder="Beispielwort (Tamil)"
          className="tamil-schrift min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          aria-label={`Beispielwort Tamil für ${basis.zeichen}`}
        />
        <input
          type="text"
          value={deutsch}
          onChange={(e) => setDeutsch(e.target.value)}
          placeholder="Lautschrift (Deutsch)"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          aria-label={`Beispielwort Lautschrift für ${basis.zeichen}`}
        />
        <button
          type="button"
          onClick={speichern}
          disabled={!geaendert || speichert}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:bg-slate-300"
        >
          Speichern
        </button>
        {ueberschreibung && (
          <button
            type="button"
            onClick={ruecksetzen}
            disabled={speichert}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600"
          >
            Zurücksetzen
          </button>
        )}
      </div>
      {fehler && <p className="mt-1 text-xs text-red-600">{fehler}</p>}
    </div>
  );
}

function LektionInhalteBlock({
  lektion,
  ueberschreibungen,
  aktualisiere,
  zuruecksetzen,
}: {
  lektion: Lektion;
  ueberschreibungen: Map<string, LektionInhaltUeberschreibung>;
  aktualisiere: (u: LektionInhaltUeberschreibung) => Promise<void>;
  zuruecksetzen: (zeichen: string) => Promise<void>;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{lektion.name}</p>
      <div className="flex flex-col gap-2">
        {lektion.buchstaben.map((b) => (
          <BuchstabeInhaltZeile
            key={b.zeichen}
            basis={b}
            ueberschreibung={ueberschreibungen.get(b.zeichen)}
            aktualisiere={aktualisiere}
            zuruecksetzen={zuruecksetzen}
          />
        ))}
      </div>
    </div>
  );
}

function LektionenVerwaltung() {
  const [ueberschreibungen, setUeberschreibungen] = useState<
    Map<string, LektionInhaltUeberschreibung>
  >(new Map());
  const [laden, setLaden] = useState(true);

  const neuLaden = () => {
    datenquelle
      .ladeLektionUeberschreibungen()
      .then((liste) => setUeberschreibungen(new Map(liste.map((u) => [u.zeichen, u]))))
      .catch(() => {})
      .finally(() => setLaden(false));
  };

  useEffect(neuLaden, []);

  const aktualisiere = async (u: LektionInhaltUeberschreibung) => {
    await datenquelle.speichereLektionUeberschreibung(u);
    neuLaden();
  };

  const zuruecksetzen = async (zeichen: string) => {
    await datenquelle.loescheLektionUeberschreibung(zeichen);
    neuLaden();
  };

  if (laden) return <p className="text-sm text-slate-400">Lade …</p>;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm text-slate-500">
          Beispielwörter und Bilder je Buchstabe – Änderungen wirken sofort für alle Schüler.
        </p>
        <div className="flex flex-col gap-4">
          {lektionen.map((lektion) => (
            <LektionInhalteBlock
              key={lektion.id}
              lektion={lektion}
              ueberschreibungen={ueberschreibungen}
              aktualisiere={aktualisiere}
              zuruecksetzen={zuruecksetzen}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Hausaufgaben zuweisen und verfolgen
// ---------------------------------------------------------------------------

function HausaufgabenVerwaltung({
  schueler,
  lehrerName,
}: {
  schueler: SchuelerUebersicht[];
  lehrerName: string;
}) {
  const [aufgaben, setAufgaben] = useState<Hausaufgabe[]>([]);
  const [status, setStatus] = useState<HausaufgabenStatus[]>([]);
  const [gruppeId, setGruppeId] = useState(uebungsgruppen[0].id as string);
  const [anzahl, setAnzahl] = useState(20);
  const [fuer, setFuer] = useState("alle");
  const [legtAn, setLegtAn] = useState(false);

  const laden = () => {
    Promise.all([datenquelle.ladeHausaufgaben(), datenquelle.ladeHausaufgabenStatus()])
      .then(([a, s]) => {
        setAufgaben(a);
        setStatus(s);
      })
      .catch(() => {});
  };

  useEffect(laden, []);

  const anlegen = async () => {
    setLegtAn(true);
    try {
      await datenquelle.hausaufgabeAnlegen({
        zugewiesenVon: lehrerName,
        zugewiesenAn: fuer,
        gruppeId,
        sollAnzahl: anzahl,
      });
      laden();
    } finally {
      setLegtAn(false);
    }
  };

  const loeschen = async (id: number) => {
    await datenquelle.hausaufgabeLoeschen(id);
    laden();
  };

  const gruppenName = (id: string) =>
    uebungsgruppen.find((g) => g.id === id)?.name ?? id;
  const nurSchueler = schueler.filter((s) => s.konto.rolle === "schueler");

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="mb-2 text-sm font-medium text-slate-700">Neue Hausaufgabe</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={gruppeId}
            onChange={(e) => setGruppeId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            aria-label="Übungsgruppe"
          >
            {uebungsgruppen.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            Fragen:
            <input
              type="number"
              min={5}
              max={200}
              value={anzahl}
              onChange={(e) => setAnzahl(Number(e.target.value) || 20)}
              className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <select
            value={fuer}
            onChange={(e) => setFuer(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            aria-label="Zugewiesen an"
          >
            <option value="alle">Für alle Schüler</option>
            {nurSchueler.map((s) => (
              <option key={s.konto.username} value={s.konto.username}>
                Nur {s.konto.username}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={anlegen}
            disabled={legtAn}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white disabled:bg-slate-300"
          >
            Zuweisen
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Gezählt werden beantwortete Fragen im Erkennen-Modus der gewählten Gruppe.
        </p>
      </div>

      {aufgaben.length === 0 ? (
        <p className="text-sm text-slate-500">Noch keine Hausaufgaben zugewiesen.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {aufgaben.map((a) => {
            const betroffene =
              a.zugewiesenAn === "alle"
                ? nurSchueler.map((s) => s.konto.username)
                : [a.zugewiesenAn];
            return (
              <div key={a.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex-1 text-sm font-medium">
                    {gruppenName(a.gruppeId)} · {a.sollAnzahl} Fragen ·{" "}
                    {a.zugewiesenAn === "alle" ? "alle Schüler" : a.zugewiesenAn}
                  </span>
                  <button
                    type="button"
                    onClick={() => loeschen(a.id)}
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs text-red-600"
                  >
                    Entfernen
                  </button>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {betroffene.map((name) => {
                    const s = status.find(
                      (x) => x.hausaufgabeId === a.id && x.username === name,
                    );
                    const fortschritt = Math.min(s?.fortschritt ?? 0, a.sollAnzahl);
                    const fertig = fortschritt >= a.sollAnzahl;
                    return (
                      <li key={name} className="flex items-center gap-2 text-sm">
                        <span className="w-28 truncate text-slate-600">{name}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${fertig ? "bg-green-600" : "bg-amber-500"}`}
                            style={{ width: `${(fortschritt / a.sollAnzahl) * 100}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-xs text-slate-500">
                          {fortschritt}/{a.sollAnzahl}
                          {fertig && " ✓"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lehrer-Dashboard
// ---------------------------------------------------------------------------

export default function LehrerBereich({ regeln, aktualisiere, zuruecksetzen }: Props) {
  const { konto } = useKonto();
  const [tab, setTab] = useState<LehrerTab>("regeln");
  const [schueler, setSchueler] = useState<SchuelerUebersicht[]>([]);

  useEffect(() => {
    datenquelle
      .ladeAlleSchueler()
      .then(setSchueler)
      .catch(() => {});
  }, []);

  if (!konto || konto.rolle !== "lehrer") return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["regeln", "Regeln"],
            ["lektionen", "Lektionen"],
            ["schueler", "Schüler"],
            ["hausaufgaben", "Hausaufgaben"],
          ] as [LehrerTab, string][]
        ).map(([id, name]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg border px-2 py-2 text-sm ${
              tab === id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        {tab === "regeln" && (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-sm text-slate-500">
              Änderungen wirken sofort auf den Position-Check aller Schüler.
            </p>
            {konsonanten.map((k) => {
              const regel = regeln.get(k.grundform);
              if (!regel) return null;
              return (
                <RegelZeile
                  key={k.grundform}
                  konsonant={k}
                  regel={regel}
                  aktualisiere={aktualisiere}
                  zuruecksetzen={zuruecksetzen}
                />
              );
            })}
          </div>
        )}
        {tab === "lektionen" && <LektionenVerwaltung />}
        {tab === "schueler" && <SchuelerListe schueler={schueler} />}
        {tab === "hausaufgaben" && (
          <HausaufgabenVerwaltung schueler={schueler} lehrerName={konto.username} />
        )}
      </section>
    </div>
  );
}
