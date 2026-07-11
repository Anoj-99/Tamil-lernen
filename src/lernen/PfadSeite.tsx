import { useCallback, useEffect, useMemo, useState } from "react";
import { Lektion, lektionById } from "../data/lektionen";
import {
  Level,
  levelFuerLektion,
  levels,
  MASKOTTCHEN_EVOLUTION,
  maskottchenFuerLevel,
} from "../data/levelPlan";
import { datenquelle } from "../lib/datenquelle";
import { Hausaufgabe, LektionFortschritt, LevelFortschritt } from "../lib/typen";
import BossTest from "./BossTest";
import HausaufgabenAnsicht from "./HausaufgabenAnsicht";
import { baueKartenLayout, KartenKnoten, QuestEingabe } from "./karte/kartenLayout";
import PfadKarte, { KnotenStatus } from "./karte/PfadKarte";
import { useKonto } from "./KontoContext";
import LektionAnsicht from "./LektionAnsicht";
import { maskottchenEmoji } from "./Maskottchen";
import { useHausaufgaben } from "./useHausaufgaben";

type Ansicht =
  | { typ: "pfad" }
  | { typ: "lektion"; lektion: Lektion }
  | { typ: "boss"; level: Level }
  | { typ: "hausaufgabe"; aufgabeId: number };

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

// Eine Hausaufgabe erscheint auf der Karte erst nach dem höchsten Level,
// dessen Stoff sie abfragt (Pool-Bausteine → Lektionen → Level;
// Kombinations-Gruppen gehören zu den Konsonanten-Leveln).
function questLevelId(aufgabe: Hausaufgabe): number {
  const letztesLevel = levels[levels.length - 1]?.id ?? 1;
  let hoechstes = 1;
  for (const teil of aufgabe.teile) {
    if (teil.poolId.startsWith("lektion:")) {
      const level = levelFuerLektion(teil.poolId.slice("lektion:".length));
      if (level) hoechstes = Math.max(hoechstes, level.id);
    } else if (teil.poolId.startsWith("gruppe:")) {
      const gruppe = teil.poolId.slice("gruppe:".length);
      hoechstes = Math.max(
        hoechstes,
        gruppe.startsWith("vallinam") ? 2 : gruppe.startsWith("mellinam") ? 3 : letztesLevel,
      );
    }
  }
  return Math.min(hoechstes, letztesLevel);
}

interface Props {
  // Deep-Link aus der Bibliothek: diese Lektion direkt öffnen (Instant
  // Review – unabhängig vom Freischalt-Status des Pfads).
  sprungLektionId?: string | null;
  sprungVerbraucht?: () => void;
}

// Das Dashboard: die Sri-Lanka-Spielkarte (PfadKarte) als Darstellung des
// Lernpfads. Die gesamte Freischalt- und Lernlogik lebt weiterhin hier –
// die Karte ist reine Präsentation und Interaktion. Level, Lektionen und
// Side-Quests werden komplett aus levelPlan.ts bzw. den Hausaufgaben
// generiert; feste Positionen gibt es nicht.
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

  // Karten-Layout: komplett aus den Daten generiert (levelPlan.ts +
  // Hausaufgaben) – neue Level erscheinen automatisch auf der Karte.
  const layout = useMemo(() => {
    const quests: QuestEingabe[] = hausaufgaben.map((meine) => ({
      aufgabeId: meine.aufgabe.id,
      levelId: questLevelId(meine.aufgabe),
      name: `Side-Quest: ${meine.aufgabe.thema}`,
    }));
    return baueKartenLayout(
      levels,
      (lektionId) => lektionById(lektionId)?.name ?? lektionId,
      quests,
    );
  }, [hausaufgaben]);

  const statusFuer = useCallback(
    (knoten: KartenKnoten): KnotenStatus => {
      if (knoten.typ === "lektion") {
        return lektionStatus.get(knoten.lektionId ?? "") ?? "gesperrt";
      }
      if (knoten.typ === "boss") {
        return bossStatus.get(knoten.levelId) ?? "gesperrt";
      }
      // Side-Quests sind optional und nie gesperrt.
      const meine = hausaufgaben.find((a) => a.aufgabe.id === knoten.aufgabeId);
      return meine?.erledigt ? "fertig" : "offen";
    },
    [lektionStatus, bossStatus, hausaufgaben],
  );

  // Aktueller Fortschritt = erster offener Knoten auf dem Hauptweg; dort
  // steht der Avatar (auch nach einem Neustart der App).
  const startKnoten = useMemo(
    () =>
      layout.hauptpfad.find((k) => statusFuer(k) === "offen") ??
      layout.hauptpfad[layout.hauptpfad.length - 1],
    [layout, statusFuer],
  );

  const aktivesLevelId =
    levels.find((l) => levelStatus.get(l.id) === "offen")?.id ??
    levels[levels.length - 1]?.id ??
    1;

  // Offene Hausaufgabe hinter dem aktuellen Fortschritt → Hinweis oben
  // rechts auf der Karte.
  const hinweisQuest = useMemo(() => {
    const offene = layout.questPfade.find((q) => {
      const meine = hausaufgaben.find((a) => a.aufgabe.id === q.knoten.aufgabeId);
      return meine && !meine.erledigt && q.knoten.levelId < aktivesLevelId;
    });
    return offene?.knoten ?? null;
  }, [layout, hausaufgaben, aktivesLevelId]);

  const oeffneKnoten = useCallback((knoten: KartenKnoten) => {
    if (knoten.typ === "lektion") {
      const lektion = lektionById(knoten.lektionId ?? "");
      if (lektion) setAnsicht({ typ: "lektion", lektion });
    } else if (knoten.typ === "boss") {
      const level = levels.find((l) => l.id === knoten.levelId);
      if (level) setAnsicht({ typ: "boss", level });
    } else if (knoten.aufgabeId !== undefined) {
      setAnsicht({ typ: "hausaufgabe", aufgabeId: knoten.aufgabeId });
    }
  }, []);

  if (!konto) return null;

  if (ansicht.typ === "lektion") {
    return (
      <LektionAnsicht
        lektion={ansicht.lektion}
        zurueck={() => {
          // Zurück zur Karte: die Kamera startet wieder beim aktuellen
          // Fortschritt (die Karte wird neu aufgebaut).
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

  // Nächste Maskottchen-Evolution (alle 5 Level) als Ausblick unter der Karte.
  const naechsteEvolutionsStufe = Math.floor((aktivesLevelId - 1) / 5) + 1;
  const naechstesTier =
    MASKOTTCHEN_EVOLUTION[Math.min(naechsteEvolutionsStufe, MASKOTTCHEN_EVOLUTION.length - 1)];
  const evolutionSteht = naechsteEvolutionsStufe < MASKOTTCHEN_EVOLUTION.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-semibold text-slate-800">Deine Reise durch Sri Lanka</h2>
        <p className="text-xs text-slate-500">
          Dein Begleiter ({maskottchenFuerLevel(aktivesLevelId)}) läuft den Weg mit dir –
          zoome hinein, um die Lektionen zwischen den Leveln zu sehen.
        </p>
      </div>

      <PfadKarte
        layout={layout}
        statusFuer={statusFuer}
        avatarEmoji={maskottchenEmoji(aktivesLevelId)}
        startKnotenId={startKnoten?.id ?? ""}
        onKnoten={oeffneKnoten}
        hinweisQuest={hinweisQuest}
      />

      {evolutionSteht && (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 p-3 text-center">
          <p className="text-sm font-medium text-amber-800">
            ✨ In Level {naechsteEvolutionsStufe * 5 + 1} entwickelt sich dein
            Begleiter zum {naechstesTier} weiter!
          </p>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        🌴 Weitere Level (Uyirmei-Kombinationen) folgen – die Karte wächst
        automatisch mit.
      </p>
    </div>
  );
}
