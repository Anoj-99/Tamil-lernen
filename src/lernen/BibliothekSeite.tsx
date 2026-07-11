import { useEffect, useMemo, useState } from "react";
import {
  ANZAHL_ZEICHEN_GESAMT,
  ayuthamZeichen,
  BibliothekZeichen,
  meiZeichen,
  uyirmeiMatrix,
  uyirZeichen,
} from "../data/bibliothek";
import { lektionById } from "../data/lektionen";
import { schwierigkeitsStufen, woerter } from "../data/woerter";
import { datenquelle } from "../lib/datenquelle";
import { useKonto } from "./KontoContext";
import { sprachausgabeVerfuegbar, sprich } from "./sprache";

type Lernstand = "gelernt" | "ungelernt";

function farbeFuer(stand: Lernstand, klickbar: boolean): string {
  if (stand === "gelernt") return "border-green-300 bg-green-50 text-green-900";
  if (klickbar) return "border-slate-300 bg-white text-slate-700";
  return "border-slate-200 bg-slate-50 text-slate-400";
}

interface Props {
  oeffneLektion: (lektionId: string) => void;
}

// Das Nachschlagewerk: alle 247 Zeichen in klassischer Reihenfolge
// (Uyir → Ayutham → Mei → Uyirmei-Matrix). Gelernte Zeichen sind grün
// eingefärbt; ein Tipp öffnet die Detail-Ansicht mit Audio und dem
// Deep-Link zurück in die Lektion, in der das Zeichen gelehrt wurde.
export default function BibliothekSeite({ oeffneLektion }: Props) {
  const { konto } = useKonto();
  const [tab, setTab] = useState<"zeichen" | "woerter">("zeichen");
  const [gelernteLektionen, setGelernteLektionen] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<BibliothekZeichen | null>(null);

  useEffect(() => {
    if (!konto) return;
    let aktiv = true;
    datenquelle
      .ladeLektionFortschritt(konto.username)
      .then((liste) => {
        if (!aktiv) return;
        setGelernteLektionen(
          new Set(liste.filter((f) => f.teil === 6).map((f) => f.lektionId)),
        );
      })
      .catch(() => {});
    return () => {
      aktiv = false;
    };
  }, [konto]);

  const standFuer = useMemo(
    () =>
      (z: BibliothekZeichen): Lernstand =>
        z.lektionId && gelernteLektionen.has(z.lektionId) ? "gelernt" : "ungelernt",
    [gelernteLektionen],
  );

  const anzahlGelernt = useMemo(() => {
    const alle = [
      ...uyirZeichen,
      ayuthamZeichen,
      ...meiZeichen,
      ...uyirmeiMatrix.flatMap((zeile) => zeile.zellen),
    ];
    return alle.filter((z) => standFuer(z) === "gelernt").length;
  }, [standFuer]);

  if (detail) {
    const lektion = detail.lektionId ? lektionById(detail.lektionId) : undefined;
    const beispiel = lektion?.buchstaben.find((b) => b.zeichen === detail.zeichen);
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setDetail(null)}
          className="self-start text-sm text-slate-500 hover:text-slate-900"
        >
          ← Zurück zur Bibliothek
        </button>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <div className="tamil-schrift text-8xl leading-none text-slate-900">
            {detail.zeichen}
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-700">{detail.latein}</p>
          {detail.lautDeutsch && (
            <p className="mt-1 text-sm text-slate-500">{detail.lautDeutsch}</p>
          )}
          {beispiel && (
            <p className="tamil-schrift mt-4 text-2xl text-slate-800">
              {beispiel.beispielwortTamil}{" "}
              <span className="text-base text-slate-500">({beispiel.beispielwortDeutsch})</span>
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {sprachausgabeVerfuegbar && (
              <button
                type="button"
                onClick={() => sprich(detail.zeichen)}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50"
              >
                🔊 Anhören
              </button>
            )}
            {lektion ? (
              <button
                type="button"
                onClick={() => oeffneLektion(lektion.id)}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-700"
              >
                Zur Lektion „{lektion.name}“
              </button>
            ) : (
              <p className="self-center text-sm text-slate-400">
                Wird in einem späteren Level gelehrt.
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  const zelle = (z: BibliothekZeichen, groesse: "gross" | "klein" = "gross") => (
    <button
      key={z.zeichen}
      type="button"
      onClick={() => setDetail(z)}
      className={`tamil-schrift rounded-xl border text-center leading-none transition-colors hover:border-slate-500 ${
        groesse === "gross" ? "px-2 py-3 text-3xl" : "min-w-14 px-1.5 py-2.5 text-2xl"
      } ${farbeFuer(standFuer(z), true)}`}
    >
      {z.zeichen}
    </button>
  );

  const tabKnopf = (id: "zeichen" | "woerter", name: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
        tab === id
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-700"
      }`}
    >
      {name}
    </button>
  );

  if (tab === "woerter") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex gap-2">
          {tabKnopf("zeichen", "Zeichen")}
          {tabKnopf("woerter", "Wörter")}
        </div>
        <p className="text-center text-xs text-slate-500">
          Sortiert nach Schwierigkeit – thematische Sortierung (Essen,
          Familie, Verben) folgt später.
        </p>
        {schwierigkeitsStufen.map((stufe) => (
          <section key={stufe}>
            <h2 className="mb-2 font-semibold">Schwierigkeit {stufe}</h2>
            <div className="flex flex-col gap-2">
              {woerter
                .filter((w) => w.schwierigkeit === stufe)
                .map((w) => {
                  const gelernt = gelernteLektionen.has(w.lektionId);
                  return (
                    <div
                      key={w.wortTamil}
                      className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
                        gelernt ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className="tamil-schrift text-2xl">{w.wortTamil}</span>
                      <span className="flex-1 text-sm text-slate-600">{w.lautschrift}</span>
                      {sprachausgabeVerfuegbar && (
                        <button
                          type="button"
                          onClick={() => sprich(w.wortTamil, 0.9)}
                          aria-label={`${w.wortTamil} anhören`}
                          className="rounded-full border border-slate-300 bg-white px-2.5 py-1.5 hover:bg-slate-50"
                        >
                          🔊
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => oeffneLektion(w.lektionId)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Zur Lektion
                      </button>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {tabKnopf("zeichen", "Zeichen")}
        {tabKnopf("woerter", "Wörter")}
      </div>
      <p className="text-center text-sm text-slate-500">
        {anzahlGelernt} von {ANZAHL_ZEICHEN_GESAMT} Zeichen gelernt ·{" "}
        <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-800">grün = gelernt</span>
      </p>

      <section>
        <h2 className="mb-1 font-semibold">Vokale – உயிர் எழுத்து (Uyir)</h2>
        <p className="mb-3 text-xs text-slate-500">12 Vokale + Ayutham (ஃ)</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {uyirZeichen.map((z) => zelle(z))}
          {zelle(ayuthamZeichen)}
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-semibold">Konsonanten – மெய் எழுத்து (Mei)</h2>
        <p className="mb-3 text-xs text-slate-500">
          18 Grundformen mit Pulli, klassische Reihenfolge
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {meiZeichen.map((z) => zelle(z))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-semibold">
          Kombinationen – உயிர்மெய் எழுத்து (Uyirmei)
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          216 Zeichen: 18 Konsonanten × 12 Vokale. Zeile antippen zum Nachschlagen.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3">
          <table className="border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white px-1 text-left text-xs font-normal text-slate-400">
                  +
                </th>
                {uyirZeichen.map((v) => (
                  <th
                    key={v.zeichen}
                    className="tamil-schrift px-1 pb-1 text-center text-lg font-normal text-slate-400"
                  >
                    {v.zeichen}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uyirmeiMatrix.map((zeile) => (
                <tr key={zeile.mei.zeichen}>
                  <th className="tamil-schrift sticky left-0 bg-white px-1 text-left text-xl font-normal text-slate-500">
                    {zeile.mei.grundform}
                  </th>
                  {zeile.zellen.map((z) => (
                    <td key={z.zeichen}>{zelle(z, "klein")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
