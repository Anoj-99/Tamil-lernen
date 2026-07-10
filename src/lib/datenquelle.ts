// Datenzugriff der App. Zwei austauschbare Backends:
//
// 1. SupabaseDatenquelle — geteilte Datenbank, sobald in Vercel/`.env`
//    VITE_SUPABASE_URL und VITE_SUPABASE_PUBLISHABLE_KEY gesetzt sind.
// 2. LokaleDatenquelle — Fallback ohne Konfiguration: alles landet im
//    localStorage dieses Geräts ("Test-Modus"). So bleibt die App auch
//    ohne eingerichtetes Backend voll bedienbar.
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  einfachesKonto,
  FehlerEintrag,
  Hausaufgabe,
  HausaufgabenStatus,
  HausaufgabenTeil,
  heuteIso,
  isoWoche,
  Konto,
  leererPunkteStand,
  LeitnerEintrag,
  LektionFortschritt,
  LektionInhaltUeberschreibung,
  LevelFortschritt,
  PruefungsErgebnis,
  PunkteStand,
  RegelEintrag,
  Rolle,
  SchuelerUebersicht,
  Schule,
} from "./typen";

// Kurzer, gut vorlesbarer Code (ohne verwechselbare Zeichen wie 0/O, 1/I).
export function neuerCode(laenge = 6): string {
  const zeichen = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < laenge; i++) {
    code += zeichen[Math.floor(Math.random() * zeichen.length)];
  }
  return code;
}

export interface Datenquelle {
  loginOderAnlegen(username: string): Promise<Konto>;
  ladePunkte(username: string): Promise<PunkteStand>;
  speicherePunkte(username: string, stand: PunkteStand): Promise<void>;

  // Rollen-Hierarchie: Schulen (Admin), Lehrer-Registrierung per Schul-Code,
  // Schüler-Bindung per Lehrer-Code (QR).
  ladeSchulen(): Promise<Schule[]>;
  schuleAnlegen(name: string): Promise<Schule>;
  schulleiterAnlegen(username: string, schuleId: number, email: string): Promise<void>;
  lehrerRegistrieren(username: string, schulCode: string): Promise<Konto>;
  schuelerMitLehrerCode(username: string, lehrerCode: string): Promise<Konto>;

  ladeRegeln(): Promise<RegelEintrag[]>;
  speichereRegel(eintrag: RegelEintrag): Promise<void>;
  loescheRegel(buchstabe: string): Promise<void>;

  logFehler(eintrag: FehlerEintrag): Promise<void>;
  ladeFehler(username: string, limit: number): Promise<FehlerEintrag[]>;

  ladeLeitner(username: string): Promise<LeitnerEintrag[]>;
  speichereLeitner(username: string, eintrag: LeitnerEintrag): Promise<void>;

  ladeAlleSchueler(): Promise<SchuelerUebersicht[]>;

  hausaufgabeAnlegen(h: Omit<Hausaufgabe, "id" | "erstelltAm">): Promise<void>;
  hausaufgabeLoeschen(id: number): Promise<void>;
  ladeHausaufgaben(): Promise<Hausaufgabe[]>;
  ladeHausaufgabenStatus(): Promise<HausaufgabenStatus[]>;
  speichereHausaufgabenStatus(status: HausaufgabenStatus): Promise<void>;

  pruefungSpeichern(ergebnis: PruefungsErgebnis): Promise<void>;
  ladePruefungen(username: string, limit: number): Promise<PruefungsErgebnis[]>;

  ladeLektionFortschritt(username: string): Promise<LektionFortschritt[]>;
  lektionTeilAbschliessen(username: string, lektionId: string, teil: number): Promise<void>;

  ladeLektionUeberschreibungen(): Promise<LektionInhaltUeberschreibung[]>;
  speichereLektionUeberschreibung(u: LektionInhaltUeberschreibung): Promise<void>;
  loescheLektionUeberschreibung(zeichen: string): Promise<void>;
  bildHochladen(zeichen: string, datei: File): Promise<string>;

  ladeLevelFortschritt(username: string): Promise<LevelFortschritt[]>;
  speichereLevelFortschritt(f: LevelFortschritt): Promise<void>;
}

// ---------------------------------------------------------------------------
// Supabase-Backend
// ---------------------------------------------------------------------------

class SupabaseDatenquelle implements Datenquelle {
  constructor(private client: SupabaseClient) {}

  private async abfrage<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T | null> {
    const { data, error } = await promise;
    if (error) throw new Error(error.message);
    return data;
  }

  private kontoAusZeile(z: Record<string, unknown>): Konto {
    return {
      username: String(z.username),
      rolle: z.rolle as Rolle,
      schuleId: z.schule_id == null ? null : Number(z.schule_id),
      lehrerUsername: (z.lehrer_username as string | null) ?? null,
      lehrerCode: (z.lehrer_code as string | null) ?? null,
      email: (z.email as string | null) ?? null,
    };
  }

  async loginOderAnlegen(username: string): Promise<Konto> {
    const vorhanden = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("accounts").select("*").eq("username", username).limit(1),
    );
    if (vorhanden && vorhanden.length > 0) {
      return this.kontoAusZeile(vorhanden[0]);
    }
    await this.abfrage(this.client.from("accounts").insert({ username }));
    await this.abfrage(this.client.from("punkte").insert({ username }));
    return einfachesKonto(username, "schueler");
  }

  async ladeSchulen(): Promise<Schule[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("schulen").select("*").order("name"),
    );
    return (zeilen ?? []).map((z) => ({
      id: Number(z.id),
      name: String(z.name),
      schulCode: String(z.schul_code),
      erstelltAm: String(z.erstellt_am),
    }));
  }

  async schuleAnlegen(name: string): Promise<Schule> {
    const schulCode = neuerCode();
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("schulen").insert({ name, schul_code: schulCode }).select(),
    );
    const z = zeilen?.[0];
    if (!z) throw new Error("Schule konnte nicht angelegt werden");
    return {
      id: Number(z.id),
      name: String(z.name),
      schulCode: String(z.schul_code),
      erstelltAm: String(z.erstellt_am),
    };
  }

  async schulleiterAnlegen(username: string, schuleId: number, email: string): Promise<void> {
    await this.abfrage(
      this.client.from("accounts").upsert({
        username,
        rolle: "schulleiter",
        schule_id: schuleId,
        email,
      }),
    );
    await this.abfrage(this.client.from("punkte").upsert({ username }));
  }

  async lehrerRegistrieren(username: string, schulCode: string): Promise<Konto> {
    const schulen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("schulen").select("*").eq("schul_code", schulCode).limit(1),
    );
    if (!schulen || schulen.length === 0) {
      throw new Error("Schul-Code nicht gefunden – bitte beim Schulleiter nachfragen.");
    }
    // Admin-/Schulleiter-Konten nicht versehentlich herabstufen.
    const vorhanden = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("accounts").select("*").eq("username", username).limit(1),
    );
    if (vorhanden && vorhanden.length > 0) {
      const rolle = vorhanden[0].rolle as Rolle;
      if (rolle === "admin" || rolle === "schulleiter") {
        return this.kontoAusZeile(vorhanden[0]);
      }
    }
    const schuleId = Number(schulen[0].id);
    const lehrerCode = neuerCode();
    await this.abfrage(
      this.client.from("accounts").upsert({
        username,
        rolle: "lehrer",
        schule_id: schuleId,
        lehrer_code: lehrerCode,
      }),
    );
    await this.abfrage(this.client.from("punkte").upsert({ username }));
    const konto = einfachesKonto(username, "lehrer");
    return { ...konto, schuleId, lehrerCode };
  }

  async schuelerMitLehrerCode(username: string, lehrerCode: string): Promise<Konto> {
    const lehrer = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("accounts").select("*").eq("lehrer_code", lehrerCode).limit(1),
    );
    if (!lehrer || lehrer.length === 0) {
      throw new Error("Lehrer-Code nicht gefunden – bitte den QR-Code neu scannen.");
    }
    const l = this.kontoAusZeile(lehrer[0]);
    // Nur Schüler-Konten binden – Lehrer/Schulleiter/Admin nicht herabstufen.
    const vorhanden = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("accounts").select("*").eq("username", username).limit(1),
    );
    if (vorhanden && vorhanden.length > 0 && (vorhanden[0].rolle as Rolle) !== "schueler") {
      return this.kontoAusZeile(vorhanden[0]);
    }
    await this.abfrage(
      this.client.from("accounts").upsert({
        username,
        rolle: "schueler",
        schule_id: l.schuleId,
        lehrer_username: l.username,
      }),
    );
    await this.abfrage(this.client.from("punkte").upsert({ username }));
    const konto = einfachesKonto(username, "schueler");
    return { ...konto, schuleId: l.schuleId, lehrerUsername: l.username };
  }

  async ladePunkte(username: string): Promise<PunkteStand> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("punkte").select("*").eq("username", username).limit(1),
    );
    if (!zeilen || zeilen.length === 0) return leererPunkteStand();
    const z = zeilen[0];
    return {
      epGesamt: Number(z.ep_gesamt ?? 0),
      epHeute: Number(z.ep_heute ?? 0),
      heuteDatum: String(z.heute_datum ?? heuteIso()),
      streakTage: Number(z.streak_tage ?? 0),
      letzterLerntag: (z.letzter_lerntag as string | null) ?? null,
      freezeVerfuegbar: Boolean(z.freeze_verfuegbar ?? true),
      freezeWoche: String(z.freeze_woche ?? isoWoche(new Date())),
      challengePunkte: Number(z.challenge_punkte ?? 0),
      letzteChallenge: (z.letzte_challenge as string | null) ?? null,
      gerissenerStreak: Number(z.gerissener_streak ?? 0),
    };
  }

  async speicherePunkte(username: string, stand: PunkteStand): Promise<void> {
    await this.abfrage(
      this.client.from("punkte").upsert({
        username,
        ep_gesamt: stand.epGesamt,
        ep_heute: stand.epHeute,
        heute_datum: stand.heuteDatum,
        streak_tage: stand.streakTage,
        letzter_lerntag: stand.letzterLerntag,
        freeze_verfuegbar: stand.freezeVerfuegbar,
        freeze_woche: stand.freezeWoche,
        challenge_punkte: stand.challengePunkte,
        letzte_challenge: stand.letzteChallenge,
        gerissener_streak: stand.gerissenerStreak,
      }),
    );
  }

  async ladeRegeln(): Promise<RegelEintrag[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("buchstaben_regeln").select("*"),
    );
    return (zeilen ?? []).map((z) => ({
      buchstabe: String(z.buchstabe),
      positionWert: z.position_wert as RegelEintrag["positionWert"],
      positionHinweis: (z.position_hinweis as string | null) ?? null,
      vomLehrerAngepasst: Boolean(z.vom_lehrer_angepasst),
    }));
  }

  async speichereRegel(eintrag: RegelEintrag): Promise<void> {
    await this.abfrage(
      this.client.from("buchstaben_regeln").upsert({
        buchstabe: eintrag.buchstabe,
        position_wert: eintrag.positionWert,
        position_hinweis: eintrag.positionHinweis,
        vom_lehrer_angepasst: eintrag.vomLehrerAngepasst,
        aktualisiert_am: new Date().toISOString(),
      }),
    );
  }

  async loescheRegel(buchstabe: string): Promise<void> {
    await this.abfrage(this.client.from("buchstaben_regeln").delete().eq("buchstabe", buchstabe));
  }

  async logFehler(eintrag: FehlerEintrag): Promise<void> {
    await this.abfrage(
      this.client.from("fehlerverlauf").insert({
        username: eintrag.username,
        zeichen: eintrag.zeichen,
        modus: eintrag.modus,
        richtige_antwort: eintrag.richtigeAntwort,
        gegebene_antwort: eintrag.gegebeneAntwort,
        zeitpunkt: eintrag.zeitpunkt,
      }),
    );
  }

  async ladeFehler(username: string, limit: number): Promise<FehlerEintrag[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client
        .from("fehlerverlauf")
        .select("*")
        .eq("username", username)
        .order("zeitpunkt", { ascending: false })
        .limit(limit),
    );
    return (zeilen ?? []).map((z) => ({
      id: Number(z.id),
      username: String(z.username),
      zeichen: String(z.zeichen),
      modus: z.modus as FehlerEintrag["modus"],
      richtigeAntwort: String(z.richtige_antwort ?? ""),
      gegebeneAntwort: String(z.gegebene_antwort ?? ""),
      zeitpunkt: String(z.zeitpunkt),
    }));
  }

  async ladeLeitner(username: string): Promise<LeitnerEintrag[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("lernfortschritt").select("*").eq("username", username),
    );
    return (zeilen ?? []).map((z) => ({
      zeichen: String(z.zeichen),
      modus: z.modus as LeitnerEintrag["modus"],
      fach: Number(z.fach),
      richtigGesamt: Number(z.richtig_gesamt),
      falschGesamt: Number(z.falsch_gesamt),
    }));
  }

  async speichereLeitner(username: string, eintrag: LeitnerEintrag): Promise<void> {
    await this.abfrage(
      this.client.from("lernfortschritt").upsert({
        username,
        zeichen: eintrag.zeichen,
        modus: eintrag.modus,
        fach: eintrag.fach,
        richtig_gesamt: eintrag.richtigGesamt,
        falsch_gesamt: eintrag.falschGesamt,
        zuletzt_geuebt: new Date().toISOString(),
      }),
    );
  }

  async ladeAlleSchueler(): Promise<SchuelerUebersicht[]> {
    const konten = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("accounts").select("*").order("username"),
    );
    const punkte = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("punkte").select("*"),
    );
    const punkteNachName = new Map<string, PunkteStand>();
    for (const z of punkte ?? []) {
      punkteNachName.set(String(z.username), {
        epGesamt: Number(z.ep_gesamt ?? 0),
        epHeute: Number(z.ep_heute ?? 0),
        heuteDatum: String(z.heute_datum ?? heuteIso()),
        streakTage: Number(z.streak_tage ?? 0),
        letzterLerntag: (z.letzter_lerntag as string | null) ?? null,
        freezeVerfuegbar: Boolean(z.freeze_verfuegbar ?? true),
        freezeWoche: String(z.freeze_woche ?? ""),
        challengePunkte: Number(z.challenge_punkte ?? 0),
        letzteChallenge: (z.letzte_challenge as string | null) ?? null,
        gerissenerStreak: Number(z.gerissener_streak ?? 0),
      });
    }
    return (konten ?? []).map((k) => ({
      konto: this.kontoAusZeile(k),
      punkte: punkteNachName.get(String(k.username)) ?? leererPunkteStand(),
    }));
  }

  async hausaufgabeAnlegen(h: Omit<Hausaufgabe, "id" | "erstelltAm">): Promise<void> {
    await this.abfrage(
      this.client.from("hausaufgaben").insert({
        zugewiesen_von: h.zugewiesenVon,
        zugewiesen_an: h.zugewiesenAn,
        thema: h.thema,
        deadline: h.deadline,
        aufgaben: h.teile,
        // Legacy-Spalten (nicht mehr genutzt, aber not null in alten Schemas).
        gruppe_id: h.teile[0]?.poolId ?? "",
        soll_anzahl: h.teile.reduce((summe, t) => summe + t.anzahl, 0),
      }),
    );
  }

  async hausaufgabeLoeschen(id: number): Promise<void> {
    await this.abfrage(this.client.from("hausaufgaben").delete().eq("id", id));
  }

  async ladeHausaufgaben(): Promise<Hausaufgabe[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("hausaufgaben").select("*").order("erstellt_am", { ascending: false }),
    );
    return (zeilen ?? []).map((z) => ({
      id: Number(z.id),
      zugewiesenVon: String(z.zugewiesen_von),
      zugewiesenAn: String(z.zugewiesen_an),
      thema: String(z.thema ?? "Übung"),
      deadline: (z.deadline as string | null) ?? null,
      // Alte Zeilen (vor dem Editor) haben nur gruppe_id/soll_anzahl.
      teile: Array.isArray(z.aufgaben)
        ? (z.aufgaben as HausaufgabenTeil[])
        : [{ poolId: `gruppe:${String(z.gruppe_id)}`, anzahl: Number(z.soll_anzahl ?? 20) }],
      erstelltAm: String(z.erstellt_am),
    }));
  }

  async ladeHausaufgabenStatus(): Promise<HausaufgabenStatus[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("hausaufgaben_status").select("*"),
    );
    return (zeilen ?? []).map((z) => ({
      hausaufgabeId: Number(z.hausaufgabe_id),
      username: String(z.username),
      fortschritt: Number(z.fortschritt),
      erledigtAm: (z.erledigt_am as string | null) ?? null,
    }));
  }

  async speichereHausaufgabenStatus(status: HausaufgabenStatus): Promise<void> {
    await this.abfrage(
      this.client.from("hausaufgaben_status").upsert({
        hausaufgabe_id: status.hausaufgabeId,
        username: status.username,
        fortschritt: status.fortschritt,
        erledigt_am: status.erledigtAm,
      }),
    );
  }

  async pruefungSpeichern(ergebnis: PruefungsErgebnis): Promise<void> {
    await this.abfrage(
      this.client.from("pruefungen").insert({
        username: ergebnis.username,
        fragen_gesamt: ergebnis.fragenGesamt,
        fehler: ergebnis.fehler,
        bestanden: ergebnis.bestanden,
        zeitpunkt: ergebnis.zeitpunkt,
      }),
    );
  }

  async ladePruefungen(username: string, limit: number): Promise<PruefungsErgebnis[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client
        .from("pruefungen")
        .select("*")
        .eq("username", username)
        .order("zeitpunkt", { ascending: false })
        .limit(limit),
    );
    return (zeilen ?? []).map((z) => ({
      id: Number(z.id),
      username: String(z.username),
      fragenGesamt: Number(z.fragen_gesamt),
      fehler: Number(z.fehler),
      bestanden: Boolean(z.bestanden),
      zeitpunkt: String(z.zeitpunkt),
    }));
  }

  async ladeLektionFortschritt(username: string): Promise<LektionFortschritt[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("lektion_fortschritt").select("*").eq("username", username),
    );
    return (zeilen ?? []).map((z) => ({
      username: String(z.username),
      lektionId: String(z.lektion_id),
      teil: Number(z.teil),
      abgeschlossenAm: String(z.abgeschlossen_am),
    }));
  }

  async lektionTeilAbschliessen(username: string, lektionId: string, teil: number): Promise<void> {
    await this.abfrage(
      this.client.from("lektion_fortschritt").upsert({
        username,
        lektion_id: lektionId,
        teil,
        abgeschlossen_am: new Date().toISOString(),
      }),
    );
  }

  async ladeLektionUeberschreibungen(): Promise<LektionInhaltUeberschreibung[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("lektion_inhalt_ueberschreibung").select("*"),
    );
    return (zeilen ?? []).map((z) => ({
      zeichen: String(z.zeichen),
      beispielwortTamil: (z.beispielwort_tamil as string | null) ?? null,
      beispielwortDeutsch: (z.beispielwort_deutsch as string | null) ?? null,
      bildUrl: (z.bild_url as string | null) ?? null,
    }));
  }

  async speichereLektionUeberschreibung(u: LektionInhaltUeberschreibung): Promise<void> {
    await this.abfrage(
      this.client.from("lektion_inhalt_ueberschreibung").upsert({
        zeichen: u.zeichen,
        beispielwort_tamil: u.beispielwortTamil,
        beispielwort_deutsch: u.beispielwortDeutsch,
        bild_url: u.bildUrl,
        aktualisiert_am: new Date().toISOString(),
      }),
    );
  }

  async loescheLektionUeberschreibung(zeichen: string): Promise<void> {
    await this.abfrage(
      this.client.from("lektion_inhalt_ueberschreibung").delete().eq("zeichen", zeichen),
    );
  }

  async bildHochladen(zeichen: string, datei: File): Promise<string> {
    const pfad = `${zeichen}-${Date.now()}.${datei.name.split(".").pop() ?? "png"}`;
    const { error } = await this.client.storage
      .from("lektion-bilder")
      .upload(pfad, datei, { upsert: true });
    if (error) throw new Error(error.message);
    return this.client.storage.from("lektion-bilder").getPublicUrl(pfad).data.publicUrl;
  }

  async ladeLevelFortschritt(username: string): Promise<LevelFortschritt[]> {
    const zeilen = await this.abfrage<Record<string, unknown>[]>(
      this.client.from("level_fortschritt").select("*").eq("username", username),
    );
    return (zeilen ?? []).map((z) => ({
      username: String(z.username),
      levelId: Number(z.level_id),
      bestandenAm: String(z.bestanden_am),
      fragenGesamt: Number(z.fragen_gesamt),
      ersteRundeFehler: Number(z.erste_runde_fehler),
    }));
  }

  async speichereLevelFortschritt(f: LevelFortschritt): Promise<void> {
    await this.abfrage(
      this.client.from("level_fortschritt").upsert({
        username: f.username,
        level_id: f.levelId,
        bestanden_am: f.bestandenAm,
        fragen_gesamt: f.fragenGesamt,
        erste_runde_fehler: f.ersteRundeFehler,
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// Lokales Backend (Test-Modus ohne Supabase)
// ---------------------------------------------------------------------------

interface LokaleDb {
  accounts: Record<string, Omit<Konto, "username">>;
  schulen: Schule[];
  punkte: Record<string, PunkteStand>;
  regeln: Record<string, RegelEintrag>;
  fehler: FehlerEintrag[];
  leitner: Record<string, LeitnerEintrag[]>; // pro Benutzername
  hausaufgaben: Hausaufgabe[];
  hausaufgabenStatus: HausaufgabenStatus[];
  pruefungen: PruefungsErgebnis[];
  lektionFortschritt: LektionFortschritt[];
  lektionUeberschreibungen: Record<string, LektionInhaltUeberschreibung>;
  levelFortschritt: LevelFortschritt[];
  naechsteId: number;
}

const LOKAL_KEY = "tamil_lernen_db_v1";

class LokaleDatenquelle implements Datenquelle {
  private lade(): LokaleDb {
    const leer: LokaleDb = {
      accounts: {},
      schulen: [],
      punkte: {},
      regeln: {},
      fehler: [],
      leitner: {},
      hausaufgaben: [],
      hausaufgabenStatus: [],
      pruefungen: [],
      lektionFortschritt: [],
      lektionUeberschreibungen: {},
      levelFortschritt: [],
      naechsteId: 1,
    };
    try {
      const roh = localStorage.getItem(LOKAL_KEY);
      // Mit den Standardwerten mischen, damit ältere, lokal gespeicherte
      // Stände auch nach neu hinzugekommenen Feldern nicht abstürzen.
      if (roh) return { ...leer, ...(JSON.parse(roh) as Partial<LokaleDb>) };
    } catch {
      // beschädigte Daten → frisch starten
    }
    return leer;
  }

  private speichere(db: LokaleDb) {
    localStorage.setItem(LOKAL_KEY, JSON.stringify(db));
  }

  async loginOderAnlegen(username: string): Promise<Konto> {
    const db = this.lade();
    if (!db.accounts[username]) {
      // Im Test-Modus bekommen die Namen "lehrer", "schulleiter" und "admin"
      // automatisch die passende Rolle, damit sich alles ohne Datenbank
      // ausprobieren lässt.
      const name = username.toLowerCase();
      const rolle: Rolle =
        name === "lehrer"
          ? "lehrer"
          : name === "schulleiter"
            ? "schulleiter"
            : name === "admin"
              ? "admin"
              : "schueler";
      const konto = einfachesKonto(username, rolle);
      if (rolle === "lehrer") konto.lehrerCode = neuerCode();
      const { username: _, ...rest } = konto;
      db.accounts[username] = rest;
      db.punkte[username] = leererPunkteStand();
      this.speichere(db);
    }
    // Mit Standardwerten mischen, damit alte lokale Konten die neuen
    // Rollen-Felder nachträglich bekommen.
    return { ...einfachesKonto(username, "schueler"), ...db.accounts[username], username };
  }

  async ladeSchulen(): Promise<Schule[]> {
    return this.lade().schulen;
  }

  async schuleAnlegen(name: string): Promise<Schule> {
    const db = this.lade();
    const schule: Schule = {
      id: db.naechsteId++,
      name,
      schulCode: neuerCode(),
      erstelltAm: new Date().toISOString(),
    };
    db.schulen.push(schule);
    this.speichere(db);
    return schule;
  }

  async schulleiterAnlegen(username: string, schuleId: number, email: string): Promise<void> {
    const db = this.lade();
    const konto = einfachesKonto(username, "schulleiter");
    konto.schuleId = schuleId;
    konto.email = email;
    const { username: _, ...rest } = konto;
    db.accounts[username] = rest;
    db.punkte[username] = db.punkte[username] ?? leererPunkteStand();
    this.speichere(db);
  }

  async lehrerRegistrieren(username: string, schulCode: string): Promise<Konto> {
    const db = this.lade();
    const schule = db.schulen.find((s) => s.schulCode === schulCode);
    if (!schule) {
      throw new Error("Schul-Code nicht gefunden – bitte beim Schulleiter nachfragen.");
    }
    const bestehend = db.accounts[username];
    if (bestehend && (bestehend.rolle === "admin" || bestehend.rolle === "schulleiter")) {
      return { ...einfachesKonto(username, "schueler"), ...bestehend, username };
    }
    const konto = einfachesKonto(username, "lehrer");
    konto.schuleId = schule.id;
    konto.lehrerCode = neuerCode();
    const { username: _, ...rest } = konto;
    db.accounts[username] = rest;
    db.punkte[username] = db.punkte[username] ?? leererPunkteStand();
    this.speichere(db);
    return konto;
  }

  async schuelerMitLehrerCode(username: string, lehrerCode: string): Promise<Konto> {
    const db = this.lade();
    const eintrag = Object.entries(db.accounts).find(([, k]) => k.lehrerCode === lehrerCode);
    if (!eintrag) {
      throw new Error("Lehrer-Code nicht gefunden – bitte den QR-Code neu scannen.");
    }
    const [lehrerName, lehrer] = eintrag;
    const bestehend = db.accounts[username];
    if (bestehend && bestehend.rolle !== "schueler") {
      return { ...einfachesKonto(username, "schueler"), ...bestehend, username };
    }
    const konto = einfachesKonto(username, "schueler");
    konto.schuleId = lehrer.schuleId;
    konto.lehrerUsername = lehrerName;
    const { username: _, ...rest } = konto;
    db.accounts[username] = rest;
    db.punkte[username] = db.punkte[username] ?? leererPunkteStand();
    this.speichere(db);
    return konto;
  }

  async ladePunkte(username: string): Promise<PunkteStand> {
    // Mit Standardwerten mischen, damit ältere lokale Stände neue Felder
    // (z.B. Challenge-Punkte) nachträglich bekommen.
    const gespeichert = this.lade().punkte[username];
    return gespeichert ? { ...leererPunkteStand(), ...gespeichert } : leererPunkteStand();
  }

  async speicherePunkte(username: string, stand: PunkteStand): Promise<void> {
    const db = this.lade();
    db.punkte[username] = stand;
    this.speichere(db);
  }

  async ladeRegeln(): Promise<RegelEintrag[]> {
    return Object.values(this.lade().regeln);
  }

  async speichereRegel(eintrag: RegelEintrag): Promise<void> {
    const db = this.lade();
    db.regeln[eintrag.buchstabe] = eintrag;
    this.speichere(db);
  }

  async loescheRegel(buchstabe: string): Promise<void> {
    const db = this.lade();
    delete db.regeln[buchstabe];
    this.speichere(db);
  }

  async logFehler(eintrag: FehlerEintrag): Promise<void> {
    const db = this.lade();
    db.fehler.push({ ...eintrag, id: db.naechsteId++ });
    if (db.fehler.length > 500) db.fehler = db.fehler.slice(-500);
    this.speichere(db);
  }

  async ladeFehler(username: string, limit: number): Promise<FehlerEintrag[]> {
    return this.lade()
      .fehler.filter((f) => f.username === username)
      .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt))
      .slice(0, limit);
  }

  async ladeLeitner(username: string): Promise<LeitnerEintrag[]> {
    return this.lade().leitner[username] ?? [];
  }

  async speichereLeitner(username: string, eintrag: LeitnerEintrag): Promise<void> {
    const db = this.lade();
    const liste = db.leitner[username] ?? [];
    const index = liste.findIndex(
      (l) => l.zeichen === eintrag.zeichen && l.modus === eintrag.modus,
    );
    if (index >= 0) liste[index] = eintrag;
    else liste.push(eintrag);
    db.leitner[username] = liste;
    this.speichere(db);
  }

  async ladeAlleSchueler(): Promise<SchuelerUebersicht[]> {
    const db = this.lade();
    return Object.entries(db.accounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([username, konto]) => ({
        konto: { ...einfachesKonto(username, "schueler"), ...konto, username },
        punkte: db.punkte[username] ?? leererPunkteStand(),
      }));
  }

  async hausaufgabeAnlegen(h: Omit<Hausaufgabe, "id" | "erstelltAm">): Promise<void> {
    const db = this.lade();
    db.hausaufgaben.unshift({
      ...h,
      id: db.naechsteId++,
      erstelltAm: new Date().toISOString(),
    });
    this.speichere(db);
  }

  async hausaufgabeLoeschen(id: number): Promise<void> {
    const db = this.lade();
    db.hausaufgaben = db.hausaufgaben.filter((h) => h.id !== id);
    db.hausaufgabenStatus = db.hausaufgabenStatus.filter((s) => s.hausaufgabeId !== id);
    this.speichere(db);
  }

  async ladeHausaufgaben(): Promise<Hausaufgabe[]> {
    // Alte lokale Einträge (vor dem Editor) auf das Paket-Modell heben.
    const roh = this.lade().hausaufgaben as (Hausaufgabe & {
      gruppeId?: string;
      sollAnzahl?: number;
    })[];
    return roh.map((h) => ({
      ...h,
      thema: h.thema ?? "Übung",
      deadline: h.deadline ?? null,
      teile:
        h.teile ??
        (h.gruppeId ? [{ poolId: `gruppe:${h.gruppeId}`, anzahl: h.sollAnzahl ?? 20 }] : []),
    }));
  }

  async ladeHausaufgabenStatus(): Promise<HausaufgabenStatus[]> {
    return this.lade().hausaufgabenStatus;
  }

  async speichereHausaufgabenStatus(status: HausaufgabenStatus): Promise<void> {
    const db = this.lade();
    const index = db.hausaufgabenStatus.findIndex(
      (s) => s.hausaufgabeId === status.hausaufgabeId && s.username === status.username,
    );
    if (index >= 0) db.hausaufgabenStatus[index] = status;
    else db.hausaufgabenStatus.push(status);
    this.speichere(db);
  }

  async pruefungSpeichern(ergebnis: PruefungsErgebnis): Promise<void> {
    const db = this.lade();
    db.pruefungen.push({ ...ergebnis, id: db.naechsteId++ });
    this.speichere(db);
  }

  async ladePruefungen(username: string, limit: number): Promise<PruefungsErgebnis[]> {
    return this.lade()
      .pruefungen.filter((p) => p.username === username)
      .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt))
      .slice(0, limit);
  }

  async ladeLektionFortschritt(username: string): Promise<LektionFortschritt[]> {
    return this.lade().lektionFortschritt.filter((f) => f.username === username);
  }

  async lektionTeilAbschliessen(username: string, lektionId: string, teil: number): Promise<void> {
    const db = this.lade();
    const bereitsDa = db.lektionFortschritt.some(
      (f) => f.username === username && f.lektionId === lektionId && f.teil === teil,
    );
    if (!bereitsDa) {
      db.lektionFortschritt.push({
        username,
        lektionId,
        teil,
        abgeschlossenAm: new Date().toISOString(),
      });
      this.speichere(db);
    }
  }

  async ladeLektionUeberschreibungen(): Promise<LektionInhaltUeberschreibung[]> {
    return Object.values(this.lade().lektionUeberschreibungen);
  }

  async speichereLektionUeberschreibung(u: LektionInhaltUeberschreibung): Promise<void> {
    const db = this.lade();
    db.lektionUeberschreibungen[u.zeichen] = u;
    this.speichere(db);
  }

  async loescheLektionUeberschreibung(zeichen: string): Promise<void> {
    const db = this.lade();
    delete db.lektionUeberschreibungen[zeichen];
    this.speichere(db);
  }

  async bildHochladen(_zeichen: string, datei: File): Promise<string> {
    // Test-Modus ohne Storage: Bild als data:-URL direkt im localStorage.
    return await new Promise<string>((resolve, reject) => {
      const leser = new FileReader();
      leser.onload = () => resolve(String(leser.result));
      leser.onerror = () => reject(new Error("Bild konnte nicht gelesen werden"));
      leser.readAsDataURL(datei);
    });
  }

  async ladeLevelFortschritt(username: string): Promise<LevelFortschritt[]> {
    return this.lade().levelFortschritt.filter((f) => f.username === username);
  }

  async speichereLevelFortschritt(f: LevelFortschritt): Promise<void> {
    const db = this.lade();
    const index = db.levelFortschritt.findIndex(
      (e) => e.username === f.username && e.levelId === f.levelId,
    );
    if (index >= 0) db.levelFortschritt[index] = f;
    else db.levelFortschritt.push(f);
    this.speichere(db);
  }
}

// ---------------------------------------------------------------------------
// Auswahl des Backends
// ---------------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const istLokalerModus = !supabaseUrl || !supabaseKey;

export const datenquelle: Datenquelle = istLokalerModus
  ? new LokaleDatenquelle()
  : new SupabaseDatenquelle(createClient(supabaseUrl!, supabaseKey!));
