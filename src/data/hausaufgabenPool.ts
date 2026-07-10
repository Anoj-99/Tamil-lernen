// Der Aufgaben-Pool für den Hausaufgaben-Editor: nach Themen sortierte
// Übungsbausteine, aus denen der Lehrer Pakete zusammenstellt. Jede
// Pool-Aufgabe zieht ihre Fragen aus einer Lektion oder einer Übungsgruppe.
import { LektionBuchstabe } from "./lektionen";
import { uebungsgruppen } from "./tamilSchrift";
import { levels, lektionenDesLevels } from "./levelPlan";

export interface PoolAufgabe {
  id: string;
  thema: string;
  name: string;
  standardAnzahl: number;
  buchstaben: LektionBuchstabe[]; // Fragen-Vorrat (Multiple Choice)
}

function ausKombinationen(gruppeId: string): LektionBuchstabe[] {
  const gruppe = uebungsgruppen.find((g) => g.id === gruppeId);
  if (!gruppe) return [];
  return gruppe.kombinationen.map((k) => ({
    zeichen: k.kombination,
    latein: k.ausspracheLatein,
    beispielwortTamil: "",
    beispielwortDeutsch: "",
    bildPfad: "",
  }));
}

// Pool: pro Lektion eine Aufgabe (Thema = Level-Name) plus die
// Kombinations-Übungsgruppen als eigenes Thema.
export const hausaufgabenPool: PoolAufgabe[] = [
  ...levels.flatMap((level) =>
    lektionenDesLevels(level).map((lektion) => ({
      id: `lektion:${lektion.id}`,
      thema: level.name,
      name: `${lektion.name} (Lektion ${lektion.id})`,
      standardAnzahl: 10,
      buchstaben: lektion.buchstaben,
    })),
  ),
  ...uebungsgruppen.map((gruppe) => ({
    id: `gruppe:${gruppe.id}`,
    thema: "Konsonant-Vokal-Kombinationen",
    name: gruppe.name,
    standardAnzahl: 20,
    buchstaben: ausKombinationen(gruppe.id),
  })),
];

export function poolAufgabeById(id: string): PoolAufgabe | undefined {
  return hausaufgabenPool.find((p) => p.id === id);
}

export const poolThemen: string[] = [...new Set(hausaufgabenPool.map((p) => p.thema))];
