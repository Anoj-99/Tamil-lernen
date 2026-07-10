import { useCallback, useEffect, useMemo, useState } from "react";
import { Lektion, lektionById } from "../data/lektionen";
import { Level, levels } from "../data/levelPlan";
import { datenquelle } from "../lib/datenquelle";
import { LektionFortschritt, LevelFortschritt } from "../lib/typen";
import BossTest from "./BossTest";
import HausaufgabenAnsicht from "./HausaufgabenAnsicht";
import { useKonto } from "./KontoContext";
import LektionAnsicht from "./LektionAnsicht";
import { MeineAufgabe, useHausaufgaben } from "./useHausaufgaben";

type Ansicht =
  | { typ: "pfad" }
  | { typ: "lektion"; lektion: Lektion }
  | { typ: "boss"; level: Level }
  | { typ: "hausaufgabe"; aufgabeId: number };

type KnotenStatus = "gesperrt" | "offen" | "fertig";

interface PfadDaten {
  lektionFertig: Set<string>; // Lektions-IDs mit Teil 6 abgeschlossen
  lektionBegonnen: Set<string>; // Lektions-IDs mit mindestens einem Teil
  levelBestanden: Set<number>; // Level-IDs mit bestandenem Boss-Test
}

function berechneStatus(daten: PfadDaten) {
  const levelStatus = new Map<number, KnotenStatus>();
  const lektionStatus = new Map<string, KnotenStatus>();
  const bossStatus = new Map<number, KnotenStatus>();

  let vorherigesLevelBestanden = true; // Level 1 ist immer offen
  for (const level of levels) {
    const bestanden = daten.levelBestanden.has(level.id);
    const offen = vorherigesLevelBestanden;
    levelStatus.set(level.id, bestanden ? "fertig" : offen ? "offen" : "gesperrt");

    let vorherigeLektionFertig = true; // erste Lektion eines offenen Levels
    let alleLektionenFertig = true;
    for (const lektionId of level.lektionIds) {
      const fertig = daten.lektionFertig.has(lektionId);
      lektionStatus.set(
        lektionId,
        fertig ? "fertig" : offen && vorherigeLektionFertig ? "offen" : "gesperrt",
      );
      vorherigeLektionFertig = fertig;
      if (!fertig) alleLektionenFertig = false;
    }
    bossStatus.set(
      level.id,
      bestanden ? "fertig" : offen && alleLektionenFertig ? "offen" : "gesperrt",
    );
    vorherigesLevelBestanden = bestanden;
  }
  return { levelStatus, lektionStatus, bossStatus };
}

function KnotenKreis({
  status,
  inhalt,
  beschriftung,
  onClick,
  boss = false,
}: {
  status: KnotenStatus;
  inhalt: string;
  beschriftung: string;
  onClick: () => void;
  boss?: boolean;
}) {
  const basis =
    "flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 text-2xl transition-transform";
  let farben = "border-slate-300 bg-white text-slate-300"; // gesperrt
  if (status === "offen")
    farben = boss
      ? "border-amber-500 bg-amber-100 text-amber-700 hover:scale-105"
      : "border-blue-500 bg-blue-50 text-blue-700 hover:scale-105";
  if (status === "fertig") farben = "border-green-600 bg-green-100 text-green-700";

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onClick}
        disabled={status === "gesperrt"}
        aria-label={beschriftung}
        className={`${basis} ${farben} ${status === "gesperrt" ? "cursor-not-allowed" : ""}`}
      >
        {status === "gesperrt" ? "🔒" : status === "fertig" ? "✓" : inhalt}
      </button>
      <div>
        <p
          className={`text-sm font-medium ${
            status === "gesperrt" ? "text-slate-400" : "text-slate-800"
          }`}
        >
          {beschriftung}
        </p>
        {status === "offen" && (
          <p className="text-xs text-blue-600">{boss ? "Bereit zum Test!" : "Jetzt lernen"}</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  // Deep-Link aus der Bibliothek: diese Lektion direkt öffnen (Instant
  // Review – unabhängig vom Freischalt-Status des Pfads).
  sprungLektionId?: string | null;
  sprungVerbraucht?: () => void;
}

// Der Lernpfad (Dashboard): Level mit je 3 Lektionen und einem Boss-Test
// als Gatekeeper, vertikal von oben nach unten. Gesperrte Knoten öffnen
// sich erst, wenn der vorherige Schritt gemeistert ist.
export default function PfadSeite({ sprungLektionId, sprungVerbraucht }: Props = {}) {
  const { konto } = useKonto();
  const [ansicht, setAnsicht] = useState<Ansicht>({ typ: "pfad" });
  const {
    aufgaben: hausaufgaben,
    zaehleFortschritt,
    neuLaden: hausaufgabenNeuLaden,
  } = useHausaufgaben(konto?.username ?? "");

  useEffect(() => {
    if (!sprungLektionId) return;
    const lektion = lektionById(sprungLektionId);
    if (lektion) setAnsicht({ typ: "lektion", lektion });
    sprungVerbraucht?.();
  }, [sprungLektionId, sprungVerbraucht]);
  const [lektionFortschritt, setLektionFortschritt] = useState<LektionFortschritt[]>([]);
  const [levelFortschritt, setLevelFortschritt] = useState<LevelFortschritt[]>([]);
  const [laden, setLaden] = useState(true);

  const neuLaden = useCallback(() => {
    if (!konto) return;
    setLaden(true);
    Promise.all([
      datenquelle.ladeLektionFortschritt(konto.username),
      datenquelle.ladeLevelFortschritt(konto.username),
    ])
      .then(([lektionen, levelListe]) => {
        setLektionFortschritt(lektionen);
        setLevelFortschritt(levelListe);
      })
      .catch(() => {})
      .finally(() => setLaden(false));
  }, [konto]);

  useEffect(() => {
    neuLaden();
  }, [neuLaden]);

  const daten = useMemo<PfadDaten>(
    () => ({
      lektionFertig: new Set(
        lektionFortschritt.filter((f) => f.teil === 6).map((f) => f.lektionId),
      ),
      lektionBegonnen: new Set(lektionFortschritt.map((f) => f.lektionId)),
      levelBestanden: new Set(levelFortschritt.map((f) => f.levelId)),
    }),
    [lektionFortschritt, levelFortschritt],
  );

  const { levelStatus, lektionStatus, bossStatus } = useMemo(
    () => berechneStatus(daten),
    [daten],
  );

  if (!konto) return null;

  if (ansicht.typ === "lektion") {
    return (
      <LektionAnsicht
        lektion={ansicht.lektion}
        zurueck={() => {
          setAnsicht({ typ: "pfad" });
          neuLaden();
        }}
      />
    );
  }

  if (ansicht.typ === "boss") {
    return (
      <BossTest
        level={ansicht.level}
        zurueck={() => setAnsicht({ typ: "pfad" })}
        bestanden={() => {
          setAnsicht({ typ: "pfad" });
          neuLaden();
        }}
      />
    );
  }

  if (ansicht.typ === "hausaufgabe") {
    const meine = hausaufgaben.find((a) => a.aufgabe.id === ansicht.aufgabeId);
    if (meine) {
      return (
        <HausaufgabenAnsicht
          meineAufgabe={meine}
          zurueck={() => {
            setAnsicht({ typ: "pfad" });
            hausaufgabenNeuLaden();
          }}
          zaehleFortschritt={zaehleFortschritt}
        />
      );
    }
  }

  if (laden) {
    return <p className="text-center text-slate-500">Lade Pfad …</p>;
  }

  // Hausaufgaben hängen als Abzweigung (Side-Quest) am aktiven Level –
  // optional, der Hauptpfad läuft daran vorbei.
  const aktivesLevelId =
    levels.find((l) => levelStatus.get(l.id) === "offen")?.id ??
    levels[levels.length - 1]?.id;

  const sideQuest = (meine: MeineAufgabe) => (
    <div key={meine.aufgabe.id} className="relative ml-10 flex items-center gap-3">
      <div aria-hidden="true" className="h-0.5 w-6 bg-slate-300" />
      <button
        type="button"
        onClick={() => setAnsicht({ typ: "hausaufgabe", aufgabeId: meine.aufgabe.id })}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 text-lg transition-transform hover:scale-105 ${
          meine.erledigt
            ? "border-green-600 bg-green-100"
            : "border-dashed border-blue-400 bg-blue-50"
        }`}
        aria-label={`Side-Quest: ${meine.aufgabe.thema}`}
      >
        {meine.erledigt ? "✓" : "📌"}
      </button>
      <div>
        <p className="text-sm font-medium text-slate-800">
          Side-Quest: {meine.aufgabe.thema}
        </p>
        <p className="text-xs text-slate-500">
          Hausaufgabe von {meine.aufgabe.zugewiesenVon} · {meine.fortschritt}/
          {meine.gesamt}
          {meine.aufgabe.deadline &&
            ` · bis ${new Date(meine.aufgabe.deadline).toLocaleDateString("de-DE")}`}{" "}
          · optional
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {levels.map((level) => {
        const status = levelStatus.get(level.id) ?? "gesperrt";
        return (
          <section
            key={level.id}
            className={`rounded-2xl border p-5 ${
              status === "gesperrt"
                ? "border-slate-200 bg-slate-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className={`font-semibold ${
                  status === "gesperrt" ? "text-slate-400" : "text-slate-900"
                }`}
              >
                Level {level.id}: {level.name}
              </h2>
              {status === "fertig" && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  Bestanden 🏆
                </span>
              )}
            </div>

            <div className="relative flex flex-col gap-5 pl-2">
              {/* Verbindungslinie des Pfads */}
              <div
                aria-hidden="true"
                className="absolute bottom-8 left-10 top-8 w-1 rounded bg-slate-200"
              />
              {level.lektionIds.map((lektionId, i) => {
                const lektion = lektionById(lektionId);
                if (!lektion) return null;
                return (
                  <div key={lektionId} className="relative">
                    <KnotenKreis
                      status={lektionStatus.get(lektionId) ?? "gesperrt"}
                      inhalt={String(i + 1)}
                      beschriftung={lektion.name}
                      onClick={() => setAnsicht({ typ: "lektion", lektion })}
                    />
                  </div>
                );
              })}
              <div className="relative">
                <KnotenKreis
                  status={bossStatus.get(level.id) ?? "gesperrt"}
                  inhalt="🏆"
                  beschriftung={`Boss-Test: ${level.name}`}
                  onClick={() => setAnsicht({ typ: "boss", level })}
                  boss
                />
              </div>
              {level.id === aktivesLevelId && hausaufgaben.map(sideQuest)}
            </div>
          </section>
        );
      })}

      <p className="text-center text-xs text-slate-400">
        Weitere Level (Uyirmei-Kombinationen) folgen – der Pfad wächst mit.
      </p>
    </div>
  );
}
